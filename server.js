import http from 'http';
import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import logger from './src/config/logger.js';
import { initSocket } from './src/socket/socket.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// 1. Create native HTTP server wrapping Express app
const server = http.createServer(app);

// 2. Attach Socket.io onto the HTTP server
initSocket(server);

const PORT = process.env.PORT || 5000;

// 3. Start listening
server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});