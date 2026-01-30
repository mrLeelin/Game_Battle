/**
 * PC 游戏工具集
 *
 * 提供 PC 端游戏专用的工具
 * 手柄输入、存档系统、设置管理、性能优化等
 */

import { createTool, ParamTypes, ToolCategories } from './tool-base.js';

const PC_CATEGORY = 'pc';

/**
 * 创建输入管理器（键鼠 + 手柄）
 */
const createInputManager = createTool(
  'create_input_manager',
  '创建支持键鼠和手柄的输入管理器',
  PC_CATEGORY,
  {
    gamepadSupport: { type: ParamTypes.BOOLEAN, required: false, description: '手柄支持' },
    deadzone: { type: ParamTypes.NUMBER, required: false, description: '摇杆死区' }
  },
  async (params) => {
    const {
      gamepadSupport = true,
      deadzone = 0.15
    } = params;

    const code = `
// PC 输入管理器
// 支持键盘、鼠标、手柄

import GameController from 'gamecontroller.js';

/**
 * 输入管理器
 */
export class InputManager {
  constructor() {
    // 键盘状态
    this.keys = new Map();
    this.keyJustPressed = new Set();
    this.keyJustReleased = new Set();

    // 鼠标状态
    this.mouse = {
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: 0,
      buttons: new Map(),
      wheel: 0,
      locked: false
    };

    // 手柄状态
    this.gamepadEnabled = ${gamepadSupport};
    this.gamepad = null;
    this.gamepadState = {
      leftStick: { x: 0, y: 0 },
      rightStick: { x: 0, y: 0 },
      leftTrigger: 0,
      rightTrigger: 0,
      buttons: new Map()
    };
    this.deadzone = ${deadzone};

    // 输入映射
    this.actionBindings = new Map();

    this.init();
  }

  init() {
    // 键盘事件
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // 鼠标事件
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    window.addEventListener('wheel', (e) => this.onWheel(e));

    // 指针锁定
    document.addEventListener('pointerlockchange', () => {
      this.mouse.locked = document.pointerLockElement !== null;
    });

    // 手柄支持
    if (this.gamepadEnabled) {
      this.initGamepad();
    }

    // 默认按键绑定
    this.setupDefaultBindings();
  }

  /**
   * 初始化手柄
   */
  initGamepad() {
    GameController.search();

    window.addEventListener('gc.controller.found', (e) => {
      console.log('Gamepad connected:', e.detail.name);
      this.gamepad = e.detail;
      this.setupGamepadListeners();
    });

    window.addEventListener('gc.controller.lost', () => {
      console.log('Gamepad disconnected');
      this.gamepad = null;
    });
  }

  /**
   * 设置手柄监听
   */
  setupGamepadListeners() {
    if (!this.gamepad) return;

    // 摇杆
    this.gamepad.on('left:move', (e) => {
      this.gamepadState.leftStick.x = this.applyDeadzone(e.x);
      this.gamepadState.leftStick.y = this.applyDeadzone(e.y);
    });

    this.gamepad.on('right:move', (e) => {
      this.gamepadState.rightStick.x = this.applyDeadzone(e.x);
      this.gamepadState.rightStick.y = this.applyDeadzone(e.y);
    });

    // 扳机
    this.gamepad.on('lt', (e) => {
      this.gamepadState.leftTrigger = e.value;
    });

    this.gamepad.on('rt', (e) => {
      this.gamepadState.rightTrigger = e.value;
    });

    // 按钮
    const buttons = ['a', 'b', 'x', 'y', 'lb', 'rb', 'start', 'select', 'l3', 'r3', 'up', 'down', 'left', 'right'];
    buttons.forEach(btn => {
      this.gamepad.on(btn + ':press', () => {
        this.gamepadState.buttons.set(btn, true);
      });
      this.gamepad.on(btn + ':release', () => {
        this.gamepadState.buttons.set(btn, false);
      });
    });
  }

  /**
   * 应用摇杆死区
   */
  applyDeadzone(value) {
    if (Math.abs(value) < this.deadzone) return 0;
    return (value - Math.sign(value) * this.deadzone) / (1 - this.deadzone);
  }

  // === 键盘事件 ===
  onKeyDown(e) {
    if (!this.keys.get(e.code)) {
      this.keyJustPressed.add(e.code);
    }
    this.keys.set(e.code, true);
  }

  onKeyUp(e) {
    this.keys.set(e.code, false);
    this.keyJustReleased.add(e.code);
  }

  // === 鼠标事件 ===
  onMouseMove(e) {
    this.mouse.deltaX = e.movementX || 0;
    this.mouse.deltaY = e.movementY || 0;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  onMouseDown(e) {
    this.mouse.buttons.set(e.button, true);
  }

  onMouseUp(e) {
    this.mouse.buttons.set(e.button, false);
  }

  onWheel(e) {
    this.mouse.wheel = Math.sign(e.deltaY);
  }

  /**
   * 锁定鼠标指针
   */
  lockPointer(element = document.body) {
    element.requestPointerLock();
  }

  /**
   * 解锁鼠标指针
   */
  unlockPointer() {
    document.exitPointerLock();
  }

  // === 输入查询 ===

  /**
   * 按键是否按下
   */
  isKeyDown(code) {
    return this.keys.get(code) || false;
  }

  /**
   * 按键刚刚按下（本帧）
   */
  isKeyJustPressed(code) {
    return this.keyJustPressed.has(code);
  }

  /**
   * 按键刚刚释放（本帧）
   */
  isKeyJustReleased(code) {
    return this.keyJustReleased.has(code);
  }

  /**
   * 鼠标按键是否按下
   */
  isMouseButtonDown(button = 0) {
    return this.mouse.buttons.get(button) || false;
  }

  /**
   * 获取鼠标移动增量
   */
  getMouseDelta() {
    return { x: this.mouse.deltaX, y: this.mouse.deltaY };
  }

  /**
   * 获取手柄左摇杆
   */
  getLeftStick() {
    return { ...this.gamepadState.leftStick };
  }

  /**
   * 获取手柄右摇杆
   */
  getRightStick() {
    return { ...this.gamepadState.rightStick };
  }

  /**
   * 手柄按钮是否按下
   */
  isGamepadButtonDown(button) {
    return this.gamepadState.buttons.get(button) || false;
  }

  // === 动作绑定 ===

  /**
   * 设置默认按键绑定
   */
  setupDefaultBindings() {
    // 移动
    this.bindAction('moveForward', { keys: ['KeyW', 'ArrowUp'], gamepad: 'leftStickUp' });
    this.bindAction('moveBackward', { keys: ['KeyS', 'ArrowDown'], gamepad: 'leftStickDown' });
    this.bindAction('moveLeft', { keys: ['KeyA', 'ArrowLeft'], gamepad: 'leftStickLeft' });
    this.bindAction('moveRight', { keys: ['KeyD', 'ArrowRight'], gamepad: 'leftStickRight' });

    // 动作
    this.bindAction('jump', { keys: ['Space'], gamepad: 'a' });
    this.bindAction('sprint', { keys: ['ShiftLeft'], gamepad: 'l3' });
    this.bindAction('crouch', { keys: ['ControlLeft'], gamepad: 'b' });
    this.bindAction('interact', { keys: ['KeyE'], gamepad: 'x' });

    // 战斗
    this.bindAction('fire', { mouse: 0, gamepad: 'rt' });
    this.bindAction('aim', { mouse: 2, gamepad: 'lt' });
    this.bindAction('reload', { keys: ['KeyR'], gamepad: 'x' });
    this.bindAction('melee', { keys: ['KeyV'], gamepad: 'rb' });

    // 系统
    this.bindAction('pause', { keys: ['Escape'], gamepad: 'start' });
    this.bindAction('inventory', { keys: ['Tab', 'KeyI'], gamepad: 'select' });
  }

  /**
   * 绑定动作
   */
  bindAction(name, binding) {
    this.actionBindings.set(name, binding);
  }

  /**
   * 检查动作是否激活
   */
  isActionActive(name) {
    const binding = this.actionBindings.get(name);
    if (!binding) return false;

    // 检查键盘
    if (binding.keys) {
      for (const key of binding.keys) {
        if (this.isKeyDown(key)) return true;
      }
    }

    // 检查鼠标
    if (binding.mouse !== undefined) {
      if (this.isMouseButtonDown(binding.mouse)) return true;
    }

    // 检查手柄按钮
    if (binding.gamepad && this.gamepad) {
      if (binding.gamepad.startsWith('leftStick') || binding.gamepad.startsWith('rightStick')) {
        // 摇杆方向
        const stick = binding.gamepad.startsWith('left') ? this.gamepadState.leftStick : this.gamepadState.rightStick;
        const dir = binding.gamepad.replace(/^(left|right)Stick/, '').toLowerCase();
        switch (dir) {
          case 'up': return stick.y < -0.5;
          case 'down': return stick.y > 0.5;
          case 'left': return stick.x < -0.5;
          case 'right': return stick.x > 0.5;
        }
      } else if (binding.gamepad === 'lt') {
        return this.gamepadState.leftTrigger > 0.5;
      } else if (binding.gamepad === 'rt') {
        return this.gamepadState.rightTrigger > 0.5;
      } else {
        return this.isGamepadButtonDown(binding.gamepad);
      }
    }

    return false;
  }

  /**
   * 获取移动输入向量
   */
  getMoveInput() {
    let x = 0, y = 0;

    // 键盘
    if (this.isActionActive('moveRight')) x += 1;
    if (this.isActionActive('moveLeft')) x -= 1;
    if (this.isActionActive('moveForward')) y += 1;
    if (this.isActionActive('moveBackward')) y -= 1;

    // 手柄摇杆（覆盖）
    if (this.gamepad) {
      const stick = this.gamepadState.leftStick;
      if (Math.abs(stick.x) > 0.1 || Math.abs(stick.y) > 0.1) {
        x = stick.x;
        y = -stick.y; // 反转 Y 轴
      }
    }

    // 归一化
    const len = Math.sqrt(x * x + y * y);
    if (len > 1) {
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  /**
   * 获取视角输入
   */
  getLookInput() {
    let x = 0, y = 0;

    // 鼠标
    if (this.mouse.locked) {
      x = this.mouse.deltaX;
      y = this.mouse.deltaY;
    }

    // 手柄右摇杆
    if (this.gamepad) {
      const stick = this.gamepadState.rightStick;
      if (Math.abs(stick.x) > 0.1 || Math.abs(stick.y) > 0.1) {
        x = stick.x * 10; // 缩放因子
        y = stick.y * 10;
      }
    }

    return { x, y };
  }

  /**
   * 帧末更新（清除临时状态）
   */
  update() {
    this.keyJustPressed.clear();
    this.keyJustReleased.clear();
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    this.mouse.wheel = 0;
  }

  /**
   * 震动手柄
   */
  vibrate(duration = 200, weakMagnitude = 0.5, strongMagnitude = 0.5) {
    if (this.gamepad && this.gamepad.vibrate) {
      this.gamepad.vibrate(duration, weakMagnitude, strongMagnitude);
    }
  }
}

// 单例
export const inputManager = new InputManager();
`;

    return {
      code: code.trim(),
      filename: 'src/core/InputManager.js',
      description: `创建了输入管理器，手柄支持: ${gamepadSupport}`
    };
  }
);

