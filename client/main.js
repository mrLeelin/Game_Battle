/**
 * 应用主入口
 * 管理应用状态和模块初始化
 */
import { network } from './core/Network.js';
import { eventBus } from './core/EventBus.js';
import { sceneManager } from './core/SceneManager.js';
import { lobbyManager } from './lobby/LobbyManager.js';
import { lobbyUI } from './lobby/LobbyUI.js';
import { roomUI } from './lobby/RoomUI.js';
import { getGameConfig } from '../shared/GameTypes.js';

class App {
    constructor() {
        // 应用状态: 'login' | 'lobby' | 'room' | 'game'
        this.state = 'login';

        // 当前游戏实例
        this.currentGame = null;
        this.currentGameType = null;
    }

    /**
     * 初始化应用
     */
    async init() {
        console.log('[App] 初始化...');

        try {
            // 连接服务器
            await network.connect();

            // 初始化大厅模块
            lobbyManager.init();
            lobbyUI.init();
            roomUI.init();

            // 绑定事件
            this.bindEvents();

            // 显示登录界面
            lobbyUI.showLogin();

            console.log('[App] 初始化完成');
        } catch (error) {
            console.error('[App] 初始化失败:', error);
            alert('无法连接到服务器，请稍后重试');
        }
    }

    /**
     * 绑定应用事件
     */
    bindEvents() {
        // 游戏开始
        eventBus.on('game:start', async (data) => {
            await this.startGame(data.gameType);
        });

        // 游戏结束
        eventBus.on('game:ended', (data) => {
            this.endGame();
            // TODO: 显示结算界面
            roomUI.show();
        });

        // 网络断开
        eventBus.on('network:disconnected', () => {
            if (this.currentGame) {
                this.endGame();
            }
            alert('与服务器断开连接');
            lobbyUI.showLogin();
        });
    }

    /**
     * 开始游戏
     * @param {string} gameType - 游戏类型 ID
     */
    async startGame(gameType) {
        const gameConfig = getGameConfig(gameType);
        if (!gameConfig) {
            console.error('[App] 未知游戏类型:', gameType);
            return;
        }

        console.log(`[App] 启动游戏: ${gameConfig.name}`);
        this.state = 'game';
        this.currentGameType = gameType;

        try {
            // 动态加载游戏模块
            const GameClass = await this.loadGameModule(gameType);

            // 创建游戏实例
            this.currentGame = new GameClass();
            await this.currentGame.init();
            this.currentGame.start();

        } catch (error) {
            console.error('[App] 游戏启动失败:', error);
            this.endGame();
        }
    }

    /**
     * 动态加载游戏模块
     * @param {string} gameType - 游戏类型
     * @returns {Promise<Class>} 游戏类
     */
    async loadGameModule(gameType) {
        switch (gameType) {
            case 'fps':
                const { FPSGame } = await import('./games/fps/FPSGame.js');
                return FPSGame;

            case 'racing':
                // const { RacingGame } = await import('./games/racing/RacingGame.js');
                // return RacingGame;
                throw new Error('赛车游戏尚未实现');

            case 'puzzle':
                // const { PuzzleGame } = await import('./games/puzzle/PuzzleGame.js');
                // return PuzzleGame;
                throw new Error('解谜游戏尚未实现');

            default:
                throw new Error(`未知游戏类型: ${gameType}`);
        }
    }

    /**
     * 结束游戏
     */
    endGame() {
        if (this.currentGame) {
            this.currentGame.destroy();
            this.currentGame = null;
        }

        this.currentGameType = null;
        this.state = 'room';

        console.log('[App] 游戏结束');
    }

    /**
     * 获取当前状态
     * @returns {string}
     */
    getState() {
        return this.state;
    }
}

// 创建应用实例并启动
const app = new App();

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

export default app;
