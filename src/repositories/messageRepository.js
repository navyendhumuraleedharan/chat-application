import Message from '../models/Message.js';

class MessageRepository {
  async create(messageData) {
    const message = await Message.create(messageData);
    return await message.populate('sender', 'username email');
  }

  async findByConversationCursor(conversationId, cursor = null, limit = 20) {
    const query = { conversationId };

    // If a cursor (messageId of the oldest message currently on UI) is provided:
    if (cursor) {
      const cursorMessage = await Message.findById(cursor).select('createdAt');
      if (cursorMessage) {
        query.createdAt = { $lt: cursorMessage.createdAt };
      }
    }

    // Fetch limit + 1 items to determine if a next page exists
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('sender', 'username email');

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra item used for checking
    }

    // The nextCursor is the _id of the oldest message in this retrieved batch
    const nextCursor = messages.length > 0 ? messages[messages.length - 1]._id : null;

    return {
      messages,
      nextCursor,
      hasMore,
    };
  }

  // Update individual message status ('sent' | 'delivered' | 'seen')
  async updateStatus(messageId, status) {
    return await Message.findByIdAndUpdate(messageId, { status }, { new: true });
  }

  // Mark all unread messages in a conversation as seen by the reader
  async markConversationMessagesAsSeen(conversationId, readerId) {
    return await Message.updateMany(
      {
        conversationId,
        sender: { $ne: readerId }, // Don't update user's own messages
        status: { $ne: 'seen' },
      },
      { status: 'seen' }
    );
  }
}

export default new MessageRepository();
