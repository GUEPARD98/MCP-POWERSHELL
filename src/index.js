#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import chalk from 'chalk';
import dotenv from 'dotenv';
import shellEscape from 'shell-escape';
import os from 'os';
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno desde config/ - con múltiples opciones de configuración
const configPaths = [
  path.join(process.cwd(), 'config', '.env'),
  path.join(process.cwd(), 'config', `.env.${process.env.NODE_ENV || 'development'}`),
  path.join(process.cwd(), '.env')
];

for (const configPath of configPaths) {
  if (fs.existsSync(configPath)) {
    dotenv.config({ path: configPath });
    break;
  }
}

// Configuración por defecto
const DEFAULT_CONFIG = {
  SSH_TIMEOUT: 30000,
  COMMAND_TIMEOUT: 30000,
  LOG_LEVEL: 'info',
  DEBUG_MODE: false,
  SSH_STRICT_HOST_KEY_CHECKING: 'no'
};

// Función de logging mejorada
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logLevel = process.env.LOG_LEVEL || DEFAULT_CONFIG.LOG_LEVEL;
  const isDebug = process.env.DEBUG_MODE === 'true' || DEFAULT_CONFIG.DEBUG_MODE;
  
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  if (levels[level] < levels[logLevel] && !isDebug) return;
  
  const colors = {
    debug: chalk.gray,
    info: chalk.blue,
    warn: chalk.yellow,
    error: chalk.red
  };
  
  const prefix = colors[level](`[${timestamp}] [${level.toUpperCase()}]`);
  console.error(`${prefix} ${message}`);
  
  if (data && isDebug) {
    console.error(chalk.gray(JSON.stringify(data, null, 2)));
  }
}

// Función para obtener ruta de clave SSH cross-platform
function getSSHKeyPath(customPath = null) {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }
  
  const envPath = process.env.SSH_KEY_PATH;
  if (envPath) {
    // Expandir variables de entorno en Windows (%USERPROFILE%) y Unix (~)
    let expandedPath = envPath;
    if (os.platform() === 'win32') {
      expandedPath = expandedPath.replace(/%([^%]+)%/g, (_, key) => process.env[key] || '');
    } else {
      expandedPath = expandedPath.replace(/^~/, os.homedir());
    }
    
    if (fs.existsSync(expandedPath)) {
      return expandedPath;
    }
  }
  
  // Rutas por defecto según plataforma
  const defaultPaths = [
    path.join(os.homedir(), '.ssh', 'id_rsa'),
    path.join(os.homedir(), '.ssh', 'id_ed25519'),
    path.join(os.homedir(), '.ssh', 'id_ecdsa')
  ];
  
  for (const defaultPath of defaultPaths) {
    if (fs.existsSync(defaultPath)) {
      return defaultPath;
    }
  }
  
  throw new Error('No se encontró ninguna clave SSH válida. Configura SSH_KEY_PATH o genera una clave SSH.');
}
const server = new Server(
  {
    name: 'ssh-powershell-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Sistema de rate limiting simple
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute by default
    this.maxRequests = parseInt(process.env.RATE_LIMIT_PER_MINUTE) || maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  checkLimit() {
    const now = Date.now();
    // Limpiar requests antiguos
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }
    
    this.requests.push(now);
    return true;
  }
  
  getRemainingRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// Pool simple de conexiones SSH para reutilización
class ConnectionPool {
  constructor(maxSize = 5) {
    this.maxSize = parseInt(process.env.CONNECTION_POOL_SIZE) || maxSize;
    this.connections = new Map(); // host+user -> { lastUsed, inUse }
    this.activeConnections = 0;
  }
  
  getConnectionKey(host, user) {
    return `${user}@${host}`;
  }
  
  canCreateConnection() {
    return this.activeConnections < this.maxSize;
  }
  
  markConnectionUsed(host, user) {
    const key = this.getConnectionKey(host, user);
    this.connections.set(key, {
      lastUsed: Date.now(),
      inUse: true
    });
    this.activeConnections++;
  }
  
  releaseConnection(host, user) {
    const key = this.getConnectionKey(host, user);
    if (this.connections.has(key)) {
      this.connections.set(key, {
        lastUsed: Date.now(),
        inUse: false
      });
      this.activeConnections = Math.max(0, this.activeConnections - 1);
    }
  }
  
  cleanup() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, conn] of this.connections.entries()) {
      if (!conn.inUse && (now - conn.lastUsed) > maxAge) {
        this.connections.delete(key);
      }
    }
  }
}

