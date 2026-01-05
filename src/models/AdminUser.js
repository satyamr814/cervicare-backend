const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class AdminUser {
  static async create(email, password, role = 'admin') {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const query = `
        INSERT INTO admin_users (email, password_hash, role) 
        VALUES ($1, $2, $3) 
        RETURNING id, email, role, created_at
      `;
      const result = await pool.query(query, [email, passwordHash, role]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM admin_users WHERE email = $1';
      const result = await pool.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT id, email, role, created_at FROM admin_users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll(limit = 50) {
    try {
      const query = `
        SELECT id, email, role, created_at, updated_at 
        FROM admin_users 
        ORDER BY created_at DESC 
        LIMIT $1
      `;
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AdminUser;
