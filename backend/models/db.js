import mysql from 'mysql2/promise';
import { dbConfig } from '../config/dbConfig.js';

const pool = mysql.createPool(dbConfig);

export const getConnection = () => pool.getConnection();

export const query = (sql, params) => pool.query(sql, params);

export default pool;
