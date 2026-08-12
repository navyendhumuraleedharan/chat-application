import request from 'supertest';
import app from '../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';

// Set timeout for memory server initialization
jest.setTimeout(30000);

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

describe('Auth REST Endpoints', () => {
  it('should block registration when required fields are incomplete', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'ab',
      email: 'invalid-email',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should reject login with non-existent user credentials with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });
});