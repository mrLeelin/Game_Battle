/**
 * debug 命令
 *
 * 调试和性能分析
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export const debugCommand = new Command('debug')
  .description('调试和性能分析')
  .argument('<action>', '调试动作 (profile, analyze, report)')
  .option('-d, --duration <seconds>', '分析时长（秒）', '10')
  .option('-o, --output <path>', '输出路径', 'debug-report')
  .action(async (action, options) => {
    console.log(chalk.cyan(`\n🔍 执行调试: ${action}\n`));

    const spinner = ora('准备中...').start();

    try {
      switch (action) {
        case 'profile':
          await runProfile(spinner, options);
          break;
        case 'analyze':
          await runAnalyze(spinner, options);
          break;
        case 'report':
          await generateReport(spinner, options);
          break;
        default:
          spinner.fail(chalk.red(`未知动作: ${action}`));
          return;
      }

      spinner.succeed(chalk.green('完成!'));

    } catch (error) {
      spinner.fail(chalk.red('失败: ' + error.message));
      console.error(error);
    }
  });

/**
 * 性能分析
 */
async function runProfile(spinner, options) {
  spinner.text = '生成性能分析代码...';

  const profileCode = `
// 性能分析工具
// 将此代码添加到你的游戏主文件中

class GameProfiler {
  constructor() {
    this.metrics = {
      fps: [],
      frameTime: [],
      memory: [],
      drawCalls: [],
      triangles: []
    };

    this.isRecording = false;
    this.duration = ${options.duration} * 1000;
    this.startTime = 0;

    this.setupUI();
  }

  setupUI() {
    // 创建控制面板
    const panel = document.createElement('div');
    panel.id = 'profiler-panel';
    panel.style.cssText = \`
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
    \`;
    panel.innerHTML = \`
      <div style="margin-bottom: 10px; font-weight: bold;">🔍 性能分析器</div>
      <div id="profiler-status">状态: 就绪</div>
      <div id="profiler-time">时间: 0s / ${options.duration}s</div>
      <div style="margin-top: 10px;">
        <button id="profiler-start" style="padding: 5px 10px; cursor: pointer;">开始记录</button>
        <button id="profiler-export" style="padding: 5px 10px; cursor: pointer; margin-left: 5px;">导出报告</button>
      </div>
      <hr style="border-color: #444; margin: 10px 0;">
      <div id="profiler-fps">FPS: --</div>
      <div id="profiler-frame">帧时间: -- ms</div>
      <div id="profiler-memory">内存: -- MB</div>
      <div id="profiler-draws">Draw Calls: --</div>
      <div id="profiler-tris">三角形: --</div>
    \`;

    document.body.appendChild(panel);

    // 绑定事件
    document.getElementById('profiler-start').onclick = () => this.start();
    document.getElementById('profiler-export').onclick = () => this.exportReport();
  }

  start() {
    this.isRecording = true;
    this.startTime = performance.now();
    this.metrics = { fps: [], frameTime: [], memory: [], drawCalls: [], triangles: [] };

    document.getElementById('profiler-status').textContent = '状态: 记录中...';
    document.getElementById('profiler-start').disabled = true;

    console.log('性能分析开始');
  }

  update(renderer) {
    const now = performance.now();

    // 更新 UI
    if (renderer) {
      const info = renderer.info;
      document.getElementById('profiler-draws').textContent = \`Draw Calls: \${info.render.calls}\`;
      document.getElementById('profiler-tris').textContent = \`三角形: \${info.render.triangles.toLocaleString()}\`;
    }

    if (performance.memory) {
      const memMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
      document.getElementById('profiler-memory').textContent = \`内存: \${memMB} MB\`;
    }

    if (!this.isRecording) return;

    const elapsed = now - this.startTime;

    // 检查是否完成
    if (elapsed >= this.duration) {
      this.stop();
      return;
    }

    // 更新时间显示
    document.getElementById('profiler-time').textContent =
      \`时间: \${(elapsed / 1000).toFixed(1)}s / ${options.duration}s\`;

    // 记录指标
    if (this.lastFrameTime) {
      const frameTime = now - this.lastFrameTime;
      const fps = 1000 / frameTime;

      this.metrics.fps.push(fps);
      this.metrics.frameTime.push(frameTime);

      document.getElementById('profiler-fps').textContent = \`FPS: \${fps.toFixed(1)}\`;
      document.getElementById('profiler-frame').textContent = \`帧时间: \${frameTime.toFixed(2)} ms\`;

      if (renderer) {
        this.metrics.drawCalls.push(renderer.info.render.calls);
        this.metrics.triangles.push(renderer.info.render.triangles);
      }

      if (performance.memory) {
        this.metrics.memory.push(performance.memory.usedJSHeapSize / 1048576);
      }
    }

    this.lastFrameTime = now;
  }

  stop() {
    this.isRecording = false;
    document.getElementById('profiler-status').textContent = '状态: 完成';
    document.getElementById('profiler-start').disabled = false;
    console.log('性能分析完成');

    this.showSummary();
  }

  showSummary() {
    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const min = arr => arr.length ? Math.min(...arr) : 0;
    const max = arr => arr.length ? Math.max(...arr) : 0;

    console.log('\\n=== 性能分析报告 ===');
    console.log(\`FPS: 平均 \${avg(this.metrics.fps).toFixed(1)}, 最低 \${min(this.metrics.fps).toFixed(1)}, 最高 \${max(this.metrics.fps).toFixed(1)}\`);
    console.log(\`帧时间: 平均 \${avg(this.metrics.frameTime).toFixed(2)}ms\`);
    console.log(\`Draw Calls: 平均 \${Math.round(avg(this.metrics.drawCalls))}\`);
    console.log(\`三角形: 平均 \${Math.round(avg(this.metrics.triangles)).toLocaleString()}\`);
    if (this.metrics.memory.length) {
      console.log(\`内存: 平均 \${avg(this.metrics.memory).toFixed(1)}MB\`);
    }
    console.log('====================\\n');
  }

  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: ${options.duration},
      metrics: this.metrics,
      summary: this.calculateSummary()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'performance-report.json';
    a.click();
    URL.revokeObjectURL(url);

    console.log('报告已导出');
  }

  calculateSummary() {
    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const min = arr => arr.length ? Math.min(...arr) : 0;
    const max = arr => arr.length ? Math.max(...arr) : 0;

    return {
      fps: { avg: avg(this.metrics.fps), min: min(this.metrics.fps), max: max(this.metrics.fps) },
      frameTime: { avg: avg(this.metrics.frameTime), min: min(this.metrics.frameTime), max: max(this.metrics.frameTime) },
      drawCalls: { avg: avg(this.metrics.drawCalls), max: max(this.metrics.drawCalls) },
      triangles: { avg: avg(this.metrics.triangles), max: max(this.metrics.triangles) },
      memory: { avg: avg(this.metrics.memory), max: max(this.metrics.memory) }
    };
  }
}

// 创建分析器实例
const profiler = new GameProfiler();

// 在渲染循环中调用
// profiler.update(renderer);

export { GameProfiler, profiler };
`;

  const outputPath = path.join(process.cwd(), options.output);
  await fs.ensureDir(outputPath);

  const filePath = path.join(outputPath, 'profiler.js');
  await fs.writeFile(filePath, profileCode.trim());

  console.log(chalk.green(`\n  分析器代码已生成: ${filePath}`));
  console.log(chalk.gray('\n  使用方法:'));
  console.log(chalk.gray('  1. 在你的游戏主文件中导入: import { profiler } from "./debug-report/profiler.js"'));
  console.log(chalk.gray('  2. 在渲染循环中调用: profiler.update(renderer)'));
  console.log(chalk.gray('  3. 点击页面右上角的 "开始记录" 按钮'));
}

