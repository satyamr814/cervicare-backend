@echo off
echo Setting up environment...

echo DATABASE_URL=postgresql://postgres:admin@localhost:5432/cervicare_db > .env
echo JWT_SECRET=cervicare-super-secret-jwt-key-for-production-min-32-chars-long >> .env
echo PORT=3000 >> .env
echo NODE_ENV=development >> .env
echo ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 >> .env
echo GOOGLE_SHEETS_SPREADSHEET_ID=1jRprM6lBFldJSUEaoBtDJ6H3r4NXYVaXtXSDgYI_G1Q >> .env
echo ADMIN_KEY=cervicare-admin-secret-key-16-chars >> .env
echo ADMIN_EMAILS=admin@cervicare.com >> .env

echo Environment setup complete!
pause
