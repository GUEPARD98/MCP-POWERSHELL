#!/bin/bash
# Simple validation script for MCP PowerShell Server

echo "🧪 Testing MCP PowerShell Server functionality..."

# Test 1: List tools
echo "📋 Test 1: Listing available tools..."
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | timeout 10s node src/index.js | grep -q "ssh_execute" && echo "✅ Tools list working" || echo "❌ Tools list failed"

# Test 2: PowerShell execution
echo "⚡ Test 2: PowerShell execution..."
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "powershell_execute", "arguments": {"command": "Write-Host \"Server working\""}}}' | timeout 15s node src/index.js | grep -q "Server working" && echo "✅ PowerShell execution working" || echo "❌ PowerShell execution failed"

# Test 3: Server startup
echo "🚀 Test 3: Server startup..."
timeout 5s node src/index.js < /dev/null 2>&1 | grep -q "iniciado correctamente" && echo "✅ Server starts correctly" || echo "❌ Server startup failed"

echo "🎉 Basic validation complete"