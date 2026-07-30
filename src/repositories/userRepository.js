import User from '../models/User.js';

class UserRepository {
  // Find user by ID excluding password
  async findById(userId) {
    return await User.findById(userId).select('-password');
  }

  // Find user by email (include password for authentication)
  async findByEmail(email) {
    return await User.findOne({ email });
  }

  // Create a new user
  async create(userData) {
    return await User.create(userData);
  }

  // Search users by username or email
  async searchUsers(query, currentUserId) {
    return await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).select('username email createdAt');
  }

  // Cursor-based pagination for user lists
  async findPaginatedCursor(currentUserId, cursor = null, limit = 20) {
    const query = {
      _id: { $ne: currentUserId }, // Exclude logged-in user
    };

    if (cursor) {
      query._id = { ...query._id, $lt: cursor };
    }

    const users = await User.find(query)
      .select('username email createdAt')
      .sort({ _id: -1 })
      .limit(limit + 1);

    const hasMore = users.length > limit;
    if (hasMore) {
      users.pop(); // Remove extra item used for checking next page
    }

    const nextCursor = users.length > 0 ? users[users.length - 1]._id : null;

    return {
      users,
      nextCursor,
      hasMore,
    };
  }
}

export default new UserRepository();
