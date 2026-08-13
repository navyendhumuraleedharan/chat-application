import conversationRepository from '../repositories/conversationRepository.js';
import userRepository from '../repositories/userRepository.js';
import AppError from '../utils/AppError.js';

// @desc    Initiate or fetch direct conversation
// @route   POST /api/conversations
// @access  Private
export const createOrGetConversation = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return next(new AppError('Target user ID is required', 400));
    }

    if (targetUserId === req.user._id.toString()) {
      return next(new AppError('Cannot create a conversation with yourself', 400));
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      return next(new AppError('Target user not found', 404));
    }

    let conversation = await conversationRepository.findDirectConversation(
      req.user._id,
      targetUserId
    );

    if (!conversation) {
      conversation = await conversationRepository.createConversation([req.user._id, targetUserId]);
    }

    res.status(200).json({
      status: 'success',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's conversations
// @route   GET /api/conversations
// @access  Private
export const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await conversationRepository.getUserConversations(req.user._id);

    res.status(200).json({
      status: 'success',
      results: conversations.length,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};
