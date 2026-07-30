import Conversation from '../models/Conversation.js';

class ConversationRepository {
  async findDirectConversation(userId, targetUserId) {
    return await Conversation.findOne({
      participants: { $all: [userId, targetUserId], $size: 2 },
    })
      .populate('participants', 'username email')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username email' },
      });
  }

  async createConversation(participantIds) {
    const conversation = await Conversation.create({ participants: participantIds });
    return await conversation.populate('participants', 'username email');
  }

  async getUserConversations(userId) {
    return await Conversation.find({ participants: userId })
      .populate('participants', 'username email')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username email' },
      })
      .sort({ updatedAt: -1 });
  }

  async findById(conversationId) {
    return await Conversation.findById(conversationId).populate('participants', 'username email');
  }

  async updateLastMessage(conversationId, messageId) {
    return await Conversation.findByIdAndUpdate(
      conversationId,
      { lastMessage: messageId },
      { new: true }
    );
  }
}

export default new ConversationRepository();