/**
 * 代码分析
 */
async function runAnalyze(spinner, options) {
  spinner.text = '分析项目结构...';

  const stats = {
    files: 0,
    lines: 0,
    classes: 0,
    functions: 0,
    imports: 0,
    threeJsUsage: []
  };

  const files = await glob('**/*.js', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**']
  });

  stats.files = files.length;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');

    stats.lines += lines.length;

    // 统计类
    const classMatches = content.match(/class\s+\w+/g);
    if (classMatches) stats.classes += classMatches.length;

    // 统计函数
    const funcMatches = content.match(/function\s+\w+|=>\s*{/g);
    if (funcMatches) stats.functions += funcMatches.length;

    // 统计导入
    const importMatches = content.match(/import\s+/g);
    if (importMatches) stats.imports += importMatches.length;

    // Three.js 使用分析
    const threeUsage = content.match(/THREE\.\w+|new\s+(Mesh|Scene|Camera|Renderer)\w*/g);
    if (threeUsage) {
      stats.threeJsUsage.push({ file, usage: threeUsage });
    }
  }

  console.log(chalk.cyan('\n  📊 项目分析报告:\n'));
  console.log(chalk.gray(`  文件数量: ${stats.files}`));
  console.log(chalk.gray(`  代码行数: ${stats.lines.toLocaleString()}`));
  console.log(chalk.gray(`  类定义: ${stats.classes}`));
  console.log(chalk.gray(`  函数定义: ${stats.functions}`));
  console.log(chalk.gray(`  导入语句: ${stats.imports}`));

  if (stats.threeJsUsage.length > 0) {
    console.log(chalk.cyan('\n  Three.js 使用情况:'));
    for (const item of stats.threeJsUsage.slice(0, 5)) {
      console.log(chalk.gray(`  - ${item.file}: ${item.usage.length} 处`));
    }
  }
}

