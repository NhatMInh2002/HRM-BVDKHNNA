param([switch]$Build, [switch]$Recreate)

$ROOT     = $PSScriptRoot
$FE       = "$ROOT\frontend"
$STANDALONE = "$FE\.next\standalone\frontend"   # Next.js nests under app name

if ($Build) {
    Write-Host "Building..." -ForegroundColor Cyan
    Push-Location $FE
    npm run build
    Pop-Location
}

if ($Recreate) {
    Write-Host "Recreating container with correct env..." -ForegroundColor Cyan
    $raw    = Get-Content "$ROOT\.env" -Raw
    $secret = [regex]::Match($raw, 'NEXTAUTH_SECRET=(.+)').Groups[1].Value.Trim()
    $url    = [regex]::Match($raw, 'NEXTAUTH_URL=(.+)').Groups[1].Value.Trim()

    docker stop hrm-frontend 2>$null
    docker rm   hrm-frontend 2>$null

    docker run -d `
      --name hrm-frontend `
      --network hrm_default `
      -p 3000:3000 `
      -e BACKEND_URL=http://hrm-backend:8080 `
      -e NEXTAUTH_URL=$url `
      -e NEXTAUTH_SECRET=$secret `
      -e NODE_ENV=production `
      --restart unless-stopped `
      hrm-frontend:latest

    Start-Sleep -Seconds 4
}

Write-Host "Deploying to Docker (standalone: $STANDALONE)..." -ForegroundColor Cyan

# Server code từ standalone/frontend (có server.js, .next/server, node_modules)
docker cp "$STANDALONE\." hrm-frontend:/app/

# Static assets (client JS/CSS) — không có trong standalone
docker exec hrm-frontend sh -c "rm -rf /app/.next/static"
docker cp "$FE\.next\static" hrm-frontend:/app/.next/static

# Public folder (images, fonts, svg, ...) — standalone không tự copy
docker exec hrm-frontend sh -c "rm -rf /app/public && mkdir -p /app/public"
docker cp "$FE\public\." hrm-frontend:/app/public

# Copy BUILD_ID và routes-manifest từ root .next (standalone không có đủ)
docker cp "$FE\.next\BUILD_ID"               hrm-frontend:/app/.next/BUILD_ID
docker cp "$FE\.next\routes-manifest.json"   hrm-frontend:/app/.next/routes-manifest.json
docker cp "$FE\.next\required-server-files.json" hrm-frontend:/app/.next/required-server-files.json

# Patch backend URL: localhost → hrm-backend (build local dùng localhost)
docker exec hrm-frontend sh -c "sed -i 's|http://localhost:8080|http://hrm-backend:8080|g' /app/.next/routes-manifest.json"

# Verify BUILD_ID sync
$localId = Get-Content "$FE\.next\BUILD_ID"
$containerBuildId = docker exec hrm-frontend sh -c "cat /app/.next/BUILD_ID"
if ($localId -eq $containerBuildId) {
    Write-Host "BUILD_ID synced: $localId" -ForegroundColor Green
} else {
    Write-Host "WARNING: BUILD_ID mismatch! local=$localId container=$containerBuildId" -ForegroundColor Red
}

docker restart hrm-frontend
Write-Host "Done!" -ForegroundColor Green
