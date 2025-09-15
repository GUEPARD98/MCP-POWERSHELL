# 📥 Instalación desde GitHub

## 🚀 Instalación Rápida

### 1. **Clonar el Repositorio**
```bash
git clone https://github.com/GUEPARD98/MCP-POWERSHELL.git
cd MCP-POWERSHELL
```

### 2. **Instalar Dependencias**
```bash
npm install
```

### 3. **Configurar Entorno**
```bash
# Copiar archivo de configuración de ejemplo
copy config\.env.example config\.env

# Editar config\.env con tus datos específicos
notepad config\.env
```

### 4. **Configurar SSH**
Edita `config\.env` con tus datos:
```properties
# Tu clave SSH
SSH_KEY_PATH=C:\Users\TuUsuario\.ssh\tu_clave

# Tu servidor
SSH_DEFAULT_HOST=192.168.1.100
SSH_DEFAULT_USER=tu_usuario
SSH_DEFAULT_PORT=22
```

### 5. **Iniciar Servidor**
```bash
npm start
```

### 6. **Configurar Claude Desktop**
El servidor se configurará automáticamente en Claude Desktop.

## 🔧 Configuración Personalizada

### Para tu setup específico:
1. **Edita `config\.env`** con tus datos reales
2. **Verifica la clave SSH** existe en la ruta especificada
3. **Prueba la conexión SSH** manualmente antes de usar con Claude

### Ejemplo para Kali Linux:
```properties
SSH_KEY_PATH=C:\Users\TuUsuario\.ssh\kali_key
SSH_DEFAULT_HOST=192.168.1.12
SSH_DEFAULT_USER=kali
SSH_STRICT_HOST_KEY_CHECKING=no
```

## 🧪 Probar Instalación

```bash
# Probar servidor
npm test

# Probar conexión SSH específica
.\scripts\test.ps1 -TestType ssh
```

## 📚 Documentación Completa

- **[README Principal](README.md)** - Información general del proyecto
- **[Documentación API](docs/API.md)** - Referencia completa de APIs
- **[Guía de Seguridad](docs/SECURITY.md)** - Mejores prácticas de seguridad
- **[Arquitectura](docs/ARCHITECTURE.md)** - Diseño técnico del sistema

## 🆘 Solución de Problemas

### Error: "Clave SSH no encontrada"
```bash
# Verificar que la clave existe
ls -la ~/.ssh/
# o en Windows:
dir C:\Users\TuUsuario\.ssh\
```

### Error: "Conexión SSH falló"
```bash
# Probar conexión manual
ssh -i "ruta/a/tu/clave" usuario@servidor

# Verificar configuración en config\.env
```

### Error: "Claude no ve el servidor MCP"
1. Verifica que `npm start` funcione sin errores
2. Reinicia Claude Desktop
3. Verifica la configuración en `%APPDATA%\Claude\claude_desktop_config.json`

---

🎉 **¡Tu servidor MCP está listo para usar con Claude!**