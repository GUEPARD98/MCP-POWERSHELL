# GOOSE CONTROL REMOTO - Script simplificado
# Uso: .\goose-kali.ps1 "comando"

param([string]$Command)

if (-not $Command) {
    Write-Host "Uso: .\goose-kali.ps1 'comando para ejecutar en Kali'" -ForegroundColor Yellow
    exit
}

Write-Host "🦢➡️🐧 Ejecutando en Kali: $Command" -ForegroundColor Cyan

# Agregar PuTTY al PATH
$env:PATH += ";C:\Program Files\PuTTY"

# Conexión automática con plink
try {
    echo y | plink -ssh -pw "Root1234." kali@192.168.1.12 "/home/kali/goose-remote.sh '$Command'"
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}