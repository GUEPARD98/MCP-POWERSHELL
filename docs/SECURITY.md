# 🛡️ Guía de Seguridad - SSH-PowerShell MCP Server

<div align="center">

### 🔒 **Documentación Completa de Seguridad Enterprise**
*Mejores prácticas, análisis de riesgos y configuraciones de seguridad*

[![Security](https://img.shields.io/badge/security-Enterprise%20Grade-red.svg)](#enterprise)
[![SSH](https://img.shields.io/badge/auth-SSH%20Keys%20Only-green.svg)](#ssh-keys)
[![Audit](https://img.shields.io/badge/audit-SOX%20Compliant-blue.svg)](#compliance)
[![Zero Trust](https://img.shields.io/badge/model-Zero%20Trust-purple.svg)](#zero-trust)

</div>

---

## 🎯 **Filosofía de Seguridad**

El SSH-PowerShell MCP Server está diseñado bajo el principio de **"Seguridad por Diseño"** (Security by Design), implementando múltiples capas de protección, auditoría completa y cumplimiento de estándares enterprise.

### 🏛️ **Principios Fundamentales**

| Principio | Implementación | Beneficio |
|-----------|----------------|-----------|
| **🔐 Least Privilege** | Autenticación SSH por claves únicamente | Minimiza superficie de ataque |
| **🛡️ Defense in Depth** | Múltiples capas de validación y sanitización | Protección redundante |
| **📊 Zero Trust** | Validación continua de todas las operaciones | Nunca confiar, siempre verificar |
| **🔍 Audit Everything** | Logging completo de todas las acciones | Trazabilidad total |
| **⚡ Fail Secure** | Falla de forma segura por defecto | Protección incluso en errores |

---

## 🔐 **Autenticación y Autorización**

### 🔑 **Autenticación SSH por Claves (OBLIGATORIO)**

#### **✅ Configuración Recomendada**

```bash
# 1. Generar par de claves RSA 4096-bit
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_mcp -C "mcp-server@$(hostname)"

# 2. Configurar permisos correctos
chmod 600 ~/.ssh/id_rsa_mcp
chmod 644 ~/.ssh/id_rsa_mcp.pub

# 3. Copiar clave pública al servidor remoto
ssh-copy-id -i ~/.ssh/id_rsa_mcp.pub user@remote-server

# 4. Verificar conectividad
ssh -i ~/.ssh/id_rsa_mcp user@remote-server "echo 'Connection successful'"
```

#### **🔒 Configuración SSH Avanzada**

```bash
# ~/.ssh/config - Configuración de seguridad máxima
Host production-*
    IdentityFile ~/.ssh/production_rsa
    IdentitiesOnly yes
    StrictHostKeyChecking yes
    UserKnownHostsFile ~/.ssh/known_hosts_production
    ConnectTimeout 10
    ServerAliveInterval 60
    ServerAliveCountMax 3
    
    # Algoritmos de cifrado seguros
    Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
    MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com
    KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512
    
    # Seguridad adicional
    ForwardAgent no
    ForwardX11 no
    PasswordAuthentication no
    PubkeyAuthentication yes
    PreferredAuthentications publickey
    
Host staging-*
    IdentityFile ~/.ssh/staging_rsa
    StrictHostKeyChecking yes
    UserKnownHostsFile ~/.ssh/known_hosts_staging
    
Host development-*
    IdentityFile ~/.ssh/development_rsa
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel QUIET
```

#### **🚫 Métodos de Autenticación Prohibidos**

| Método | Estado | Motivo |
|--------|--------|--------|
| **Contraseñas** | ❌ PROHIBIDO | Susceptible a ataques de fuerza bruta |
| **Certificados autofirmados** | ❌ PROHIBIDO | No validable en PKI enterprise |
| **Tokens temporales** | ❌ PROHIBIDO | Complejidad de gestión |
| **Autenticación por IP** | ❌ PROHIBIDO | Fácilmente falsificable |

---

## 🛡️ **Sanitización y Validación de Comandos**

### 🧪 **shell-escape: Sanitización Avanzada**

#### **🔧 Implementación Core**

```javascript
import shellescape from 'shell-escape';

class CommandSanitizer {
  static sanitize(command, args = []) {
    // Validación previa
    if (!this.isValidCommand(command)) {
      throw new SecurityError('Command contains forbidden patterns');
    }
    
    // Sanitización con shell-escape
    if (Array.isArray(args) && args.length > 0) {
      return shellescape([command, ...args]);
    }
    
    // Para comandos complejos con pipes y operadores
    return this.complexCommandSanitization(command);
  }
  
  static complexCommandSanitization(command) {
    // Parsear comando complejo
    const tokens = this.parseShellCommand(command);
    
    // Sanitizar cada token individualmente
    const sanitizedTokens = tokens.map(token => {
      if (this.isOperator(token)) {
        return this.validateOperator(token);
      }
      return shellescape([token]);
    });
    
    return sanitizedTokens.join(' ');
  }
  
  static isValidCommand(command) {
    const forbiddenPatterns = [
      // Comandos destructivos
      /rm\s+.*-rf?\s+\//, 
      /dd\s+if=/,
      /mkfs\./,
      /fdisk/,
      /parted/,
      
      // Inyección de comandos
      /;\s*rm/,
      /\|\s*sh/,
      /`.*`/,
      /\$\(.*\)/,
      
      // Acceso a archivos sensibles
      /\/etc\/passwd/,
      /\/etc\/shadow/,
      /\/root\//,
      
      // Network attacks
      /wget.*sh/,
      /curl.*\|.*sh/,
      /nc.*-e/
    ];
    
    return !forbiddenPatterns.some(pattern => 
      pattern.test(command.toLowerCase())
    );
  }
}
```

#### **🔍 Matriz de Comandos Validados**

| Categoría | Permitidos | Bloqueados | Razón |
|-----------|------------|------------|-------|
| **Sistema** | `uptime`, `ps`, `top` | `rm -rf`, `dd`, `mkfs` | Prevenir destrucción |
| **Red** | `ping`, `netstat`, `ss` | `nc -e`, `wget \| sh` | Prevenir backdoors |
| **Archivos** | `ls`, `cat`, `head` | `chmod 777`, `chown root` | Prevenir escalación |
| **Servicios** | `systemctl status`, `service` | `systemctl stop`, `killall` | Preservar disponibilidad |

### 🛡️ **Validación de Parámetros**

```javascript
class ParameterValidator {
  static validateSSHParams(params) {
    const schema = {
      host: {
        type: 'string',
        pattern: /^[a-zA-Z0-9.-]+$/,
        maxLength: 253
      },
      user: {
        type: 'string',
        pattern: /^[a-zA-Z0-9_-]+$/,
        maxLength: 32
      },
      command: {
        type: 'string',
        maxLength: 4096,
        customValidator: CommandSanitizer.isValidCommand
      },
      keyPath: {
        type: 'string',
        optional: true,
        pattern: /^[a-zA-Z0-9\/._-]+$/
      }
    };
    
    return this.validate(params, schema);
  }
  
  static validate(data, schema) {
    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];
      
      // Verificar campos requeridos
      if (!rules.optional && (value === undefined || value === null)) {
        throw new ValidationError(`Missing required field: ${key}`);
      }
      
      // Validar tipo
      if (value !== undefined && typeof value !== rules.type) {
        throw new ValidationError(`Invalid type for field ${key}`);
      }
      
      // Validar patrón
      if (rules.pattern && !rules.pattern.test(value)) {
        throw new ValidationError(`Invalid format for field ${key}`);
      }
      
      // Validar longitud máxima
      if (rules.maxLength && value.length > rules.maxLength) {
        throw new ValidationError(`Field ${key} exceeds maximum length`);
      }
      
      // Validación personalizada
      if (rules.customValidator && !rules.customValidator(value)) {
        throw new ValidationError(`Custom validation failed for field ${key}`);
      }
    }
    
    return true;
  }
}
```

---

## 🔒 **Gestión de Claves SSH**

### 🗄️ **Arquitectura de Claves**

#### **🏢 Estructura Enterprise**

```
ssh-keys/
├── production/
│   ├── web-servers/
│   │   ├── web01_rsa (600)
│   │   ├── web02_rsa (600)
│   │   └── web03_rsa (600)
│   ├── database/
│   │   ├── db-master_rsa (600)
│   │   └── db-replica_rsa (600)
│   └── monitoring/
│       └── monitoring_rsa (600)
├── staging/
│   ├── staging-web_rsa (600)
│   └── staging-db_rsa (600)
└── development/
    └── dev-general_rsa (600)
```

#### **🔑 Rotación Automática de Claves**

```javascript
class SSHKeyRotation {
  constructor(config) {
    this.rotationInterval = config.rotationDays || 90;
    this.notificationDays = config.notificationDays || 7;
  }
  
  async rotateKey(keyPath, hostConfig) {
    const keyAge = this.getKeyAge(keyPath);
    
    if (keyAge > this.rotationInterval) {
      console.log(`🔄 Rotating SSH key: ${keyPath}`);
      
      // 1. Generar nueva clave
      const newKeyPath = await this.generateNewKey(keyPath);
      
      // 2. Instalar en servidores remotos
      await this.deployKeyToHosts(newKeyPath, hostConfig.hosts);
      
      // 3. Verificar conectividad
      await this.verifyConnectivity(newKeyPath, hostConfig.hosts);
      
      // 4. Revocar clave antigua
      await this.revokeOldKey(keyPath, hostConfig.hosts);
      
      // 5. Actualizar configuración
      await this.updateConfiguration(keyPath, newKeyPath);
      
      console.log(`✅ Key rotation completed: ${newKeyPath}`);
    }
  }
  
  async generateNewKey(oldKeyPath) {
    const timestamp = new Date().toISOString().split('T')[0];
    const newKeyPath = `${oldKeyPath}_${timestamp}`;
    
    const command = [
      'ssh-keygen',
      '-t', 'rsa',
      '-b', '4096',
      '-f', newKeyPath,
      '-N', '', // Sin passphrase para automatización
      '-C', `rotated-${timestamp}@mcp-server`
    ];
    
    await this.executeCommand(command);
    await this.setSecurePermissions(newKeyPath);
    
    return newKeyPath;
  }
}
```

### 🔐 **Gestión de Passphrases**

#### **🛡️ Claves con Passphrase (Recomendado para Producción)**

```javascript
class SecureKeyManager {
  constructor() {
    this.keyring = new Keyring();
  }
  
  async loadEncryptedKey(keyPath) {
    // Cargar passphrase desde keyring del sistema
    const passphrase = await this.keyring.getPassword('mcp-server', keyPath);
    
    if (!passphrase) {
      throw new SecurityError('Passphrase not found in keyring');
    }
    
    // Configurar ssh-agent con clave descifrada
    await this.addToSSHAgent(keyPath, passphrase);
  }
  
  async addToSSHAgent(keyPath, passphrase) {
    const command = `echo "${passphrase}" | ssh-add "${keyPath}"`;
    await this.executeSecureCommand(command);
    
    // Limpiar passphrase de memoria
    passphrase = null;
  }
}
```

---

## 🔍 **Auditoría y Compliance**

### 📊 **Sistema de Auditoría Completo**

#### **🗂️ Estructura de Logs de Auditoría**

```javascript
class AuditLogger {
  constructor(config) {
    this.logPath = config.auditLogPath || '/var/log/ssh-mcp-audit.log';
    this.retentionDays = config.retentionDays || 2555; // 7 años para SOX
    this.encryptLogs = config.encryptLogs || true;
    this.digitallySigned = config.signLogs || true;
  }
  
  logSecurityEvent(event) {
    const auditRecord = {
      timestamp: new Date().toISOString(),
      event_id: this.generateEventId(),
      event_type: event.type,
      severity: event.severity,
      user_id: event.userId || 'system',
      source_ip: event.sourceIP,
      target_host: event.targetHost,
      command: this.hashSensitiveData(event.command),
      success: event.success,
      error_message: event.error,
      session_id: event.sessionId,
      compliance_tags: this.getComplianceTags(event),
      digital_signature: this.generateSignature(event)
    };
    
    this.writeAuditLog(auditRecord);
    this.checkComplianceRequirements(auditRecord);
  }
  
  hashSensitiveData(data) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  getComplianceTags(event) {
    const tags = [];
    
    // GDPR
    if (this.containsPII(event)) {
      tags.push('GDPR_PII');
    }
    
    // SOX
    if (this.isFinancialSystem(event.targetHost)) {
      tags.push('SOX_FINANCIAL');
    }
    
    // HIPAA
    if (this.isHealthcareSystem(event.targetHost)) {
      tags.push('HIPAA_PHI');
    }
    
    // PCI DSS
    if (this.isPaymentSystem(event.targetHost)) {
      tags.push('PCI_DSS');
    }
    
    return tags;
  }
}
```

#### **📋 Eventos de Auditoría Capturados**

| Categoría | Eventos | Retención | Criticidad |
|-----------|---------|-----------|------------|
| **Autenticación** | Login, logout, fallos de auth | 7 años | CRÍTICA |
| **Comandos SSH** | Todos los comandos ejecutados | 7 años | ALTA |
| **Acceso a Datos** | Lectura de archivos sensibles | 7 años | ALTA |
| **Configuración** | Cambios de configuración | 7 años | MEDIA |
| **Errores** | Fallos de sistema, timeouts | 1 año | BAJA |

### 🏛️ **Compliance Enterprise**

#### **📜 GDPR (General Data Protection Regulation)**

```javascript
class GDPRCompliance {
  static dataClassification = {
    PII: ['username', 'email', 'ip_address'],
    SENSITIVE: ['command_output', 'file_content'],
    METADATA: ['timestamp', 'host', 'success_flag']
  };
  
  static handlePIIData(data) {
    // 1. Minimización de datos
    const minimizedData = this.minimizeData(data);
    
    // 2. Pseudonimización
    const pseudonymizedData = this.pseudonymize(minimizedData);
    
    // 3. Cifrado en reposo
    const encryptedData = this.encrypt(pseudonymizedData);
    
    // 4. Auditoría de acceso
    this.auditDataAccess(data.subject, 'PII_ACCESS');
    
    return encryptedData;
  }
  
  static handleDataSubjectRights(request) {
    switch (request.type) {
      case 'ACCESS':
        return this.provideDataAccess(request.subject);
      case 'RECTIFICATION':
        return this.rectifyData(request.subject, request.corrections);
      case 'ERASURE':
        return this.eraseData(request.subject);
      case 'PORTABILITY':
        return this.exportData(request.subject);
    }
  }
}
```

#### **📊 SOX (Sarbanes-Oxley Act)**

```javascript
class SOXCompliance {
  static financialSystemsRegistry = [
    'accounting.company.com',
    'erp.company.com',
    'financial-db.company.com'
  ];
  
  static validateSOXControls(operation) {
    // Control 1: Separación de funciones
    this.validateSeparationOfDuties(operation);
    
    // Control 2: Autorización apropiada
    this.validateAuthorization(operation);
    
    // Control 3: Auditoría completa
    this.ensureCompleteAuditTrail(operation);
    
    // Control 4: Protección de datos
    this.validateDataIntegrity(operation);
  }
  
  static generateSOXReport(period) {
    return {
      period: period,
      total_operations: this.getTotalOperations(period),
      unauthorized_attempts: this.getUnauthorizedAttempts(period),
      data_integrity_violations: this.getIntegrityViolations(period),
      audit_trail_completeness: this.getAuditCompleteness(period),
      control_effectiveness: this.calculateControlEffectiveness(period)
    };
  }
}
```

#### **🏥 HIPAA (Health Insurance Portability and Accountability Act)**

```javascript
class HIPAACompliance {
  static validatePHIAccess(operation) {
    // Verificar mínimo necesario
    if (!this.isMinimumNecessary(operation)) {
      throw new ComplianceError('PHI access violates minimum necessary rule');
    }
    
    // Verificar autorización
    if (!this.isAuthorizedForPHI(operation.user)) {
      throw new ComplianceError('User not authorized for PHI access');
    }
    
    // Auditar acceso
    this.auditPHIAccess(operation);
  }
  
  static encryptPHI(data) {
    // Cifrado AES-256 para PHI
    const encrypted = crypto.encrypt(data, {
      algorithm: 'aes-256-gcm',
      key: this.getPHIEncryptionKey()
    });
    
    return encrypted;
  }
}
```

---

## 🚨 **Detección y Respuesta a Incidentes**

### 🔍 **Sistema de Detección de Intrusiones (IDS)**

#### **🛡️ Patrones de Detección**

```javascript
class SecurityMonitor {
  constructor() {
    this.alertThresholds = {
      failed_auth_attempts: 5,
      suspicious_commands: 3,
      unusual_access_patterns: 10,
      data_exfiltration_size: 100 * 1024 * 1024 // 100MB
    };
  }
  
  analyzeSecurityEvents(events) {
    const threats = [];
    
    // Detección de ataques de fuerza bruta
    const authFailures = this.countFailedAuth(events);
    if (authFailures >= this.alertThresholds.failed_auth_attempts) {
      threats.push({
        type: 'BRUTE_FORCE_ATTACK',
        severity: 'HIGH',
        details: `${authFailures} failed authentication attempts`
      });
    }
    
    // Detección de comandos sospechosos
    const suspiciousCommands = this.detectSuspiciousCommands(events);
    if (suspiciousCommands.length > 0) {
      threats.push({
        type: 'SUSPICIOUS_COMMAND_EXECUTION',
        severity: 'MEDIUM',
        details: suspiciousCommands
      });
    }
    
    // Detección de exfiltración de datos
    const dataTransfer = this.calculateDataTransfer(events);
    if (dataTransfer > this.alertThresholds.data_exfiltration_size) {
      threats.push({
        type: 'POTENTIAL_DATA_EXFILTRATION',
        severity: 'CRITICAL',
        details: `Large data transfer detected: ${dataTransfer} bytes`
      });
    }
    
    return threats;
  }
  
  detectSuspiciousCommands(events) {
    const suspiciousPatterns = [
      /find.*-name.*passwd/,
      /cat.*\/etc\/shadow/,
      /nc.*-l.*-e/,
      /wget.*\.sh/,
      /curl.*\|.*bash/,
      /python.*-c.*socket/,
      /base64.*-d/
    ];
    
    return events.filter(event => 
      suspiciousPatterns.some(pattern => 
        pattern.test(event.command)
      )
    );
  }
}
```

#### **🚨 Sistema de Alertas Automáticas**

```javascript
class IncidentResponse {
  constructor(config) {
    this.alertChannels = config.alertChannels;
    this.escalationMatrix = config.escalationMatrix;
    this.autoResponseEnabled = config.autoResponse;
  }
  
  async handleSecurityIncident(incident) {
    // 1. Clasificación del incidente
    const classification = this.classifyIncident(incident);
    
    // 2. Respuesta automática inmediata
    if (this.autoResponseEnabled && classification.severity === 'CRITICAL') {
      await this.executeAutoResponse(incident);
    }
    
    // 3. Notificación a equipos
    await this.notifySecurityTeam(incident, classification);
    
    // 4. Documentación del incidente
    await this.documentIncident(incident, classification);
    
    // 5. Escalación si es necesario
    if (classification.requiresEscalation) {
      await this.escalateIncident(incident, classification);
    }
  }
  
  async executeAutoResponse(incident) {
    switch (incident.type) {
      case 'BRUTE_FORCE_ATTACK':
        await this.blockSourceIP(incident.sourceIP);
        await this.disableUser(incident.targetUser);
        break;
        
      case 'POTENTIAL_DATA_EXFILTRATION':
        await this.blockOutboundTraffic(incident.sourceIP);
        await this.isolateAffectedSystems(incident.affectedHosts);
        break;
        
      case 'MALWARE_DETECTED':
        await this.quarantineSystem(incident.affectedHost);
        await this.notifyIncidentResponse();
        break;
    }
  }
}
```

---

## 🔧 **Configuración de Seguridad Avanzada**

### 🎛️ **Variables de Seguridad**

```bash
# ============= CONFIGURACIÓN DE SEGURIDAD ENTERPRISE =============

# === AUTENTICACIÓN ===
SSH_AUTH_METHOD=keys_only              # Solo claves SSH
SSH_KEY_TYPE=rsa                       # Tipo de clave preferido
SSH_KEY_SIZE=4096                      # Tamaño mínimo de clave
SSH_KEY_ROTATION_DAYS=90               # Rotación cada 90 días
REQUIRE_PASSPHRASE=true                # Claves con passphrase

# === CIFRADO ===
SSH_CIPHERS=chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
SSH_MACS=hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com
SSH_KEX=curve25519-sha256@libssh.org,diffie-hellman-group16-sha512

# === COMANDOS ===
COMMAND_SANITIZATION=strict            # Nivel de sanitización
ALLOW_DANGEROUS_COMMANDS=false         # Bloquear comandos peligrosos
MAX_COMMAND_LENGTH=4096                # Longitud máxima de comando
COMMAND_TIMEOUT=30000                  # Timeout de comando (30s)

# === AUDITORÍA ===
AUDIT_ENABLED=true                     # Habilitar auditoría
AUDIT_LOG_PATH=/var/log/ssh-mcp-audit.log
AUDIT_ENCRYPT_LOGS=true                # Cifrar logs de auditoría
AUDIT_DIGITAL_SIGNATURE=true          # Firmar logs digitalmente
AUDIT_RETENTION_DAYS=2555              # 7 años para SOX

# === COMPLIANCE ===
GDPR_ENABLED=true                      # Cumplimiento GDPR
SOX_ENABLED=true                       # Cumplimiento SOX
HIPAA_ENABLED=false                    # Cumplimiento HIPAA
PCI_DSS_ENABLED=false                  # Cumplimiento PCI DSS

# === DETECCIÓN DE AMENAZAS ===
IDS_ENABLED=true                       # Sistema de detección
MAX_FAILED_AUTH=5                      # Intentos de auth fallidos
SUSPICIOUS_COMMAND_THRESHOLD=3         # Comandos sospechosos
AUTO_RESPONSE_ENABLED=true             # Respuesta automática

# === RATE LIMITING ===
RATE_LIMIT_ENABLED=true                # Habilitar rate limiting
MAX_REQUESTS_PER_MINUTE=100            # Requests por minuto
MAX_CONCURRENT_SESSIONS=10             # Sesiones concurrentes
CONNECTION_POOL_SIZE=15                # Tamaño del pool

# === NETWORK SECURITY ===
ALLOWED_SOURCE_IPS=192.168.1.0/24,10.0.0.0/16  # IPs permitidas
BLOCKED_DESTINATION_PORTS=23,25,135,445         # Puertos bloqueados
FIREWALL_RULES_ENABLED=true           # Reglas de firewall
INTRUSION_PREVENTION=true             # Prevención de intrusiones

# === ENCRYPTION AT REST ===
ENCRYPT_LOGS=true                      # Cifrar logs
ENCRYPT_CONFIG=true                    # Cifrar configuración
ENCRYPTION_ALGORITHM=aes-256-gcm       # Algoritmo de cifrado
KEY_MANAGEMENT_HSM=false               # Usar HSM para claves

# === BACKUP Y RECOVERY ===
BACKUP_ENCRYPTION=true                 # Cifrar backups
BACKUP_RETENTION_DAYS=90               # Retención de backups
DISASTER_RECOVERY_ENABLED=true         # Plan de recuperación
BACKUP_VERIFICATION=true               # Verificar integridad

# === MONITORING ===
SECURITY_MONITORING=true               # Monitoreo de seguridad
PERFORMANCE_MONITORING=true            # Monitoreo de performance
HEALTH_CHECK_INTERVAL=60               # Health check cada 60s
METRICS_COLLECTION=true                # Recolección de métricas

# === INCIDENT RESPONSE ===
INCIDENT_RESPONSE_ENABLED=true         # Respuesta a incidentes
AUTO_ISOLATION=true                    # Aislamiento automático
FORENSICS_ENABLED=true                 # Capacidades forenses
CHAIN_OF_CUSTODY=true                  # Cadena de custodia
```

### 🔒 **Configuración de Firewall**

#### **🛡️ Reglas iptables Recomendadas**

```bash
#!/bin/bash
# Configuración de firewall para SSH-MCP Server

# Limpiar reglas existentes
iptables -F
iptables -X
iptables -Z

# Política por defecto: DENY
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Permitir loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Permitir conexiones establecidas
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED -j ACCEPT

# Permitir SSH saliente (para MCP server)
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT

# Permitir DNS
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

# Permitir HTTPS saliente (para actualizaciones)
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT

# Rate limiting para SSH
iptables -A INPUT -p tcp --dport 22 -m limit --limit 5/min --limit-burst 3 -j ACCEPT

# Logging de paquetes descartados
iptables -A INPUT -j LOG --log-prefix "DROPPED INPUT: "
iptables -A OUTPUT -j LOG --log-prefix "DROPPED OUTPUT: "

# Guardar configuración
iptables-save > /etc/iptables/rules.v4
```

---

## 🏥 **Disaster Recovery y Business Continuity**

### 💾 **Plan de Recuperación ante Desastres**

#### **🔄 Estrategia de Backup**

```javascript
class DisasterRecovery {
  constructor(config) {
    this.backupSchedule = config.backupSchedule;
    this.retentionPolicy = config.retentionPolicy;
    this.encryptionKey = config.encryptionKey;
  }
  
  async performFullBackup() {
    const backupData = {
      timestamp: new Date().toISOString(),
      configuration: await this.backupConfiguration(),
      sshKeys: await this.backupSSHKeys(),
      auditLogs: await this.backupAuditLogs(),
      certificates: await this.backupCertificates()
    };
    
    // Cifrar backup
    const encryptedBackup = await this.encryptBackup(backupData);
    
    // Almacenar en múltiples ubicaciones
    await this.storeBackup(encryptedBackup, [
      's3://backup-bucket/mcp-server/',
      '/mnt/backup-drive/mcp-server/',
      'sftp://backup-server/mcp-server/'
    ]);
    
    // Verificar integridad
    await this.verifyBackupIntegrity(encryptedBackup);
  }
  
  async restoreFromBackup(backupId) {
    console.log(`🔄 Starting disaster recovery from backup: ${backupId}`);
    
    // 1. Recuperar backup cifrado
    const encryptedBackup = await this.retrieveBackup(backupId);
    
    // 2. Verificar integridad
    await this.verifyBackupIntegrity(encryptedBackup);
    
    // 3. Descifrar backup
    const backupData = await this.decryptBackup(encryptedBackup);
    
    // 4. Restaurar componentes
    await this.restoreConfiguration(backupData.configuration);
    await this.restoreSSHKeys(backupData.sshKeys);
    await this.restoreAuditLogs(backupData.auditLogs);
    await this.restoreCertificates(backupData.certificates);
    
    // 5. Verificar funcionalidad
    await this.verifySystemFunctionality();
    
    console.log(`✅ Disaster recovery completed successfully`);
  }
}
```

#### **⚡ Procedimiento de Failover**

```javascript
class FailoverManager {
  async executeFailover(primaryNode, backupNode) {
    console.log(`🔄 Executing failover from ${primaryNode} to ${backupNode}`);
    
    // 1. Verificar estado del nodo primario
    const primaryStatus = await this.checkNodeHealth(primaryNode);
    if (primaryStatus.healthy) {
      throw new Error('Primary node is healthy, failover not needed');
    }
    
    // 2. Preparar nodo de backup
    await this.prepareBackupNode(backupNode);
    
    // 3. Sincronizar datos críticos
    await this.synchronizeCriticalData(primaryNode, backupNode);
    
    // 4. Actualizar DNS/Load Balancer
    await this.updateRoutingConfiguration(backupNode);
    
    // 5. Verificar funcionalidad
    await this.verifyFailoverSuccess(backupNode);
    
    // 6. Notificar equipos
    await this.notifyFailoverCompletion(primaryNode, backupNode);
  }
}
```

---

## 📞 **Contactos de Seguridad y Respuesta a Incidentes**

### 🆘 **Escalación de Incidentes de Seguridad**

#### **📋 Matriz de Escalación**

| Severidad | Tiempo de Respuesta | Contactos | Acciones |
|-----------|-------------------|-----------|----------|
| **🔴 CRÍTICA** | 15 minutos | CISO, SOC Lead, CEO | Auto-respuesta + call |
| **🟡 ALTA** | 1 hora | Security Team, IT Manager | Análisis + contención |
| **🟢 MEDIA** | 4 horas | Security Analyst | Investigación |
| **⚪ BAJA** | 24 horas | Incident Team | Documentación |

#### **📞 Contactos de Emergencia**

```javascript
const SecurityContacts = {
  CISO: {
    name: "Chief Information Security Officer",
    email: "ciso@company.com",
    phone: "+1-555-0001",
    escalation_time: "15min"
  },
  SOC_Lead: {
    name: "Security Operations Center Lead",
    email: "soc-lead@company.com",
    phone: "+1-555-0002", 
    escalation_time: "15min"
  },
  Incident_Response: {
    name: "Incident Response Team",
    email: "incident-response@company.com",
    phone: "+1-555-0003",
    escalation_time: "1hour"
  },
  External_Forensics: {
    name: "External Forensics Partner",
    email: "forensics@securitypartner.com",
    phone: "+1-555-0004",
    escalation_time: "4hours"
  }
};
```

### 🔐 **Reporte de Vulnerabilidades**

#### **📧 Reporte Responsable de Vulnerabilidades**

Para reportar vulnerabilidades de seguridad:

1. **Email**: `security@ssh-mcp-server.com`
2. **PGP Key**: [Descargar clave pública](./security-pgp-key.asc)
3. **Bug Bounty**: Programa de recompensas disponible
4. **SLA**: Respuesta en 24h, fix en 72h (críticas)

#### **📝 Formato de Reporte**

```markdown
# Reporte de Vulnerabilidad de Seguridad

## Información General
- **Fecha**: [YYYY-MM-DD]
- **Reportero**: [Nombre y contacto]
- **Severidad**: [Crítica/Alta/Media/Baja]

## Descripción de la Vulnerabilidad
- **Tipo**: [SQLi, XSS, Command Injection, etc.]
- **Componente Afectado**: [ssh_execute, etc.]
- **Versión**: [Versión del software]

## Pasos para Reproducir
1. [Paso 1]
2. [Paso 2]
3. [Resultado esperado vs obtenido]

## Impacto
- **Confidencialidad**: [Alto/Medio/Bajo]
- **Integridad**: [Alto/Medio/Bajo]  
- **Disponibilidad**: [Alto/Medio/Bajo]

## Prueba de Concepto
```bash
# Código de ejemplo (si aplica)
```

## Mitigación Sugerida
[Descripción de posibles soluciones]
```

---

<div align="center">

### 🛡️ **Seguridad como Prioridad Número Uno**

*Zero Trust | Defense in Depth | Compliance Ready | Enterprise Grade*

**SSH-PowerShell MCP Server - Seguridad sin Compromisos**

</div>