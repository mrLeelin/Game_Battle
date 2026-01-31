# 3D JS Game Development Agent

这是一个用于 3D JavaScript 游戏开发的 Claude Code Skill，支持 Three.js、Babylon.js、PlayCanvas 等主流引擎。

## 触发条件

当用户请求涉及以下关键词时自动激活：
- 3D游戏、三维游戏、游戏开发
- 场景创建、地形、天空盒、光照
- 模型加载、GLB、FBX、OBJ
- 动画、骨骼动画、动画状态机
- 物理引擎、碰撞检测、刚体
- 多人游戏、网络同步、Socket
- 材质、PBR、着色器、Shader
- 性能优化、LOD、批处理
- Three.js、Babylon.js、PlayCanvas

## 核心能力

### 🎬 场景搭建
- 创建基础3D场景（相机、渲染器、灯光）
- 生成程序化地形或加载高度图
- 配置天空盒（CubeMap、HDR、程序化天空）
- 设置多光源系统（平行光、点光源、聚光灯、环境光）

### 🧱 模型管理
- 加载多种格式模型（GLB/GLTF、FBX、OBJ）
- 模型优化（减面、合并网格、实例化）
- LOD（Level of Detail）层级配置
- 模型动态加载与卸载

### 🎭 动画系统
- 骨骼动画加载与播放
- 动画混合（Blend Tree）
- 动画状态机配置
- 程序化动画（IK、物理动画）

### 🔫 游戏逻辑
- 玩家控制器（FPS、TPS、俯视角）
- 碰撞检测与响应
- 物理模拟（刚体、关节、布料）
- AI 行为树与状态机

### 🌐 网络同步
- 实体状态同步（位置、旋转、动画）
- 客户端预测与服务器校正
- 插值与外推平滑
- 房间与匹配系统

### 🎨 材质与光照
- PBR 材质创建与配置
- 自定义着色器编写
- 实时阴影配置
- 光照烘焙与探针

### 📦 性能优化
- Draw Call 批处理
- 纹理压缩与 Atlas
- 内存管理与对象池
- 异步加载与流式加载

### 🐛 调试工具
- 性能统计（FPS、Draw Call、三角形数）
- 内存分析
- 网络延迟监控
- 可视化调试（碰撞体、路径、射线）

## 使用示例

### 创建基础场景
```
用户: 帮我创建一个 Three.js 基础场景
Agent: 将生成包含相机、渲染器、光照的完整场景代码
```

### 添加玩家控制器
```
用户: 添加一个 FPS 玩家控制器
Agent: 生成第一人称控制器，包含移动、跳跃、视角控制
```

### 网络同步
```
用户: 如何同步多个玩家的位置
Agent: 提供基于 Socket.io 的位置同步方案和代码
```

### 性能优化
```
用户: 场景太卡了，帮我优化
Agent: 分析性能瓶颈，提供优化建议和代码修改
```

## 代码模板

### Three.js 基础场景模板
```javascript
// 场景初始化
import * as THREE from 'three';

export class GameScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
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
    this.camera.position.set(0, 5, 10);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 光照
    this.setupLights();

    // 响应式
    window.addEventListener('resize', () => this.onResize());
  }

  setupLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // 平行光（模拟太阳）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update() {
    const delta = this.clock.getDelta();
    // 更新游戏逻辑
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.update();
    this.render();
  }

  start() {
    this.animate();
  }
}
```

### FPS 控制器模板
```javascript
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

export class FPSController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canJump = true;

    this.speed = 10;
    this.jumpForce = 10;

    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));

    this.controls.addEventListener('lock', () => {
      console.log('Pointer locked');
    });

    this.controls.addEventListener('unlock', () => {
      console.log('Pointer unlocked');
    });
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW': this.moveForward = true; break;
      case 'KeyS': this.moveBackward = true; break;
      case 'KeyA': this.moveLeft = true; break;
      case 'KeyD': this.moveRight = true; break;
      case 'Space':
        if (this.canJump) {
          this.velocity.y = this.jumpForce;
          this.canJump = false;
        }
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW': this.moveForward = false; break;
      case 'KeyS': this.moveBackward = false; break;
      case 'KeyA': this.moveLeft = false; break;
      case 'KeyD': this.moveRight = false; break;
    }
  }

  update(delta) {
    if (!this.controls.isLocked) return;

    // 减速
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;
    this.velocity.y -= 9.8 * delta; // 重力

    // 方向
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

    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);

    // 地面检测
    if (this.camera.position.y < 1.6) {
      this.velocity.y = 0;
      this.camera.position.y = 1.6;
      this.canJump = true;
    }
  }

  lock() {
    this.controls.lock();
  }

  unlock() {
    this.controls.unlock();
  }
}
```

### 网络同步模板
```javascript
import { io } from 'socket.io-client';

export class NetworkManager {
  constructor() {
    this.socket = null;
    this.players = new Map();
    this.localPlayer = null;
    this.interpolationDelay = 100; // ms
  }

  connect(serverUrl) {
    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('playerJoined', (data) => {
      this.addPlayer(data.id, data.position);
    });

    this.socket.on('playerLeft', (data) => {
      this.removePlayer(data.id);
    });

    this.socket.on('gameState', (state) => {
      this.updateGameState(state);
    });
  }

  addPlayer(id, position) {
    // 创建远程玩家对象
    const player = {
      id,
      position: { ...position },
      targetPosition: { ...position },
      lastUpdate: Date.now()
    };
    this.players.set(id, player);
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  updateGameState(state) {
    for (const playerData of state.players) {
      const player = this.players.get(playerData.id);
      if (player) {
        player.targetPosition = playerData.position;
        player.lastUpdate = Date.now();
      }
    }
  }

  sendPosition(position) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('updatePosition', {
        position,
        timestamp: Date.now()
      });
    }
  }

  // 插值更新远程玩家位置
  interpolatePlayers(delta) {
    const now = Date.now();

    for (const player of this.players.values()) {
      const t = Math.min(1, (now - player.lastUpdate) / this.interpolationDelay);

      player.position.x += (player.targetPosition.x - player.position.x) * t;
      player.position.y += (player.targetPosition.y - player.position.y) * t;
      player.position.z += (player.targetPosition.z - player.position.z) * t;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
```

## 引擎切换

Agent 默认使用 Three.js，但可以根据需求切换到其他引擎：

### Babylon.js
```
用户: 使用 Babylon.js 创建场景
Agent: 切换到 Babylon.js 模板
```

### PlayCanvas
```
用户: 用 PlayCanvas 开发
Agent: 切换到 PlayCanvas 模板
```

## 与项目集成

本 Agent 与 Battle 项目深度集成：
- 复用 `shared/` 目录的常量和事件定义
- 兼容现有的 Socket.io 网络架构
- 遵循项目的模块化设计原则
- 游戏逻辑放在 `client/games/` 和 `server/games/`

## 调试模式

启用调试模式获取更多信息：
```
用户: 开启调试模式
Agent: 启用详细日志、性能统计、可视化调试
```

## 注意事项

1. **性能优先**：生成的代码默认考虑性能优化
2. **模块化设计**：代码按功能模块拆分，便于维护
3. **类型安全**：推荐使用 TypeScript（可选）
4. **跨平台**：考虑桌面和移动端兼容性
5. **网络优化**：多人游戏代码包含延迟补偿
