const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Check dependencies
let bcrypt, uuidv4;
try {
    // Using bcryptjs instead of bcrypt (pure JavaScript, no compilation needed)
    bcrypt = require('bcryptjs');
    const uuid = require('uuid');
    uuidv4 = uuid.v4;
    console.log('✅ Dependencies loaded successfully');
} catch (error) {
    console.error('❌ Error loading dependencies:', error.message);
    console.error('Please run: npm install');
    console.error('Required packages: express, bcryptjs, uuid');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (for cross-origin requests)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Users data file path
const USERS_FILE = path.join(__dirname, 'users.json');

// ===== HELPER FUNCTIONS =====
// In-memory cache for users (fallback if file operations fail)
let usersCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5000; // 5 seconds

// Read users from file with retry logic
async function readUsers(retryCount = 0) {
    const maxRetries = 3;
    
    try {
        // Check cache first if recent
        if (usersCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_TTL) {
            return usersCache;
        }
        
        // Try to read file
        const data = await fs.readFile(USERS_FILE, 'utf8');
        if (!data || data.trim() === '') {
            console.log('Users file is empty, initializing...');
            const emptyData = { users: [] };
            await writeUsers(emptyData);
            usersCache = emptyData;
            cacheTimestamp = Date.now();
            return emptyData;
        }
        
        const parsed = JSON.parse(data);
        // Ensure the structure is correct
        if (!parsed.users || !Array.isArray(parsed.users)) {
            console.log('Users file structure invalid, resetting...');
            const emptyData = { users: [] };
            await writeUsers(emptyData);
            usersCache = emptyData;
            cacheTimestamp = Date.now();
            return emptyData;
        }
        
        // Update cache
        usersCache = parsed;
        cacheTimestamp = Date.now();
        return parsed;
        
    } catch (error) {
        // If file doesn't exist, create empty users array
        if (error.code === 'ENOENT') {
            console.log('Creating users.json file...');
            try {
                const emptyData = { users: [] };
                await writeUsers(emptyData);
                usersCache = emptyData;
                cacheTimestamp = Date.now();
                return emptyData;
            } catch (writeError) {
                console.error('Error creating users file:', writeError);
                // Return cached data or empty as fallback
                return usersCache || { users: [] };
            }
        }
        
        // If JSON parse error, try to recover
        if (error instanceof SyntaxError) {
            console.error('JSON parse error in users file, resetting...', error.message);
            try {
                const emptyData = { users: [] };
                await writeUsers(emptyData);
                usersCache = emptyData;
                cacheTimestamp = Date.now();
                return emptyData;
            } catch (writeError) {
                console.error('Error resetting users file:', writeError);
                return usersCache || { users: [] };
            }
        }
        
        // If file is locked or busy, retry
        if ((error.code === 'EBUSY' || error.code === 'EACCES' || error.code === 'EPERM') && retryCount < maxRetries) {
            console.log(`File busy, retrying... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
            return readUsers(retryCount + 1);
        }
        
        console.error('Error reading users file:', error.message, error.code);
        // Return cached data or empty as fallback
        return usersCache || { users: [] };
    }
}

// Write users to file with retry logic
async function writeUsers(data, retryCount = 0) {
    const maxRetries = 3;
    
    try {
        // Ensure directory exists
        const dir = path.dirname(USERS_FILE);
        await fs.mkdir(dir, { recursive: true });
        
        // Ensure data structure is valid
        const validData = {
            users: Array.isArray(data.users) ? data.users : []
        };
        
        // Write atomically using a temporary file first
        const tempFile = USERS_FILE + '.tmp';
        const jsonData = JSON.stringify(validData, null, 2);
        
        // Write to temp file first
        await fs.writeFile(tempFile, jsonData, 'utf8');
        
        // Then rename (atomic operation on most systems)
        await fs.rename(tempFile, USERS_FILE);
        
        // Update cache
        usersCache = validData;
        cacheTimestamp = Date.now();
        
        console.log('Users file updated successfully');
    } catch (error) {
        // If file is locked or busy, retry
        if ((error.code === 'EBUSY' || error.code === 'EACCES' || error.code === 'EPERM') && retryCount < maxRetries) {
            console.log(`File busy during write, retrying... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
            return writeUsers(data, retryCount + 1);
        }
        
        console.error('Error writing users file:', error.message, error.code);
        console.error('File path:', USERS_FILE);
        
        // Update cache even if write fails
        usersCache = {
            users: Array.isArray(data.users) ? data.users : []
        };
        cacheTimestamp = Date.now();
        
        // Don't throw for read operations, but log the error
        if (retryCount >= maxRetries) {
            console.error('Max retries reached for file write. Using cache.');
        }
        
        throw error;
    }
}

// ===== ROUTES =====
// Route for index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for protection.html
app.get('/protection.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'protection.html'));
});

// Route for auth.html
app.get('/auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ===== AUTHENTICATION API =====
// Sign Up / Create Account
app.post('/api/auth/signup', async (req, res) => {
    try {
        console.log('Signup request received:', { 
            firstName: req.body.firstName ? 'present' : 'missing',
            lastName: req.body.lastName ? 'present' : 'missing',
            email: req.body.email ? 'present' : 'missing',
            password: req.body.password ? 'present' : 'missing'
        });
        
        const { firstName, lastName, email, password } = req.body;
        
        // Validation
        if (!firstName || !lastName || !email || !password) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character'
            });
        }
        
        // Read existing users
        let data;
        try {
            data = await readUsers();
            if (!data || !data.users) {
                data = { users: [] };
            }
        } catch (readError) {
            console.error('Error reading users during signup:', readError);
            return res.status(500).json({
                success: false,
                message: 'Unable to access user database. Please try again.'
            });
        }
        
        // Check if user already exists
        const existingUser = data.users.find(user => user.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered. Please login instead.'
            });
        }
        
        // Hash password
        let hashedPassword;
        try {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(password, saltRounds);
        } catch (hashError) {
            console.error('Error hashing password:', hashError);
            return res.status(500).json({
                success: false,
                message: 'Error processing password. Please try again.'
            });
        }
        
        // Create new user
        const newUser = {
            id: uuidv4(),
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        // Add user to data
        data.users.push(newUser);
        
        // Save to file
        try {
            await writeUsers(data);
        } catch (writeError) {
            console.error('Error writing users file during signup:', writeError);
            return res.status(500).json({
                success: false,
                message: 'Account created but unable to save. Please try logging in or contact support.'
            });
        }
        
        // Return success (don't send password)
        const { password: _, ...userWithoutPassword } = newUser;
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: userWithoutPassword
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating your account. Please try again.'
        });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Read users
        let data;
        try {
            data = await readUsers();
            if (!data || !data.users) {
                data = { users: [] };
            }
        } catch (readError) {
            console.error('Error reading users during login:', readError);
            return res.status(500).json({
                success: false,
                message: 'Unable to access user database. Please try again.'
            });
        }
        
        // Find user by email
        const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Verify password
        let passwordMatch;
        try {
            passwordMatch = await bcrypt.compare(password, user.password);
        } catch (compareError) {
            console.error('Error comparing password:', compareError);
            return res.status(500).json({
                success: false,
                message: 'Error verifying password. Please try again.'
            });
        }
        
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login. Please try again.'
        });
    }
});

