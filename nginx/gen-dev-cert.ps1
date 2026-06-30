# Tao self-signed SSL cert cho dev (KHONG dung cho production)
# Production: thay file trong nginx/certs/ bang chung chi CA that (VNPT-CA/Viettel-CA)

$certDir = Join-Path $PSScriptRoot "certs"
if (-not (Test-Path $certDir)) { New-Item -ItemType Directory -Path $certDir | Out-Null }

$opensslPath = (Get-Command openssl -ErrorAction SilentlyContinue).Source
if (-not $opensslPath) {
    Write-Error "Khong tim thay openssl. Cai Git for Windows (da kem openssl) hoac OpenSSL rieng."
    exit 1
}

& openssl req -x509 -nodes -days 825 -newkey rsa:2048 `
    -keyout "$certDir\privkey.pem" `
    -out "$certDir\fullchain.pem" `
    -subj "/C=VN/ST=NgheAn/L=VinhCity/O=BVHN Nghe An/CN=hrm.bvnghean.local" `
    -addext "subjectAltName=DNS:hrm.bvnghean.local,DNS:localhost,IP:127.0.0.1"

Write-Host "Da tao cert dev tai nginx/certs/. Han dung 825 ngay." -ForegroundColor Green
Write-Host "Trinh duyet se canh bao 'Not secure' vi la self-signed -- binh thuong o moi truong dev." -ForegroundColor Yellow
