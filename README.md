# SSH-PowerShell MCP Server

🚀 **Enterprise-grade Model Context Protocol (MCP) server** for secure SSH and PowerShell command execution with Claude Desktop.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-0.5.0-blue)](https://github.com/modelcontextprotocol/sdk)

## ✨ Features

- � **Secure SSH command execution** on remote servers
- ⚡ **Local PowerShell integration** for Windows automation  
- 🛡️ **Enterprise security** with SSH key authentication
- 🌐 **Network scanning** and SSH port discovery
- 🔍 **SSH key verification** and host key scanning
- 📊 **Comprehensive logging** and error handling
- 🎯 **Claude Desktop optimized** for seamless AI integration

## �🚀 Quick Start

```powershell
# Clone repository
git clone https://github.com/GUEPARD98/MCP-POWERSHELL.git
cd MCP-POWERSHELL

# Install dependencies
npm install

# Configure environment
Copy-Item config\.env.example config\.env
# Edit config\.env with your SSH settings

# Start server
npm start
```

## 📁 Project Structure

```
MCP-POWERSHELL/
├── 📁 config/           # Environment configurations
│   ├── .env.example     # Configuration template
│   ├── .env.development # Development settings
│   ├── .env.production  # Production settings
│   └── .env.test       # Test settings
├── 📁 docs/            # Complete documentation
│   ├── README.md       # Detailed guide
│   ├── API.md          # API reference
│   ├── ARCHITECTURE.md # Technical architecture
│   └── SECURITY.md     # Security best practices
├── 📁 scripts/         # PowerShell automation scripts
│   ├── start.ps1       # Start server
│   ├── stop.ps1        # Stop server
│   ├── setup.ps1       # Initial setup
│   └── test.ps1        # Run tests
├── 📁 src/             # Source code
│   └── index.js        # Main MCP server
└── 📁 tests/           # Automated tests
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start MCP server |
| `npm test` | Run test suite |
| `npm run dev` | Development mode with PowerShell scripts |
| `npm run setup` | Initial configuration |

## ⚡ MCP Tools

### 🔐 ssh_execute
Execute commands on remote SSH servers
```javascript
// Example: Run 'ls -la' on remote server
{
  "name": "ssh_execute",
  "arguments": {
    "command": "ls -la",
    "host": "192.168.1.100", 
    "user": "root"
  }
}
```

### 💻 powershell_execute  
Execute PowerShell commands locally
```javascript
// Example: Get Windows processes
{
  "name": "powershell_execute",
  "arguments": {
    "command": "Get-Process | Select-Object -First 10"
  }
}
```

### 🌐 ssh_scan
Scan network for SSH services
```javascript
// Example: Scan local network
{
  "name": "ssh_scan", 
  "arguments": {
    "target": "192.168.1.0/24"
  }
}
```

### 🔍 ssh_keyscan
Verify SSH host keys
```javascript
// Example: Get host key fingerprint
{
  "name": "ssh_keyscan",
  "arguments": {
    "host": "192.168.1.100"
  }
}
```

## 🔧 Configuration

### Environment Setup
1. Copy `config/.env.example` to `config/.env`
2. Configure your SSH settings:

```properties
# SSH Configuration
SSH_KEY_PATH=/path/to/your/ssh/key
SSH_DEFAULT_HOST=your.server.ip
SSH_DEFAULT_USER=your_username
SSH_DEFAULT_PORT=22

# Security Settings  
SSH_STRICT_HOST_KEY_CHECKING=no
COMMAND_TIMEOUT=30000
LOG_LEVEL=info
```

### Claude Desktop Integration
The server automatically configures Claude Desktop. Manual setup:

```json
{
  "mcpServers": {
    "ssh-powershell-mcp": {
      "command": "node",
      "args": ["path/to/MCP-POWERSHELL/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## � Security

- ✅ **SSH key authentication** only (no passwords)
- ✅ **Command sanitization** with shell-escape
- ✅ **Environment isolation** for different configurations
- ✅ **Comprehensive input validation**
- ✅ **Secure credential handling**

See [SECURITY.md](docs/SECURITY.md) for detailed security practices.

## 📚 Documentation

- **[Complete Guide](docs/README.md)** - Detailed installation and usage
- **[API Reference](docs/API.md)** - Full MCP API documentation  
- **[Architecture](docs/ARCHITECTURE.md)** - Technical design and diagrams
- **[Security Guide](docs/SECURITY.md)** - Security best practices

## 🧪 Testing

```powershell
# Run all tests
npm test

# Run specific test types
.\scripts\test.ps1 -TestType unit
.\scripts\test.ps1 -TestType integration
.\scripts\test.ps1 -TestType ssh
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 📖 Check the [documentation](docs/)
- 🐛 Report issues on [GitHub Issues](https://github.com/GUEPARD98/MCP-POWERSHELL/issues)
- 💬 Join discussions in [GitHub Discussions](https://github.com/GUEPARD98/MCP-POWERSHELL/discussions)

## 🏆 Acknowledgments

- [Model Context Protocol](https://github.com/modelcontextprotocol) for the excellent SDK
- [Claude Desktop](https://claude.ai) for AI integration capabilities
- The open-source community for inspiration and tools

---

**🏢 Enterprise Ready** | **🔒 Secure by Design** | **⚡ Claude Optimized**

Made with ❤️ by [GUEPARD98](https://github.com/GUEPARD98)