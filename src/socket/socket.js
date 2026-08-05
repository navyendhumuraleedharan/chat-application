import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import messageRepository from '../repositories/messageRepository.js';
import conversationRepository from '../repositories/conversationRepository.js';
import logger from '../config/logger.js';

let io;

// Track active users online: userId -> Set of socketIds (multi-device support)
const onlineUsers = new Map();

export const initSocket = (server) => {
  // Initialize Socket.io server with CORS setup
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for frontend domain in production
      methods: ['GET', 'POST'],
    },
  });

  // ==========================================
  // 1. SOCKET AUTHENTICATION MIDDLEWARE
  // ==========================================
  io.use(async (socket, next) => {
    try {
      const rawAuthHeader = socket.handshake.headers?.authorization;
      const headerToken = rawAuthHeader
        ? rawAuthHeader.startsWith('Bearer ')
          ? rawAuthHeader.split(' ')[1]
          : rawAuthHeader
        : null;

      const token = socket.handshake.auth?.token || headerToken;

      if (!token) {
        return next(new Error('Authentication failed: Token missing'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication failed: User not found'));
      }

      // Store authenticated user in the socket instance
      socket.user = user;
      next();
    } catch {
      // Fixed: Removed unused 'err' parameter
      next(new Error('Authentication failed: Invalid or expired token'));
    }
  });

  // ==========================================
  // 2. SOCKET CONNECTION & EVENT HANDLERS
  // ==========================================
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Add socket ID to user's Set of active connections
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    logger.info(`⚡ Socket Connected: ${socket.user.username} (${socket.id})`);

    // Broadcast online status to all connected users
    io.emit('user_status', { userId, status: 'online' });

    // --- EVENT: Join Conversation Room ---
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      logger.info(`👤 ${socket.user.username} joined room: ${conversationId}`);
    });

    // --- EVENT: Leave Conversation Room ---
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
      logger.info(`👤 ${socket.user.username} left room: ${conversationId}`);
    });

    // --- EVENT: Real-Time Send Message ---
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;

        if (!conversationId || !content?.trim()) {
          return socket.emit('error', { message: 'Conversation ID and content are required' });
        }

        // Check if conversation exists
        const conversation = await conversationRepository.findById(conversationId);
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Verify sender is part of this conversation
        const isParticipant = conversation.participants.some((p) => p._id.toString() === userId);
        if (!isParticipant) {
          return socket.emit('error', { message: 'Not authorized for this chat' });
        }

        // Save message to MongoDB using Repository
        const newMessage = await messageRepository.create({
          conversationId,
          sender: userId,
          content: content.trim(),
        });

        // Update lastMessage pointer in conversation
        await conversationRepository.updateLastMessage(conversationId, newMessage._id);

        // Populate sender info for immediate frontend display
        const populatedMessage = await newMessage.populate('sender', 'username email');

        // BROADCAST to everyone inside this conversation room
        io.to(conversationId).emit('new_message', populatedMessage);
      } catch (error) {
        logger.error('Socket send_message error:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    // =========================================================
    // --- TYPING INDICATORS ---
    // =========================================================

    // Start Typing
    socket.on('typing', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('user_typing', {
        conversationId,
        user: { _id: userId, username: socket.user.username },
      });
    });

    // Stop Typing
    socket.on('stop_typing', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('user_stop_typing', {
        conversationId,
        user: { _id: userId, username: socket.user.username },
      });
    });

    // =========================================================
    // --- DELIVERY & SEEN CONFIRMATIONS ---
    // =========================================================

    // Message Delivered Acknowledgment
    socket.on('message_delivered', async ({ messageId, conversationId }) => {
      try {
        if (!messageId) return;

        // Fixed: Removed unused 'updatedMessage' variable assignment
        await messageRepository.updateStatus(messageId, 'delivered');

        // Notify room participants that message was delivered
        io.to(conversationId).emit('message_status_updated', {
          messageId,
          conversationId,
          status: 'delivered',
        });
      } catch (error) {
        logger.error('Error updating delivery status:', error);
      }
    });

    // Mark Message as Seen (Read Receipts)
    socket.on('mark_as_seen', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        // Update all unread messages in this conversation not sent by this user
        await messageRepository.markConversationMessagesAsSeen(conversationId, userId);

        // Notify room participants that messages were seen
        io.to(conversationId).emit('messages_seen', {
          conversationId,
          seenBy: userId,
        });
      } catch (error) {
        logger.error('Error marking messages as seen:', error);
      }
    });

    // --- EVENT: Multi-Device Disconnect Handler ---
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);

        // Only emit 'offline' if ALL devices/tabs for this user are closed
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_status', { userId, status: 'offline' });
        }
      }

      logger.info(`❌ Socket Disconnected: ${socket.user.username} (${socket.id})`);
    });
  });

  return io;
};

// Optional helper to access 'io' in Express controllers if needed
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
