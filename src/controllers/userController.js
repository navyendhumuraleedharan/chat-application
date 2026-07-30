import userRepository from '../repositories/userRepository.js';
import User from '../models/User.js';

// @desc    Get all users with Cursor-Based Pagination
// @route   GET /api/users/all?cursor=user_id&limit=20
// @access  Private
export const getAllUsers = async (req, res, next) => {
  try {
    const { cursor } = req.query;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await userRepository.findPaginatedCursor(req.user._id, cursor, limit);

    res.status(200).json({
      status: 'success',
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      results: result.users.length,
      data: result.users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users by query (Existing)
// @route   GET /api/users/search?q=
// @access  Private
export const searchUsers = async (req, res, next) => {
  try {
    const searchQuery = req.query.q || '';

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
      ],
    }).select('username email');

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
