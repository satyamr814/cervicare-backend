@echo off
echo ================================================
echo CerviCare Phase 1 Backend - Environment Setup
echo ================================================
echo.

REM Copy .env.phase1 to .env
if exist .env (
    echo WARNING: .env file already exists!
    echo.
    choice /C YN /M "Do you want to overwrite it with Phase 1 configuration"
    if errorlevel 2 goto :skip
    if errorlevel 1 goto :copy
) else (
    goto :copy
)

:copy
copy /Y .env.phase1 .env
echo ✓ Created .env file with Phase 1 configuration
echo.
goto :continue

:skip
echo Skipped .env creation
echo.

:continue
echo ================================================
echo Next Steps:
echo ================================================
echo 1. Review .env file and update if needed
echo 2. Run: npm install
echo 3. Initialize database: psql "your-neon-url" -f database/schema.sql
echo 4. Add sample content: psql "your-neon-url" -f database/sample-content.sql
echo 5. Start server: npm run dev
echo.
echo ================================================
pause
