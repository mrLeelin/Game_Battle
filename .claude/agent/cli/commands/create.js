/**
 * create 命令
 *
 * 创建新的游戏项目或场景
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createCommand = new Command('create')
  .description('创建新的游戏项目或场景')
  .argument('[name]', '项目/场景名称')
  .option('-e, --engine <engine>', '游戏引擎 (threejs, babylon, playcanvas)', 'threejs')
  .option('-t, --template <template>', '项目模板 (basic, fps, tps, platformer)', 'basic')
  .option('--typescript', '使用 TypeScript', false)
  .option('--multiplayer', '包含多人游戏支持', false)
  .action(async (name, options) => {
    console.log(chalk.cyan('\n🎮 创建新的游戏项目\n'));

    // 如果没有提供名称，交互式询问
    if (!name) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '项目名称:',
          default: 'my-game',
          validate: (input) => {
            if (/^[a-z0-9-]+$/.test(input)) return true;
            return '项目名称只能包含小写字母、数字和连字符';
          }
        },
        {
          type: 'list',
          name: 'engine',
          message: '选择游戏引擎:',
          choices: [
            { name: 'Three.js (推荐)', value: 'threejs' },
            { name: 'Babylon.js', value: 'babylon' },
            { name: 'PlayCanvas', value: 'playcanvas' }
          ],
          default: 'threejs'
        },
        {
          type: 'list',
          name: 'template',
          message: '选择项目模板:',
          choices: [
            { name: '基础项目', value: 'basic' },
            { name: 'FPS 射击游戏', value: 'fps' },
            { name: '第三人称游戏', value: 'tps' },
            { name: '平台跳跃游戏', value: 'platformer' }
          ],
          default: 'basic'
        },
        {
          type: 'confirm',
          name: 'typescript',
          message: '使用 TypeScript?',
          default: false
        },
        {
          type: 'confirm',
          name: 'multiplayer',
          message: '包含多人游戏支持?',
          default: false
        }
      ]);

      name = answers.name;
      options = { ...options, ...answers };
    }

    const spinner = ora('创建项目结构...').start();

    try {
      const projectPath = path.resolve(process.cwd(), name);

      // 检查目录是否已存在
      if (await fs.pathExists(projectPath)) {
        spinner.fail(chalk.red(`目录 "${name}" 已存在`));
        return;
      }

      // 创建目录结构
      await createProjectStructure(projectPath, options);
      spinner.text = '生成配置文件...';

      // 生成配置文件
      await generateConfigFiles(projectPath, name, options);
      spinner.text = '生成游戏代码...';

      // 生成游戏代码
      await generateGameCode(projectPath, options);
      spinner.text = '安装依赖...';

      spinner.succeed(chalk.green('项目创建成功!'));

      // 显示后续步骤
      console.log(chalk.cyan('\n📝 后续步骤:\n'));
      console.log(chalk.gray(`  cd ${name}`));
      console.log(chalk.gray('  npm install'));
      console.log(chalk.gray('  npm run dev'));
      console.log('');

    } catch (error) {
      spinner.fail(chalk.red('创建失败: ' + error.message));
      console.error(error);
    }
  });

/**
 * 创建项目目录结构
 */
async function createProjectStructure(projectPath, options) {
  const dirs = [
    'src',
    'src/core',
    'src/game',
    'src/ui',
    'src/assets',
    'src/assets/models',
    'src/assets/textures',
    'src/assets/sounds',
    'public',
    'public/assets'
  ];

  if (options.multiplayer) {
    dirs.push('server', 'shared');
  }

  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectPath, dir));
  }
}

/**
 * 生成配置文件
 */
async function generateConfigFiles(projectPath, name, options) {
  // package.json
  const packageJson = {
    name,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      three: '^0.160.0'
    },
    devDependencies: {
      vite: '^5.0.0'
    }
  };

  if (options.engine === 'babylon') {
    delete packageJson.dependencies.three;
    packageJson.dependencies['@babylonjs/core'] = '^6.0.0';
  }

  if (options.multiplayer) {
    packageJson.dependencies['socket.io-client'] = '^4.7.0';
    packageJson.scripts.server = 'node server/index.js';
  }

  if (options.typescript) {
    packageJson.devDependencies.typescript = '^5.3.0';
    packageJson.devDependencies['@types/three'] = '^0.160.0';
  }

  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

  // vite.config.js
  const viteConfig = `
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist'
  },
  server: {
    port: 8080
  }
});
`.trim();

  await fs.writeFile(path.join(projectPath, 'vite.config.js'), viteConfig);

  // index.html
  const indexHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; }
    #game-container { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`.trim();

  await fs.writeFile(path.join(projectPath, 'index.html'), indexHtml);

  // .gitignore
  const gitignore = `
node_modules/
dist/
.DS_Store
*.log
`.trim();

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
}

/**
 * 生成游戏代码
 */
async function generateGameCode(projectPath, options) {
  const ext = options.typescript ? 'ts' : 'js';

  // main.js
  const mainCode = `
import { Game } from './game/Game.${ext === 'ts' ? '' : 'js'}';

const container = document.getElementById('game-container');
const game = new Game(container);
game.start();

// 开发模式热重载
if (import.meta.hot) {
  import.meta.hot.accept();
}
`.trim();

  await fs.writeFile(path.join(projectPath, `src/main.${ext}`), mainCode);

  // Game.js
  const gameCode = generateGameClass(options);
  await fs.writeFile(path.join(projectPath, `src/game/Game.${ext}`), gameCode);

  // Scene.js
  const sceneCode = generateSceneClass(options);
  await fs.writeFile(path.join(projectPath, `src/core/Scene.${ext}`), sceneCode);
}

/**
 * 生成 Game 类
 */
function generateGameClass(options) {
  return `
import * as THREE from 'three';
import { GameScene } from '../core/Scene.js';

export class Game {
  constructor(container) {
    this.container = container;
    this.scene = new GameScene(container);
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.scene.start();
    console.log('Game started');
  }

  stop() {
    this.isRunning = false;
    console.log('Game stopped');
  }

  dispose() {
    this.scene.dispose();
  }
}
`.trim();
}

/**
 * 生成 Scene 类
 */
function generateSceneClass(options) {
  return `
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class GameScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    // 光照
    this.setupLights();

    // 测试物体
    this.setupTestScene();

    // 响应式
    window.addEventListener('resize', () => this.onResize());
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  setupTestScene() {
    // 地面
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3d6b3d });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 测试立方体
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.y = 0.5;
    cube.castShadow = true;
    this.scene.add(cube);

    // 网格辅助线
    const gridHelper = new THREE.GridHelper(20, 20);
    this.scene.add(gridHelper);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(delta) {
    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    this.update(delta);
    this.render();
  }

  start() {
    this.animate();
  }

  dispose() {
    this.renderer.dispose();
    this.controls.dispose();
  }
}
`.trim();
}