/**
 * 创建存档管理器
 */
const createSaveManager = createTool(
  'create_save_manager',
  '创建游戏存档管理器',
  PC_CATEGORY,
  {
    maxSlots: { type: ParamTypes.NUMBER, required: false, description: '最大存档槽位' },
    autoSave: { type: ParamTypes.BOOLEAN, required: false, description: '自动存档' }
  },
  async (params) => {
    const {
      maxSlots = 10,
      autoSave = true
    } = params;

    const code = `
// 游戏存档管理器

import fs from 'fs-extra';
import path from 'path';

/**
 * 存档管理器
 */
export class SaveManager {
  constructor(options = {}) {
    this.maxSlots = ${maxSlots};
    this.autoSave = ${autoSave};
    this.autoSaveInterval = options.autoSaveInterval || 60000; // 1分钟

    // 存档目录
    this.saveDir = options.saveDir || './saves';

    // 当前存档数据
    this.currentSave = null;
    this.currentSlot = null;

    // 自动存档定时器
    this.autoSaveTimer = null;

    this.init();
  }

  async init() {
    // 确保存档目录存在
    await fs.ensureDir(this.saveDir);

    // 启动自动存档
    if (this.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * 保存游戏
   */
  async save(slot, gameData) {
    const saveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      playTime: gameData.playTime || 0,
      slot,
      data: gameData
    };

    const filePath = this.getSlotPath(slot);

    try {
      await fs.writeJson(filePath, saveData, { spaces: 2 });
      this.currentSave = saveData;
      this.currentSlot = slot;

      console.log(\`Game saved to slot \${slot}\`);
      return { success: true, slot };
    } catch (error) {
      console.error('Save failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 加载游戏
   */
  async load(slot) {
    const filePath = this.getSlotPath(slot);

    try {
      if (!await fs.pathExists(filePath)) {
        return { success: false, error: 'Save not found' };
      }

      const saveData = await fs.readJson(filePath);
      this.currentSave = saveData;
      this.currentSlot = slot;

      console.log(\`Game loaded from slot \${slot}\`);
      return { success: true, data: saveData.data };
    } catch (error) {
      console.error('Load failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除存档
   */
  async delete(slot) {
    const filePath = this.getSlotPath(slot);

    try {
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        console.log(\`Save slot \${slot} deleted\`);
        return { success: true };
      }
      return { success: false, error: 'Save not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取所有存档信息
   */
  async listSaves() {
    const saves = [];

    for (let slot = 1; slot <= this.maxSlots; slot++) {
      const filePath = this.getSlotPath(slot);

      if (await fs.pathExists(filePath)) {
        try {
          const saveData = await fs.readJson(filePath);
          saves.push({
            slot,
            timestamp: saveData.timestamp,
            playTime: saveData.playTime,
            date: new Date(saveData.timestamp).toLocaleString()
          });
        } catch (e) {
          // 损坏的存档
          saves.push({ slot, corrupted: true });
        }
      } else {
        saves.push({ slot, empty: true });
      }
    }

    return saves;
  }

  /**
   * 快速存档
   */
  async quickSave(gameData) {
    return this.save(0, gameData); // 槽位 0 为快速存档
  }

  /**
   * 快速加载
   */
  async quickLoad() {
    return this.load(0);
  }

  /**
   * 自动存档
   */
  async autoSaveNow(gameData) {
    return this.save(-1, gameData); // 槽位 -1 为自动存档
  }

  /**
   * 启动自动存档
   */
  startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      if (this.currentSave && this.onAutoSave) {
        const gameData = this.onAutoSave();
        if (gameData) {
          this.autoSaveNow(gameData);
        }
      }
    }, this.autoSaveInterval);
  }

  /**
   * 停止自动存档
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 获取存档槽位路径
   */
  getSlotPath(slot) {
    const filename = slot === 0 ? 'quicksave.json' :
                     slot === -1 ? 'autosave.json' :
                     \`save_\${slot}.json\`;
    return path.join(this.saveDir, filename);
  }

  /**
   * 导出存档（用于云存档或备份）
   */
  async exportSave(slot) {
    const filePath = this.getSlotPath(slot);

    if (await fs.pathExists(filePath)) {
      return fs.readJson(filePath);
    }
    return null;
  }

  /**
   * 导入存档
   */
  async importSave(slot, saveData) {
    const filePath = this.getSlotPath(slot);
    await fs.writeJson(filePath, saveData, { spaces: 2 });
    return { success: true };
  }
}

// 单例
export const saveManager = new SaveManager();
`;

    return {
      code: code.trim(),
      filename: 'src/core/SaveManager.js',
      description: `创建了存档管理器，${maxSlots} 个槽位`
    };
  }
);

