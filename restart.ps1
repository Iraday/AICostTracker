Write-Host "Checking environment setup..." -ForegroundColor Cyan

# 1. Check if Node is installed and available
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    if (Test-Path "C:\Program Files\nodejs\node.exe") {
        Write-Host "Node.js found in C:\Program Files\nodejs but not in PATH. Adding temporarily..." -ForegroundColor Yellow
        $env:PATH += ";C:\Program Files\nodejs\"
    } else {
        Write-Host "Node.js is not installed. Attempting to install via winget..." -ForegroundColor Yellow
        winget install OpenJS.NodeJS --silent
        $env:PATH += ";C:\Program Files\nodejs\"
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Write-Host "Failed to install Node.js automatically. Please install it manually from https://nodejs.org/" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit
        }
    }
}

# 2. Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Dependencies not found. Running npm install automatically..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "Dependencies already installed." -ForegroundColor Green
}

# 3. Stop existing node processes
Write-Host "Stopping existing node processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Killing node processes..." -ForegroundColor Yellow
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "Old processes stopped." -ForegroundColor Green
} else {
    Write-Host "No existing node processes found." -ForegroundColor Green
}

# 4. Start dev server
Write-Host "Starting fresh Next.js dev server on port 3334..." -ForegroundColor Cyan
npm run dev
