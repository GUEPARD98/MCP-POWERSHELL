# Script de inicio para SSH-PowerShell MCP Server
# Autor: SSH-PowerShell MCP Team
# Versión: 1.0.0

param(
    [Parameter(HelpMessage="Entorno a usar: development, production, test")]
    [ValidateSet("development", "production", "test")]
    [string]$Environment = "development",
    
    [Parameter(HelpMessage="Modo debug habilitado")]
    [switch]$Debug,
    
    [Parameter(HelpMessage="Puerto específico para el servidor")]
    [int]$Port
)

# Configuración de colores para output
$Host.UI.RawUI.ForegroundColor = "Green"

Write-Host "🚀 SSH-PowerShell MCP Server - Iniciando..." -ForegroundColor Cyan
Write-Host "📁 Directorio: $(Get-Location)" -ForegroundColor Yellow
Write-Host "🌍 Entorno: $Environment" -ForegroundColor Magenta

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Error "❌ Error: No se encuentra package.json. Ejecuta desde el directorio raíz del proyecto."
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "❌ Error: Node.js no está instalado o no está en PATH"
    exit 1
}

# Configurar variables de entorno
$envFile = "config\.env.$Environment"
if (Test-Path $envFile) {
    Write-Host "📋 Cargando configuración: $envFile" -ForegroundColor Yellow
    # Cargar variables de entorno desde archivo
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "  $name = $value" -ForegroundColor Gray
        }
    }
} else {
    Write-Warning "⚠️  Archivo de configuración no encontrado: $envFile"
    Write-Host "📝 Usando configuración por defecto..."
}

# Aplicar parámetros específicos
if ($Debug) {
    [System.Environment]::SetEnvironmentVariable("DEBUG_MODE", "true", "Process")
    [System.Environment]::SetEnvironmentVariable("LOG_LEVEL", "debug", "Process")
    Write-Host "🐛 Modo debug habilitado" -ForegroundColor Yellow
}

if ($Port) {
    [System.Environment]::SetEnvironmentVariable("MCP_SERVER_PORT", $Port.ToString(), "Process")
    Write-Host "🔌 Puerto personalizado: $Port" -ForegroundColor Yellow
}

# Verificar clave SSH
$sshKeyPath = [System.Environment]::GetEnvironmentVariable("SSH_KEY_PATH", "Process")
if ($sshKeyPath) {
    $expandedPath = [System.Environment]::ExpandEnvironmentVariables($sshKeyPath)
    if (Test-Path $expandedPath) {
        Write-Host "🔑 Clave SSH encontrada: $expandedPath" -ForegroundColor Green
    } else {
        Write-Warning "⚠️  Clave SSH no encontrada: $expandedPath"
    }
}

# Instalar dependencias si es necesario
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Error instalando dependencias"
        exit 1
    }
}

Write-Host ""
Write-Host "🎯 Iniciando servidor MCP..." -ForegroundColor Cyan
Write-Host "💡 Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host "📖 Documentación: docs/README.md" -ForegroundColor Gray
Write-Host ""

# Iniciar el servidor
try {
    npm start
} catch {
    Write-Error "❌ Error iniciando el servidor: $_"
    exit 1
}