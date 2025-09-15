# Perfil de PowerShell para SSH-PowerShell MCP Server
# Este archivo se carga automáticamente cuando se abre PowerShell en el directorio del proyecto

# Importar módulo MCP si está disponible
if (Test-Path "$PSScriptRoot\MCP-PowerShell.psm1") {
    Import-Module "$PSScriptRoot\MCP-PowerShell.psm1" -Force
    
    # Mostrar bienvenida
    Write-Host ""
    Write-Host "🎯 SSH-PowerShell MCP Server - Entorno Listo" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Gray
    
    # Mostrar estado rápido
    Show-MCPStatus
    
    Write-Host "💡 Comandos disponibles:" -ForegroundColor Yellow
    Write-Host "  mcp-status   - Ver estado del sistema" -ForegroundColor Gray
    Write-Host "  mcp-start    - Iniciar servidor MCP" -ForegroundColor Gray
    Write-Host "  mcp-stop     - Detener servidor MCP" -ForegroundColor Gray
    Write-Host "  mcp-setup    - Configuración rápida" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📚 Documentación: docs\README.md" -ForegroundColor Gray
    Write-Host "⚙️  Scripts: scripts\" -ForegroundColor Gray
    Write-Host ""
}

# Configurar prompt personalizado
function prompt {
    $location = Get-Location
    $projectName = Split-Path $location -Leaf
    
    if ($projectName -eq "GOOSE" -or $projectName -like "*mcp*") {
        Write-Host "🚀 MCP" -NoNewline -ForegroundColor Cyan
        Write-Host " $($location.Path.Replace($HOME, '~'))" -NoNewline -ForegroundColor Yellow
        Write-Host " λ " -NoNewline -ForegroundColor Green
    } else {
        Write-Host "PS $($location.Path.Replace($HOME, '~'))" -NoNewline -ForegroundColor Blue
        Write-Host " > " -NoNewline -ForegroundColor Green
    }
    
    return " "
}

# Función para navegación rápida
function Set-MCPLocation {
    param([string]$Target = "root")
    
    switch ($Target.ToLower()) {
        "root" { Set-Location $PSScriptRoot }
        "config" { Set-Location (Join-Path $PSScriptRoot "config") }
        "docs" { Set-Location (Join-Path $PSScriptRoot "docs") }
        "scripts" { Set-Location (Join-Path $PSScriptRoot "scripts") }
        "src" { Set-Location (Join-Path $PSScriptRoot "src") }
        "tests" { Set-Location (Join-Path $PSScriptRoot "tests") }
        default { 
            Write-Host "Ubicaciones disponibles: root, config, docs, scripts, src, tests" -ForegroundColor Yellow
            return
        }
    }
    
    Write-Host "📁 Navegado a: $(Get-Location)" -ForegroundColor Green
}

# Alias para navegación
Set-Alias -Name cd-mcp -Value Set-MCPLocation

# Configurar variables de entorno útiles
$env:MCP_PROJECT_ROOT = $PSScriptRoot
$env:MCP_DEVELOPMENT_MODE = "true"

# Función para ver logs en tiempo real (si existen)
function Watch-MCPLogs {
    $logPath = Join-Path $PSScriptRoot "logs"
    if (Test-Path $logPath) {
        Get-ChildItem $logPath -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object {
            Write-Host "📊 Monitoreando logs: $($_.FullName)" -ForegroundColor Cyan
            Get-Content $_.FullName -Tail 10 -Wait
        }
    } else {
        Write-Host "📊 No se encontraron logs en: $logPath" -ForegroundColor Yellow
    }
}

# Alias adicionales para productividad
Set-Alias -Name logs -Value Watch-MCPLogs
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name la -Value Get-ChildItem