// Instancias globales
const rateLimiter = new RateLimiter();
const connectionPool = new ConnectionPool();

// Limpiar pool periódicamente
setInterval(() => {
  connectionPool.cleanup();
}, 5 * 60 * 1000); // Cada 5 minutos

// Configuración del servidor MCP
// Función para detectar el ejecutable de PowerShell disponible
function getPowerShellExecutable() {
  // En Windows, preferir powershell.exe, luego pwsh.exe
  // En Linux/macOS, usar pwsh (PowerShell Core)
  const platform = os.platform();
  
  if (platform === 'win32') {
    return 'powershell'; // Windows PowerShell por defecto
  } else {
    return 'pwsh'; // PowerShell Core en Linux/macOS
  }
}

// Función para ejecutar comandos PowerShell con mejor manejo de errores
function executePowerShell(command, timeout = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const actualTimeout = timeout || parseInt(process.env.COMMAND_TIMEOUT) || DEFAULT_CONFIG.COMMAND_TIMEOUT;
    
    log('debug', 'Ejecutando comando PowerShell', { command, timeout: actualTimeout });
    
    // Validar comando
    if (!command || typeof command !== 'string') {
      return reject(new Error('Comando PowerShell inválido'));
    }
    
    const psExecutable = getPowerShellExecutable();
    const childProcess = spawn(psExecutable, ['-Command', command], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false // Mejor seguridad sin shell wrapper
    });
    
    let stdout = '';
    let stderr = '';
    let isResolved = false;
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    childProcess.on('close', (code) => {
      if (isResolved) return;
      isResolved = true;
      
      const executionTime = Date.now() - startTime;
      const result = {
        success: code === 0,
        output: stdout,
        error: stderr || null,
        exitCode: code,
        executionTime
      };
      
      log('debug', 'Comando PowerShell completado', result);
      
      if (code === 0) {
        resolve(result);
      } else {
        reject(result);
      }
    });
    
    childProcess.on('error', (error) => {
      if (isResolved) return;
      isResolved = true;
      
      const result = {
        success: false,
        output: stdout,
        error: error.message,
        exitCode: -1,
        executionTime: Date.now() - startTime
      };
      
      log('error', 'Error ejecutando PowerShell', result);
      reject(result);
    });
    
    // Timeout mejorado
    const timeoutId = setTimeout(() => {
      if (isResolved) return;
      isResolved = true;
      
      try {
        childProcess.kill('SIGKILL');
      } catch (e) {
        log('warn', 'Error matando proceso', e);
      }
      
      const result = {
        success: false,
        output: stdout,
        error: `Timeout de ${actualTimeout}ms excedido`,
        exitCode: -1,
        executionTime: actualTimeout
      };
      
      log('warn', 'Timeout en comando PowerShell', result);
      reject(result);
    }, actualTimeout);
    
    childProcess.on('close', () => clearTimeout(timeoutId));
    childProcess.on('error', () => clearTimeout(timeoutId));
  });
}

