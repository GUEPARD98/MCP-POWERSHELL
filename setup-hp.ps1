# Configuración Específica para PC Usuario HP
# SSH-PowerShell MCP Server
# Ejecutar este script para configurar todo automáticamente

Write-Host "🖥️  Configurando SSH-PowerShell MCP para Usuario HP" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# ===========================================
# INFORMACIÓN DEL SISTEMA
# ===========================================

Write-Host "📋 Información del Sistema:" -ForegroundColor Yellow
Write-Host "  👤 Usuario: $env:USERNAME" -ForegroundColor White
Write-Host "  🏠 Perfil: $env:USERPROFILE" -ForegroundColor White
Write-Host "  💻 Computadora: $env:COMPUTERNAME" -ForegroundColor White
Write-Host "  📁 Directorio Proyecto: $(Get-Location)" -ForegroundColor White

# ===========================================
# VERIFICAR PRERREQUISITOS
# ===========================================

Write-Host "`n🔍 Verificando Prerrequisitos:" -ForegroundColor Yellow

# Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js no instalado" -ForegroundColor Red
    Write-Host "     Descargar de: https://nodejs.org/" -ForegroundColor Gray
    exit 1
}

# npm
try {
    $npmVersion = npm --version
    Write-Host "  ✅ npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ npm no disponible" -ForegroundColor Red
    exit 1
}

# Claves SSH
$sshKeyPath = "C:\Users\HP\.ssh\id_rsa"
if (Test-Path $sshKeyPath) {
    Write-Host "  ✅ Clave SSH principal: id_rsa" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Clave SSH principal no encontrada" -ForegroundColor Yellow
}

$kaliKeyPath = "C:\Users\HP\.ssh\kali_key"
if (Test-Path $kaliKeyPath) {
    Write-Host "  ✅ Clave SSH Kali: kali_key" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Clave SSH Kali no encontrada" -ForegroundColor Yellow
}

# ===========================================
# INSTALAR DEPENDENCIAS
# ===========================================

Write-Host "`n📦 Instalando Dependencias:" -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    Write-Host "  🔄 Instalando paquetes npm..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Dependencias instaladas correctamente" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ Dependencias ya instaladas" -ForegroundColor Green
}

# ===========================================
# CONFIGURAR ARCHIVOS
# ===========================================

Write-Host "`n⚙️  Configurando Archivos:" -ForegroundColor Yellow

# Verificar configuración
if (Test-Path "config\.env") {
    Write-Host "  ✅ Archivo de configuración existe" -ForegroundColor Green
} else {
    Write-Host "  ❌ Archivo de configuración no encontrado" -ForegroundColor Red
    exit 1
}

# ===========================================
# PROBAR SERVIDOR
# ===========================================

Write-Host "`n🧪 Probando Servidor MCP:" -ForegroundColor Yellow

Write-Host "  🔄 Iniciando servidor de prueba..." -ForegroundColor Gray

$testJob = Start-Job -ScriptBlock {
    Set-Location "D:\GOOSE"
    node src\index.js
}

Start-Sleep -Seconds 3

$jobState = Get-Job $testJob | Select-Object -ExpandProperty State
if ($jobState -eq "Running") {
    Write-Host "  ✅ Servidor MCP funciona correctamente" -ForegroundColor Green
    Stop-Job $testJob
    Remove-Job $testJob
} else {
    Write-Host "  ❌ Error iniciando servidor MCP" -ForegroundColor Red
    Get-Job $testJob | Receive-Job
    Remove-Job $testJob
    exit 1
}

# ===========================================
# CONFIGURAR CLAUDE DESKTOP
# ===========================================

Write-Host "`n🤖 Configurando Claude Desktop:" -ForegroundColor Yellow

$claudeConfigPath = "$env:APPDATA\Claude\claude_desktop_config.json"
if (Test-Path $claudeConfigPath) {
    Write-Host "  ✅ Claude Desktop ya configurado" -ForegroundColor Green
    Write-Host "     Archivo: $claudeConfigPath" -ForegroundColor Gray
} else {
    Write-Host "  ⚠️  Claude Desktop no configurado" -ForegroundColor Yellow
    Write-Host "     Ejecuta: .\scripts\setup.ps1 -ConfigureClaude" -ForegroundColor Gray
}

# ===========================================
# RESUMEN FINAL
# ===========================================

Write-Host "`n🎉 Configuración Completada para Usuario HP!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📋 Comandos Disponibles:" -ForegroundColor Cyan
Write-Host "  🚀 Iniciar servidor:    npm start" -ForegroundColor White
Write-Host "  🛑 Detener servidor:    .\scripts\stop.ps1" -ForegroundColor White
Write-Host "  🧪 Ejecutar pruebas:    .\scripts\test.ps1" -ForegroundColor White
Write-Host "  📊 Ver estado:          .\scripts\status.ps1" -ForegroundColor White

Write-Host "`n🔑 Claves SSH Configuradas:" -ForegroundColor Cyan
Write-Host "  📁 Principal: C:\Users\HP\.ssh\id_rsa" -ForegroundColor White
Write-Host "  📁 Kali:     C:\Users\HP\.ssh\kali_key" -ForegroundColor White

Write-Host "`n🤖 Claude Desktop:" -ForegroundColor Cyan
Write-Host "  📁 Config:   $claudeConfigPath" -ForegroundColor White
Write-Host "  🔗 Servidor: ssh-powershell-mcp" -ForegroundColor White

Write-Host "`n💡 Próximos Pasos:" -ForegroundColor Yellow
Write-Host "  1. Ejecutar: npm start" -ForegroundColor Gray
Write-Host "  2. Abrir Claude Desktop" -ForegroundColor Gray
Write-Host "  3. Usar comandos MCP: ssh_execute, powershell_execute, ssh_scan, ssh_keyscan" -ForegroundColor Gray

Write-Host "`n✨ ¡Todo listo para usar con Claude!" -ForegroundColor Green