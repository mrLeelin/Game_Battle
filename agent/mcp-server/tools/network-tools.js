/**
 * 网络工具集
 *
 * 提供多人游戏网络同步、状态管理相关的工具
 * 与 Battle 项目的 Socket.io 架构兼容
 */

import { createTool, ParamTypes, ToolCategories, generateId } from './tool-base.js';

/**
 * 同步 Transform
 */
const syncTransform = createTool(
  'sync_transform',
  '同步物体的位置、旋转、缩放',
  ToolCategories.NETWORK,
  {
    syncPosition: { type: ParamTypes.BOOLEAN, required: false, description: '同步位置' },
    syncRotation: { type: ParamTypes.BOOLEAN, required: false, description: '同步旋转' },
    syncScale: { type: ParamTypes.BOOLEAN, required: false, description: '同步缩放' },
    interpolation: { type: ParamTypes.BOOLEAN, required: false, description: '启用插值' },
    sendRate: { type: ParamTypes.NUMBER, required: false, description: '发送频率（Hz）' }
  },
  async (params) => {
    const {
      syncPosition = true,
      syncRotation = true,
      syncScale = false,
      interpolation = true,
      sendRate = 20
    } = params;

    const code = `
// Transform 网络同步组件
// 兼容 Battle 项目的 Socket.io 架构

import { Events } from '../../shared/Events.js';

/**
 * 网络 Transform 同步
 */
class NetworkTransform {
  constructor(gameObject, socket, options = {}) {
    this.gameObject = gameObject;
    this.socket = socket;
    this.isLocal = options.isLocal || false;
    this.networkId = options.networkId || gameObject.uuid;

    // 同步选项
    this.syncPosition = ${syncPosition};
    this.syncRotation = ${syncRotation};
    this.syncScale = ${syncScale};

    // 插值
    this.interpolation = ${interpolation};
    this.interpolationSpeed = options.interpolationSpeed || 10;

    // 发送频率控制
    this.sendRate = ${sendRate}; // Hz
    this.sendInterval = 1000 / this.sendRate;
    this.lastSendTime = 0;

    // 目标状态（用于插值）
    this.targetPosition = gameObject.position.clone();
    this.targetQuaternion = gameObject.quaternion.clone();
    this.targetScale = gameObject.scale.clone();

    // 历史状态（用于外推）
    this.stateBuffer = [];
    this.bufferSize = 10;

    // 网络延迟估算
    this.latency = 50; // ms
    this.serverTimeOffset = 0;

    if (!this.isLocal) {
      this.setupListeners();
    }
  }

  /**
   * 设置网络监听
   */
  setupListeners() {
    this.socket.on('transformUpdate', (data) => {
      if (data.networkId === this.networkId) {
        this.onReceiveTransform(data);
      }
    });
  }

  /**
   * 接收 Transform 更新
   */
  onReceiveTransform(data) {
    const state = {
      timestamp: data.timestamp,
      position: data.position ? new THREE.Vector3(data.position.x, data.position.y, data.position.z) : null,
      quaternion: data.rotation ? new THREE.Quaternion(data.rotation.x, data.rotation.y, data.rotation.z, data.rotation.w) : null,
      scale: data.scale ? new THREE.Vector3(data.scale.x, data.scale.y, data.scale.z) : null
    };

    // 添加到状态缓冲
    this.stateBuffer.push(state);
    if (this.stateBuffer.length > this.bufferSize) {
      this.stateBuffer.shift();
    }

    // 更新目标状态
    if (state.position) this.targetPosition.copy(state.position);
    if (state.quaternion) this.targetQuaternion.copy(state.quaternion);
    if (state.scale) this.targetScale.copy(state.scale);
  }

  /**
   * 发送 Transform 更新（本地玩家调用）
   */
  sendTransform() {
    const now = Date.now();
    if (now - this.lastSendTime < this.sendInterval) return;
    this.lastSendTime = now;

    const data = {
      networkId: this.networkId,
      timestamp: now
    };

    if (this.syncPosition) {
      data.position = {
        x: this.gameObject.position.x,
        y: this.gameObject.position.y,
        z: this.gameObject.position.z
      };
    }

    if (this.syncRotation) {
      data.rotation = {
        x: this.gameObject.quaternion.x,
        y: this.gameObject.quaternion.y,
        z: this.gameObject.quaternion.z,
        w: this.gameObject.quaternion.w
      };
    }

    if (this.syncScale) {
      data.scale = {
        x: this.gameObject.scale.x,
        y: this.gameObject.scale.y,
        z: this.gameObject.scale.z
      };
    }

    this.socket.emit('transformUpdate', data);
  }

  /**
   * 更新（每帧调用）
   */
  update(delta) {
    if (this.isLocal) {
      // 本地玩家：发送状态
      this.sendTransform();
    } else {
      // 远程玩家：插值到目标状态
      if (this.interpolation) {
        const t = Math.min(1, this.interpolationSpeed * delta);

        if (this.syncPosition) {
          this.gameObject.position.lerp(this.targetPosition, t);
        }

        if (this.syncRotation) {
          this.gameObject.quaternion.slerp(this.targetQuaternion, t);
        }

        if (this.syncScale) {
          this.gameObject.scale.lerp(this.targetScale, t);
        }
      } else {
        // 直接设置
        if (this.syncPosition) this.gameObject.position.copy(this.targetPosition);
        if (this.syncRotation) this.gameObject.quaternion.copy(this.targetQuaternion);
        if (this.syncScale) this.gameObject.scale.copy(this.targetScale);
      }
    }
  }

  /**
   * 清理
   */
  dispose() {
    this.socket.off('transformUpdate');
  }
}

// 使用示例
/*
// 本地玩家
const localPlayerTransform = new NetworkTransform(localPlayer, socket, {
  isLocal: true,
  networkId: 'player_' + socket.id
});

// 远程玩家
const remotePlayerTransform = new NetworkTransform(remotePlayer, socket, {
  isLocal: false,
  networkId: 'player_' + remotePlayerId
});

// 在 update 中
localPlayerTransform.update(delta);
remotePlayerTransform.update(delta);
*/

export { NetworkTransform };
`;

    return {
      code: code.trim(),
      description: `创建了 Transform 网络同步组件，发送频率 ${sendRate}Hz`
    };
  }
);

