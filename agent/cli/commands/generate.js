/**
 * generate 命令
 *
 * 生成游戏代码组件
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';

export const generateCommand = new Command('generate')
  .alias('g')
  .description('生成游戏代码组件')
  .argument('<component>', '组件类型 (player-controller, enemy-ai, weapon, vehicle, ui-panel)')
  .option('-t, --type <type>', '组件子类型')
  .option('-o, --output <path>', '输出路径', 'src/game')
  .option('--force', '覆盖已存在的文件', false)
  .action(async (component, options) => {
    console.log(chalk.cyan(`\n🔧 生成 ${component} 组件\n`));

    const spinner = ora('生成代码...').start();

    try {
      const code = await generateComponent(component, options);

      if (!code) {
        spinner.fail(chalk.red(`未知组件类型: ${component}`));
        return;
      }

      const outputPath = path.resolve(process.cwd(), options.output);
      await fs.ensureDir(outputPath);

      const filename = `${toPascalCase(component)}.js`;
      const filePath = path.join(outputPath, filename);

      if (await fs.pathExists(filePath) && !options.force) {
        spinner.fail(chalk.red(`文件已存在: ${filePath}`));
        console.log(chalk.gray('使用 --force 覆盖'));
        return;
      }

      await fs.writeFile(filePath, code);

      spinner.succeed(chalk.green(`组件已生成: ${filePath}`));

    } catch (error) {
      spinner.fail(chalk.red('生成失败: ' + error.message));
      console.error(error);
    }
  });

/**
 * 转换为 PascalCase
 */
function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * 生成组件代码
 */
async function generateComponent(component, options) {
  const generators = {
    'player-controller': generatePlayerController,
    'enemy-ai': generateEnemyAI,
    'weapon': generateWeapon,
    'vehicle': generateVehicle,
    'ui-panel': generateUIPanel
  };

  const generator = generators[component];
  if (!generator) return null;

  return generator(options);
}

/**
 * 生成玩家控制器
 */
function generatePlayerController(options) {
  const type = options.type || 'fps';

  if (type === 'fps') {
    return `
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

/**
 * FPS 玩家控制器
 */
export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.controls = new PointerLockControls(camera, domElement);

    // 移动状态
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canJump = true;

    // 参数
    this.speed = 10;
    this.jumpForce = 10;
    this.gravity = 30;
    this.playerHeight = 1.6;

    this.init();
  }

  init() {
    // 键盘事件
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));

    // 点击锁定鼠标
    this.domElement.addEventListener('click', () => {
      this.controls.lock();
    });

    // 锁定状态变化
    this.controls.addEventListener('lock', () => {
      console.log('Controls locked');
    });

    this.controls.addEventListener('unlock', () => {
      console.log('Controls unlocked');
    });
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
      case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
      case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
      case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
      case 'Space':
        if (this.canJump) {
          this.velocity.y = this.jumpForce;
          this.canJump = false;
        }
        break;
      case 'ShiftLeft':
        this.speed = 20; // 冲刺
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
      case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
      case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
      case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
      case 'ShiftLeft':
        this.speed = 10; // 恢复正常速度
        break;
    }
  }

  update(delta) {
    if (!this.controls.isLocked) return;

    // 阻尼减速
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    // 重力
    this.velocity.y -= this.gravity * delta;

    // 计算移动方向
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    // 移动
    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * this.speed * delta;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * this.speed * delta;
    }

    // 应用移动
    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);

    // 垂直位移
    this.camera.position.y += this.velocity.y * delta;

    // 地面检测
    if (this.camera.position.y < this.playerHeight) {
      this.velocity.y = 0;
      this.camera.position.y = this.playerHeight;
      this.canJump = true;
    }
  }

  getPosition() {
    return this.camera.position.clone();
  }

  getDirection() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.controls.dispose();
  }
}
`.trim();
  } else if (type === 'tps') {
    return `
import * as THREE from 'three';

/**
 * 第三人称玩家控制器
 */
export class PlayerController {
  constructor(model, camera) {
    this.model = model;
    this.camera = camera;

    // 移动状态
    this.velocity = new THREE.Vector3();
    this.moveDirection = new THREE.Vector3();
    this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false };

    // 参数
    this.walkSpeed = 5;
    this.runSpeed = 10;
    this.rotationSpeed = 8;
    this.jumpForce = 8;
    this.gravity = 20;

    // 相机跟随
    this.cameraOffset = new THREE.Vector3(0, 3, 8);
    this.cameraLookOffset = new THREE.Vector3(0, 1.5, 0);

    // 状态
    this.isGrounded = true;
    this.isRunning = false;

    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW': this.keys.w = true; break;
      case 'KeyS': this.keys.s = true; break;
      case 'KeyA': this.keys.a = true; break;
      case 'KeyD': this.keys.d = true; break;
      case 'Space': this.keys.space = true; break;
      case 'ShiftLeft': this.keys.shift = true; this.isRunning = true; break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW': this.keys.w = false; break;
      case 'KeyS': this.keys.s = false; break;
      case 'KeyA': this.keys.a = false; break;
      case 'KeyD': this.keys.d = false; break;
      case 'Space': this.keys.space = false; break;
      case 'ShiftLeft': this.keys.shift = false; this.isRunning = false; break;
    }
  }

  update(delta) {
    // 计算输入方向
    this.moveDirection.set(0, 0, 0);
    if (this.keys.w) this.moveDirection.z -= 1;
    if (this.keys.s) this.moveDirection.z += 1;
    if (this.keys.a) this.moveDirection.x -= 1;
    if (this.keys.d) this.moveDirection.x += 1;

    if (this.moveDirection.length() > 0) {
      this.moveDirection.normalize();

      // 相对于相机方向移动
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();

      const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
      this.moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

      // 旋转角色朝向移动方向
      const targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z);
      const currentRotation = this.model.rotation.y;
      const rotationDiff = targetRotation - currentRotation;

      // 平滑旋转
      this.model.rotation.y += rotationDiff * this.rotationSpeed * delta;

      // 移动速度
      const speed = this.isRunning ? this.runSpeed : this.walkSpeed;
      this.velocity.x = this.moveDirection.x * speed;
      this.velocity.z = this.moveDirection.z * speed;
    } else {
      // 减速
      this.velocity.x *= 0.9;
      this.velocity.z *= 0.9;
    }

    // 跳跃
    if (this.keys.space && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    // 重力
    this.velocity.y -= this.gravity * delta;

    // 应用移动
    this.model.position.add(this.velocity.clone().multiplyScalar(delta));

    // 地面检测
    if (this.model.position.y < 0) {
      this.model.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // 更新相机位置
    this.updateCamera(delta);
  }

  updateCamera(delta) {
    // 相机跟随
    const targetCameraPos = this.model.position.clone().add(this.cameraOffset);
    this.camera.position.lerp(targetCameraPos, 5 * delta);

    // 相机看向角色
    const lookTarget = this.model.position.clone().add(this.cameraLookOffset);
    this.camera.lookAt(lookTarget);
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
  }
}
`.trim();
  }

  return null;
}

