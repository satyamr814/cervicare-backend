# Fix Neon Database - PowerShell Script
Write-Host "🔌 Connecting to Neon database and fixing login issues..." -ForegroundColor Cyan

# Try to find node
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    # Try common locations
    $possiblePaths = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "$env:ProgramFiles(x86)\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $nodePath = $path
            break
        }
    }
}

if (-not $nodePath) {
    Write-Host "❌ Node.js not found. Please install Node.js or run manually:" -ForegroundColor Red
    Write-Host "   node fix-database-now.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found Node.js at: $nodePath" -ForegroundColor Green
Write-Host ""

# Run the fix script
& $nodePath fix-database-now.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Database fix completed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Database fix failed. Check errors above." -ForegroundColor Red
}