// Función para conectar SSH con autenticación por claves mejorada y pooling
async function executeSSHCommand(host, user, command, keyPath = null, timeout = null) {
  const startTime = Date.now();
  
  // Validar parámetros de entrada
  if (!host || typeof host !== 'string') {
    throw new Error('Parámetro host es requerido y debe ser una cadena válida');
  }
  if (!user || typeof user !== 'string') {
    throw new Error('Parámetro user es requerido y debe ser una cadena válida');
  }
  if (!command || typeof command !== 'string') {
    throw new Error('Parámetro command es requerido y debe ser una cadena válida');
  }
  
  // Verificar pool de conexiones
  if (!connectionPool.canCreateConnection()) {
    throw new Error(`Máximo de conexiones SSH concurrentes alcanzado (${connectionPool.maxSize}). Intente más tarde.`);
  }
  
  log('info', 'Iniciando conexión SSH', { host, user, command: command.substring(0, 100) });
  
  // Marcar conexión como en uso
  connectionPool.markConnectionUsed(host, user);
  
  try {
    // Obtener ruta de clave SSH
    const actualKeyPath = getSSHKeyPath(keyPath);
    const actualTimeout = timeout || parseInt(process.env.SSH_TIMEOUT) || DEFAULT_CONFIG.SSH_TIMEOUT;
    
    // Sanitizar comando usando shell-escape para seguridad
    const sanitizedCommand = shellEscape([command]);
    
    // Construir comando SSH seguro con parámetros de conexión
    const sshArgs = [
      '-i', actualKeyPath,
      '-o', `StrictHostKeyChecking=${process.env.SSH_STRICT_HOST_KEY_CHECKING || DEFAULT_CONFIG.SSH_STRICT_HOST_KEY_CHECKING}`,
      '-o', 'BatchMode=yes',
      '-o', 'ConnectTimeout=10',
      '-o', 'ServerAliveInterval=30',
      '-o', 'ServerAliveCountMax=3',
      `${user}@${host}`,
      sanitizedCommand
    ];
    
    log('debug', 'Comando SSH construido', { args: sshArgs });
    
    // Ejecutar comando SSH
    const sshCommand = `ssh ${sshArgs.map(arg => shellEscape([arg])).join(' ')}`;
    const result = await executePowerShell(sshCommand, actualTimeout);
    
    // Agregar metadata específica de SSH
    const sshResult = {
      ...result,
      metadata: {
        host,
        user,
        keyPath: actualKeyPath,
        sanitizedCommand,
        executionTime: Date.now() - startTime,
        connectionPoolStatus: {
          active: connectionPool.activeConnections,
          maxSize: connectionPool.maxSize
        }
      }
    };
    
    log('info', 'Comando SSH ejecutado exitosamente', { 
      host, 
      executionTime: sshResult.metadata.executionTime,
      outputLength: result.output.length 
    });
    
    return sshResult;
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    log('error', 'Error ejecutando comando SSH', { 
      host, 
      user, 
      error: error.message,
      executionTime 
    });
    
    throw new Error(`Error SSH en ${host}: ${error.message}`);
  } finally {
    // Liberar conexión del pool
    connectionPool.releaseConnection(host, user);
  }
}

// Lista de herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'ssh_execute',
        description: 'Ejecutar comandos en máquinas remotas vía SSH usando clave SSH',
        inputSchema: {
          type: 'object',
          properties: {
            host: {
              type: 'string',
              description: 'Dirección IP o hostname del servidor remoto'
            },
            user: {
              type: 'string',
              description: 'Nombre de usuario para SSH'
            },
            command: {
              type: 'string',
              description: 'Comando a ejecutar en el servidor remoto'
            },
            keyPath: {
              type: 'string',
              description: 'Ruta a la clave SSH privada (opcional)'
            },
            timeout: {
              type: 'number',
              description: 'Timeout en milisegundos (opcional)'
            }
          },
          required: ['host', 'user', 'command']
        }
      },
      {
        name: 'powershell_execute',
        description: 'Ejecutar comandos PowerShell localmente',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Comando PowerShell a ejecutar'
            },
            timeout: {
              type: 'number',
              description: 'Timeout en milisegundos (opcional)'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'ssh_scan',
        description: 'Escanear red para encontrar hosts SSH disponibles',
        inputSchema: {
          type: 'object',
          properties: {
            target: {
              type: 'string',
              description: 'Red a escanear (ej: 192.168.1.0/24) o host individual'
            },
            timeout: {
              type: 'number',
              description: 'Timeout en milisegundos (opcional)'
            }
          },
          required: ['target']
        }
      },
      {
        name: 'ssh_keyscan',
        description: 'Obtener fingerprint de claves SSH de un host',
        inputSchema: {
          type: 'object',
          properties: {
            host: {
              type: 'string',
              description: 'Host para obtener claves SSH'
            },
            port: {
              type: 'number',
              description: 'Puerto SSH (opcional, default: 22)',
              default: 22
            },
            timeout: {
              type: 'number',
              description: 'Timeout en milisegundos (opcional)'
            }
          },
          required: ['host']
        }
      }
    ]
  };
});

