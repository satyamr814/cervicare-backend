# Troubleshooting Guide

## Account Creation Errors

### Error: "Cannot connect to server"
**Solution:**
1. Make sure the server is running:
   ```bash
   npm start
   ```
2. Check if the server is running on `http://localhost:3000`
3. Make sure you're accessing the page from the same port (not opening the HTML file directly)

### Error: "All fields are required"
**Solution:**
- Make sure all fields (First Name, Last Name, Email, Password) are filled in
- Check for any extra spaces that might need to be trimmed

### Error: "Invalid email format"
**Solution:**
- Make sure the email address is in a valid format (e.g., `user@example.com`)

### Error: "Password does not meet all requirements"
**Solution:**
- Password must contain:
  - At least 8 characters
  - One uppercase letter (A-Z)
  - One lowercase letter (a-z)
  - One number (0-9)
  - One special character (!@#$%^&*()_+-=[]{}|;':"\\,.<>/?)

### Error: "Email already registered"
**Solution:**
- This email is already in use. Try logging in instead, or use a different email address.

### Error: "Module not found" or "Cannot find module 'bcrypt'"
**Solution:**
1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```
2. If you're on Windows and having issues with bcrypt, try:
   ```bash
   npm install bcrypt --save
   ```
   Or use bcryptjs instead:
   ```bash
   npm uninstall bcrypt
   npm install bcryptjs
   ```
   Then in `server.js`, change:
   ```javascript
   const bcrypt = require('bcryptjs');
   ```

### Error: "EACCES: permission denied" when writing users.json
**Solution:**
- Make sure the folder has write permissions
- On Linux/Mac, you might need:
   ```bash
   chmod 755 "/Users/sarvagyakumarupadhyay/Downloads/cervicare final website"
   ```

### General Debugging Steps

1. **Check server console logs**: The server will show detailed error messages in the terminal
2. **Check browser console**: Open Developer Tools (F12) and check the Console tab for JavaScript errors
3. **Check Network tab**: In Developer Tools, go to Network tab and see if the API request is being made and what response you're getting
4. **Verify users.json exists**: The file should be automatically created, but you can check if it exists in the project folder

## Common Issues

### Server won't start
- Make sure Node.js is installed: `node --version`
- Make sure you're in the correct directory
- Try deleting `node_modules` and reinstalling: `rm -rf node_modules && npm install`

### Port 3000 already in use
- Kill the process using port 3000:
  ```bash
  # On Mac/Linux:
  lsof -ti:3000 | xargs kill
  
  # On Windows:
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```
- Or change the port in `server.js`:
  ```javascript
  const PORT = process.env.PORT || 3001;
  ```

## Getting Help

If you're still experiencing issues:
1. Check the server console for error messages
2. Check the browser console (F12) for JavaScript errors
3. Check the Network tab to see the API response
4. Share the specific error message you're seeing

