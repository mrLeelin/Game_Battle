/**
 * optimize 命令
 *
 * 优化游戏资源
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export const optimizeCommand = new Command('optimize')
  .alias('opt')
  .description('优化游戏资源')
  .argument('<target>', '优化目标 (models, textures, code, all)')
  .option('-t, --target-platform <platform>', '目标平台 (mobile, desktop, vr)', 'desktop')
  .option('-q, --quality <quality>', '质量级别 (low, medium, high)', 'medium')
  .option('--dry-run', '预览操作，不实际执行', false)
  .action(async (target, options) => {
    console.log(chalk.cyan(`\n🚀 优化 ${target}\n`));

    const spinner = ora('分析资源...').start();

    try {
      switch (target) {
        case 'models':
          await optimizeModels(spinner, options);
          break;
        case 'textures':
          await optimizeTextures(spinner, options);
          break;
        case 'code':
          await optimizeCode(spinner, options);
          break;
        case 'all':
          await optimizeModels(spinner, options);
          await optimizeTextures(spinner, options);
          await optimizeCode(spinner, options);
          break;
        default:
          spinner.fail(chalk.red(`未知优化目标: ${target}`));
          return;
      }

      spinner.succeed(chalk.green('优化完成!'));

    } catch (error) {
      spinner.fail(chalk.red('优化失败: ' + error.message));
      console.error(error);
    }
  });

/**
 * 优化模型
 */
async function optimizeModels(spinner, options) {
  spinner.text = '扫描模型文件...';

  const modelExtensions = ['glb', 'gltf', 'fbx', 'obj'];
  const patterns = modelExtensions.map(ext => `**/*.${ext}`);

  let files = [];
  for (const pattern of patterns) {
    const found = await glob(pattern, { cwd: process.cwd() });
    files = files.concat(found);
  }

  if (files.length === 0) {
    console.log(chalk.yellow('\n  未找到模型文件'));
    return;
  }

  console.log(chalk.gray(`\n  找到 ${files.length} 个模型文件`));

  // 平台配置
  const platformConfigs = {
    mobile: { maxTriangles: 10000, maxTextureSize: 512 },
    desktop: { maxTriangles: 100000, maxTextureSize: 2048 },
    vr: { maxTriangles: 50000, maxTextureSize: 1024 }
  };

  const config = platformConfigs[options.targetPlatform] || platformConfigs.desktop;

  // 输出建议
  console.log(chalk.cyan('\n  模型优化建议:'));
  console.log(chalk.gray(`  - 目标平台: ${options.targetPlatform}`));
  console.log(chalk.gray(`  - 最大三角形数: ${config.maxTriangles.toLocaleString()}`));
  console.log(chalk.gray(`  - 最大纹理尺寸: ${config.maxTextureSize}px`));

  for (const file of files) {
    const stat = await fs.stat(file);
    const sizeKB = (stat.size / 1024).toFixed(1);

    console.log(chalk.gray(`\n  📁 ${file} (${sizeKB} KB)`));

    // 建议
    if (stat.size > 5 * 1024 * 1024) {
      console.log(chalk.yellow('     ⚠️ 文件过大，建议压缩或简化'));
    }

    if (file.endsWith('.fbx')) {
      console.log(chalk.yellow('     ⚠️ FBX 格式较大，建议转换为 GLB'));
    }
  }

  if (!options.dryRun) {
    console.log(chalk.cyan('\n  生成优化脚本...'));

    const scriptContent = `
// 模型优化脚本
// 使用 gltf-pipeline 进行优化

const { processGltf } = require('gltf-pipeline');
const fs = require('fs');

async function optimizeModel(inputPath, outputPath) {
  const gltf = JSON.parse(fs.readFileSync(inputPath));

  const options = {
    dracoOptions: {
      compressionLevel: 7
    }
  };

  const results = await processGltf(gltf, options);
  fs.writeFileSync(outputPath, JSON.stringify(results.gltf));
}

// 使用示例
// optimizeModel('input.gltf', 'output.gltf');
`;

    const scriptPath = path.join(process.cwd(), 'optimize-models.js');
    await fs.writeFile(scriptPath, scriptContent.trim());
    console.log(chalk.green(`  脚本已生成: ${scriptPath}`));
  }
}

/**
 * 优化纹理
 */
