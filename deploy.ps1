# Lambda Deployment Script for Windows PowerShell
# This script creates a deployment package optimized for AWS Lambda

Write-Host "🚀 Starting Lambda deployment package creation..." -ForegroundColor Cyan

# Step 1: Build the project
Write-Host "`n📦 Building NestJS project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Create deployment directory
$deployDir = "lambda-deploy"
Write-Host "`n🗂️  Creating deployment directory..." -ForegroundColor Yellow
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Step 3: Copy necessary files
Write-Host "`n📋 Copying required files..." -ForegroundColor Yellow
Copy-Item -Path "dist" -Destination "$deployDir/dist" -Recurse
Copy-Item -Path "package.json" -Destination "$deployDir/"
Write-Host "  ✓ Copied dist/ and package.json" -ForegroundColor Green

# Step 4: Install production dependencies only
Write-Host "`n📥 Installing production dependencies..." -ForegroundColor Yellow
Set-Location $deployDir
npm install --omit=dev --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "  ✓ Production dependencies installed" -ForegroundColor Green

# Step 5: Remove unnecessary files from node_modules
Write-Host "`n🧹 Cleaning up unnecessary files..." -ForegroundColor Yellow
$cleanupPaths = @(
    "$deployDir/node_modules/@nestjs/cli",
    "$deployDir/node_modules/@nestjs/testing",
    "$deployDir/node_modules/@types",
    "$deployDir/node_modules/typescript",
    "$deployDir/node_modules/jest",
    "$deployDir/node_modules/.bin"
)

foreach ($path in $cleanupPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "  ✓ Removed $(Split-Path $path -Leaf)" -ForegroundColor Green
    }
}

# Step 6: Remove source maps and typescript files
Write-Host "`n🗑️  Removing source maps and .ts files..." -ForegroundColor Yellow
Get-ChildItem -Path "$deployDir" -Recurse -Include "*.map", "*.ts" -File | Remove-Item -Force
Write-Host "  ✓ Cleanup complete" -ForegroundColor Green

# Step 7: Create zip file
Write-Host "`n📦 Creating deployment zip..." -ForegroundColor Yellow
$zipFile = "lambda-deployment.zip"
if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
}

Set-Location $deployDir
Compress-Archive -Path * -DestinationPath "../$zipFile" -CompressionLevel Optimal -Force
Set-Location ..

# Step 8: Show results
Write-Host "`n✅ Deployment package created successfully!" -ForegroundColor Green
Write-Host "`n📊 Package Statistics:" -ForegroundColor Cyan

$zipSize = (Get-Item $zipFile).Length / 1MB
$unzippedSize = (Get-ChildItem $deployDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$fileCount = (Get-ChildItem $deployDir -Recurse -File | Measure-Object).Count

Write-Host "  📁 Unzipped size: $([math]::Round($unzippedSize, 2)) MB" -ForegroundColor White
Write-Host "  🗜️  Zipped size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor White
Write-Host "  📄 File count: $fileCount" -ForegroundColor White

# Step 9: Check Lambda limits
Write-Host "`n🎯 Lambda Limits Check:" -ForegroundColor Cyan
if ($zipSize -lt 50) {
    Write-Host "  ✅ Zip size ($([math]::Round($zipSize, 2)) MB) is under 50 MB limit (direct upload)" -ForegroundColor Green
} elseif ($zipSize -lt 250) {
    Write-Host "  ⚠️  Zip size ($([math]::Round($zipSize, 2)) MB) requires S3 upload (over 50 MB)" -ForegroundColor Yellow
} else {
    Write-Host "  ❌ Zip size ($([math]::Round($zipSize, 2)) MB) exceeds 250 MB S3 limit!" -ForegroundColor Red
}

if ($unzippedSize -lt 250) {
    Write-Host "  ✅ Unzipped size ($([math]::Round($unzippedSize, 2)) MB) is under 250 MB limit" -ForegroundColor Green
} else {
    Write-Host "  ❌ Unzipped size ($([math]::Round($unzippedSize, 2)) MB) exceeds 250 MB limit!" -ForegroundColor Red
}

Write-Host "`n🎉 Done! Deployment package: $zipFile" -ForegroundColor Cyan
Write-Host "📁 Temp directory: $deployDir (can be deleted after upload)" -ForegroundColor Gray
