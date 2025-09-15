# Script de configuración para SSH-PowerShell MCP Server
# Autor: SSH-PowerShell MCP Team
# Versión: 1.0.0

param(
    [Parameter(HelpMessage="Configurar para entorno específico")]
    [ValidateSet("development", "production", "test", "all")]
    [string]$Environment = "development",
    
    [Parameter(HelpMessage="Configurar Claude Desktop automáticamente")]
    [switch]$ConfigureClaude,
    
    [Parameter(HelpMessage="Generar claves SSH automáticamente")]
    [switch]$GenerateSSHKeys
)

Write-Host "⚙️  SSH-PowerShell MCP Server - Configuración" -ForegroundColor Cyan
Write-Host "🎯 Entorno: $Environment" -ForegroundColor Yellow

# Función para configurar archivos de entorno
function Set-EnvironmentConfig {
    param($env)
    
    $configFile = "config\.env.$env"
    
    if (-not (Test-Path $configFile)) {
        Write-Error "❌ Archivo de configuración no encontrado: $configFile"
        return
    }
    
    Write-Host "📝 Configurando entorno: $env" -ForegroundColor Green
    
    # Crear copia activa
    Copy-Item $configFile "config\.env" -Force
    Write-Host "✅ Configuración activa actualizada: config\.env" -ForegroundColor Green
}

# Verificar dependencias
Write-Host "🔍 Verificando dependencias..." -ForegroundColor Yellow

# Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "❌ Node.js no está instalado. Instálalo desde: https://nodejs.org/"
    exit 1
}

# Configurar entornos
if ($Environment -eq "all") {
    @("development", "production", "test") | ForEach-Object {
        Set-EnvironmentConfig $_
    }
} else {
    Set-EnvironmentConfig $Environment
}

# Instalar dependencias npm
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias npm..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
    } else {
        Write-Error "❌ Error instalando dependencias"
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Configuración completada!" -ForegroundColor Green
Write-Host "🚀 Para iniciar el servidor: .\scripts\start.ps1" -ForegroundColor Gray
Write-Host "📖 Documentación: docs\README.md" -ForegroundColor Gray
Write-Host "⚙️  Configuración activa: config\.env" -ForegroundColor Gray