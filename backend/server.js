import dotenv from 'dotenv';
import app from './app.js';
import pool from './models/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Failed to connect to MySQL database:', error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
