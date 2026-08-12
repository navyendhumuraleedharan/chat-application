import http from 'http';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { initSocket } from '../src/socket/socket.js';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';

// Increase default timeout for Windows MongoMemoryServer startup
jest.setTimeout(30000);

let httpServer, ioServer, port;

beforeAll(async () => {
  await connectTestDB();
  httpServer = http.createServer(app);
  ioServer = initSocket(httpServer);

  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      resolve();
    });
  });
});

afterEach(async () => await clearTestDB());

afterAll(async () => {
  if (ioServer) ioServer.close();
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  await closeTestDB();
});

describe('Socket.io Real-Time Events', () => {
  it('should reject unauthenticated socket connection', (done) => {
    const clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: '' },
      reconnection: false,
    });

    clientSocket.on('connect_error', (err) => {
      expect(err.message).toMatch(/Authentication failed/i);
      clientSocket.close();
      done();
    });
  });
});