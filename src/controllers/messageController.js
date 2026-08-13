import messageRepository from '../repositories/messageRepository.js';
import conversationRepository from '../repositories/conversationRepository.js';
import AppError from '../utils/AppError.js';

// @desc    Get historic messages for a conversation (Cursor-Based Pagination)
// @route   GET /api/messages/:conversationId?cursor=msg_id&limit=20
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { cursor } = req.query; // Oldest message ID currently rendered on UI
    const limit = parseInt(req.query.limit, 10) || 20;

    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return next(new AppError('Not authorized to access messages in this conversation', 403));
    }

    const result = await messageRepository.findByConversationCursor(conversationId, cursor, limit);

    res.status(200).json({
      status: 'success',
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      results: result.messages.length,
      data: result.messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message via HTTP (Fallback / HTTP route)
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return next(new AppError('Conversation ID and content are required', 400));
    }

    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    const message = await messageRepository.create({
      conversationId,
      sender: req.user._id,
      content,
    });

    await conversationRepository.updateLastMessage(conversationId, message._id);

    res.status(201).json({
      status: 'success',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};