/**
 * 生成敌人 AI
 */
function generateEnemyAI(options) {
  return `
import * as THREE from 'three';

/**
 * 敌人 AI 控制器
 */
export class EnemyAI {
  constructor(model, options = {}) {
    this.model = model;
    this.target = null;

    // AI 参数
    this.detectionRange = options.detectionRange || 20;
    this.attackRange = options.attackRange || 2;
    this.moveSpeed = options.moveSpeed || 3;
    this.rotationSpeed = options.rotationSpeed || 5;
    this.attackCooldown = options.attackCooldown || 1;

    // 状态
    this.state = 'idle'; // idle, patrol, chase, attack
    this.health = options.health || 100;
    this.lastAttackTime = 0;

    // 巡逻路径
    this.patrolPoints = options.patrolPoints || [];
    this.currentPatrolIndex = 0;
    this.waitTimer = 0;
  }

  /**
   * 设置追踪目标
   */
  setTarget(target) {
    this.target = target;
  }

  /**
   * 设置巡逻点
   */
  setPatrolPoints(points) {
    this.patrolPoints = points;
    this.currentPatrolIndex = 0;
  }

  /**
   * 更新 AI
   */
  update(delta) {
    if (this.health <= 0) return;

    // 检测目标
    const distanceToTarget = this.target
      ? this.model.position.distanceTo(this.target.position)
      : Infinity;

    // 状态转换
    if (distanceToTarget <= this.attackRange) {
      this.state = 'attack';
    } else if (distanceToTarget <= this.detectionRange) {
      this.state = 'chase';
    } else if (this.patrolPoints.length > 0) {
      this.state = 'patrol';
    } else {
      this.state = 'idle';
    }

    // 执行状态行为
    switch (this.state) {
      case 'idle':
        this.doIdle(delta);
        break;
      case 'patrol':
        this.doPatrol(delta);
        break;
      case 'chase':
        this.doChase(delta);
        break;
      case 'attack':
        this.doAttack(delta);
        break;
    }
  }

  /**
   * 空闲状态
   */
  doIdle(delta) {
    // 站立等待
  }

  /**
   * 巡逻状态
   */
  doPatrol(delta) {
    if (this.patrolPoints.length === 0) return;

    const targetPoint = this.patrolPoints[this.currentPatrolIndex];
    const distance = this.model.position.distanceTo(targetPoint);

    if (distance < 0.5) {
      // 到达巡逻点，等待后移动到下一个
      this.waitTimer += delta;
      if (this.waitTimer >= 2) {
        this.waitTimer = 0;
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      }
    } else {
      // 移动到巡逻点
      this.moveTowards(targetPoint, delta);
    }
  }

  /**
   * 追击状态
   */
  doChase(delta) {
    if (!this.target) return;
    this.moveTowards(this.target.position, delta);
  }

  /**
   * 攻击状态
   */
  doAttack(delta) {
    if (!this.target) return;

    // 面向目标
    this.lookAt(this.target.position, delta);

    // 攻击冷却
    const now = performance.now() / 1000;
    if (now - this.lastAttackTime >= this.attackCooldown) {
      this.performAttack();
      this.lastAttackTime = now;
    }
  }

  /**
   * 移动到目标位置
   */
  moveTowards(targetPosition, delta) {
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, this.model.position)
      .normalize();

    // 忽略 Y 轴
    direction.y = 0;

    // 移动
    this.model.position.add(direction.multiplyScalar(this.moveSpeed * delta));

    // 面向移动方向
    this.lookAt(targetPosition, delta);
  }

  /**
   * 面向目标
   */
  lookAt(targetPosition, delta) {
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, this.model.position);
    direction.y = 0;

    if (direction.length() > 0.1) {
      const targetRotation = Math.atan2(direction.x, direction.z);
      const currentRotation = this.model.rotation.y;

      // 平滑旋转
      let rotationDiff = targetRotation - currentRotation;

      // 处理角度跨越
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

      this.model.rotation.y += rotationDiff * this.rotationSpeed * delta;
    }
  }

  /**
   * 执行攻击
   */
  performAttack() {
    console.log('Enemy attacks!');
    // 触发攻击事件或动画
    // this.onAttack?.();
  }

  /**
   * 受到伤害
   */
  takeDamage(amount) {
    this.health -= amount;
    console.log(\`Enemy takes \${amount} damage, health: \${this.health}\`);

    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * 死亡
   */
  die() {
    console.log('Enemy died');
    this.state = 'dead';
    // this.onDeath?.();
  }

  /**
   * 获取当前状态
   */
  getState() {
    return this.state;
  }
}
`.trim();
}

