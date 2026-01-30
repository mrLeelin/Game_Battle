/**
 * 调试工具集
 *
 * 提供性能统计、可视化调试、日志分析相关的工具
 */

import { createTool, ParamTypes, ToolCategories, generateId } from './tool-base.js';

/**
 * 显示性能统计
 */
const showStats = createTool(
  'show_stats',
  '显示实时性能统计',
  ToolCategories.DEBUG,
  {
    position: { type: ParamTypes.STRING, required: false, enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], description: '显示位置' },
    panels: { type: ParamTypes.ARRAY, required: false, description: '显示面板' }
  },
  async (params) => {
    const {
      position = 'top-left',
      panels = ['fps', 'ms', 'mb']
    } = params;

    const positionStyles = {
      'top-left': 'top: 0; left: 0;',
      'top-right': 'top: 0; right: 0;',
      'bottom-left': 'bottom: 0; left: 0;',
      'bottom-right': 'bottom: 0; right: 0;'
    };

    const code = `
// 性能统计面板

import Stats from 'three/examples/jsm/libs/stats.module';

/**
 * 性能统计显示器
 */
class PerformanceStats {
  constructor(options = {}) {
    this.position = '${position}';
    this.panels = [${panels.map(p => `'${p}'`).join(', ')}];
    this.stats = null;
    this.customPanels = new Map();
    this.visible = true;

    this.init();
  }

  init() {
    this.stats = new Stats();

    // 设置位置
    this.stats.dom.style.cssText = '${positionStyles[position]}';
    this.stats.dom.style.position = 'fixed';
    this.stats.dom.style.zIndex = '10000';

    // 显示指定面板
    const panelMap = { 'fps': 0, 'ms': 1, 'mb': 2 };
    const panelIndex = panelMap[this.panels[0]] ?? 0;
    this.stats.showPanel(panelIndex);

    document.body.appendChild(this.stats.dom);
  }

  /**
   * 开始帧计时（在渲染循环开始时调用）
   */
  begin() {
    if (this.visible) {
      this.stats.begin();
    }
  }

  /**
   * 结束帧计时（在渲染循环结束时调用）
   */
  end() {
    if (this.visible) {
      this.stats.end();
    }
  }

  /**
   * 更新（可替代 begin/end）
   */
  update() {
    if (this.visible) {
      this.stats.update();
    }
  }

  /**
   * 切换显示的面板
   */
  switchPanel(panelName) {
    const panelMap = { 'fps': 0, 'ms': 1, 'mb': 2 };
    const index = panelMap[panelName] ?? 0;
    this.stats.showPanel(index);
  }

  /**
   * 显示/隐藏
   */
  toggle() {
    this.visible = !this.visible;
    this.stats.dom.style.display = this.visible ? 'block' : 'none';
  }

  /**
   * 显示
   */
  show() {
    this.visible = true;
    this.stats.dom.style.display = 'block';
  }

  /**
   * 隐藏
   */
  hide() {
    this.visible = false;
    this.stats.dom.style.display = 'none';
  }

  /**
   * 销毁
   */
  dispose() {
    if (this.stats.dom.parentNode) {
      this.stats.dom.parentNode.removeChild(this.stats.dom);
    }
  }
}

/**
 * 自定义性能面板（渲染信息）
 */
class RenderStatsPanel {
  constructor(renderer) {
    this.renderer = renderer;
    this.container = null;
    this.visible = true;

    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.style.cssText = \`
      position: fixed;
      ${positionStyles['${position}']}
      margin-top: 50px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      padding: 8px;
      min-width: 150px;
      z-index: 10000;
    \`;
    document.body.appendChild(this.container);
  }

  update() {
    if (!this.visible) return;

    const info = this.renderer.info;
    this.container.innerHTML = \`
      <div><b>Render</b></div>
      <div>Calls: \${info.render.calls}</div>
      <div>Triangles: \${info.render.triangles.toLocaleString()}</div>
      <div>Lines: \${info.render.lines}</div>
      <div>Points: \${info.render.points}</div>
      <hr style="border-color: #444; margin: 4px 0;">
      <div><b>Memory</b></div>
      <div>Geometries: \${info.memory.geometries}</div>
      <div>Textures: \${info.memory.textures}</div>
      <div>Programs: \${info.programs?.length || 0}</div>
    \`;
  }

  toggle() {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';
  }

  dispose() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// 使用示例
/*
const stats = new PerformanceStats();
const renderStats = new RenderStatsPanel(renderer);

function animate() {
  requestAnimationFrame(animate);

  stats.begin();

  // 渲染逻辑
  renderer.render(scene, camera);

  stats.end();
  renderStats.update();
}

// 按 F1 切换显示
document.addEventListener('keydown', (e) => {
  if (e.key === 'F1') {
    stats.toggle();
    renderStats.toggle();
  }
});
*/

export { PerformanceStats, RenderStatsPanel };
`;

    return {
      code: code.trim(),
      description: `创建了性能统计显示器，位置 ${position}`
    };
  }
);