/**
 * 同步游戏状态
 */
const syncState = createTool(
  'sync_state',
  '同步游戏状态（生命值、分数等）',
  ToolCategories.NETWORK,
  {
    stateKeys: { type: ParamTypes.ARRAY, required: true, description: '需要同步的状态键' },
    syncMode: { type: ParamTypes.STRING, required: false, enum: ['reliable', 'unreliable', 'delta'], description: '同步模式' }
  },
  async (params) => {
    const {
      stateKeys = ['health', 'score', 'ammo'],
      syncMode = 'reliable'
    } = params;

    const code = `
// 游戏状态网络同步

import { Events } from '../../shared/Events.js';

/**
 * 网络状态同步器
 */
class NetworkState {
  constructor(socket, options = {}) {
    this.socket = socket;
    this.isHost = options.isHost || false;
    this.playerId = options.playerId || socket.id;

    // 本地状态
    this.localState = {
      ${stateKeys.map(key => `${key}: 0`).join(',\n      ')}
    };

    // 远程玩家状态
    this.remoteStates = new Map();

    // 状态变更回调
    this.onStateChange = new Map();

    // 同步模式
    this.syncMode = '${syncMode}';

    // Delta 同步：上次发送的状态
    this.lastSentState = {};

    this.setupListeners();
  }

  /**
   * 设置监听器
   */
  setupListeners() {
    // 接收状态更新
    this.socket.on('stateUpdate', (data) => {
      this.onReceiveState(data);
    });

    // 接收完整状态同步（用于新加入玩家）
    this.socket.on('fullStateSync', (data) => {
      for (const [playerId, state] of Object.entries(data.states)) {
        if (playerId !== this.playerId) {
          this.remoteStates.set(playerId, state);
        }
      }
    });

    // 玩家离开时清理
    this.socket.on('playerLeft', (data) => {
      this.remoteStates.delete(data.playerId);
    });
  }

  /**
   * 接收状态更新
   */
  onReceiveState(data) {
    const { playerId, state, timestamp } = data;

    if (playerId === this.playerId) return;

    // 获取或创建远程状态
    let remoteState = this.remoteStates.get(playerId);
    if (!remoteState) {
      remoteState = {};
      this.remoteStates.set(playerId, remoteState);
    }

    // 更新状态
    for (const [key, value] of Object.entries(state)) {
      const oldValue = remoteState[key];
      remoteState[key] = value;

      // 触发变更回调
      if (oldValue !== value) {
        const callbacks = this.onStateChange.get(key);
        if (callbacks) {
          for (const callback of callbacks) {
            callback(playerId, key, value, oldValue);
          }
        }
      }
    }
  }

  /**
   * 设置本地状态
   */
  set(key, value) {
    const oldValue = this.localState[key];
    this.localState[key] = value;

    // 发送更新
    this.sendState(key, value);

    // 触发本地回调
    if (oldValue !== value) {
      const callbacks = this.onStateChange.get(key);
      if (callbacks) {
        for (const callback of callbacks) {
          callback(this.playerId, key, value, oldValue);
        }
      }
    }
  }

  /**
   * 获取本地状态
   */
  get(key) {
    return this.localState[key];
  }

  /**
   * 获取远程玩家状态
   */
  getRemote(playerId, key) {
    const state = this.remoteStates.get(playerId);
    return state ? state[key] : undefined;
  }

  /**
   * 发送状态更新
   */
  sendState(key, value) {
    const data = {
      playerId: this.playerId,
      timestamp: Date.now()
    };

    ${syncMode === 'delta' ? `
    // Delta 模式：只发送变化的值
    if (this.lastSentState[key] !== value) {
      data.state = { [key]: value };
      this.lastSentState[key] = value;
      this.socket.emit('stateUpdate', data);
    }
    ` : `
    // 完整模式：发送指定的键值
    data.state = { [key]: value };
    this.socket.emit('stateUpdate', data);
    `}
  }

  /**
   * 发送完整状态
   */
  sendFullState() {
    this.socket.emit('stateUpdate', {
      playerId: this.playerId,
      state: { ...this.localState },
      timestamp: Date.now(),
      isFull: true
    });
  }

  /**
   * 订阅状态变更
   */
  subscribe(key, callback) {
    if (!this.onStateChange.has(key)) {
      this.onStateChange.set(key, []);
    }
    this.onStateChange.get(key).push(callback);
  }

  /**
   * 取消订阅
   */
  unsubscribe(key, callback) {
    const callbacks = this.onStateChange.get(key);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 获取所有远程状态
   */
  getAllRemoteStates() {
    return new Map(this.remoteStates);
  }
}

// 使用示例
/*
const networkState = new NetworkState(socket, { playerId: myId });

// 设置状态
networkState.set('health', 100);
networkState.set('score', 50);

// 订阅状态变更
networkState.subscribe('health', (playerId, key, newValue, oldValue) => {
  console.log(\`Player \${playerId} health: \${oldValue} -> \${newValue}\`);
  if (newValue <= 0) {
    console.log(\`Player \${playerId} died!\`);
  }
});

// 获取状态
const myHealth = networkState.get('health');
const enemyHealth = networkState.getRemote(enemyId, 'health');
*/

export { NetworkState };
`;

    return {
      code: code.trim(),
      description: `创建了游戏状态同步器，同步 ${stateKeys.join(', ')}`
    };
  }
);