/**
 * 生成报告
 */
async function generateReport(spinner, options) {
  spinner.text = '生成调试报告...';

  const outputPath = path.join(process.cwd(), options.output);
  await fs.ensureDir(outputPath);

  // 收集项目信息
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  let projectInfo = { name: 'unknown', version: '0.0.0' };

  if (await fs.pathExists(packageJsonPath)) {
    projectInfo = await fs.readJson(packageJsonPath);
  }

  const report = {
    generated: new Date().toISOString(),
    project: {
      name: projectInfo.name,
      version: projectInfo.version
    },
    environment: {
      node: process.version,
      platform: process.platform
    },
    files: {},
    recommendations: []
  };

  // 分析文件
  const files = await glob('**/*.js', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**']
  });

  for (const file of files) {
    const stat = await fs.stat(file);
    report.files[file] = {
      size: stat.size,
      modified: stat.mtime
    };
  }

  // 添加建议
  report.recommendations.push('使用 npm run build 构建生产版本');
  report.recommendations.push('检查是否移除了所有 console.log');
  report.recommendations.push('考虑使用代码分割减少初始加载');

  // 写入报告
  const reportPath = path.join(outputPath, 'debug-report.json');
  await fs.writeJson(reportPath, report, { spaces: 2 });

  // 生成 HTML 报告
  const htmlReport = generateHtmlReport(report);
  const htmlPath = path.join(outputPath, 'debug-report.html');
  await fs.writeFile(htmlPath, htmlReport);

  console.log(chalk.green(`\n  报告已生成:`));
  console.log(chalk.gray(`  - JSON: ${reportPath}`));
  console.log(chalk.gray(`  - HTML: ${htmlPath}`));
}

/**
 * 生成 HTML 报告
 */
function generateHtmlReport(report) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>调试报告 - ${report.project.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #00d4ff; margin-bottom: 20px; }
    h2 { color: #ff6b6b; margin: 20px 0 10px; }
    .card {
      background: #16213e;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .card-title { color: #00d4ff; font-size: 14px; margin-bottom: 10px; }
    .stat { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #0f3460; }
    .stat:last-child { border-bottom: none; }
    .stat-label { color: #888; }
    .stat-value { color: #fff; }
    ul { padding-left: 20px; }
    li { margin: 5px 0; }
    .file-list { max-height: 300px; overflow-y: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 调试报告</h1>
    <p style="color: #888; margin-bottom: 20px;">生成时间: ${report.generated}</p>

    <div class="card">
      <div class="card-title">📦 项目信息</div>
      <div class="stat"><span class="stat-label">项目名称</span><span class="stat-value">${report.project.name}</span></div>
      <div class="stat"><span class="stat-label">版本</span><span class="stat-value">${report.project.version}</span></div>
      <div class="stat"><span class="stat-label">Node 版本</span><span class="stat-value">${report.environment.node}</span></div>
      <div class="stat"><span class="stat-label">平台</span><span class="stat-value">${report.environment.platform}</span></div>
    </div>

    <div class="card">
      <div class="card-title">📁 文件列表 (${Object.keys(report.files).length} 个)</div>
      <div class="file-list">
        ${Object.entries(report.files).map(([file, info]) => `
          <div class="stat">
            <span class="stat-label">${file}</span>
            <span class="stat-value">${(info.size / 1024).toFixed(1)} KB</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-title">💡 优化建议</div>
      <ul>
        ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>
  </div>
</body>
</html>
`.trim();
}