// Get current user (for checking if logged in)
app.get('/api/auth/me', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }
        
        const data = await readUsers();
        const user = data.users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: userWithoutPassword
        });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
});

// API endpoint for protection plans (optional - for future backend integration)
app.get('/api/protection-plans', (req, res) => {
    res.json({
        success: true,
        message: 'Protection plans API endpoint',
        plans: []
    });
});

// API endpoint to save protection plan data (optional)
app.post('/api/protection-plans/save', express.json(), (req, res) => {
    // In a real application, you would save this to a database
    console.log('Protection plan data received:', req.body);
    res.json({
        success: true,
        message: 'Protection plan data saved successfully'
    });
});

// Initialize users.json if it doesn't exist
async function initializeUsersFile() {
    try {
        console.log('📁 Users file path:', USERS_FILE);
        const data = await readUsers();
        console.log(`✅ Users file ready (${data.users.length} users)`);
    } catch (error) {
        console.error('⚠️  Error initializing users file:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        // Try to create file as fallback
        try {
            await writeUsers({ users: [] });
            console.log('✅ Created new users file');
        } catch (writeError) {
            console.error('❌ Failed to create users file:', writeError.message);
        }
    }
}

// Start server
async function startServer() {
    // Initialize users file
    await initializeUsersFile();
    
    const server = app.listen(PORT, () => {
        console.log(`\n🚀 CerviCare server is running on http://localhost:${PORT}`);
        console.log(`📄 Main page: http://localhost:${PORT}/`);
        console.log(`🛡️  Protection Plans: http://localhost:${PORT}/protection.html`);
        console.log(`🔐 Authentication: http://localhost:${PORT}/auth.html`);
        console.log(`\n📝 To create an account, visit: http://localhost:${PORT}/auth.html\n`);
    });
    
    // Handle port already in use error
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`\n❌ Error: Port ${PORT} is already in use.`);
            console.error(`\n💡 Solutions:`);
            console.error(`   1. Kill the process using port ${PORT}:`);
            console.error(`      lsof -ti:${PORT} | xargs kill -9`);
            console.error(`   2. Or use a different port:`);
            console.error(`      PORT=3001 npm start`);
            console.error(`\n🔍 Finding processes on port ${PORT}...`);
            
            // Try to find and suggest killing the process
            const { exec } = require('child_process');
            exec(`lsof -ti:${PORT}`, (err, stdout) => {
                if (!err && stdout.trim()) {
                    const pids = stdout.trim().split('\n').filter(Boolean);
                    console.error(`   Found process(es): ${pids.join(', ')}`);
                    console.error(`   To kill them, run: kill -9 ${pids.join(' ')}`);
                }
            });
            
            process.exit(1);
        } else {
            console.error('❌ Server error:', error);
            process.exit(1);
        }
    });
}

// Start the server
startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});


