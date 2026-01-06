const pool = require('../config/database');

class DietContent {
  static async findByFilters(dietType, budgetLevel, region) {
    try {
      const query = `
        SELECT * FROM diet_content 
        WHERE diet_type = $1 AND budget_level = $2 AND region = $3 AND is_active = true
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [dietType, budgetLevel, region]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByDietType(dietType) {
    try {
      const query = 'SELECT * FROM diet_content WHERE diet_type = $1 AND is_active = true ORDER BY created_at DESC';
      const result = await pool.query(query, [dietType]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByBudgetLevel(budgetLevel) {
    try {
      const query = 'SELECT * FROM diet_content WHERE budget_level = $1 AND is_active = true ORDER BY created_at DESC';
      const result = await pool.query(query, [budgetLevel]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByRegion(region) {
    try {
      const query = 'SELECT * FROM diet_content WHERE region = $1 AND is_active = true ORDER BY created_at DESC';
      const result = await pool.query(query, [region]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(contentData) {
    try {
      const { diet_type, budget_level, region, food_name, reason, frequency } = contentData;
      const query = `
        INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `;
      const result = await pool.query(query, [
        diet_type, budget_level, region, food_name, reason, frequency
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getAll(includeInactive = false) {
    try {
      const query = includeInactive
        ? 'SELECT * FROM diet_content ORDER BY created_at DESC'
        : 'SELECT * FROM diet_content WHERE is_active = true ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM diet_content WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async update(id, contentData) {
    try {
      const { diet_type, budget_level, region, food_name, reason, frequency, is_active, updated_by } = contentData;
      const query = `
        UPDATE diet_content 
        SET diet_type = $2, budget_level = $3, region = $4, food_name = $5, 
            reason = $6, frequency = $7, is_active = $8, updated_by = $9, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
        RETURNING *
      `;
      const result = await pool.query(query, [
        id, diet_type, budget_level, region, food_name, reason, frequency, is_active, updated_by
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Soft delete
      const query = 'UPDATE diet_content SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DietContent;