/**
 * 绘制调试信息
 */
const drawDebug = createTool(
  'draw_debug',
  '绘制调试可视化信息',
  ToolCategories.DEBUG,
  {
    type: { type: ParamTypes.STRING, required: true, enum: ['grid', 'axes', 'bounds', 'skeleton', 'normals', 'wireframe'], description: '调试类型' },
    color: { type: ParamTypes.COLOR, required: false, description: '颜色' },
    size: { type: ParamTypes.NUMBER, required: false, description: '尺寸' }
  },
  async (params) => {
    const {
      type,
      color = 0x00ff00,
      size = 10
    } = params;

    const colorStr = typeof color === 'string' ? `'${color}'` : `0x${color.toString(16).padStart(6, '0')}`;

    const code = `
// 调试可视化工具

import { SkeletonHelper } from 'three/examples/jsm/helpers/SkeletonHelper';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper';

/**
 * 调试绘制器
 */
class DebugDrawer {
  constructor(scene) {
    this.scene = scene;
    this.helpers = new Map();
    this.visible = true;
  }

  /**
   * 添加网格辅助线
   */
  addGrid(options = {}) {
    const {
      size = ${size},
      divisions = 10,
      colorCenterLine = ${colorStr},
      colorGrid = 0x444444
    } = options;

    const grid = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
    grid.name = 'debugGrid';
    this.scene.add(grid);
    this.helpers.set('grid', grid);

    return grid;
  }

  /**
   * 添加坐标轴
   */
  addAxes(options = {}) {
    const { size = ${size} } = options;

    const axes = new THREE.AxesHelper(size);
    axes.name = 'debugAxes';
    this.scene.add(axes);
    this.helpers.set('axes', axes);

    return axes;
  }

  /**
   * 添加包围盒显示
   */
  addBoundingBox(mesh, options = {}) {
    const { color = ${colorStr} } = options;

    const box = new THREE.Box3().setFromObject(mesh);
    const helper = new THREE.Box3Helper(box, color);
    helper.name = 'debugBounds_' + mesh.name;
    this.scene.add(helper);
    this.helpers.set('bounds_' + mesh.uuid, helper);

    return helper;
  }

  /**
   * 添加骨骼显示
   */
  addSkeleton(skinnedMesh, options = {}) {
    const helper = new THREE.SkeletonHelper(skinnedMesh);
    helper.name = 'debugSkeleton_' + skinnedMesh.name;
    this.scene.add(helper);
    this.helpers.set('skeleton_' + skinnedMesh.uuid, helper);

    return helper;
  }

  /**
   * 添加法线显示
   */
  addNormals(mesh, options = {}) {
    const { size = 1, color = ${colorStr} } = options;

    const helper = new VertexNormalsHelper(mesh, size, color);
    helper.name = 'debugNormals_' + mesh.name;
    this.scene.add(helper);
    this.helpers.set('normals_' + mesh.uuid, helper);

    return helper;
  }

  /**
   * 切换线框模式
   */
  toggleWireframe(mesh, enable = true) {
    mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.wireframe = enable);
        } else {
          child.material.wireframe = enable;
        }
      }
    });
  }

  /**
   * 绘制射线
   */
  drawRay(origin, direction, length = 100, color = ${colorStr}) {
    const points = [
      origin.clone(),
      origin.clone().add(direction.clone().normalize().multiplyScalar(length))
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    line.name = 'debugRay';

    this.scene.add(line);
    this.helpers.set('ray_' + Date.now(), line);

    return line;
  }

  /**
   * 绘制点
   */
  drawPoint(position, color = ${colorStr}, size = 0.1) {
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    sphere.name = 'debugPoint';

    this.scene.add(sphere);
    this.helpers.set('point_' + Date.now(), sphere);

    return sphere;
  }

  /**
   * 绘制线段
   */
  drawLine(start, end, color = ${colorStr}) {
    const points = [start.clone(), end.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    line.name = 'debugLine';

    this.scene.add(line);
    this.helpers.set('line_' + Date.now(), line);

    return line;
  }

  /**
   * 绘制球体
   */
  drawSphere(center, radius, color = ${colorStr}) {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(center);
    sphere.name = 'debugSphere';

    this.scene.add(sphere);
    this.helpers.set('sphere_' + Date.now(), sphere);

    return sphere;
  }

  /**
   * 绘制箭头
   */
  drawArrow(origin, direction, length = 1, color = ${colorStr}) {
    const arrow = new THREE.ArrowHelper(
      direction.clone().normalize(),
      origin,
      length,
      color
    );
    arrow.name = 'debugArrow';

    this.scene.add(arrow);
    this.helpers.set('arrow_' + Date.now(), arrow);

    return arrow;
  }

  /**
   * 显示/隐藏所有调试信息
   */
  toggle() {
    this.visible = !this.visible;
    for (const helper of this.helpers.values()) {
      helper.visible = this.visible;
    }
  }

  /**
   * 移除指定辅助
   */
  remove(key) {
    const helper = this.helpers.get(key);
    if (helper) {
      this.scene.remove(helper);
      if (helper.geometry) helper.geometry.dispose();
      if (helper.material) {
        if (Array.isArray(helper.material)) {
          helper.material.forEach(m => m.dispose());
        } else {
          helper.material.dispose();
        }
      }
      this.helpers.delete(key);
    }
  }

  /**
   * 清除所有调试信息
   */
  clear() {
    for (const key of this.helpers.keys()) {
      this.remove(key);
    }
  }

  /**
   * 更新（用于动态辅助）
   */
  update() {
    // 更新包围盒
    for (const [key, helper] of this.helpers) {
      if (key.startsWith('bounds_') && helper.box) {
        // Box3Helper 需要手动更新
      }
    }
  }
}

// 使用示例
/*
const debug = new DebugDrawer(scene);

// 添加网格和坐标轴
debug.addGrid({ size: 100, divisions: 20 });
debug.addAxes({ size: 10 });

// 显示物体包围盒
debug.addBoundingBox(player);

// 显示骨骼
debug.addSkeleton(character);

// 绘制射线
debug.drawRay(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), 50);

// 按 F2 切换调试显示
document.addEventListener('keydown', (e) => {
  if (e.key === 'F2') {
    debug.toggle();
  }
});
*/

export { DebugDrawer };
`;

    return {
      code: code.trim(),
      description: `创建了 ${type} 类型的调试绘制器`
    };
  }
);