/**
 * 创建设置管理器
 */
const createSettingsManager = createTool(
  'create_settings_manager',
  '创建游戏设置管理器',
  PC_CATEGORY,
  {},
  async (params) => {
    const code = `
// 游戏设置管理器

/**
 * 设置管理器
 */
export class SettingsManager {
  constructor() {
    // 默认设置
    this.defaults = {
      // 图形
      graphics: {
        quality: 'high',        // low, medium, high, ultra
        resolution: '1920x1080',
        fullscreen: false,
        vsync: true,
        fpsLimit: 60,
        shadows: true,
        shadowQuality: 'high',
        antialiasing: 'msaa',   // off, fxaa, msaa, taa
        ambientOcclusion: true,
        bloom: true,
        motionBlur: false
      },

      // 音频
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.8,
        sfxVolume: 1.0,
        voiceVolume: 1.0,
        muteOnFocusLoss: true
      },

      // 控制
      controls: {
        mouseSensitivity: 1.0,
        invertY: false,
        gamepadSensitivity: 1.0,
        gamepadInvertY: false,
        vibration: true
      },

      // 游戏
      gameplay: {
        difficulty: 'normal',   // easy, normal, hard
        subtitles: true,
        hints: true,
        autoAim: false
      },

      // 辅助功能
      accessibility: {
        colorBlindMode: 'off',  // off, protanopia, deuteranopia, tritanopia
        screenShake: true,
        flashingEffects: true,
        largeText: false
      }
    };

    // 当前设置
    this.settings = this.deepClone(this.defaults);

    // 设置变更监听器
    this.listeners = new Map();

    this.init();
  }

  async init() {
    // 从 Electron 加载保存的设置
    if (window.electronAPI) {
      const savedSettings = await window.electronAPI.getSettings();
      if (savedSettings && savedSettings.game) {
        this.settings = this.mergeSettings(this.defaults, savedSettings.game);
      }
    } else {
      // 浏览器模式，从 localStorage 加载
      const saved = localStorage.getItem('gameSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.settings = this.mergeSettings(this.defaults, parsed);
        } catch (e) {
          console.warn('Failed to load settings:', e);
        }
      }
    }

    // 应用初始设置
    this.applyAll();
  }

  /**
   * 获取设置值
   */
  get(path) {
    const keys = path.split('.');
    let value = this.settings;
    for (const key of keys) {
      value = value?.[key];
    }
    return value;
  }

  /**
   * 设置值
   */
  set(path, value) {
    const keys = path.split('.');
    let obj = this.settings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }

    const oldValue = obj[keys[keys.length - 1]];
    obj[keys[keys.length - 1]] = value;

    // 触发监听器
    this.notifyListeners(path, value, oldValue);

    // 保存设置
    this.save();

    // 应用设置
    this.apply(path, value);
  }

  /**
   * 重置为默认值
   */
  reset(path = null) {
    if (path) {
      const keys = path.split('.');
      let defaultValue = this.defaults;
      for (const key of keys) {
        defaultValue = defaultValue?.[key];
      }
      this.set(path, this.deepClone(defaultValue));
    } else {
      this.settings = this.deepClone(this.defaults);
      this.save();
      this.applyAll();
    }
  }

  /**
   * 保存设置
   */
  async save() {
    if (window.electronAPI) {
      await window.electronAPI.setSetting('game', this.settings);
    } else {
      localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }
  }

  /**
   * 应用单个设置
   */
  apply(path, value) {
    // 根据路径应用设置
    switch (path) {
      case 'graphics.fullscreen':
        if (window.electronAPI) {
          window.electronAPI.toggleFullscreen();
        }
        break;

      case 'graphics.quality':
        this.applyGraphicsQuality(value);
        break;

      case 'audio.masterVolume':
      case 'audio.musicVolume':
      case 'audio.sfxVolume':
        this.applyAudioSettings();
        break;

      case 'controls.mouseSensitivity':
        // 输入管理器会读取此设置
        break;
    }
  }

  /**
   * 应用所有设置
   */
  applyAll() {
    this.applyGraphicsQuality(this.settings.graphics.quality);
    this.applyAudioSettings();
  }

  /**
   * 应用图形质量预设
   */
  applyGraphicsQuality(quality) {
    const presets = {
      low: {
        shadows: false,
        shadowQuality: 'low',
        antialiasing: 'off',
        ambientOcclusion: false,
        bloom: false,
        motionBlur: false
      },
      medium: {
        shadows: true,
        shadowQuality: 'medium',
        antialiasing: 'fxaa',
        ambientOcclusion: false,
        bloom: true,
        motionBlur: false
      },
      high: {
        shadows: true,
        shadowQuality: 'high',
        antialiasing: 'msaa',
        ambientOcclusion: true,
        bloom: true,
        motionBlur: false
      },
      ultra: {
        shadows: true,
        shadowQuality: 'ultra',
        antialiasing: 'taa',
        ambientOcclusion: true,
        bloom: true,
        motionBlur: true
      }
    };

    const preset = presets[quality];
    if (preset) {
      Object.assign(this.settings.graphics, preset);
    }
  }

  /**
   * 应用音频设置
   */
  applyAudioSettings() {
    // 这里需要与音频管理器集成
    // audioManager.setVolume('master', this.settings.audio.masterVolume);
    // audioManager.setVolume('music', this.settings.audio.musicVolume);
    // audioManager.setVolume('sfx', this.settings.audio.sfxVolume);
  }

  /**
   * 添加设置变更监听器
   */
  onChange(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, []);
    }
    this.listeners.get(path).push(callback);
  }

  /**
   * 移除监听器
   */
  offChange(path, callback) {
    const callbacks = this.listeners.get(path);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  /**
   * 通知监听器
   */
  notifyListeners(path, newValue, oldValue) {
    const callbacks = this.listeners.get(path);
    if (callbacks) {
      callbacks.forEach(cb => cb(newValue, oldValue));
    }
  }

  /**
   * 深拷贝
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * 合并设置
   */
  mergeSettings(defaults, saved) {
    const result = this.deepClone(defaults);

    for (const category in saved) {
      if (result[category]) {
        for (const key in saved[category]) {
          if (result[category].hasOwnProperty(key)) {
            result[category][key] = saved[category][key];
          }
        }
      }
    }

    return result;
  }

  /**
   * 获取所有设置（用于 UI）
   */
  getAll() {
    return this.deepClone(this.settings);
  }

  /**
   * 获取可用分辨率
   */
  getAvailableResolutions() {
    return [
      '1280x720',
      '1366x768',
      '1600x900',
      '1920x1080',
      '2560x1440',
      '3840x2160'
    ];
  }
}

// 单例
export const settingsManager = new SettingsManager();
`;

    return {
      code: code.trim(),
      filename: 'src/core/SettingsManager.js',
      description: '创建了游戏设置管理器'
    };
  }
);

// ============================================================
// 导出工具集
// ============================================================

export const pcGameTools = {
  create_input_manager: createInputManager,
  create_save_manager: createSaveManager,
  create_settings_manager: createSettingsManager
};