/**
 * 生成武器
 */
function generateWeapon(options) {
  return `
import * as THREE from 'three';

/**
 * 武器系统
 */
export class Weapon {
  constructor(scene, camera, options = {}) {
    this.scene = scene;
    this.camera = camera;

    // 武器参数
    this.name = options.name || 'Weapon';
    this.damage = options.damage || 10;
    this.fireRate = options.fireRate || 0.1;  // 射击间隔（秒）
    this.range = options.range || 100;
    this.ammo = options.ammo || 30;
    this.maxAmmo = options.maxAmmo || 30;
    this.reloadTime = options.reloadTime || 2;

    // 状态
    this.lastFireTime = 0;
    this.isReloading = false;
    this.reloadProgress = 0;

    // 射线检测
    this.raycaster = new THREE.Raycaster();

    // 武器模型
    this.model = null;

    // 回调
    this.onFire = null;
    this.onHit = null;
    this.onReload = null;
    this.onEmpty = null;
  }

  /**
   * 设置武器模型
   */
  setModel(model) {
    this.model = model;
  }

  /**
   * 开火
   */
  fire() {
    const now = performance.now() / 1000;

    // 检查冷却和弹药
    if (now - this.lastFireTime < this.fireRate) return false;
    if (this.isReloading) return false;
    if (this.ammo <= 0) {
      this.onEmpty?.();
      return false;
    }

    this.lastFireTime = now;
    this.ammo--;

    // 射线检测
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    let hitResult = null;

    for (const intersect of intersects) {
      // 跳过自身和 UI 元素
      if (intersect.object.userData.isWeapon) continue;
      if (intersect.object.userData.isUI) continue;

      if (intersect.distance <= this.range) {
        hitResult = {
          object: intersect.object,
          point: intersect.point,
          distance: intersect.distance,
          normal: intersect.face?.normal
        };
        break;
      }
    }

    // 触发开火回调
    this.onFire?.({
      ammo: this.ammo,
      maxAmmo: this.maxAmmo
    });

    // 如果命中
    if (hitResult) {
      this.onHit?.({
        ...hitResult,
        damage: this.damage
      });

      // 如果目标有 takeDamage 方法
      if (hitResult.object.userData.entity?.takeDamage) {
        hitResult.object.userData.entity.takeDamage(this.damage);
      }
    }

    return true;
  }

  /**
   * 开始换弹
   */
  reload() {
    if (this.isReloading) return;
    if (this.ammo >= this.maxAmmo) return;

    this.isReloading = true;
    this.reloadProgress = 0;

    this.onReload?.({ started: true });
  }

  /**
   * 更新
   */
  update(delta) {
    // 换弹进度
    if (this.isReloading) {
      this.reloadProgress += delta / this.reloadTime;

      if (this.reloadProgress >= 1) {
        this.ammo = this.maxAmmo;
        this.isReloading = false;
        this.reloadProgress = 0;

        this.onReload?.({ completed: true, ammo: this.ammo });
      }
    }

    // 更新武器模型位置（如果有）
    if (this.model) {
      // 武器跟随相机
      this.model.position.copy(this.camera.position);
      this.model.quaternion.copy(this.camera.quaternion);

      // 偏移到手持位置
      const offset = new THREE.Vector3(0.3, -0.3, -0.5);
      offset.applyQuaternion(this.camera.quaternion);
      this.model.position.add(offset);
    }
  }

  /**
   * 获取弹药信息
   */
  getAmmoInfo() {
    return {
      current: this.ammo,
      max: this.maxAmmo,
      isReloading: this.isReloading,
      reloadProgress: this.reloadProgress
    };
  }
}
`.trim();
}

