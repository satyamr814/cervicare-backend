const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

let doc = null;
let isInitialized = false;

/**
 * Initialize Google Sheets connection
 * This is called once at server startup
 */
async function initializeGoogleSheets() {
  try {
    // Check if credentials path is configured
    if (!process.env.GOOGLE_SHEETS_CREDENTIALS_PATH) {
      console.warn('⚠️  Google Sheets credentials path not configured. Sheets sync will be disabled.');
      return null;
    }

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.warn('⚠️  Google Sheets spreadsheet ID not configured. Sheets sync will be disabled.');
      return null;
    }

    // Load credentials from JSON file
    const credentials = require(process.env.GOOGLE_SHEETS_CREDENTIALS_PATH);

    // Initialize JWT auth
    const serviceAccountAuth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize the sheet
    doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID, serviceAccountAuth);
    
    // Load document properties and worksheets
    await doc.loadInfo();
    
    console.log(`✅ Connected to Google Sheets: ${doc.title}`);
    isInitialized = true;
    
    return doc;
  } catch (error) {
    console.error('❌ Failed to initialize Google Sheets:', error.message);
    console.warn('⚠️  Google Sheets sync will be disabled. Application will continue without it.');
    return null;
  }
}

/**
 * Get or create a worksheet by title
 * @param {string} title - Worksheet title
 * @returns {Promise<GoogleSpreadsheetWorksheet|null>}
 */
async function getOrCreateSheet(title) {
  try {
    if (!doc || !isInitialized) {
      return null;
    }

    // Try to find existing sheet
    let sheet = doc.sheetsByTitle[title];
    
    // Create if doesn't exist
    if (!sheet) {
      sheet = await doc.addSheet({ title });
      console.log(`📊 Created new worksheet: ${title}`);
    }
    
    return sheet;
  } catch (error) {
    console.error(`Error getting/creating sheet "${title}":`, error.message);
    return null;
  }
}

/**
 * Append a row to a worksheet
 * @param {string} sheetTitle - Worksheet title
 * @param {Object} rowData - Data to append
 * @returns {Promise<boolean>}
 */
async function appendRow(sheetTitle, rowData) {
  try {
    if (!doc || !isInitialized) {
      return false;
    }

    const sheet = await getOrCreateSheet(sheetTitle);
    if (!sheet) {
      return false;
    }

    // Load headers if not loaded
    await sheet.loadHeaderRow();
    
    // If no headers, set them from rowData keys
    if (sheet.headerValues.length === 0) {
      await sheet.setHeaderRow(Object.keys(rowData));
    }

    // Append the row
    await sheet.addRow(rowData);
    return true;
  } catch (error) {
    console.error(`Error appending row to "${sheetTitle}":`, error.message);
    return false;
  }
}

/**
 * Update a row in a worksheet
 * @param {string} sheetTitle - Worksheet title
 * @param {Object} searchCriteria - Criteria to find the row (e.g., { user_id: '123' })
 * @param {Object} updateData - Data to update
 * @returns {Promise<boolean>}
 */
async function updateRow(sheetTitle, searchCriteria, updateData) {
  try {
    if (!doc || !isInitialized) {
      return false;
    }

    const sheet = await getOrCreateSheet(sheetTitle);
    if (!sheet) {
      return false;
    }

    // Load all rows
    const rows = await sheet.getRows();
    
    // Find matching row
    const searchKey = Object.keys(searchCriteria)[0];
    const searchValue = searchCriteria[searchKey];
    
    const row = rows.find(r => r.get(searchKey) === searchValue);
    
    if (row) {
      // Update existing row
      Object.keys(updateData).forEach(key => {
        row.set(key, updateData[key]);
      });
      await row.save();
      return true;
    } else {
      // Row doesn't exist, append new one
      await appendRow(sheetTitle, { ...searchCriteria, ...updateData });
      return true;
    }
  } catch (error) {
    console.error(`Error updating row in "${sheetTitle}":`, error.message);
    return false;
  }
}

/**
 * Check if Google Sheets is initialized and ready
 * @returns {boolean}
 */
function isReady() {
  return isInitialized && doc !== null;
}

/**
 * Get the document instance
 * @returns {GoogleSpreadsheet|null}
 */
function getDocument() {
  return doc;
}

module.exports = {
  initializeGoogleSheets,
  getOrCreateSheet,
  appendRow,
  updateRow,
  isReady,
  getDocument
};
