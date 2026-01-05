const pool = require('../config/database');

class DietContent {
  static async findByFilters(dietType, budgetLevel, region) {
    try {
      const query = `
        SELECT * FROM diet_content 
        WHERE diet_type = $1 AND budget_level = $2 AND region = $3
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
      const query = 'SELECT * FROM diet_content WHERE diet_type = $1 ORDER BY created_at DESC';
      const result = await pool.query(query, [dietType]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByBudgetLevel(budgetLevel) {
    try {
      const query = 'SELECT * FROM diet_content WHERE budget_level = $1 ORDER BY created_at DESC';
      const result = await pool.query(query, [budgetLevel]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByRegion(region) {
    try {
      const query = 'SELECT * FROM diet_content WHERE region = $1 ORDER BY created_at DESC';
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

  static async getAll() {
    try {
      const query = 'SELECT * FROM diet_content ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DietContent;
