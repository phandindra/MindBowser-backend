import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = '7d';

export const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);
