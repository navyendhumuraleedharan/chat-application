import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import generateToken from '../src/utils/generateToken.js';

describe('User Endpoints', () => {
  let token;
  let testUser;

  beforeEach(async () => {
    // Create a test user and generate a JWT token
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    token = generateToken(testUser._id);
  });

  test('GET /api/users/all - should fetch all users', async () => {
    const res = await request(app)
      .get('/api/users/all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('GET /api/users/search - should search for users', async () => {
    const res = await request(app)
      .get('/api/users/search?q=test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});