/**
 * 生成载具
 */
function generateVehicle(options) {
  return `
import * as THREE from 'three';

/**
 * 载具控制器
 */
export class Vehicle {
  constructor(model, options = {}) {
    this.model = model;

    // 物理参数
    this.maxSpeed = options.maxSpeed || 50;
    this.acceleration = options.acceleration || 20;
    this.brakeForce = options.brakeForce || 30;
    this.turnSpeed = options.turnSpeed || 2;
    this.friction = options.friction || 0.98;

    // 当前状态
    this.speed = 0;
    this.steeringAngle = 0;
    this.velocity = new THREE.Vector3();

    // 输入状态
    this.input = {
      throttle: 0,
      brake: 0,
      steering: 0
    };

    // 车轮（如果有）
    this.wheels = [];

    // 乘客
    this.driver = null;
  }

  /**
   * 设置车轮
   */
  setWheels(wheels) {
    this.wheels = wheels;
  }

  /**
   * 进入载具
   */
  enter(player) {
    if (this.driver) return false;
    this.driver = player;
    // 隐藏玩家模型，启用载具控制
    return true;
  }

  /**
   * 离开载具
   */
  exit() {
    const driver = this.driver;
    this.driver = null;
    return driver;
  }

  /**
   * 设置输入
   */
  setInput(throttle, brake, steering) {
    this.input.throttle = throttle;
    this.input.brake = brake;
    this.input.steering = steering;
  }

  /**
   * 更新
   */
  update(delta) {
    // 加速
    if (this.input.throttle > 0) {
      this.speed += this.acceleration * this.input.throttle * delta;
    }

    // 刹车
    if (this.input.brake > 0) {
      this.speed -= this.brakeForce * this.input.brake * delta;
    }

    // 速度限制
    this.speed = THREE.MathUtils.clamp(this.speed, -this.maxSpeed * 0.3, this.maxSpeed);

    // 摩擦力
    this.speed *= this.friction;

    // 转向
    if (Math.abs(this.speed) > 0.1) {
      const turnAmount = this.input.steering * this.turnSpeed * delta;
      // 速度越快转向越小
      const turnFactor = 1 - (Math.abs(this.speed) / this.maxSpeed) * 0.5;
      this.model.rotation.y -= turnAmount * turnFactor * Math.sign(this.speed);
    }

    // 计算方向
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.model.quaternion);

    // 移动
    this.velocity.copy(direction).multiplyScalar(this.speed * delta);
    this.model.position.add(this.velocity);

    // 更新车轮旋转
    this.updateWheels(delta);
  }

  /**
   * 更新车轮
   */
  updateWheels(delta) {
    const wheelRotation = this.speed * delta * 0.5;

    for (const wheel of this.wheels) {
      // 滚动
      wheel.rotation.x += wheelRotation;

      // 前轮转向
      if (wheel.userData.isFrontWheel) {
        wheel.rotation.y = this.input.steering * 0.3;
      }
    }
  }

  /**
   * 获取状态
   */
  getState() {
    return {
      position: this.model.position.clone(),
      rotation: this.model.rotation.y,
      speed: this.speed,
      hasDriver: !!this.driver
    };
  }
}
`.trim();
}

