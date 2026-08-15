import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Conversation from '../src/models/Conversation.js';
import generateToken from '../src/utils/generateToken.js';

describe('Conversation Endpoints', () => {
  let token;
  let user1, user2;

  beforeEach(async () => {
    user1 = await User.create({ username: 'userone', email: 'one@example.com', password: 'password123' });
    user2 = await User.create({ username: 'usertwo', email: 'two@example.com', password: 'password123' });
    token = generateToken(user1._id);
  });

  test('POST /api/conversations - should create or access a 1-on-1 conversation', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetUserId: user2._id }); // Updated key here

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('_id');
  });

  test('GET /api/conversations - should fetch all conversations for the user', async () => {
    await Conversation.create({ participants: [user1._id, user2._id] });

    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});