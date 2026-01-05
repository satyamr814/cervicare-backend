const pool = require('../config/database');

class ContentAuditLog {
  static async create(adminId, action, tableName, recordId, oldValues = null, newValues = null) {
    try {
      const query = `
        INSERT INTO content_audit_log (admin_id, action, table_name, record_id, old_values, new_values) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `;
      const result = await pool.query(query, [
        adminId, 
        action, 
        tableName, 
        recordId, 
        oldValues ? JSON.stringify(oldValues) : null, 
        newValues ? JSON.stringify(newValues) : null
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getByAdminId(adminId, limit = 100) {
    try {
      const query = `
        SELECT * FROM content_audit_log 
        WHERE admin_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      const result = await pool.query(query, [adminId, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getByTableName(tableName, limit = 100) {
    try {
      const query = `
        SELECT * FROM content_audit_log 
        WHERE table_name = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      const result = await pool.query(query, [tableName, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(limit = 200) {
    try {
      const query = `
        SELECT cal.*, au.email as admin_email 
        FROM content_audit_log cal 
        LEFT JOIN admin_users au ON cal.admin_id = au.id 
        ORDER BY cal.created_at DESC 
        LIMIT $1
      `;
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getRecent(days = 7, limit = 50) {
    try {
      const query = `
        SELECT cal.*, au.email as admin_email 
        FROM content_audit_log cal 
        LEFT JOIN admin_users au ON cal.admin_id = au.id 
        WHERE cal.created_at >= NOW() - INTERVAL '${days} days'
        ORDER BY cal.created_at DESC 
        LIMIT $1
      `;
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ContentAuditLog;
