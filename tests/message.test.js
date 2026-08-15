import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Conversation from '../src/models/Conversation.js';
import generateToken from '../src/utils/generateToken.js';

describe('Message Endpoints', () => {
  let token;
  let user1, user2, conversation;

  beforeEach(async () => {
    user1 = await User.create({ username: 'sender', email: 'sender@example.com', password: 'password123' });
    user2 = await User.create({ username: 'receiver', email: 'receiver@example.com', password: 'password123' });
    conversation = await Conversation.create({ participants: [user1._id, user2._id] });
    token = generateToken(user1._id);
  });

  test('POST /api/messages - should send a message', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        conversationId: conversation._id,
        content: 'Hello World',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('Hello World');
  });

  test('GET /api/messages/:conversationId - should fetch message history', async () => {
    const res = await request(app)
      .get(`/api/messages/${conversation._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});