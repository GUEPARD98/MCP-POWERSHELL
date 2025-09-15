# ===================================================================
# CONFIGURACIÓN COMPLETA PARA USUARIO HP
# SSH-PowerShell MCP Server configurado para Kali Linux
# ===================================================================

## ✅ CONFIGURACIÓN VERIFICADA Y FUNCIONANDO

### 🖥️ **Tu PC (Windows)**
- **Usuario:** HP
- **Perfil:** C:\Users\HP
- **Proyecto:** D:\GOOSE
- **Node.js:** ✅ Instalado y funcionando
- **npm:** ✅ Funcionando

### 🐧 **Servidor Kali Linux**
- **IP:** 192.168.1.12
- **Usuario:** kali
- **Puerto SSH:** 22
- **Conectividad:** ✅ Verificada
- **Autenticación SSH:** ✅ Funcionando

### 🔑 **Claves SSH Configuradas**
```
Clave Principal: C:\Users\HP\.ssh\kali_key
Clave Pública:   C:\Users\HP\.ssh\kali_key.pub
Clave Backup:    C:\Users\HP\.ssh\id_rsa
```

### ⚙️ **Archivos de Configuración**
```
MCP Server:     D:\GOOSE\config\.env
Claude Desktop: C:\Users\HP\AppData\Roaming\Claude\claude_desktop_config.json
```

## 🚀 **COMANDOS PARA USAR**

### **1. Iniciar el Servidor MCP**
```powershell
cd D:\GOOSE
npm start
```
**Resultado esperado:** `🚀 SSH-PowerShell MCP Server iniciado`

### **2. Probar Conexión SSH Manual**
```powershell
ssh -o StrictHostKeyChecking=no -i "C:\Users\HP\.ssh\kali_key" kali@192.168.1.12 "whoami"
```
**Resultado esperado:** `kali`

### **3. Comandos MCP Disponibles en Claude**
Una vez que abras Claude Desktop, podrás usar:

#### **ssh_execute** - Ejecutar comandos en Kali
```
Ejemplo: "Ejecuta 'ls -la' en el servidor Kali"
Claude usará: ssh_execute con host=192.168.1.12, user=kali
```

#### **powershell_execute** - Comandos locales Windows
```
Ejemplo: "Lista los archivos del directorio actual en Windows"
Claude usará: powershell_execute
```

#### **ssh_scan** - Escanear puertos SSH
```
Ejemplo: "Escanea puertos SSH en la red 192.168.1.0/24"
Claude usará: ssh_scan
```

#### **ssh_keyscan** - Verificar claves SSH
```
Ejemplo: "Verifica la clave SSH del servidor 192.168.1.12"
Claude usará: ssh_keyscan
```

## 🔧 **CONFIGURACIÓN ACTUAL**

### **config\.env**
```properties
SSH_KEY_PATH=C:\Users\HP\.ssh\kali_key
SSH_DEFAULT_HOST=192.168.1.12
SSH_DEFAULT_USER=kali
SSH_DEFAULT_PORT=22
SSH_STRICT_HOST_KEY_CHECKING=no
LOG_LEVEL=info
DEBUG_MODE=false
```

### **Claude Desktop Config**
```json
{
  "mcpServers": {
    "ssh-powershell-mcp": {
      "command": "node",
      "args": ["D:\\GOOSE\\src\\index.js"],
      "env": {
        "SSH_KEY_PATH": "C:\\Users\\HP\\.ssh\\kali_key",
        "SSH_DEFAULT_HOST": "192.168.1.12",
        "SSH_DEFAULT_USER": "kali"
      }
    }
  }
}
```

## 📋 **PRÓXIMOS PASOS**

1. **✅ El servidor MCP está ejecutándose**
2. **Abre Claude Desktop**
3. **El servidor ssh-powershell-mcp debe aparecer como disponible**
4. **Prueba comandos como:**
   - "Ejecuta 'uname -a' en mi servidor Kali"
   - "Lista los archivos en el directorio home de Kali"
   - "Muestra los procesos ejecutándose en Kali"
   - "Ejecuta 'Get-Process' en Windows"

## 🆘 **SOLUCIÓN DE PROBLEMAS**

### Si Claude no ve el servidor MCP:
1. Verifica que el servidor esté ejecutándose: `npm start`
2. Reinicia Claude Desktop
3. Verifica el archivo de configuración de Claude

### Si falla la conexión SSH:
1. Verifica conectividad: `Test-NetConnection 192.168.1.12 -Port 22`
2. Prueba SSH manual: `ssh -i "C:\Users\HP\.ssh\kali_key" kali@192.168.1.12`
3. Verifica que Kali esté encendido y SSH habilitado

---
**🎉 ¡Todo configurado y listo para usar con Claude!**