// Manejador de ejecución de herramientas con manejo de errores mejorado y rate limiting
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();
  
  // Verificar rate limiting
  if (!rateLimiter.checkLimit()) {
    const remainingRequests = rateLimiter.getRemainingRequests();
    log('warn', `Rate limit excedido para herramienta: ${name}`, { remainingRequests });
    
    return {
      content: [
        {
          type: 'text',
          text: `⚠️ Rate limit excedido. Máximo ${rateLimiter.maxRequests} requests por minuto. Quedan: ${remainingRequests} requests disponibles.`
        }
      ],
      isError: true,
      metadata: {
        tool: name,
        error: 'Rate limit exceeded',
        rateLimitInfo: {
          maxRequests: rateLimiter.maxRequests,
          remainingRequests: remainingRequests,
          windowMs: rateLimiter.windowMs
        },
        timestamp: new Date().toISOString()
      }
    };
  }
  
  log('info', `Ejecutando herramienta: ${name}`, { args, remainingRequests: rateLimiter.getRemainingRequests() });
  
  try {
    switch (name) {
      case 'ssh_execute':
        log('info', `🔗 Conectando SSH: ${args.user}@${args.host}`);
        const sshResult = await executeSSHCommand(
          args.host, 
          args.user, 
          args.command, 
          args.keyPath,
          args.timeout
        );
        
        return {
          content: [
            {
              type: 'text',
              text: `✅ SSH ejecutado en ${args.host}:\n\n${sshResult.output}`
            }
          ],
          isError: false,
          metadata: {
            tool: 'ssh_execute',
            host: args.host,
            user: args.user,
            exitCode: sshResult.exitCode,
            executionTime: sshResult.executionTime || sshResult.metadata?.executionTime,
            connectionPoolStatus: sshResult.metadata?.connectionPoolStatus,
            rateLimitInfo: {
              remainingRequests: rateLimiter.getRemainingRequests()
            },
            timestamp: new Date().toISOString()
          }
        };
        
      case 'powershell_execute':
        log('info', `⚡ Ejecutando PowerShell: ${args.command}`);
        const psResult = await executePowerShell(args.command, args.timeout);
        
        return {
          content: [
            {
              type: 'text',
              text: `✅ PowerShell ejecutado:\n\n${psResult.output}`
            }
          ],
          isError: false,
          metadata: {
            tool: 'powershell_execute',
            exitCode: psResult.exitCode,
            executionTime: psResult.executionTime,
            rateLimitInfo: {
              remainingRequests: rateLimiter.getRemainingRequests()
            },
            timestamp: new Date().toISOString()
          }
        };
        
      case 'ssh_scan':
        log('info', `🔍 Escaneando red: ${args.target}`);
        
        // Validar formato de red/host
        if (!args.target || !/^[\d\w\.\-\/]+$/.test(args.target)) {
          throw new Error('Formato de target inválido. Use formato IP (192.168.1.1) o CIDR (192.168.1.0/24)');
        }
        
        // Usar nmap si está disponible, sino usar ping básico
        let scanCommand;
        try {
          // Verificar si nmap está disponible
          await executePowerShell('nmap --version', 5000);
          scanCommand = `nmap -p 22 --open ${args.target}`;
        } catch (e) {
          // Fallback a escaneo básico con ping
          log('warn', 'nmap no disponible, usando escaneo básico');
          if (args.target.includes('/')) {
            throw new Error('Escaneo de rango CIDR requiere nmap. Instale nmap o especifique un host individual.');
          }
          scanCommand = `Test-NetConnection -ComputerName ${args.target} -Port 22 -WarningAction SilentlyContinue | Select-Object ComputerName, TcpTestSucceeded, RemotePort`;
        }
        
        const scanResult = await executePowerShell(scanCommand, args.timeout);
        
        return {
          content: [
            {
              type: 'text',
              text: `🔍 Escaneo SSH de ${args.target}:\n\n${scanResult.output}`
            }
          ],
          isError: false,
          metadata: {
            tool: 'ssh_scan',
            target: args.target,
            exitCode: scanResult.exitCode,
            executionTime: scanResult.executionTime,
            rateLimitInfo: {
              remainingRequests: rateLimiter.getRemainingRequests()
            },
            timestamp: new Date().toISOString()
          }
        };
        
      case 'ssh_keyscan':
        log('info', `🔑 Obteniendo claves SSH: ${args.host}`);
        
        // Validar formato de host
        if (!args.host || !/^[\w\.\-]+$/.test(args.host)) {
          throw new Error('Formato de host inválido');
        }
        
        const port = args.port || 22;
        const keyCommand = `ssh-keyscan -p ${port} ${args.host}`;
        const keyResult = await executePowerShell(keyCommand, args.timeout);
        
        return {
          content: [
            {
              type: 'text',
              text: `🔑 Claves SSH de ${args.host}:${port}:\n\n${keyResult.output}`
            }
          ],
          isError: false,
          metadata: {
            tool: 'ssh_keyscan',
            host: args.host,
            port: port,
            exitCode: keyResult.exitCode,
            executionTime: keyResult.executionTime,
            rateLimitInfo: {
              remainingRequests: rateLimiter.getRemainingRequests()
            },
            timestamp: new Date().toISOString()
          }
        };
        
      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    log('error', `❌ Error en ${name}`, { error: error.message, args, executionTime });
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error ejecutando ${name}: ${error.message}`
        }
      ],
      isError: true,
      metadata: {
        tool: name,
        error: error.message,
        executionTime,
        rateLimitInfo: {
          remainingRequests: rateLimiter.getRemainingRequests()
        },
        timestamp: new Date().toISOString(),
        args: args
      }
    };
  }
});

// Iniciar servidor con manejo de errores mejorado
async function main() {
  try {
    // Verificar configuración crítica al inicio
    log('info', 'Iniciando SSH-PowerShell MCP Server...');
    
    // Verificar disponibilidad de comandos críticos
    const checks = [];
    
    try {
      await executePowerShell('$PSVersionTable.PSVersion', 5000);
      checks.push('✅ PowerShell disponible');
    } catch (e) {
      checks.push('❌ PowerShell no disponible');
      throw new Error(`PowerShell no está disponible: ${e.message}`);
    }
    
    try {
      await executePowerShell('ssh -V', 5000);
      checks.push('✅ SSH client disponible');
    } catch (e) {
      checks.push('⚠️ SSH client no disponible - funciones SSH deshabilitadas');
      log('warn', 'SSH client no disponible, algunas funciones estarán limitadas');
    }
    
    // Mostrar información de configuración
    log('info', 'Verificaciones del sistema:', checks);
    log('info', `Configuración cargada: timeout=${process.env.COMMAND_TIMEOUT || DEFAULT_CONFIG.COMMAND_TIMEOUT}ms, log_level=${process.env.LOG_LEVEL || DEFAULT_CONFIG.LOG_LEVEL}`);
    log('info', `Rate limiting: ${rateLimiter.maxRequests} requests/min, Connection pool: ${connectionPool.maxSize} conexiones`);
    log('info', `PowerShell executable: ${getPowerShellExecutable()}`);
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    log('info', '🚀 SSH-PowerShell MCP Server iniciado correctamente');
    
    // Configurar manejadores de señales para shutdown graceful
    process.on('SIGINT', () => {
      log('info', 'Recibida señal SIGINT, cerrando servidor...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log('info', 'Recibida señal SIGTERM, cerrando servidor...');
      process.exit(0);
    });
    
  } catch (error) {
    log('error', '❌ Error fatal al iniciar servidor', { error: error.message });
    process.exit(1);
  }
}

main().catch((error) => {
  log('error', '❌ Error fatal no capturado', { error: error.message, stack: error.stack });
  process.exit(1);
});