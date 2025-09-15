# 🔌 API Reference - SSH-PowerShell MCP Server

<div align="center">

### 📡 **Documentación Completa de APIs MCP**
*Especificación técnica de herramientas, endpoints y interfaces*

[![MCP](https://img.shields.io/badge/protocol-MCP%200.5.0-purple.svg)](https://modelcontextprotocol.io/)
[![JSON-RPC](https://img.shields.io/badge/transport-JSON--RPC%202.0-blue.svg)](#transport)
[![OpenAPI](https://img.shields.io/badge/spec-OpenAPI%203.0-green.svg)](#schemas)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-blue.svg)](#typescript)

</div>

---

## 🎯 **Visión General del API**

El SSH-PowerShell MCP Server expone **4 herramientas principales** a través del protocolo **Model Context Protocol (MCP)**, permitiendo a Claude ejecutar comandos remotos, escanear redes, y gestionar infraestructura de forma segura y automatizada.

### 🛠️ **Herramientas Disponibles**

| Herramienta | Propósito | Acceso | Criticidad |
|-------------|-----------|--------|------------|
| `ssh_execute` | 🔐 Ejecutar comandos en servidores remotos | Remoto | Alta |
| `powershell_execute` | ⚡ Ejecutar comandos PowerShell locales | Local | Media |
| `ssh_scan` | 🔍 Descubrir hosts SSH en red | Red | Baja |
| `ssh_keyscan` | 🔑 Obtener fingerprints SSH | Remoto | Baja |

---

## 🔐 **ssh_execute** - Ejecución SSH Remota

### 📋 **Descripción**
Ejecuta comandos en servidores remotos usando autenticación SSH por claves. Incluye sanitización avanzada con `shell-escape` y validación de seguridad.

### 🎛️ **Parámetros de Entrada**

```typescript
interface SSHExecuteParams {
  host: string;           // REQUERIDO: Dirección IP o hostname
  user: string;           // REQUERIDO: Usuario SSH
  command: string;        // REQUERIDO: Comando a ejecutar
  keyPath?: string;       // OPCIONAL: Ruta a clave SSH personalizada
  timeout?: number;       // OPCIONAL: Timeout en milisegundos
}
```

#### **🔧 Parámetros Detallados**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `host` | `string` | ✅ | IP o hostname del servidor | `"192.168.1.100"` |
| `user` | `string` | ✅ | Usuario SSH para autenticación | `"admin"` |
| `command` | `string` | ✅ | Comando shell a ejecutar | `"systemctl status nginx"` |
| `keyPath` | `string` | ❌ | Ruta personalizada a clave SSH | `"/path/to/custom_key"` |
| `timeout` | `number` | ❌ | Timeout en ms (default: 30000) | `45000` |

### 📤 **Respuesta**

```typescript
interface SSHExecuteResponse {
  content: Array<{
    type: "text";
    text: string;           // Output del comando o mensaje de error
  }>;
  isError?: boolean;        // true si hubo error
  metadata?: {
    exitCode: number;       // Código de salida del comando
    executionTime: number;  // Tiempo de ejecución en ms
    host: string;          // Host donde se ejecutó
    sanitizedCommand: string; // Comando después de sanitización
  };
}
```

### 🌟 **Ejemplos de Uso**

#### **🖥️ Ejemplo 1: Verificar Estado del Sistema**
```json
{
  "host": "192.168.1.50",
  "user": "administrator",
  "command": "uptime && free -h && df -h"
}
```

**Respuesta:**
```json
{
  "content": [{
    "type": "text",
    "text": " 14:23:45 up 15 days,  3:42,  2 users,  load average: 0.15, 0.18, 0.12\n              total        used        free      shared  buff/cache   available\nMem:           7.8G        2.1G        4.2G        256M        1.5G        5.2G\nSwap:          2.0G          0B        2.0G\nFilesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        20G  8.5G   10G  46% /\n/dev/sda2       100G   45G   50G  47% /home"
  }],
  "metadata": {
    "exitCode": 0,
    "executionTime": 1250,
    "host": "192.168.1.50",
    "sanitizedCommand": "uptime && free -h && df -h"
  }
}
```

#### **🔧 Ejemplo 2: Gestión de Servicios**
```json
{
  "host": "webserver.company.com",
  "user": "sysadmin",
  "command": "sudo systemctl restart nginx && sudo systemctl status nginx --no-pager"
}
```

#### **🐳 Ejemplo 3: Gestión de Contenedores**
```json
{
  "host": "docker-host.internal",
  "user": "docker",
  "command": "docker ps -a && docker stats --no-stream"
}
```

### 🔒 **Características de Seguridad**

#### **🛡️ Sanitización de Comandos**
- **shell-escape**: Escape automático de caracteres especiales
- **Validación**: Blacklist de comandos peligrosos
- **Limitación**: Timeout configurable para prevenir comandos colgados

#### **🔑 Autenticación SSH**
- **Claves SSH**: Autenticación por claves privadas (recomendado)
- **Rutas adaptativas**: Auto-detección de rutas SSH por OS
- **Validación de permisos**: Verificación de permisos 600 en claves

#### **📊 Auditoría**
```javascript
// Log de auditoría automático
{
  "timestamp": "2024-09-14T12:34:56.789Z",
  "event": "ssh_execute",
  "host": "192.168.1.50",
  "user": "admin",
  "command_hash": "sha256:abc123...",
  "success": true,
  "execution_time": 1250
}
```

---

## ⚡ **powershell_execute** - Ejecución PowerShell Local

### 📋 **Descripción**
Ejecuta comandos PowerShell en el sistema Windows local. Optimizado para administración de sistemas Windows y integración con APIs de Windows.

### 🎛️ **Parámetros de Entrada**

```typescript
interface PowerShellExecuteParams {
  command: string;        // REQUERIDO: Comando PowerShell
  timeout?: number;       // OPCIONAL: Timeout en milisegundos
  executionPolicy?: string; // OPCIONAL: Política de ejecución
}
```

#### **🔧 Parámetros Detallados**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `command` | `string` | ✅ | Comando PowerShell | `"Get-Service \| Where-Object Status -eq 'Running'"` |
| `timeout` | `number` | ❌ | Timeout en ms (default: 30000) | `60000` |
| `executionPolicy` | `string` | ❌ | Política de ejecución | `"Bypass"` |

### 📤 **Respuesta**

```typescript
interface PowerShellExecuteResponse {
  content: Array<{
    type: "text";
    text: string;           // Output de PowerShell
  }>;
  isError?: boolean;        // true si hubo error
  metadata?: {
    exitCode: number;       // Código de salida
    executionTime: number;  // Tiempo de ejecución en ms
    powershellVersion: string; // Versión de PowerShell utilizada
  };
}
```

### 🌟 **Ejemplos de Uso**

#### **🖥️ Ejemplo 1: Información del Sistema**
```json
{
  "command": "Get-ComputerInfo | Select-Object WindowsProductName, TotalPhysicalMemory, ProcessorCount"
}
```

**Respuesta:**
```json
{
  "content": [{
    "type": "text",
    "text": "WindowsProductName  : Windows 11 Pro\nTotalPhysicalMemory : 17079209984\nProcessorCount      : 8"
  }],
  "metadata": {
    "exitCode": 0,
    "executionTime": 2100,
    "powershellVersion": "5.1.22621.2506"
  }
}
```

#### **📊 Ejemplo 2: Monitoreo de Servicios**
```json
{
  "command": "Get-Service | Where-Object {$_.Status -eq 'Stopped' -and $_.StartType -eq 'Automatic'} | Select-Object Name, Status, StartType"
}
```

#### **🔍 Ejemplo 3: Análisis de Procesos**
```json
{
  "command": "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, CPU, WorkingSet"
}
```

### 🔒 **Características de Seguridad**

#### **🛡️ Ejecución Controlada**
- **NoProfile**: Ejecución sin cargar perfil de usuario
- **NonInteractive**: Modo no interactivo para seguridad
- **ExecutionPolicy**: Control de políticas de ejecución

#### **📋 Limitaciones de Seguridad**
```powershell
# Comandos restringidos automáticamente
$RestrictedCommands = @(
    'Remove-Item -Recurse -Force C:',
    'Format-Volume',
    'Clear-Disk',
    'Initialize-Disk'
)
```

---

## 🔍 **ssh_scan** - Descubrimiento de Red

### 📋 **Descripción**
Escanea rangos de red para descubrir hosts con servicios SSH activos. Utiliza técnicas optimizadas para identificación rápida de infraestructura SSH.

### 🎛️ **Parámetros de Entrada**

```typescript
interface SSHScanParams {
  network: string;        // REQUERIDO: Rango de red CIDR
  timeout?: number;       // OPCIONAL: Timeout por host
  maxHosts?: number;      // OPCIONAL: Límite de hosts a escanear
}
```

#### **🔧 Parámetros Detallados**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `network` | `string` | ✅ | Rango CIDR o IP específica | `"192.168.1.0/24"` |
| `timeout` | `number` | ❌ | Timeout por host en ms | `5000` |
| `maxHosts` | `number` | ❌ | Máximo hosts a escanear | `254` |

### 📤 **Respuesta**

```typescript
interface SSHScanResponse {
  content: Array<{
    type: "text";
    text: string;           // Lista de hosts SSH encontrados
  }>;
  metadata?: {
    totalScanned: number;   // Total de hosts escaneados
    sshHostsFound: number;  // Hosts con SSH encontrados
    scanDuration: number;   // Duración del escaneo en ms
    technique: string;      // Técnica utilizada (nmap/ping)
  };
}
```

### 🌟 **Ejemplos de Uso**

#### **🌐 Ejemplo 1: Escaneo de Red Local**
```json
{
  "network": "192.168.1.0/24",
  "timeout": 3000
}
```

**Respuesta:**
```json
{
  "content": [{
    "type": "text",
    "text": "🔍 SSH Hosts Discovered:\n\n192.168.1.10:22 - SSH (OpenSSH 8.2)\n192.168.1.15:22 - SSH (OpenSSH 7.9)\n192.168.1.50:22 - SSH (OpenSSH 8.4)\n192.168.1.100:22 - SSH (Dropbear 2020.81)\n\nTotal: 4 SSH servers found"
  }],
  "metadata": {
    "totalScanned": 254,
    "sshHostsFound": 4,
    "scanDuration": 12400,
    "technique": "nmap"
  }
}
```

#### **🏢 Ejemplo 2: Escaneo de Subred Empresarial**
```json
{
  "network": "10.0.0.0/16",
  "maxHosts": 1000
}
```

#### **🎯 Ejemplo 3: Verificación de Host Específico**
```json
{
  "network": "database.company.com"
}
```

### 🔧 **Técnicas de Escaneo**

#### **🚀 Método Primario: nmap**
```bash
nmap -p 22 --open -sS -T4 --host-timeout 30s 192.168.1.0/24
```

#### **📡 Método Fallback: ping sweep**
```bash
for ip in {1..254}; do
  ping -c 1 -W 1 192.168.1.$ip && nc -z -w1 192.168.1.$ip 22
done
```

---

## 🔑 **ssh_keyscan** - Análisis de Claves SSH

### 📋 **Descripción**
Obtiene y analiza fingerprints de claves SSH de servidores remotos. Útil para verificación de identidad y auditorías de seguridad.

### 🎛️ **Parámetros de Entrada**

```typescript
interface SSHKeyscanParams {
  host: string;           // REQUERIDO: Hostname o IP
  port?: number;          // OPCIONAL: Puerto SSH (default: 22)
  keyTypes?: string[];    // OPCIONAL: Tipos de claves a obtener
}
```

#### **🔧 Parámetros Detallados**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `host` | `string` | ✅ | Hostname o dirección IP | `"production.company.com"` |
| `port` | `number` | ❌ | Puerto SSH (default: 22) | `2222` |
| `keyTypes` | `string[]` | ❌ | Tipos de claves específicas | `["rsa", "ed25519"]` |

### 📤 **Respuesta**

```typescript
interface SSHKeyscanResponse {
  content: Array<{
    type: "text";
    text: string;           // Información de claves SSH
  }>;
  metadata?: {
    host: string;          // Host escaneado
    port: number;          // Puerto utilizado
    keysFound: number;     // Número de claves encontradas
    algorithms: string[];  // Algoritmos disponibles
    scanTime: number;      // Tiempo de escaneo en ms
  };
}
```

### 🌟 **Ejemplos de Uso**

#### **🔐 Ejemplo 1: Análisis Completo de Servidor**
```json
{
  "host": "webserver.company.com"
}
```

**Respuesta:**
```json
{
  "content": [{
    "type": "text",
    "text": "🔑 SSH Key Analysis for webserver.company.com:22\n\n📋 Available Host Keys:\n\n🔸 RSA (2048-bit)\n   Fingerprint: SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8\n   MD5: 16:27:ac:a5:76:28:2d:36:63:1b:56:4d:eb:df:a6:48\n\n🔸 ECDSA (256-bit)\n   Fingerprint: SHA256:br9IjFspm1vxR3iA35FWE+4VTyz1hYVLIE2t1/A67Pq\n   MD5: a1:b2:c3:d4:e5:f6:g7:h8:i9:j0:k1:l2:m3:n4:o5:p6\n\n🔸 ED25519\n   Fingerprint: SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU\n   MD5: z1:y2:x3:w4:v5:u6:t7:s8:r9:q0:p1:o2:n3:m4:l5:k6\n\n🛡️ Security Assessment:\n✅ Modern algorithms supported (ED25519, ECDSA)\n✅ RSA key size adequate (2048-bit)\n⚠️  Consider disabling older algorithms in production"
  }],
  "metadata": {
    "host": "webserver.company.com",
    "port": 22,
    "keysFound": 3,
    "algorithms": ["rsa", "ecdsa", "ed25519"],
    "scanTime": 1800
  }
}
```

#### **🔍 Ejemplo 2: Verificación de Puerto Personalizado**
```json
{
  "host": "secure-server.company.com",
  "port": 2222,
  "keyTypes": ["ed25519", "rsa"]
}
```

### 🛡️ **Análisis de Seguridad Automático**

#### **✅ Evaluación de Algoritmos**
```javascript
const SecurityAnalysis = {
  "ed25519": { grade: "A+", recommendation: "Excellent - Modern and secure" },
  "ecdsa": { grade: "A", recommendation: "Good - Widely supported" },
  "rsa-4096": { grade: "B+", recommendation: "Acceptable - Large key size" },
  "rsa-2048": { grade: "B", recommendation: "Minimum recommended" },
  "dss": { grade: "F", recommendation: "Deprecated - Replace immediately" }
};
```

---

## 🔄 **Transport Layer - JSON-RPC 2.0**

### 📡 **Protocolo de Comunicación**

El servidor utiliza **JSON-RPC 2.0** sobre **stdio** como capa de transporte, siguiendo la especificación del protocolo MCP.

#### **📨 Request Format**
```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "tools/call",
  "params": {
    "name": "ssh_execute",
    "arguments": {
      "host": "192.168.1.100",
      "user": "admin",
      "command": "uptime"
    }
  }
}
```

#### **📬 Response Format**
```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "result": {
    "content": [{
      "type": "text",
      "text": "14:23:45 up 15 days, 3:42, 2 users, load average: 0.15, 0.18, 0.12"
    }],
    "isError": false
  }
}
```

#### **❌ Error Response Format**
```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "error": {
    "code": -32603,
    "message": "SSH connection failed",
    "data": {
      "host": "192.168.1.100",
      "error": "Permission denied (publickey)"
    }
  }
}
```

---

## 🔧 **Configuración Avanzada del API**

### 🎛️ **Variables de Entorno**

```bash
# === CONFIGURACIÓN API ===
MCP_SERVER_NAME=ssh-powershell-prod
MCP_PROTOCOL_VERSION=0.5.0
JSON_RPC_VERSION=2.0

# === CONFIGURACIÓN TIMEOUTS ===
DEFAULT_SSH_TIMEOUT=30000      # 30 segundos
DEFAULT_PS_TIMEOUT=30000       # 30 segundos
DEFAULT_SCAN_TIMEOUT=60000     # 60 segundos
DEFAULT_KEYSCAN_TIMEOUT=10000  # 10 segundos

# === CONFIGURACIÓN SEGURIDAD ===
MAX_COMMAND_LENGTH=4096        # Longitud máxima de comando
MAX_OUTPUT_SIZE=1048576        # 1MB de output máximo
RATE_LIMIT_REQUESTS=100        # Requests por minuto
CONCURRENT_OPERATIONS=10       # Operaciones concurrentes

# === CONFIGURACIÓN AUDITORÍA ===
AUDIT_ENABLED=true             # Habilitar auditoría
AUDIT_LOG_PATH=/var/log/ssh-mcp-audit.log
AUDIT_RETENTION_DAYS=90        # Retención de logs
```

### 📊 **Métricas de API**

```typescript
interface APIMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate_limited: number;
  };
  tools: {
    ssh_execute: ToolMetrics;
    powershell_execute: ToolMetrics;
    ssh_scan: ToolMetrics;
    ssh_keyscan: ToolMetrics;
  };
  performance: {
    avg_response_time: number;
    p95_response_time: number;
    concurrent_operations: number;
  };
}

interface ToolMetrics {
  invocations: number;
  success_rate: number;
  avg_execution_time: number;
  last_used: string;
}
```

---

## 🛡️ **Seguridad del API**

### 🔒 **Medidas de Seguridad Implementadas**

#### **🛡️ Sanitización de Entrada**
- **shell-escape**: Sanitización automática de comandos
- **Validación de parámetros**: Esquemas JSON Schema estrictos
- **Blacklist de comandos**: Prevención de comandos destructivos

#### **🔑 Autenticación y Autorización**
- **SSH Key-based**: Solo autenticación por claves SSH
- **Validación de permisos**: Verificación de permisos de archivos
- **No credenciales hardcodeadas**: Configuración externa

#### **📊 Rate Limiting y DoS Protection**
```javascript
const RateLimits = {
  ssh_execute: { limit: 50, window: '1m' },
  powershell_execute: { limit: 100, window: '1m' },
  ssh_scan: { limit: 10, window: '5m' },
  ssh_keyscan: { limit: 20, window: '1m' }
};
```

#### **🔍 Auditoría y Logging**
- **Audit trail**: Log de todas las operaciones
- **PII Protection**: Hash de comandos sensibles
- **Compliance**: GDPR, SOX, HIPAA ready

---

## 📚 **Esquemas TypeScript**

### 🏗️ **Definiciones de Tipos Completas**

```typescript
// ===== INTERFACES PRINCIPALES =====

interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema7;
}

interface ToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
  metadata?: Record<string, any>;
}

// ===== SSH EXECUTE =====

interface SSHExecuteInput {
  host: string;
  user: string;
  command: string;
  keyPath?: string;
  timeout?: number;
}

interface SSHExecuteOutput extends ToolResult {
  metadata?: {
    exitCode: number;
    executionTime: number;
    host: string;
    sanitizedCommand: string;
  };
}

// ===== POWERSHELL EXECUTE =====

interface PowerShellExecuteInput {
  command: string;
  timeout?: number;
  executionPolicy?: string;
}

interface PowerShellExecuteOutput extends ToolResult {
  metadata?: {
    exitCode: number;
    executionTime: number;
    powershellVersion: string;
  };
}

// ===== SSH SCAN =====

interface SSHScanInput {
  network: string;
  timeout?: number;
  maxHosts?: number;
}

interface SSHScanOutput extends ToolResult {
  metadata?: {
    totalScanned: number;
    sshHostsFound: number;
    scanDuration: number;
    technique: string;
  };
}

// ===== SSH KEYSCAN =====

interface SSHKeyscanInput {
  host: string;
  port?: number;
  keyTypes?: string[];
}

interface SSHKeyscanOutput extends ToolResult {
  metadata?: {
    host: string;
    port: number;
    keysFound: number;
    algorithms: string[];
    scanTime: number;
  };
}

// ===== CONFIGURACIÓN Y ERRORES =====

interface ServerConfig {
  ssh: {
    defaultKeyPath: string;
    defaultTimeout: number;
    maxConcurrentConnections: number;
  };
  powershell: {
    defaultTimeout: number;
    executionPolicy: string;
  };
  security: {
    maxCommandLength: number;
    maxOutputSize: number;
    auditEnabled: boolean;
  };
}

interface APIError {
  code: number;
  message: string;
  data?: Record<string, any>;
}
```

---

## 🧪 **Testing y Ejemplos**

### 🛠️ **Suite de Testing Completa**

#### **🔧 Tests de Integración**
```bash
# Ejecutar todos los tests
npm test

# Tests específicos por herramienta
npm run test:ssh-execute
npm run test:powershell
npm run test:ssh-scan
npm run test:keyscan

# Tests de carga
npm run test:load
```

#### **📊 Ejemplos de Testing con curl**
```bash
# Test de health check
curl -X POST http://localhost:3000/health

# Test de capacidades
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node src/index.js

# Test de SSH execute
echo '{
  "jsonrpc":"2.0",
  "id":1,
  "method":"tools/call",
  "params":{
    "name":"ssh_execute",
    "arguments":{
      "host":"192.168.1.100",
      "user":"test",
      "command":"echo hello"
    }
  }
}' | node src/index.js
```

---

## 📞 **Soporte y Troubleshooting del API**

### 🆘 **Códigos de Error Comunes**

| Código | Nombre | Descripción | Solución |
|--------|--------|-------------|----------|
| `-32700` | Parse Error | JSON malformado | Verificar sintaxis JSON |
| `-32600` | Invalid Request | Request inválido | Verificar estructura JSON-RPC |
| `-32601` | Method Not Found | Método inexistente | Usar métodos MCP válidos |
| `-32602` | Invalid Params | Parámetros inválidos | Verificar schema de herramienta |
| `-32603` | Internal Error | Error interno | Revisar logs del servidor |

### 🔧 **Debugging Avanzado**

#### **📝 Logging Detallado**
```bash
# Habilitar debugging
export LOG_LEVEL=debug
export DEBUG_SSH=true
export DEBUG_POWERSHELL=true

# Iniciar con logging verbose
npm start 2>&1 | tee debug.log
```

#### **🕵️ Análisis de Tráfico**
```bash
# Monitorear llamadas MCP
tcpdump -i any -s 0 -w mcp-traffic.pcap port 3000

# Analizar con Wireshark
wireshark mcp-traffic.pcap
```

---

<div align="center">

### 🔌 **API Diseñada para la Excelencia**

*Segura | Escalable | Documentada | Enterprise-Ready*

**SSH-PowerShell MCP Server - Conectando Claude con el Mundo**

</div>