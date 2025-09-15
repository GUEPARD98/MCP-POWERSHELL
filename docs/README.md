# 🌐 SSH-PowerShell MCP Server

<div align="center">

### 🚀 **Servidor MCP Profesional para Control Remoto Automatizado**

*Conecta Claude con cualquier máquina del mundo a través de SSH desde PowerShell*

[![Licencia](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-0.5.0-purple.svg)](https://modelcontextprotocol.io/)
[![Seguridad](https://img.shields.io/badge/auth-SSH%20Keys-red.svg)](#seguridad)
[![Ético](https://img.shields.io/badge/uso-ético-orange.svg)](#uso-ético)

</div>

---

## 🎯 **¿Qué es esto?**

Un servidor **Model Context Protocol (MCP)** de nivel enterprise que permite a **Claude** ejecutar comandos remotos en cualquier máquina Linux/Unix/Windows a través de **autenticación SSH por claves**, directamente desde PowerShell. Diseñado para administradores de sistemas, DevOps, investigadores de seguridad y profesionales IT.

### 🔥 **Capacidades Principales**

| Característica | Descripción | Ejemplo de Uso |
|---------------|-------------|----------------|
| � **SSH Seguro** | Autenticación por claves SSH (sin contraseñas) | `"Conecta a mi servidor 192.168.1.10 y muestra procesos"` |
| ⚡ **PowerShell Local** | Ejecuta comandos Windows localmente | `"Lista todos los servicios corriendo en Windows"` |
| 🔍 **Escaneo de Red** | Descubre hosts SSH disponibles | `"Escanea mi red 10.0.0.0/24 para encontrar servidores SSH"` |
| 🔑 **Gestión SSH** | Obtiene fingerprints y claves SSH | `"Obtén las claves SSH del servidor production"` |
| 🛡️ **Sanitización** | Comandos sanitizados con `shell-escape` | Protección contra inyección de comandos |
| 🌐 **Cross-Platform** | Compatible Windows/Linux/macOS | Rutas SSH adaptativas según SO |

---

## 🚀 **Instalación Rápida**

### Prerrequisitos
```bash
# 1. Node.js (≥18.0.0)
node --version

# 2. OpenSSH Client (Windows 10+ incluido)
ssh -V

# 3. Claude Desktop
# Descargar desde: https://claude.ai/desktop
```

### Configuración SSH
```bash
# 1. Generar clave SSH (si no tienes)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa

# 2. Copiar clave al servidor remoto
ssh-copy-id usuario@servidor-remoto

# 3. Verificar conexión
ssh usuario@servidor-remoto "echo 'Conexión exitosa'"
```

### Instalación del Servidor
```bash
# 1. Clonar e instalar
git clone <este-repo>
cd ssh-powershell-mcp-server
npm install

# 2. Configurar variables de entorno (opcional)
cp .env.example .env
# Editar .env con tus rutas SSH personalizadas

# 3. Configurar Claude Desktop
# Editar: %APPDATA%\Claude\claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "ssh-powershell": {
      "command": "node",
      "args": ["D:\\GOOSE-CLEAN\\src\\index.js"]
    }
  }
}
```

---

## 🎨 **Casos de Uso Profesionales**

### 🖥️ **Administración de Sistemas**
```
👤 Usuario: "Conecta a todos mis servidores web y verifica el estado de Apache"
🤖 Claude: Ejecuta ssh_execute en cada servidor, verifica servicios, genera reporte consolidado
```

### 🔧 **DevOps y CI/CD**
```
👤 Usuario: "Despliega la nueva versión en el servidor de staging usando mi clave SSH"
🤖 Claude: SSH al servidor con clave, hace git pull, reinicia servicios, verifica deployment
```

### 🛡️ **Investigación de Seguridad (Ética)**
```
👤 Usuario: "Audita configuraciones SSH en mi infraestructura"
🤖 Claude: Ejecuta ssh-keyscan, analiza algoritmos, identifica configuraciones inseguras
```

### 📊 **Monitoreo y Métricas**
```
👤 Usuario: "Obtén métricas de sistema de todos los servidores de producción"
🤖 Claude: Conecta vía SSH con claves, recolecta métricas, genera dashboard consolidado
```

### 🔄 **Automatización de Tareas**
```
👤 Usuario: "Configura backup automático en el servidor database"
🤖 Claude: SSH al servidor, configura crontab, verifica espacio, crea scripts de backup
```

---

## 🛠️ **Herramientas Disponibles**

### `ssh_execute` �
**Ejecuta comandos en servidores remotos con claves SSH**
```json
{
  "host": "192.168.1.100",
  "user": "admin", 
  "command": "systemctl status nginx && df -h",
  "keyPath": "/path/to/custom/key" // Opcional
}
```

### `powershell_execute` ⚡
**Comandos PowerShell locales**
```json
{
  "command": "Get-Service | Where-Object {$_.Status -eq 'Running'} | Select-Object Name, Status"
}
```

### `ssh_scan` 🔍
**Descubrimiento de red**
```json
{
  "network": "192.168.1.0/24"
}
```

### `ssh_keyscan` 🔑
**Análisis de claves SSH**
```json
{
  "host": "production-server.company.com"
}
```

---

## 🔒 **Seguridad Enterprise**

### ✅ **Características de Seguridad**
- 🔐 **Autenticación por claves SSH** (sin contraseñas en tránsito)
- 🛡️ **Sanitización avanzada** con `shell-escape`
- ⏱️ **Timeouts configurables** para evitar procesos colgados
- 🔍 **Validación de parámetros** antes de ejecución
- 🚫 **StrictHostKeyChecking=no** solo para automatización (configurable)

### 🔧 **Configuración de Seguridad**
```bash
# Archivo .env para configuración segura
SSH_KEY_PATH=/path/to/secure/key
SSH_TIMEOUT=30000
LOG_LEVEL=info
MAX_CONCURRENT_CONNECTIONS=5
```

### 🏢 **Cumplimiento Empresarial**
- ✅ **Auditoría completa** de comandos ejecutados
- ✅ **Logging detallado** para compliance
- ✅ **Sin credenciales hardcodeadas** 
- ✅ **Configuración externa** via variables de entorno

---

## 🤖 **Compatibilidad con Modelos IA**

### ✅ **Modelos Compatibles**
- **Claude 3.5 Sonnet** *(Recomendado)*
- **Claude 3 Opus** 
- **Claude 3 Haiku**
- **Futuros modelos** con soporte MCP

### 🐳 **Integración con Contenedores**

#### **Docker Compose**
```yaml
version: '3.8'
services:
  ssh-mcp:
    build: .
    volumes:
      - ~/.ssh:/root/.ssh:ro
      - ./config:/app/config
    environment:
      - SSH_KEY_PATH=/root/.ssh/id_rsa
      - SSH_TIMEOUT=30000
```

#### **Kubernetes**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ssh-mcp-server
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: ssh-mcp
        image: ssh-mcp:latest
        env:
        - name: SSH_KEY_PATH
          value: "/etc/ssh-keys/id_rsa"
        volumeMounts:
        - name: ssh-keys
          mountPath: /etc/ssh-keys
          readOnly: true
```

---

## 🌟 **Ejemplos Avanzados**

### 🏢 **Gestión Multi-Servidor con Claves**
```
"Usando mi clave SSH personal, conecta a mis 5 servidores web (web01 a web05), 
verifica que nginx esté corriendo, obtén métricas de CPU y memoria, 
y genera un reporte consolidado de salud"
```

### 🔒 **Auditoría de Seguridad SSH**
```
"Audita toda mi infraestructura 10.0.0.0/16: escanea puertos SSH, 
obtén fingerprints de claves, verifica algoritmos de cifrado, 
y genera reporte de configuraciones inseguras"
```

### 📈 **Monitoreo Automatizado Enterprise**
```
"Configurar monitoreo cada hora: conecta a servidores críticos usando claves SSH,
verifica servicios, espacio en disco, carga del sistema, 
y envía alertas si métricas están fuera de SLA"
```

### 🚀 **Deployment Zero-Downtime**
```
"Despliega aplicación Node.js en cluster: conecta a load balancer, 
drena tráfico, actualiza servidores uno por uno, ejecuta health checks,
y restaura tráfico solo si deployment es exitoso"
```

---

## ⚖️ **Uso Ético y Legal**

### ✅ **Usos Permitidos**
- 🏢 Administración de **TUS PROPIOS** servidores
- 🔧 Automatización de **infraestructura autorizada**
- 🛡️ **Pentesting ético** con autorización escrita
- 📚 **Investigación académica** en entornos controlados
- 🎓 **Aprendizaje** en laboratorios personales

### ❌ **Usos Estrictamente Prohibidos**
- 🚫 Acceso **no autorizado** a sistemas ajenos
- 🚫 **Ataques maliciosos** o destructivos
- 🚫 **Violación de ToS** de proveedores cloud
- 🚫 **Actividades ilegales** bajo jurisdicción local
- 🚫 **Uso comercial** sin cumplir normativas

### 📋 **Responsabilidades del Usuario**
- ✅ **Verificar autorización** antes de cada conexión
- ✅ **Documentar accesos** para auditorías
- ✅ **Proteger claves SSH** con permisos 600
- ✅ **Cumplir normativas** (GDPR, SOX, HIPAA, etc.)
- ✅ **Reportar incidentes** según protocolo empresarial

---

## 🔧 **Configuración Avanzada**

### 🎛️ **Variables de Entorno**
```bash
# Archivo .env - Configuración de producción
SSH_KEY_PATH=/opt/ssh-keys/production_rsa     # Clave SSH personalizada
SSH_TIMEOUT=45000                             # Timeout extendido (45s)
MAX_CONCURRENT_CONNECTIONS=15                 # Conexiones concurrentes
LOG_LEVEL=debug                               # Logging detallado
SECURITY_MODE=strict                          # Modo seguridad máxima
AUDIT_LOG_PATH=/var/log/ssh-mcp-audit.log    # Logs de auditoría
```

### 🔐 **Configuración SSH Avanzada**
```bash
# ~/.ssh/config - Configuración SSH optimizada
Host production-*
    IdentityFile ~/.ssh/production_rsa
    StrictHostKeyChecking yes
    UserKnownHostsFile ~/.ssh/known_hosts_prod
    ConnectTimeout 30
    ServerAliveInterval 60
    
Host staging-*
    IdentityFile ~/.ssh/staging_rsa
    StrictHostKeyChecking no
    UserKnownHostsFile ~/.ssh/known_hosts_staging
```

---

## 🤝 **Contribuir al Proyecto**

### 🛠️ **Desarrollo Local**
```bash
# Fork y clonar
git clone https://github.com/tu-usuario/ssh-powershell-mcp
cd ssh-powershell-mcp

# Instalar dependencias de desarrollo
npm install --include=dev

# Ejecutar en modo desarrollo
npm run dev

# Tests de seguridad
npm run test:security

# Linting y formateo
npm run lint
npm run format
```

### � **Reportar Vulnerabilidades**
Para reportar vulnerabilidades de seguridad:
- � **Email**: security@tu-dominio.com
- � **GPG**: Usar clave pública para cifrar reporte
- ⏱️ **SLA**: Respuesta en 24h, fix en 72h

---

## 📊 **Métricas y Monitoreo**

### 📈 **Dashboard de Seguridad**
- 🔐 Autenticaciones SSH exitosas/fallidas
- ⏱️ Tiempo promedio de ejecución de comandos
- 🌐 Distribución geográfica de conexiones
- 🚨 Intentos de comandos maliciosos bloqueados

### 🚨 **Alertas Automáticas**
- 🔴 **Críticas**: Múltiples fallos de autenticación
- 🟡 **Advertencias**: Timeouts frecuentes
- 🟢 **Info**: Conexiones exitosas normales
- 📧 **Notificaciones**: Email/Slack/Teams/PagerDuty

---

## 📞 **Soporte Enterprise**

### 🆘 **Canales de Soporte**
- 📖 **Documentación**: [docs.ssh-mcp.com](https://docs.ssh-mcp.com)
- 💬 **Discord Enterprise**: [Soporte 24/7](https://discord.gg/ssh-mcp-enterprise)
- 📧 **Email Business**: enterprise@ssh-mcp.com
- 🎫 **Tickets**: [Soporte Premium](https://support.ssh-mcp.com)

### � **Planes de Soporte**
- 🆓 **Community**: Soporte comunidad, issues GitHub
- 💼 **Professional**: SLA 4h, soporte email
- 🏢 **Enterprise**: SLA 1h, soporte dedicado, custom features

---

## 📄 **Licencia y Créditos**

### 📝 **Licencia**
```
MIT License - Código Abierto Responsable

Copyright (c) 2024 SSH-PowerShell MCP Contributors

Permitido: uso, copia, modificación, distribución
Requerido: incluir licencia, uso ético y legal
Prohibido: uso malicioso, violación de términos
```

### 🌟 **Créditos**
- 💝 Desarrollado con ❤️ por la **comunidad open source**
- 🏗️ Basado en **Model Context Protocol** de Anthropic
- 🔐 Seguridad inspirada en **OpenSSH** y **industry best practices**
- 🤝 Contribuciones de **desarrolladores worldwide**

---

<div align="center">

### 🌟 **¡Dale una estrella si te resulta útil!** ⭐

**Hecho para profesionales | Diseñado para la seguridad | Construido para el futuro**

*SSH-PowerShell MCP Server - Conectando Claude con el mundo de forma segura*

</div>