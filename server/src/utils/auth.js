import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function authMiddlewareHttp(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Yetkisiz' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}

export async function authMiddlewareSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('unauthorized'));
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).lean();
    if (!user) return next(new Error('unauthorized'));
    socket.user = { _id: user._id, username: user.username };
    next();
  } catch (err) {
    next(new Error('unauthorized'));
  }
}


