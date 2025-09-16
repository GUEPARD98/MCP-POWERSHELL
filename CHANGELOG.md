# Changelog - SSH-PowerShell MCP Server

## [1.1.0] - 2025-09-16 - Enhanced Edition

### 🚀 Major Improvements

#### ✅ Fixed Critical Issues
- **Cross-Platform PowerShell Support**: Automatic detection of PowerShell executable (`pwsh` vs `powershell`)
- **Enhanced Error Handling**: Comprehensive error handling with structured logging and metadata
- **Security Improvements**: Proper shell escaping, input validation, and SSH parameter sanitization
- **Configuration Management**: Multiple environment configuration loading with fallbacks
- **SSH Key Path Detection**: Cross-platform SSH key detection with environment variable expansion

#### 🆕 New Features
- **Rate Limiting**: Configurable rate limiting (default: 100 requests/minute)
- **Connection Pooling**: SSH connection pooling with configurable pool size (default: 5)
- **Enhanced Logging**: Structured logging with different levels and debug mode
- **Metadata in Responses**: All tool responses include execution time, exit codes, and timestamps
- **Timeout Handling**: Proper timeout implementation for all commands
- **Input Validation**: Enhanced validation for all tool parameters

#### 🔧 Technical Enhancements
- **Environment Configuration**: Support for `.env`, `.env.development`, `.env.production`, `.env.test`
- **Graceful Shutdown**: Proper signal handling for clean server shutdown
- **Resource Management**: Automatic cleanup of connection pools and timeouts
- **Command Sanitization**: Improved shell-escape implementation for security
- **Process Management**: Better child process handling with proper cleanup

### 📊 Configuration Options

#### New Environment Variables
```bash
# Rate Limiting
RATE_LIMIT_PER_MINUTE=100

# Connection Pooling
CONNECTION_POOL_SIZE=5
MAX_CONCURRENT_SSH=10

# Timeouts
COMMAND_TIMEOUT=30000
SSH_TIMEOUT=30000
SSH_CONNECT_TIMEOUT=10

# Logging
LOG_LEVEL=info
DEBUG_MODE=false

# Security
SSH_STRICT_HOST_KEY_CHECKING=no
```

### 🛠️ Tool Enhancements

#### ssh_execute
- ✅ Enhanced security with proper shell escaping
- ✅ Connection pooling support
- ✅ Cross-platform SSH key detection
- ✅ Comprehensive error handling
- ✅ Execution metadata in responses

#### powershell_execute
- ✅ Cross-platform PowerShell executable detection
- ✅ Enhanced timeout handling
- ✅ Better process management
- ✅ Structured error responses

#### ssh_scan
- ✅ Fixed parameter name (`target` instead of `network`)
- ✅ Fallback to basic connectivity test when nmap unavailable
- ✅ Enhanced input validation

#### ssh_keyscan
- ✅ Added port parameter support
- ✅ Enhanced host validation
- ✅ Better error handling

### 🔒 Security Improvements
- **Command Sanitization**: All commands are sanitized using shell-escape
- **Input Validation**: Comprehensive validation of all input parameters
- **SSH Security**: Enhanced SSH connection parameters and security options
- **Process Isolation**: Better process management with proper cleanup

### 📈 Performance Improvements
- **Connection Pooling**: Reuse SSH connections for better performance
- **Rate Limiting**: Prevent server overload with configurable limits
- **Resource Management**: Automatic cleanup of resources and connections
- **Optimized Logging**: Structured logging with configurable levels

### 🧪 Testing & Validation
- **Comprehensive Tests**: Added comprehensive functionality tests
- **Validation Scripts**: Simple validation scripts for CI/CD
- **Error Handling Tests**: Tests for error conditions and edge cases

### 📚 Documentation Updates
- **Enhanced README**: Updated with new features and configuration options
- **Configuration Examples**: Updated example configurations
- **API Documentation**: Enhanced with new parameters and metadata
- **Security Guide**: Updated security best practices

### 🐛 Bug Fixes
- Fixed shell escaping vulnerabilities in SSH commands
- Fixed PowerShell executable detection on different platforms
- Fixed timeout handling in command execution
- Fixed environment variable loading and expansion
- Fixed error handling and response formatting

### 🔄 Breaking Changes
- **ssh_scan parameter**: Changed from `network` to `target` (as documented)
- **Response format**: Added metadata to all responses (backward compatible)
- **Configuration**: Enhanced configuration loading (backward compatible)

### 🎯 Migration Guide
No breaking changes for existing installations. New features are opt-in through environment variables.

---

## [1.0.0] - 2025-09-15 - Initial Release

### 🆕 Initial Features
- SSH command execution with key authentication
- PowerShell command execution
- Network scanning for SSH services
- SSH key fingerprint scanning
- Claude Desktop integration
- Basic error handling and logging

---

**For detailed installation and usage instructions, see [README.md](README.md)**