#!/usr/bin/env node

/**
 * 3D Game Agent CLI
 *
 * 命令行工具，用于创建和管理 3D 游戏项目
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create.js';
import { generateCommand } from './commands/generate.js';
import { optimizeCommand } from './commands/optimize.js';
import { debugCommand } from './commands/debug.js';

const program = new Command();

// 版本和描述
program
  .name('game-agent')
  .description(chalk.cyan('🎮 3D Game Agent CLI - 快速创建和管理 3D JS 游戏'))
  .version('1.0.0');

// 注册命令
program.addCommand(createCommand);
program.addCommand(generateCommand);
program.addCommand(optimizeCommand);
program.addCommand(debugCommand);

// 帮助信息
program.on('--help', () => {
  console.log('');
  console.log(chalk.yellow('示例:'));
  console.log('  $ game-agent create my-game --engine=threejs');
  console.log('  $ game-agent generate player-controller --type=fps');
  console.log('  $ game-agent optimize models --target=mobile');
  console.log('  $ game-agent debug profile --duration=10s');
  console.log('');
  console.log(chalk.gray('更多信息请访问: https://github.com/battle/game-agent'));
});

// 未知命令处理
program.on('command:*', () => {
  console.error(chalk.red('错误: 未知命令 "%s"'), program.args.join(' '));
  console.log('使用 ' + chalk.cyan('game-agent --help') + ' 查看可用命令');
  process.exit(1);
});

// 解析命令行参数
program.parse(process.argv);

// 如果没有参数，显示帮助
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎮  3D Game Agent CLI                                     ║
║                                                              ║
║   快速创建和管理 3D JavaScript 游戏                         ║
║   支持 Three.js / Babylon.js / PlayCanvas                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `));
  program.outputHelp();
}