/**
 * 配置插值平滑
 */
const setupInterpolation = createTool(
  'setup_interpolation',
  '配置网络插值和外推',
  ToolCategories.NETWORK,
  {
    method: { type: ParamTypes.STRING, required: false, enum: ['lerp', 'hermite', 'catmullrom'], description: '插值方法' },
    bufferTime: { type: ParamTypes.NUMBER, required: false, description: '缓冲时间（ms）' },
    extrapolation: { type: ParamTypes.BOOLEAN, required: false, description: '启用外推' }
  },
  async (params) => {
    const {
      method = 'lerp',
      bufferTime = 100,
      extrapolation = true
    } = params;

    const code = `
// 高级网络插值系统

/**
 * 网络插值器
 * 使用状态缓冲和时间回溯实现平滑的网络同步
 */
class NetworkInterpolator {
  constructor(options = {}) {
    // 插值方法
    this.method = '${method}';

    // 缓冲时间（渲染延迟）
    this.bufferTime = ${bufferTime};

    // 启用外推
    this.extrapolation = ${extrapolation};
    this.maxExtrapolationTime = 200; // 最大外推时间（ms）

    // 状态快照缓冲
    this.snapshots = [];
    this.maxSnapshots = 20;

    // 服务器时间同步
    this.serverTimeOffset = 0;
    this.lastServerTime = 0;
  }

  /**
   * 添加状态快照
   */
  addSnapshot(snapshot) {
    // 确保有时间戳
    if (!snapshot.timestamp) {
      snapshot.timestamp = Date.now() + this.serverTimeOffset;
    }

    // 按时间顺序插入
    let inserted = false;
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].timestamp < snapshot.timestamp) {
        this.snapshots.splice(i + 1, 0, snapshot);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.snapshots.unshift(snapshot);
    }

    // 限制缓冲大小
    while (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * 获取插值后的状态
   */
  getInterpolatedState(currentTime = Date.now()) {
    const renderTime = currentTime - this.bufferTime;

    // 查找两个相邻的快照
    let before = null;
    let after = null;

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (this.snapshots[i].timestamp <= renderTime &&
          this.snapshots[i + 1].timestamp >= renderTime) {
        before = this.snapshots[i];
        after = this.snapshots[i + 1];
        break;
      }
    }

    // 如果找到两个快照，进行插值
    if (before && after) {
      const t = (renderTime - before.timestamp) / (after.timestamp - before.timestamp);
      return this.interpolate(before, after, t);
    }

    // 外推
    if (this.extrapolation && this.snapshots.length >= 2) {
      const latest = this.snapshots[this.snapshots.length - 1];
      const previous = this.snapshots[this.snapshots.length - 2];

      const timeSinceLatest = currentTime - latest.timestamp;

      if (timeSinceLatest > 0 && timeSinceLatest < this.maxExtrapolationTime) {
        return this.extrapolate(previous, latest, timeSinceLatest);
      }
    }

    // 返回最新快照
    return this.snapshots.length > 0
      ? this.snapshots[this.snapshots.length - 1]
      : null;
  }

  /**
   * 插值计算
   */
  interpolate(before, after, t) {
    const result = { timestamp: before.timestamp + (after.timestamp - before.timestamp) * t };

    // 位置插值
    if (before.position && after.position) {
      switch (this.method) {
        case 'lerp':
          result.position = {
            x: before.position.x + (after.position.x - before.position.x) * t,
            y: before.position.y + (after.position.y - before.position.y) * t,
            z: before.position.z + (after.position.z - before.position.z) * t
          };
          break;

        case 'hermite':
          result.position = this.hermiteInterpolate(before, after, t);
          break;

        case 'catmullrom':
          result.position = this.catmullRomInterpolate(t);
          break;
      }
    }

    // 旋转插值（始终使用 slerp）
    if (before.rotation && after.rotation) {
      result.rotation = this.slerpQuaternion(before.rotation, after.rotation, t);
    }

    return result;
  }

  /**
   * Hermite 插值（使用速度信息）
   */
  hermiteInterpolate(before, after, t) {
    const t2 = t * t;
    const t3 = t2 * t;

    const h1 = 2 * t3 - 3 * t2 + 1;
    const h2 = -2 * t3 + 3 * t2;
    const h3 = t3 - 2 * t2 + t;
    const h4 = t3 - t2;

    const dt = (after.timestamp - before.timestamp) / 1000;

    return {
      x: h1 * before.position.x + h2 * after.position.x +
         h3 * (before.velocity?.x || 0) * dt + h4 * (after.velocity?.x || 0) * dt,
      y: h1 * before.position.y + h2 * after.position.y +
         h3 * (before.velocity?.y || 0) * dt + h4 * (after.velocity?.y || 0) * dt,
      z: h1 * before.position.z + h2 * after.position.z +
         h3 * (before.velocity?.z || 0) * dt + h4 * (after.velocity?.z || 0) * dt
    };
  }

  /**
   * Catmull-Rom 样条插值
   */
  catmullRomInterpolate(t) {
    if (this.snapshots.length < 4) {
      return this.snapshots[this.snapshots.length - 1]?.position || { x: 0, y: 0, z: 0 };
    }

    const n = this.snapshots.length;
    const p0 = this.snapshots[n - 4].position;
    const p1 = this.snapshots[n - 3].position;
    const p2 = this.snapshots[n - 2].position;
    const p3 = this.snapshots[n - 1].position;

    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t +
         (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
         (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t +
         (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
         (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      z: 0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t +
         (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
         (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3)
    };
  }

  /**
   * 四元数球面线性插值
   */
  slerpQuaternion(a, b, t) {
    let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

    if (dot < 0) {
      b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
      dot = -dot;
    }

    if (dot > 0.9995) {
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
        w: a.w + (b.w - a.w) * t
      };
    }

    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);

    const wa = Math.sin((1 - t) * theta) / sinTheta;
    const wb = Math.sin(t * theta) / sinTheta;

    return {
      x: a.x * wa + b.x * wb,
      y: a.y * wa + b.y * wb,
      z: a.z * wa + b.z * wb,
      w: a.w * wa + b.w * wb
    };
  }

  /**
   * 外推
   */
  extrapolate(before, after, timeDelta) {
    const dt = (after.timestamp - before.timestamp) / 1000;
    const extrapolateTime = timeDelta / 1000;

    const velocity = {
      x: (after.position.x - before.position.x) / dt,
      y: (after.position.y - before.position.y) / dt,
      z: (after.position.z - before.position.z) / dt
    };

    return {
      timestamp: after.timestamp + timeDelta,
      position: {
        x: after.position.x + velocity.x * extrapolateTime,
        y: after.position.y + velocity.y * extrapolateTime,
        z: after.position.z + velocity.z * extrapolateTime
      },
      rotation: after.rotation
    };
  }

  /**
   * 同步服务器时间
   */
  syncServerTime(serverTime, rtt) {
    this.serverTimeOffset = serverTime - Date.now() + rtt / 2;
  }

  /**
   * 清空缓冲
   */
  clear() {
    this.snapshots = [];
  }
}

// 使用示例
/*
const interpolator = new NetworkInterpolator({
  method: '${method}',
  bufferTime: ${bufferTime},
  extrapolation: ${extrapolation}
});

// 接收网络更新
socket.on('entityUpdate', (data) => {
  interpolator.addSnapshot({
    timestamp: data.timestamp,
    position: data.position,
    rotation: data.rotation
  });
});

// 在 update 中应用插值状态
const state = interpolator.getInterpolatedState();
if (state) {
  entity.position.set(state.position.x, state.position.y, state.position.z);
  if (state.rotation) {
    entity.quaternion.set(state.rotation.x, state.rotation.y, state.rotation.z, state.rotation.w);
  }
}
*/

export { NetworkInterpolator };
`;

    return {
      code: code.trim(),
      description: `配置了 ${method} 插值方法，缓冲时间 ${bufferTime}ms`
    };
  }
);

// ============================================================
// 导出工具集
// ============================================================

export const networkTools = {
  sync_transform: syncTransform,
  sync_state: syncState,
  setup_interpolation: setupInterpolation
};
