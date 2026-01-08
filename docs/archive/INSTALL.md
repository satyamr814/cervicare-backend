# Installation Guide - Step by Step

## Step 1: Check Node.js Installation

First, verify Node.js is installed:

```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org/

## Step 2: Navigate to Project Directory

```bash
cd "/Users/sarvagyakumarupadhyay/Downloads/cervicare final website"
```

## Step 3: Install Dependencies

```bash
npm install
```

This will install:
- express (web server)
- bcryptjs (password hashing - pure JavaScript, no compilation needed)
- uuid (unique ID generation)

## Step 4: Verify Installation

Check if node_modules folder was created:

```bash
ls -la node_modules
```

You should see a `node_modules` directory with all packages.

## Step 5: Start the Server

```bash
npm start
```

You should see:
```
✅ Dependencies loaded successfully
🚀 CerviCare server is running on http://localhost:3000
```

## Step 6: Test the Application

1. Open your browser
2. Go to: http://localhost:3000
3. Click "Sign Up" or "Sign In"
4. Try creating an account

## Troubleshooting

### If npm install fails:

**On macOS/Linux:**
```bash
sudo npm install
```

**If bcryptjs fails, try:**
```bash
npm cache clean --force
npm install
```

### If port 3000 is already in use:

**Change port in server.js:**
```javascript
const PORT = process.env.PORT || 3001;
```

Then access: http://localhost:3001

### If you get "Cannot find module" error:

1. Delete node_modules folder:
   ```bash
   rm -rf node_modules
   ```

2. Delete package-lock.json if it exists:
   ```bash
   rm package-lock.json
   ```

3. Reinstall:
   ```bash
   npm install
   ```

### Check if dependencies are installed:

```bash
node check-dependencies.js
```

## Common Error Messages

### "Error: Cannot find module 'bcryptjs'"
- Run: `npm install bcryptjs`

### "EACCES: permission denied"
- On Mac/Linux: `sudo npm install`
- Or fix permissions: `sudo chown -R $(whoami) ~/.npm`

### "Port 3000 already in use"
- Kill the process or change the port

## Success Indicators

✅ Server starts without errors
✅ You can access http://localhost:3000
✅ Sign up page loads correctly
✅ You can create an account successfully
✅ users.json file is created automatically

