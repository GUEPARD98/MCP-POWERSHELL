# Script de prueba para conexión SSH a Kali
# Usuario HP -> Kali Linux (192.168.1.12)

Write-Host "🐧 Probando Conexión SSH a Kali Linux" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Configuración
$kaliHost = "192.168.1.12"
$kaliUser = "kali"
$kaliKey = "C:\Users\HP\.ssh\kali_key"
$sshOptions = "-o StrictHostKeyChecking=no"

Write-Host "📋 Configuración de Conexión:" -ForegroundColor Yellow
Write-Host "  🖥️  Host: $kaliHost" -ForegroundColor White
Write-Host "  👤 Usuario: $kaliUser" -ForegroundColor White
Write-Host "  🔑 Clave: $kaliKey" -ForegroundColor White

# Verificar clave SSH
Write-Host "`n🔍 Verificando Clave SSH:" -ForegroundColor Yellow
if (Test-Path $kaliKey) {
    Write-Host "  ✅ Clave SSH encontrada" -ForegroundColor Green
    
    # Mostrar información de la clave
    try {
        $keyInfo = ssh-keygen -l -f $kaliKey
        Write-Host "  📋 Info: $keyInfo" -ForegroundColor Gray
    } catch {
        Write-Host "  ⚠️  No se pudo obtener info de la clave" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ Clave SSH no encontrada: $kaliKey" -ForegroundColor Red
    exit 1
}

# Probar conectividad básica
Write-Host "`n🌐 Probando Conectividad:" -ForegroundColor Yellow
try {
    $pingResult = Test-NetConnection -ComputerName $kaliHost -Port 22 -InformationLevel Quiet
    if ($pingResult) {
        Write-Host "  ✅ Puerto SSH (22) accesible en $kaliHost" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Puerto SSH no accesible en $kaliHost" -ForegroundColor Red
        Write-Host "     Verifica que Kali esté encendido y SSH habilitado" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "  ⚠️  No se pudo probar conectividad: $_" -ForegroundColor Yellow
}

# Probar conexión SSH real
Write-Host "`n🔐 Probando Conexión SSH:" -ForegroundColor Yellow
Write-Host "  🔄 Ejecutando: ssh $sshOptions -i $kaliKey $kaliUser@$kaliHost 'whoami && hostname'" -ForegroundColor Gray

try {
    $sshCommand = "ssh $sshOptions -i `"$kaliKey`" $kaliUser@$kaliHost 'whoami && hostname && uname -a'"
    $result = Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Conexión SSH exitosa!" -ForegroundColor Green
        Write-Host "  📋 Resultado:" -ForegroundColor Gray
        $result | ForEach-Object { Write-Host "     $_" -ForegroundColor White }
    } else {
        Write-Host "  ❌ Error en conexión SSH (código: $LASTEXITCODE)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error ejecutando SSH: $_" -ForegroundColor Red
}

# Probar comandos específicos de Kali
Write-Host "`n🐧 Probando Comandos Específicos de Kali:" -ForegroundColor Yellow

$testCommands = @(
    @{ Name = "Versión del sistema"; Command = "lsb_release -a" },
    @{ Name = "Procesos activos"; Command = "ps aux | head -5" },
    @{ Name = "Uso de disco"; Command = "df -h | head -3" },
    @{ Name = "Herramientas de Kali"; Command = "which nmap metasploit-framework" }
)

foreach ($test in $testCommands) {
    Write-Host "  🔄 $($test.Name)..." -ForegroundColor Gray
    try {
        $sshCommand = "ssh $sshOptions -i `"$kaliKey`" $kaliUser@$kaliHost '$($test.Command)'"
        $result = Invoke-Expression $sshCommand
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Éxito" -ForegroundColor Green
            if ($result) {
                $result | Select-Object -First 2 | ForEach-Object { 
                    Write-Host "      $_" -ForegroundColor White 
                }
            }
        } else {
            Write-Host "    ⚠️  Error (código: $LASTEXITCODE)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "    ❌ Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Prueba de Conexión SSH Completada!" -ForegroundColor Green
Write-Host "💡 Ahora puedes usar el servidor MCP con Claude Desktop" -ForegroundColor Gray
Write-Host "🚀 Ejecuta: npm start" -ForegroundColor Gray