/**
 * Electron 工具集
 *
 * 提供 Electron 桌面应用相关的工具
 * 窗口管理、菜单、文件系统、系统托盘等
 */

import { createTool, ParamTypes, ToolCategories } from './tool-base.js';

// 添加新的工具分类
const PC_CATEGORY = 'pc';

/**
 * 创建 Electron 主进程
 */
const createElectronMain = createTool(
  'create_electron_main',
  '创建 Electron 主进程配置',
  PC_CATEGORY,
  {
    title: { type: ParamTypes.STRING, required: false, description: '窗口标题' },
    width: { type: ParamTypes.NUMBER, required: false, description: '窗口宽度' },
    height: { type: ParamTypes.NUMBER, required: false, description: '窗口高度' },
    fullscreen: { type: ParamTypes.BOOLEAN, required: false, description: '全屏模式' },
    devTools: { type: ParamTypes.BOOLEAN, required: false, description: '开发者工具' }
  },
  async (params) => {
    const {
      title = 'My Game',
      width = 1920,
      height = 1080,
      fullscreen = false,
      devTools = false
    } = params;

    const code = `
// Electron 主进程
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

// 配置存储
const store = new Store({
  name: 'game-settings',
  defaults: {
    windowBounds: { width: ${width}, height: ${height} },
    fullscreen: ${fullscreen},
    volume: 1.0,
    graphics: 'high'
  }
});

let mainWindow = null;

/**
 * 创建主窗口
 */
function createWindow() {
  const { width, height } = store.get('windowBounds');
  const isFullscreen = store.get('fullscreen');

  mainWindow = new BrowserWindow({
    width,
    height,
    title: '${title}',
    fullscreen: isFullscreen,
    fullscreenable: true,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    show: false, // 等待 ready-to-show
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载游戏页面
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    ${devTools ? "mainWindow.webContents.openDevTools();" : ""}
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 保存窗口尺寸
  mainWindow.on('resize', () => {
    if (!mainWindow.isFullScreen()) {
      const { width, height } = mainWindow.getBounds();
      store.set('windowBounds', { width, height });
    }
  });

  // 全屏状态变化
  mainWindow.on('enter-full-screen', () => {
    store.set('fullscreen', true);
    mainWindow.webContents.send('fullscreen-changed', true);
  });

  mainWindow.on('leave-full-screen', () => {
    store.set('fullscreen', false);
    mainWindow.webContents.send('fullscreen-changed', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 创建菜单
  createMenu();
}

/**
 * 创建应用菜单
 */
function createMenu() {
  const template = [
    {
      label: '游戏',
      submenu: [
        {
          label: '新游戏',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new-game')
        },
        {
          label: '保存游戏',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save-game')
        },
        {
          label: '加载游戏',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu-load-game')
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '全屏',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools()
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 通信处理
ipcMain.handle('get-settings', () => {
  return store.store;
});

ipcMain.handle('set-setting', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('toggle-fullscreen', () => {
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
  return mainWindow.isFullScreen();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '保存游戏',
    defaultPath: options.defaultPath || 'save.json',
    filters: [{ name: '存档文件', extensions: ['json'] }]
  });
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '加载游戏',
    filters: [{ name: '存档文件', extensions: ['json'] }],
    properties: ['openFile']
  });
  return result;
});

// 应用生命周期
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 禁用硬件加速问题的解决方案（可选）
// app.disableHardwareAcceleration();
`;

    return {
      code: code.trim(),
      filename: 'electron/main.js',
      description: `创建了 Electron 主进程，窗口 ${width}x${height}`
    };
  }
);

/**
 * 创建预加载脚本
 */
const createPreloadScript = createTool(
  'create_preload_script',
  '创建 Electron 预加载脚本',
  PC_CATEGORY,
  {},
  async (params) => {
    const code = `
// Electron 预加载脚本
// 安全地暴露 API 给渲染进程

const { contextBridge, ipcRenderer } = require('electron');

/**
 * 暴露给游戏的 API
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // === 设置 ===
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // === 窗口 ===
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  onFullscreenChanged: (callback) => {
    ipcRenderer.on('fullscreen-changed', (event, isFullscreen) => callback(isFullscreen));
  },

  // === 文件系统 ===
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  loadFile: (filePath) => ipcRenderer.invoke('load-file', filePath),

  // === 菜单事件 ===
  onNewGame: (callback) => ipcRenderer.on('menu-new-game', callback),
  onSaveGame: (callback) => ipcRenderer.on('menu-save-game', callback),
  onLoadGame: (callback) => ipcRenderer.on('menu-load-game', callback),

  // === 系统信息 ===
  getPlatform: () => process.platform,
  getVersion: () => ipcRenderer.invoke('get-version')
});

console.log('Electron preload script loaded');
`;

    return {
      code: code.trim(),
      filename: 'electron/preload.js',
      description: '创建了 Electron 预加载脚本'
    };
  }
);

/**
 * 创建 Electron 打包配置
 */
const createElectronBuilder = createTool(
  'create_electron_builder',
  '创建 Electron 打包配置',
  PC_CATEGORY,
  {
    appId: { type: ParamTypes.STRING, required: false, description: '应用 ID' },
    productName: { type: ParamTypes.STRING, required: false, description: '产品名称' }
  },
  async (params) => {
    const {
      appId = 'com.mygame.app',
      productName = 'My Game'
    } = params;

    const code = `
# electron-builder 配置文件
# electron-builder.yml

appId: "${appId}"
productName: "${productName}"
copyright: "Copyright © 2024"

directories:
  output: release
  buildResources: build

files:
  - dist/**/*
  - electron/**/*
  - package.json

win:
  target:
    - target: nsis
      arch:
        - x64
  icon: build/icon.ico

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true

mac:
  target:
    - target: dmg
      arch:
        - x64
        - arm64
  icon: build/icon.icns
  category: public.app-category.games

linux:
  target:
    - target: AppImage
      arch:
        - x64
  icon: build/icon.png
  category: Game

# 额外资源（存档、配置等）
extraResources:
  - from: assets/
    to: assets/
    filter:
      - "**/*"
`;

    return {
      code: code.trim(),
      filename: 'electron-builder.yml',
      description: `创建了打包配置，应用 ID: ${appId}`
    };
  }
);

// ============================================================
// 导出工具集
// ============================================================

export const electronTools = {
  create_electron_main: createElectronMain,
  create_preload_script: createPreloadScript,
  create_electron_builder: createElectronBuilder
};
