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

// Cargar variables de entorno desde config/
dotenv.config({ path: path.join(process.cwd(), 'config', '.env') });

// Configuración del servidor MCP
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

// Función para ejecutar comandos PowerShell
function executePowerShell(command, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const process = spawn('powershell', ['-Command', command], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout, error: null });
      } else {
        reject({ success: false, output: stdout, error: stderr });
      }
    });
    
    process.on('error', (error) => {
      reject({ success: false, output: '', error: error.message });
    });
    
    // Timeout
    setTimeout(() => {
      process.kill('SIGKILL');
      reject({ success: false, output: '', error: 'Timeout excedido' });
    }, timeout);
  });
}

// Función para conectar SSH con OpenSSH nativo
async function executeSSHCommand(host, user, command, keyPath = null) {
  // Validar parámetros
  if (!host || !user || !command) {
    throw new Error('Parámetros faltantes: host, user y command son requeridos');
  }
  
  // Configurar ruta de clave SSH cross-platform
  if (!keyPath) {
    keyPath = process.env.SSH_KEY_PATH || path.join(os.homedir(), '.ssh', 'id_rsa');
  }
  
  // Sanitizar comando de forma segura
  const sanitizedCommand = shellEscape([command]);
  
  const sshCommand = `ssh -i "${keyPath}" -o StrictHostKeyChecking=no ${user}@${host} ${sanitizedCommand}`;
  
  try {
    const result = await executePowerShell(sshCommand);
    return result;
  } catch (error) {
    throw new Error(`Error SSH: ${error.message}`);
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
            network: {
              type: 'string',
              description: 'Red a escanear (ej: 192.168.1.0/24)'
            }
          },
          required: ['network']
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
            }
          },
          required: ['host']
        }
      }
    ]
  };
});

// Manejador de ejecución de herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'ssh_execute':
        console.log(chalk.cyan(`🔗 Conectando SSH: ${args.user}@${args.host}`));
        const sshResult = await executeSSHCommand(
          args.host, 
          args.user, 
          args.command, 
          args.keyPath
        );
        return {
          content: [
            {
              type: 'text',
              text: `✅ SSH Ejecutado en ${args.host}:\n\n${sshResult.output}`
            }
          ]
        };
        
      case 'powershell_execute':
        console.log(chalk.blue(`⚡ Ejecutando PowerShell: ${args.command}`));
        const psResult = await executePowerShell(args.command);
        return {
          content: [
            {
              type: 'text',
              text: `✅ PowerShell ejecutado:\n\n${psResult.output}`
            }
          ]
        };
        
      case 'ssh_scan':
        console.log(chalk.yellow(`🔍 Escaneando red: ${args.network}`));
        const scanCommand = `nmap -p 22 --open ${args.network}`;
        const scanResult = await executePowerShell(scanCommand);
        return {
          content: [
            {
              type: 'text',
              text: `🔍 Escaneo SSH de ${args.network}:\n\n${scanResult.output}`
            }
          ]
        };
        
      case 'ssh_keyscan':
        console.log(chalk.magenta(`🔑 Obteniendo claves SSH: ${args.host}`));
        const keyCommand = `ssh-keyscan ${args.host}`;
        const keyResult = await executePowerShell(keyCommand);
        return {
          content: [
            {
              type: 'text',
              text: `🔑 Claves SSH de ${args.host}:\n\n${keyResult.output}`
            }
          ]
        };
        
      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error en ${name}:`), error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error ejecutando ${name}: ${error.message}`
        }
      ]
    };
  }
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(chalk.green('🚀 SSH-PowerShell MCP Server iniciado'));
}

main().catch((error) => {
  console.error(chalk.red('❌ Error fatal:'), error);
  process.exit(1);
});