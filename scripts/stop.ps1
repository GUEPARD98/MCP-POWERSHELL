# Script para detener SSH-PowerShell MCP Server
# Autor: SSH-PowerShell MCP Team
# Versión: 1.0.0

param(
    [Parameter(HelpMessage="Forzar cierre de procesos")]
    [switch]$Force,
    
    [Parameter(HelpMessage="También cerrar Claude Desktop")]
    [switch]$IncludeClaude
)

Write-Host "🛑 SSH-PowerShell MCP Server - Deteniendo..." -ForegroundColor Red

# Buscar procesos de Node.js relacionados con MCP
$mcpProcesses = Get-Process | Where-Object { 
    $_.ProcessName -eq "node" -and 
    $_.CommandLine -like "*index.js*" 
}

if ($mcpProcesses) {
    foreach ($process in $mcpProcesses) {
        try {
            Write-Host "🔄 Deteniendo proceso MCP (PID: $($process.Id))..." -ForegroundColor Yellow
            if ($Force) {
                $process | Stop-Process -Force
                Write-Host "✅ Proceso forzadamente terminado" -ForegroundColor Green
            } else {
                $process | Stop-Process
                Write-Host "✅ Proceso terminado gracefully" -ForegroundColor Green
            }
        } catch {
            Write-Warning "⚠️  No se pudo detener el proceso $($process.Id): $_"
        }
    }
} else {
    Write-Host "ℹ️  No se encontraron procesos MCP ejecutándose" -ForegroundColor Blue
}

# Detener Claude Desktop si se solicita
if ($IncludeClaude) {
    $claudeProcesses = Get-Process -Name "*Claude*" -ErrorAction SilentlyContinue
    if ($claudeProcesses) {
        foreach ($process in $claudeProcesses) {
            try {
                Write-Host "🔄 Deteniendo Claude Desktop (PID: $($process.Id))..." -ForegroundColor Yellow
                $process | Stop-Process
                Write-Host "✅ Claude Desktop detenido" -ForegroundColor Green
            } catch {
                Write-Warning "⚠️  No se pudo detener Claude Desktop: $_"
            }
        }
    } else {
        Write-Host "ℹ️  Claude Desktop no está ejecutándose" -ForegroundColor Blue
    }
}

# Limpiar puertos si están ocupados
$ports = @(3000, 3001, 8080)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "🔌 Puerto $port está en uso, intentando liberar..." -ForegroundColor Yellow
        $connections | ForEach-Object {
            try {
                $processId = $_.OwningProcess
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    $process | Stop-Process -Force
                    Write-Host "✅ Liberado puerto $port (proceso $processId)" -ForegroundColor Green
                }
            } catch {
                Write-Warning "⚠️  No se pudo liberar puerto $port: $_"
            }
        }
    }
}

Write-Host ""
Write-Host "✅ Proceso de detención completado" -ForegroundColor Green
Write-Host "💡 Para reiniciar: .\scripts\start.ps1" -ForegroundColor Gray