/**
 * 生成 UI 面板
 */
function generateUIPanel(options) {
  return `
/**
 * 游戏 UI 面板
 */
export class UIPanel {
  constructor(options = {}) {
    this.id = options.id || 'ui-panel';
    this.visible = true;

    this.container = null;
    this.elements = new Map();

    this.init();
  }

  init() {
    // 创建容器
    this.container = document.createElement('div');
    this.container.id = this.id;
    this.container.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: 'Arial', sans-serif;
      z-index: 100;
    \`;
    document.body.appendChild(this.container);

    // 默认 UI 元素
    this.createHealthBar();
    this.createAmmoDisplay();
    this.createCrosshair();
    this.createMessageArea();
  }

  /**
   * 创建血条
   */
  createHealthBar() {
    const healthBar = document.createElement('div');
    healthBar.id = 'health-bar';
    healthBar.style.cssText = \`
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: 200px;
      height: 20px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid #fff;
      border-radius: 3px;
      overflow: hidden;
    \`;

    const healthFill = document.createElement('div');
    healthFill.id = 'health-fill';
    healthFill.style.cssText = \`
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, #ff0000, #ff6600);
      transition: width 0.3s;
    \`;

    healthBar.appendChild(healthFill);
    this.container.appendChild(healthBar);
    this.elements.set('healthBar', healthBar);
    this.elements.set('healthFill', healthFill);
  }

  /**
   * 创建弹药显示
   */
  createAmmoDisplay() {
    const ammoDisplay = document.createElement('div');
    ammoDisplay.id = 'ammo-display';
    ammoDisplay.style.cssText = \`
      position: absolute;
      bottom: 20px;
      right: 20px;
      color: #fff;
      font-size: 24px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    \`;
    ammoDisplay.innerHTML = '<span id="ammo-current">30</span> / <span id="ammo-max">30</span>';

    this.container.appendChild(ammoDisplay);
    this.elements.set('ammoDisplay', ammoDisplay);
  }

  /**
   * 创建准心
   */
  createCrosshair() {
    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
    crosshair.style.cssText = \`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
    \`;

    // 十字线
    crosshair.innerHTML = \`
      <div style="position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: #fff; transform: translateY(-50%);"></div>
      <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: #fff; transform: translateX(-50%);"></div>
    \`;

    this.container.appendChild(crosshair);
    this.elements.set('crosshair', crosshair);
  }

  /**
   * 创建消息区域
   */
  createMessageArea() {
    const messageArea = document.createElement('div');
    messageArea.id = 'message-area';
    messageArea.style.cssText = \`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-size: 32px;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s;
    \`;

    this.container.appendChild(messageArea);
    this.elements.set('messageArea', messageArea);
  }

  /**
   * 更新血量显示
   */
  updateHealth(current, max = 100) {
    const fill = this.elements.get('healthFill');
    if (fill) {
      const percentage = Math.max(0, Math.min(100, (current / max) * 100));
      fill.style.width = percentage + '%';

      // 低血量变红
      if (percentage < 30) {
        fill.style.background = '#ff0000';
      } else if (percentage < 60) {
        fill.style.background = 'linear-gradient(to right, #ff0000, #ff6600)';
      } else {
        fill.style.background = 'linear-gradient(to right, #00ff00, #88ff00)';
      }
    }
  }

  /**
   * 更新弹药显示
   */
  updateAmmo(current, max) {
    const display = this.elements.get('ammoDisplay');
    if (display) {
      display.querySelector('#ammo-current').textContent = current;
      display.querySelector('#ammo-max').textContent = max;

      // 低弹药变红
      if (current <= 5) {
        display.style.color = '#ff0000';
      } else {
        display.style.color = '#fff';
      }
    }
  }

  /**
   * 显示消息
   */
  showMessage(text, duration = 2000) {
    const messageArea = this.elements.get('messageArea');
    if (messageArea) {
      messageArea.textContent = text;
      messageArea.style.opacity = '1';

      setTimeout(() => {
        messageArea.style.opacity = '0';
      }, duration);
    }
  }

  /**
   * 显示/隐藏
   */
  toggle() {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';
  }

  /**
   * 销毁
   */
  dispose() {
    this.container.parentNode?.removeChild(this.container);
  }
}
`.trim();
}
