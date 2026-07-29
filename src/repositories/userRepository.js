import User from '../models/User.js';

class UserRepository {
  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findById(id) {
    return await User.findById(id).select('-password');
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }
}

export default new UserRepository();