/**
 * 日志分析
 */
const logAnalysis = createTool(
  'log_analysis',
  '创建日志分析和监控系统',
  ToolCategories.DEBUG,
  {
    level: { type: ParamTypes.STRING, required: false, enum: ['debug', 'info', 'warn', 'error'], description: '日志级别' },
    persist: { type: ParamTypes.BOOLEAN, required: false, description: '持久化日志' }
  },
  async (params) => {
    const {
      level = 'info',
      persist = false
    } = params;

    const levelPriority = { 'debug': 0, 'info': 1, 'warn': 2, 'error': 3 };

    const code = `
// 日志分析系统

/**
 * 游戏日志系统
 */
class GameLogger {
  constructor(options = {}) {
    this.level = '${level}';
    this.levelPriority = { 'debug': 0, 'info': 1, 'warn': 2, 'error': 3 };
    this.persist = ${persist};
    this.maxLogs = options.maxLogs || 1000;

    this.logs = [];
    this.filters = new Set();
    this.listeners = [];

    // 性能计时器
    this.timers = new Map();

    // 拦截原生 console
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    if (options.interceptConsole) {
      this.interceptConsole();
    }

    // 从本地存储恢复日志
    if (this.persist) {
      this.loadFromStorage();
    }
  }

  /**
   * 拦截原生 console
   */
  interceptConsole() {
    console.log = (...args) => {
      this.debug(...args);
      this.originalConsole.log(...args);
    };
    console.info = (...args) => {
      this.info(...args);
      this.originalConsole.info(...args);
    };
    console.warn = (...args) => {
      this.warn(...args);
      this.originalConsole.warn(...args);
    };
    console.error = (...args) => {
      this.error(...args);
      this.originalConsole.error(...args);
    };
  }

  /**
   * 恢复原生 console
   */
  restoreConsole() {
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
  }

  /**
   * 添加日志
   */
  log(level, category, message, data = null) {
    if (this.levelPriority[level] < this.levelPriority[this.level]) {
      return;
    }

    const entry = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);

    // 限制日志数量
    while (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 持久化
    if (this.persist) {
      this.saveToStorage();
    }

    // 通知监听器
    for (const listener of this.listeners) {
      listener(entry);
    }

    return entry;
  }

  // 便捷方法
  debug(message, data = null, category = 'general') {
    return this.log('debug', category, message, data);
  }

  info(message, data = null, category = 'general') {
    return this.log('info', category, message, data);
  }

  warn(message, data = null, category = 'general') {
    return this.log('warn', category, message, data);
  }

  error(message, data = null, category = 'general') {
    return this.log('error', category, message, data);
  }

  /**
   * 开始计时
   */
  time(label) {
    this.timers.set(label, performance.now());
  }

  /**
   * 结束计时并记录
   */
  timeEnd(label) {
    const start = this.timers.get(label);
    if (start) {
      const duration = performance.now() - start;
      this.debug(\`\${label}: \${duration.toFixed(2)}ms\`, { duration }, 'performance');
      this.timers.delete(label);
      return duration;
    }
    return 0;
  }

  /**
   * 添加监听器
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * 移除监听器
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 过滤日志
   */
  filter(options = {}) {
    let filtered = [...this.logs];

    if (options.level) {
      filtered = filtered.filter(log =>
        this.levelPriority[log.level] >= this.levelPriority[options.level]
      );
    }

    if (options.category) {
      filtered = filtered.filter(log => log.category === options.category);
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower)
      );
    }

    if (options.startTime) {
      filtered = filtered.filter(log =>
        new Date(log.timestamp) >= new Date(options.startTime)
      );
    }

    if (options.endTime) {
      filtered = filtered.filter(log =>
        new Date(log.timestamp) <= new Date(options.endTime)
      );
    }

    return filtered;
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    const errors = this.filter({ level: 'error' });
    const warnings = this.filter({ level: 'warn' });

    const errorsByCategory = {};
    for (const error of errors) {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
    }

    return {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      errorsByCategory,
      recentErrors: errors.slice(-10)
    };
  }

  /**
   * 导出日志
   */
  export(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else if (format === 'csv') {
      const headers = 'timestamp,level,category,message\\n';
      const rows = this.logs.map(log =>
        \`"\${log.timestamp}","\${log.level}","\${log.category}","\${log.message.replace(/"/g, '""')}"\`
      ).join('\\n');
      return headers + rows;
    }
    return '';
  }

  /**
   * 下载日志
   */
  download(filename = 'game_logs.json') {
    const data = this.export('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 保存到本地存储
   */
  saveToStorage() {
    try {
      localStorage.setItem('gameLogs', JSON.stringify(this.logs.slice(-100)));
    } catch (e) {
      // 存储满了
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('gameLogs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      // 忽略解析错误
    }
  }

  /**
   * 清除日志
   */
  clear() {
    this.logs = [];
    if (this.persist) {
      localStorage.removeItem('gameLogs');
    }
  }
}

// 使用示例
/*
const logger = new GameLogger({
  level: '${level}',
  persist: ${persist},
  interceptConsole: true
});

// 记录日志
logger.info('Game started');
logger.debug('Player spawned', { position: { x: 0, y: 0, z: 0 } }, 'player');
logger.warn('Low memory', { available: 100 }, 'system');
logger.error('Failed to load asset', { url: 'model.glb' }, 'assets');

// 性能计时
logger.time('renderLoop');
// ... 渲染代码
logger.timeEnd('renderLoop');

// 添加监听器（用于 UI 显示）
logger.addListener((entry) => {
  if (entry.level === 'error') {
    showErrorNotification(entry.message);
  }
});

// 获取统计
const stats = logger.getErrorStats();
console.log('Errors:', stats.totalErrors);

// 导出日志
logger.download('debug_session.json');
*/

export { GameLogger };
`;

    return {
      code: code.trim(),
      description: `创建了日志分析系统，级别 ${level}`
    };
  }
);

// ============================================================
// 导出工具集
// ============================================================

export const debugTools = {
  show_stats: showStats,
  draw_debug: drawDebug,
  log_analysis: logAnalysis
};
