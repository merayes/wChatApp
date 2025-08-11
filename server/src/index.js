import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import authRouter from './routes/auth.js';
import { authMiddlewareSocket } from './utils/auth.js';
import Message from './models/Message.js';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// In-memory active users map socketId -> { userId, username }
const activeUsers = new Map();

// In-memory rate limiter per user: timestamp array of last messages
const messageBuckets = new Map();
const MAX_MSG_PER_SEC = 3;
const WINDOW_MS = 1000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Mongo connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/turkishchat';
mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error', err);
  process.exit(1);
});

io.use(authMiddlewareSocket);

io.on('connection', async (socket) => {
  const user = socket.user; // from auth middleware
  activeUsers.set(socket.id, { userId: user._id, username: user.username });

  // Send last 20 messages
  const recent = await Message.find({}).sort({ timestamp: -1 }).limit(20).lean();
  socket.emit('chat:history', recent.reverse());

  // Broadcast active user joined
  io.emit('users:active', Array.from(activeUsers.values()));

  socket.on('chat:send', async (payload) => {
    try {
      const text = (payload?.message || '').toString().trim();
      if (!text) return;

      // Rate limit per userId
      const now = Date.now();
      const key = user._id.toString();
      const bucket = messageBuckets.get(key) || [];
      const windowStart = now - WINDOW_MS;
      const filtered = bucket.filter((ts) => ts > windowStart);
      if (filtered.length >= MAX_MSG_PER_SEC) {
        socket.emit('chat:rate_limited', { message: 'Yavaş! 1 saniyede en fazla 3 mesaj.' });
        messageBuckets.set(key, filtered);
        return;
      }
      filtered.push(now);
      messageBuckets.set(key, filtered);

      const msg = await Message.create({
        userId: user._id,
        username: user.username,
        message: text,
        timestamp: new Date()
      });
      io.emit('chat:new_message', {
        _id: msg._id,
        userId: msg.userId,
        username: msg.username,
        message: msg.message,
        timestamp: msg.timestamp
      });
    } catch (err) {
      console.error('chat:send error', err);
    }
  });

  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    io.emit('users:active', Array.from(activeUsers.values()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


