/**
 * 3D Game Agent MCP Server
 *
 * 提供 3D 游戏开发相关的 MCP 工具集
 * 支持 Three.js、Babylon.js、PlayCanvas 等引擎
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES Module 兼容
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 导入工具模块
import { sceneTools } from './tools/scene-tools.js';
import { modelTools } from './tools/model-tools.js';
import { animationTools } from './tools/animation-tools.js';
import { physicsTools } from './tools/physics-tools.js';
import { networkTools } from './tools/network-tools.js';
import { materialTools } from './tools/material-tools.js';
import { optimizeTools } from './tools/optimize-tools.js';
import { debugTools } from './tools/debug-tools.js';
import { electronTools } from './tools/electron-tools.js';
import { pcGameTools } from './tools/pc-game-tools.js';

/**
 * MCP 工具注册表
 */
const toolRegistry = {
  ...sceneTools,
  ...modelTools,
  ...animationTools,
  ...physicsTools,
  ...networkTools,
  ...materialTools,
  ...optimizeTools,
  ...debugTools,
  ...electronTools,
  ...pcGameTools
};

/**
 * 获取所有可用工具的描述
 */
function getToolDescriptions() {
  const descriptions = {};

  for (const [name, tool] of Object.entries(toolRegistry)) {
    descriptions[name] = {
      description: tool.description,
      parameters: tool.parameters,
      category: tool.category
    };
  }

  return descriptions;
}

/**
 * 执行工具
 * @param {string} toolName - 工具名称
 * @param {object} params - 工具参数
 * @returns {Promise<object>} - 执行结果
 */
async function executeTool(toolName, params) {
  const tool = toolRegistry[toolName];

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
      availableTools: Object.keys(toolRegistry)
    };
  }

  try {
    const result = await tool.execute(params);
    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * MCP 请求处理器
 */
async function handleRequest(req, res) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 路由处理
  switch (url.pathname) {
    case '/':
    case '/health':
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: '3D Game Agent MCP Server',
        version: '1.0.0',
        status: 'running',
        tools: Object.keys(toolRegistry).length
      }));
      break;

    case '/tools':
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getToolDescriptions()));
      break;

    case '/execute':
      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { tool, params } = JSON.parse(body);
          const result = await executeTool(tool, params);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request body' }));
        }
      });
      break;

    default:
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
  }
}

/**
 * 启动服务器
 */
const PORT = process.env.MCP_PORT || 3100;
const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           3D Game Agent MCP Server                        ║
╠════════════════════════════════════════════════════════════╣
║  Status:  Running                                          ║
║  Port:    ${PORT}                                             ║
║  Tools:   ${Object.keys(toolRegistry).length} available                                     ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    GET  /         - Server info                            ║
║    GET  /health   - Health check                           ║
║    GET  /tools    - List all tools                         ║
║    POST /execute  - Execute a tool                         ║
╚════════════════════════════════════════════════════════════╝
  `);

  console.log('Available tools:');
  for (const [name, tool] of Object.entries(toolRegistry)) {
    console.log(`  - ${name}: ${tool.description}`);
  }
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down MCP server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export { toolRegistry, executeTool, getToolDescriptions };
