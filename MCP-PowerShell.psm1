# Configuración principal para SSH-PowerShell MCP Server
# Este archivo define funciones y variables para uso con Claude y PowerShell

# ============================================================================
# CONFIGURACIÓN GLOBAL
# ============================================================================

# Información del proyecto
$Global:MCP_PROJECT_NAME = "SSH-PowerShell MCP Server"
$Global:MCP_PROJECT_VERSION = "1.0.0"
$Global:MCP_PROJECT_ROOT = $PSScriptRoot

# Rutas importantes
$Global:MCP_CONFIG_DIR = Join-Path $MCP_PROJECT_ROOT "config"
$Global:MCP_SCRIPTS_DIR = Join-Path $MCP_PROJECT_ROOT "scripts"
$Global:MCP_DOCS_DIR = Join-Path $MCP_PROJECT_ROOT "docs"
$Global:MCP_SRC_DIR = Join-Path $MCP_PROJECT_ROOT "src"

# ============================================================================
# FUNCIONES DE UTILIDAD
# ============================================================================

# Función para mostrar información del proyecto
function Show-MCPInfo {
    Write-Host "🚀 $Global:MCP_PROJECT_NAME v$Global:MCP_PROJECT_VERSION" -ForegroundColor Cyan
    Write-Host "📁 Directorio: $Global:MCP_PROJECT_ROOT" -ForegroundColor Gray
    Write-Host "🔧 Configuración: $Global:MCP_CONFIG_DIR" -ForegroundColor Gray
    Write-Host "📚 Documentación: $Global:MCP_DOCS_DIR" -ForegroundColor Gray
}

# Función para verificar prerrequisitos
function Test-MCPPrerequisites {
    $checks = @()
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        $checks += @{ Component = "Node.js"; Status = "✅"; Version = $nodeVersion }
    } catch {
        $checks += @{ Component = "Node.js"; Status = "❌"; Version = "No instalado" }
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version
        $checks += @{ Component = "npm"; Status = "✅"; Version = "v$npmVersion" }
    } catch {
        $checks += @{ Component = "npm"; Status = "❌"; Version = "No instalado" }
    }
    
    # Verificar dependencias
    if (Test-Path (Join-Path $Global:MCP_PROJECT_ROOT "node_modules")) {
        $checks += @{ Component = "Dependencias"; Status = "✅"; Version = "Instaladas" }
    } else {
        $checks += @{ Component = "Dependencias"; Status = "⚠️"; Version = "Pendientes" }
    }
    
    # Verificar configuración
    if (Test-Path (Join-Path $Global:MCP_CONFIG_DIR ".env")) {
        $checks += @{ Component = "Configuración"; Status = "✅"; Version = "Configurado" }
    } else {
        $checks += @{ Component = "Configuración"; Status = "⚠️"; Version = "Pendiente" }
    }
    
    return $checks
}

# Función para mostrar estado del sistema
function Show-MCPStatus {
    Show-MCPInfo
    Write-Host ""
    Write-Host "🔍 Estado del Sistema:" -ForegroundColor Yellow
    
    $checks = Test-MCPPrerequisites
    $checks | ForEach-Object {
        Write-Host "  $($_.Status) $($_.Component): $($_.Version)" -ForegroundColor White
    }
    
    Write-Host ""
}

# Función para configuración rápida
function Start-MCPQuickSetup {
    param(
        [string]$Environment = "development"
    )
    
    Write-Host "⚡ Configuración Rápida - $Environment" -ForegroundColor Cyan
    
    # Verificar si ya está configurado
    $configFile = Join-Path $Global:MCP_CONFIG_DIR ".env"
    if (Test-Path $configFile) {
        Write-Host "✅ Ya existe configuración en: $configFile" -ForegroundColor Green
        return
    }
    
    # Copiar configuración base
    $sourceConfig = Join-Path $Global:MCP_CONFIG_DIR ".env.$Environment"
    if (Test-Path $sourceConfig) {
        Copy-Item $sourceConfig $configFile
        Write-Host "✅ Configuración creada desde: .env.$Environment" -ForegroundColor Green
    } else {
        Write-Warning "⚠️ No se encontró configuración base: .env.$Environment"
    }
}

# Función para iniciar servidor con validaciones
function Start-MCPServer {
    param(
        [string]$Environment = "development",
        [switch]$SkipChecks
    )
    
    if (-not $SkipChecks) {
        Write-Host "🔍 Verificando prerrequisitos..." -ForegroundColor Yellow
        $checks = Test-MCPPrerequisites
        
        $failed = $checks | Where-Object { $_.Status -eq "❌" }
        if ($failed) {
            Write-Error "❌ Faltan prerrequisitos. Ejecuta: .\scripts\setup.ps1"
            return
        }
    }
    
    Write-Host "🚀 Iniciando servidor MCP..." -ForegroundColor Green
    & (Join-Path $Global:MCP_SCRIPTS_DIR "start.ps1") -Environment $Environment
}

# Función para detener servidor
function Stop-MCPServer {
    param([switch]$Force)
    
    if ($Force) {
        & (Join-Path $Global:MCP_SCRIPTS_DIR "stop.ps1") -Force
    } else {
        & (Join-Path $Global:MCP_SCRIPTS_DIR "stop.ps1")
    }
}

# ============================================================================
# ALIASES Y SHORTCUTS
# ============================================================================

# Aliases para comandos comunes
Set-Alias -Name mcp-info -Value Show-MCPInfo
Set-Alias -Name mcp-status -Value Show-MCPStatus
Set-Alias -Name mcp-start -Value Start-MCPServer
Set-Alias -Name mcp-stop -Value Stop-MCPServer
Set-Alias -Name mcp-setup -Value Start-MCPQuickSetup

# ============================================================================
# EXPORTAR FUNCIONES
# ============================================================================

Export-ModuleMember -Function Show-MCPInfo, Show-MCPStatus, Test-MCPPrerequisites, Start-MCPQuickSetup, Start-MCPServer, Stop-MCPServer
Export-ModuleMember -Alias mcp-info, mcp-status, mcp-start, mcp-stop, mcp-setup
Export-ModuleMember -Variable MCP_PROJECT_NAME, MCP_PROJECT_VERSION, MCP_PROJECT_ROOT, MCP_CONFIG_DIR, MCP_SCRIPTS_DIR, MCP_DOCS_DIR, MCP_SRC_DIR

# ============================================================================
# INICIALIZACIÓN
# ============================================================================

# Mostrar información al cargar el módulo
Write-Host "📦 Módulo SSH-PowerShell MCP cargado" -ForegroundColor Green
Write-Host "💡 Usa 'mcp-status' para ver el estado del sistema" -ForegroundColor Gray
Write-Host "💡 Usa 'mcp-start' para iniciar el servidor" -ForegroundColor Gray