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


  
}

export default new UserRepository();
