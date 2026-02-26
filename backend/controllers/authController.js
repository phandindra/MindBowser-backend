import bcrypt from 'bcrypt';
import { query } from '../models/db.js';
import { signToken } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  try {
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const user = { id: result.insertId, username, email };
    const token = signToken(user);

    return res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [rows] = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const userRow = rows[0];
    const isMatch = await bcrypt.compare(password, userRow.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = { id: userRow.id, username: userRow.username, email: userRow.email };
    const token = signToken(user);

    return res.json({
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
