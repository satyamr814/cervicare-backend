const pool = require('../config/database');

class ProtectionPlanContent {
  static async findByFilters(riskBand, planType, section) {
    try {
      const query = `
        SELECT * FROM protection_plan_content 
        WHERE risk_band = $1 AND plan_type = $2 AND section = $3
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
      const query = 'SELECT * FROM protection_plan_content WHERE risk_band = $1 ORDER BY created_at DESC';
      const result = await pool.query(query, [riskBand]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByPlanType(planType) {
    try {
      const query = 'SELECT * FROM protection_plan_content WHERE plan_type = $1 ORDER BY created_at DESC';
      const result = await pool.query(query, [planType]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findBySection(section) {
    try {
      const query = 'SELECT * FROM protection_plan_content WHERE section = $1 ORDER BY created_at DESC';
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

  static async getAll() {
    try {
      const query = 'SELECT * FROM protection_plan_content ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProtectionPlanContent;