async function optimizeTextures(spinner, options) {
  spinner.text = '扫描纹理文件...';

  const textureExtensions = ['png', 'jpg', 'jpeg', 'webp', 'tga'];
  const patterns = textureExtensions.map(ext => `**/*.${ext}`);

  let files = [];
  for (const pattern of patterns) {
    const found = await glob(pattern, {
      cwd: process.cwd(),
      ignore: ['node_modules/**', 'dist/**']
    });
    files = files.concat(found);
  }

  if (files.length === 0) {
    console.log(chalk.yellow('\n  未找到纹理文件'));
    return;
  }

  console.log(chalk.gray(`\n  找到 ${files.length} 个纹理文件`));

  // 平台配置
  const qualityConfigs = {
    low: { maxSize: 512, format: 'webp', quality: 60 },
    medium: { maxSize: 1024, format: 'webp', quality: 80 },
    high: { maxSize: 2048, format: 'png', quality: 90 }
  };

  const config = qualityConfigs[options.quality] || qualityConfigs.medium;

  console.log(chalk.cyan('\n  纹理优化建议:'));
  console.log(chalk.gray(`  - 质量级别: ${options.quality}`));
  console.log(chalk.gray(`  - 最大尺寸: ${config.maxSize}px`));
  console.log(chalk.gray(`  - 目标格式: ${config.format}`));

  let totalSize = 0;
  let optimizableCount = 0;

  for (const file of files) {
    const stat = await fs.stat(file);
    totalSize += stat.size;

    if (stat.size > 500 * 1024) {
      optimizableCount++;
      console.log(chalk.yellow(`  ⚠️ ${file} - ${(stat.size / 1024 / 1024).toFixed(1)} MB`));
    }
  }

  console.log(chalk.gray(`\n  总计: ${(totalSize / 1024 / 1024).toFixed(1)} MB`));
  console.log(chalk.gray(`  可优化: ${optimizableCount} 个文件`));

  if (!options.dryRun) {
    console.log(chalk.cyan('\n  生成优化脚本...'));

    const scriptContent = `
// 纹理优化脚本
// 使用 sharp 进行优化

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const config = {
  maxSize: ${config.maxSize},
  format: '${config.format}',
  quality: ${config.quality}
};

async function optimizeTexture(inputPath, outputPath) {
  let image = sharp(inputPath);
  const metadata = await image.metadata();

  // 调整大小
  if (metadata.width > config.maxSize || metadata.height > config.maxSize) {
    image = image.resize(config.maxSize, config.maxSize, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // 转换格式
  if (config.format === 'webp') {
    await image.webp({ quality: config.quality }).toFile(outputPath);
  } else if (config.format === 'png') {
    await image.png({ quality: config.quality }).toFile(outputPath);
  } else {
    await image.jpeg({ quality: config.quality }).toFile(outputPath);
  }

  console.log('Optimized:', inputPath, '->', outputPath);
}

// 使用示例
// optimizeTexture('input.png', 'output.webp');
`;

    const scriptPath = path.join(process.cwd(), 'optimize-textures.js');
    await fs.writeFile(scriptPath, scriptContent.trim());
    console.log(chalk.green(`  脚本已生成: ${scriptPath}`));
  }
}

/**
 * 优化代码
 */
async function optimizeCode(spinner, options) {
  spinner.text = '分析代码...';

  const files = await glob('**/*.js', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**', '*.config.js']
  });

  if (files.length === 0) {
    console.log(chalk.yellow('\n  未找到 JavaScript 文件'));
    return;
  }

  console.log(chalk.gray(`\n  找到 ${files.length} 个 JavaScript 文件`));

  // 分析常见问题
  const issues = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');

    // 检查问题模式
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 在循环中使用 new
      if (/for\s*\(.*\)[\s\S]*new\s+(THREE\.)?\w+/.test(line)) {
        issues.push({
          file,
          line: lineNum,
          type: 'perf',
          message: '循环中创建对象，可能导致 GC 压力'
        });
      }

      // 使用 .find() 在 Update 循环中
      if (/update|tick|loop/i.test(file) && /\.find\(|\.filter\(/.test(line)) {
        issues.push({
          file,
          line: lineNum,
          type: 'perf',
          message: 'Update 中使用数组查找，建议使用 Map'
        });
      }

      // console.log 在非调试代码中
      if (!/debug|dev|test/i.test(file) && /console\.log/.test(line)) {
        issues.push({
          file,
          line: lineNum,
          type: 'cleanup',
          message: '生产代码中的 console.log'
        });
      }
    }
  }

  console.log(chalk.cyan('\n  代码分析结果:'));

  if (issues.length === 0) {
    console.log(chalk.green('  ✓ 未发现明显问题'));
  } else {
    console.log(chalk.yellow(`  发现 ${issues.length} 个潜在问题:\n`));

    for (const issue of issues.slice(0, 10)) {
      const icon = issue.type === 'perf' ? '⚡' : '🧹';
      console.log(chalk.gray(`  ${icon} ${issue.file}:${issue.line}`));
      console.log(chalk.yellow(`     ${issue.message}`));
    }

    if (issues.length > 10) {
      console.log(chalk.gray(`\n  ... 还有 ${issues.length - 10} 个问题`));
    }
  }
}
