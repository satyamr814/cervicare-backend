const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const MAX_BACKUPS = process.env.MAX_BACKUPS || 30;
const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set.');
    process.exit(1);
}

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const getTimestamp = () => {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-');
};

const backupDatabase = () => {
    const timestamp = getTimestamp();
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    console.log(`📦 Starting backup to ${filepath}...`);

    // Use pg_dump to create backup
    // Note: This requires pg_dump to be installed on the system
    const command = `pg_dump "${DB_URL}" -f "${filepath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Backup failed: ${error.message}`);
            return;
        }

        if (stderr) {
            // pg_dump often outputs to stderr even on success (verbose info)
            // mainly we check for error code.
            if (stderr.includes('error')) {
                console.warn(`⚠️ Backup warning: ${stderr}`);
            }
        }

        console.log(`✅ Backup created successfully: ${filename}`);
        rotateBackups();
    });
};

const rotateBackups = () => {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) {
            console.error('❌ Failed to read backup directory for rotation:', err);
            return;
        }

        const backups = files.filter(f => f.startsWith('backup-') && f.endsWith('.sql'));

        // Sort by modification time (newest first)
        backups.sort((a, b) => {
            const statA = fs.statSync(path.join(BACKUP_DIR, a));
            const statB = fs.statSync(path.join(BACKUP_DIR, b));
            return statB.mtime.getTime() - statA.mtime.getTime();
        });

        if (backups.length > MAX_BACKUPS) {
            const toDelete = backups.slice(MAX_BACKUPS);
            console.log(`🧹 Cleaning up ${toDelete.length} old backups...`);

            toDelete.forEach(file => {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
                console.log(`   Deleted: ${file}`);
            });
        }
    });
};

// Check for command line args
const args = process.argv.slice(2);
if (args.includes('--list')) {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) return console.error(err);
        console.log('📂 Available Backups:');
        files.forEach(f => console.log(` - ${f}`));
    });
} else {
    backupDatabase();
}
