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
}

export default new MessageRepository();
