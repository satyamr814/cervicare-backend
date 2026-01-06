const pool = require('../config/database');

class ProtectionPlanContent {
  static async findByFilters(riskBand, planType, section) {
    try {
      const query = `
        SELECT * FROM protection_plan_content 
        WHERE risk_band = $1 AND plan_type = $2 AND section = $3 AND is_active = true
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [riskBand, planType, section]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByRiskBand(riskBand) {
    try {
      const query = 'SELECT * FROM protection_plan_content WHERE risk_band = $1 AND is_active = true ORDER BY created_at DESC';
      const result = await pool.query(query, [riskBand]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByPlanType(planType) {
    try {
      const query = 'SELECT * FROM protection_plan_content WHERE plan_type = $1 AND is_active = true ORDER BY created_at DESC';
      const result = await pool.query(query, [planType]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findBySection(section) {
    try {
      const query = 'SELECT * FROM protection_plan_content WHERE section = $1 AND is_active = true ORDER BY created_at DESC';
      const result = await pool.query(query, [section]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(contentData) {
    try {
      const { risk_band, plan_type, section, content_text } = contentData;
      const query = `
        INSERT INTO protection_plan_content (risk_band, plan_type, section, content_text) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *
      `;
      const result = await pool.query(query, [risk_band, plan_type, section, content_text]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getAll(includeInactive = false) {
    try {
      const query = includeInactive
        ? 'SELECT * FROM protection_plan_content ORDER BY created_at DESC'
        : 'SELECT * FROM protection_plan_content WHERE is_active = true ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM protection_plan_content WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async update(id, contentData) {
    try {
      const { risk_band, plan_type, section, content_text, is_active, updated_by } = contentData;
      const query = `
        UPDATE protection_plan_content 
        SET risk_band = $2, plan_type = $3, section = $4, content_text = $5, 
            is_active = $6, updated_by = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
        RETURNING *
      `;
      const result = await pool.query(query, [
        id, risk_band, plan_type, section, content_text, is_active, updated_by
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Soft delete
      const query = 'UPDATE protection_plan_content SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProtectionPlanContent;
