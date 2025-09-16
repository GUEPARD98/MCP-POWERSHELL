#!/usr/bin/env node
/**
 * Comprehensive test suite for MCP PowerShell Server
 * Tests all tools and validates functionality according to documentation
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

const TIMEOUT = 25000; // 25 seconds per test

// Test configuration
const tests = [
  {
    name: 'List Tools',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    },
    validate: (response) => {
      return response.result && 
             response.result.tools && 
             response.result.tools.length === 4 &&
             response.result.tools.find(t => t.name === 'ssh_execute') &&
             response.result.tools.find(t => t.name === 'powershell_execute') &&
             response.result.tools.find(t => t.name === 'ssh_scan') &&
             response.result.tools.find(t => t.name === 'ssh_keyscan');
    }
  },
  {
    name: 'PowerShell Get-Date',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'powershell_execute',
        arguments: {
          command: 'Get-Date'
        }
      }
    },
    validate: (response) => {
      return response.result && 
             response.result.content &&
             response.result.content[0] &&
             response.result.content[0].text.includes('✅') &&
             response.result.metadata &&
             response.result.metadata.tool === 'powershell_execute' &&
             typeof response.result.metadata.executionTime === 'number';
    }
  },
  {
    name: 'PowerShell Get Process Count',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'powershell_execute',
        arguments: {
          command: '(Get-Process).Count'
        }
      }
    },
    validate: (response) => {
      return response.result && 
             response.result.content &&
             response.result.content[0] &&
             response.result.content[0].text.includes('✅') &&
             response.result.metadata &&
             typeof response.result.metadata.executionTime === 'number';
    }
  },
  {
    name: 'PowerShell Error Handling',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'powershell_execute',
        arguments: {
          command: 'Get-NonExistentCommand'
        }
      }
    },
    validate: (response) => {
      return response.result && 
             response.result.isError === true &&
             response.result.content &&
             response.result.content[0] &&
             response.result.content[0].text.includes('❌') &&
             response.result.metadata &&
             response.result.metadata.tool === 'powershell_execute';
    }
  },
  {
    name: 'SSH Keyscan (localhost)',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'ssh_keyscan',
        arguments: {
          host: 'localhost',
          port: 22
        }
      }
    },
    validate: (response) => {
      // SSH keyscan may fail if no SSH server is running, but should handle gracefully
      return response.result && 
             response.result.content &&
             response.result.metadata &&
             response.result.metadata.tool === 'ssh_keyscan';
    }
  }
];

// Helper function to run a single test
function runTest(test) {
  return new Promise((resolve) => {
    console.log(chalk.blue(`🧪 Running test: ${test.name}`));
    
    const server = spawn('node', ['src/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    
    server.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    server.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Set timeout for test
    const timeout = setTimeout(() => {
      timedOut = true;
      server.kill('SIGKILL');
      resolve({
        name: test.name,
        success: false,
        error: 'Test timeout',
        details: { stderr }
      });
    }, TIMEOUT);
    
    // Wait for server to initialize (look for startup message)
    const checkInit = setInterval(() => {
      if (stderr.includes('iniciado correctamente')) {
        clearInterval(checkInit);
        
        // Wait a bit more for server to be fully ready
        setTimeout(() => {
          // Send test request
          server.stdin.write(JSON.stringify(test.request) + '\n');
          server.stdin.end();
        }, 1000); // Additional 1 second delay
      }
    }, 100);
    
    server.on('close', (code) => {
      if (timedOut) return;
      
      clearTimeout(timeout);
      clearInterval(checkInit);
      
      try {
        // Try to parse JSON response from stdout
        const lines = stdout.split('\n').filter(line => line.trim());
        let response = null;
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.jsonrpc && parsed.id === test.request.id) {
              response = parsed;
              break;
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }
        
        if (!response) {
          resolve({
            name: test.name,
            success: false,
            error: 'No valid JSON response found',
            details: { stdout, stderr, code }
          });
          return;
        }
        
        // Validate response
        const isValid = test.validate(response);
        
        resolve({
          name: test.name,
          success: isValid,
          error: isValid ? null : 'Response validation failed',
          details: { response, stderr }
        });
        
      } catch (error) {
        resolve({
          name: test.name,
          success: false,
          error: error.message,
          details: { stdout, stderr, code }
        });
      }
    });
    
    server.on('error', (error) => {
      if (timedOut) return;
      
      clearTimeout(timeout);
      clearInterval(checkInit);
      
      resolve({
        name: test.name,
        success: false,
        error: error.message,
        details: { stderr: error.message }
      });
    });
  });
}

// Main test runner
async function runAllTests() {
  console.log(chalk.cyan('🚀 Starting MCP PowerShell Server Comprehensive Test Suite'));
  console.log(chalk.gray('=' * 60));
  
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
    
    if (result.success) {
      console.log(chalk.green(`✅ ${result.name}`));
    } else {
      console.log(chalk.red(`❌ ${result.name}: ${result.error}`));
      if (result.details && result.details.stderr) {
        console.log(chalk.gray(`   Error details: ${result.details.stderr}`));
      }
    }
  }
  
  // Summary
  console.log(chalk.gray('=' * 60));
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(chalk.cyan('📊 Test Results Summary:'));
  console.log(chalk.green(`  ✅ Passed: ${passed}`));
  console.log(chalk.red(`  ❌ Failed: ${failed}`));
  console.log(chalk.blue(`  📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`));
  
  if (failed > 0) {
    console.log(chalk.yellow('\n⚠️  Failed Tests:'));
    results.filter(r => !r.success).forEach(result => {
      console.log(chalk.red(`    • ${result.name}: ${result.error}`));
    });
  }
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error(chalk.red('Fatal error running tests:'), error);
  process.exit(1);
});