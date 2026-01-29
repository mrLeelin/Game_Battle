/**
 * 游戏基类 - 所有游戏类型的抽象基类
 * 新游戏必须继承此类并实现所有抽象方法
 */
import { network } from '../core/Network.js';
import { sceneManager } from '../core/SceneManager.js';
import { eventBus } from '../core/EventBus.js';
import { GAME_EVENTS } from '../../shared/Events.js';

export class GameBase {
    /**
     * @param {Object} options - 游戏配置
     */
    constructor(options = {}) {
        this.options = options;
        this.network = network;
        this.sceneManager = sceneManager;
        this.eventBus = eventBus;

        this.isRunning = false;
        this.isPaused = false;
        this.players = new Map();  // 其他玩家

        // 动画循环
        this.animationFrameId = null;
        this.lastTime = 0;
    }

    // ==================== 生命周期方法（必须实现） ====================

    /**
     * 初始化游戏
     * 设置场景、加载资源等
     */
    async init() {
        throw new Error('子类必须实现 init() 方法');
    }

    /**
     * 游戏主循环
     * @param {number} delta - 帧间隔时间（秒）
     */
    update(delta) {
        throw new Error('子类必须实现 update() 方法');
    }

    /**
     * 销毁游戏
     * 清理资源、移除事件监听等
     */
    destroy() {
        throw new Error('子类必须实现 destroy() 方法');
    }

    // ==================== 通用方法 ====================

    /**
     * 启动游戏循环
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();

        console.log(`[${this.constructor.name}] 游戏开始`);
    }

    /**
     * 停止游戏循环
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        console.log(`[${this.constructor.name}] 游戏停止`);
    }

    /**
     * 暂停游戏
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * 恢复游戏
     */
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.isRunning) return;

        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());

        const now = performance.now();
        const delta = (now - this.lastTime) / 1000;
        this.lastTime = now;

        if (!this.isPaused) {
            this.update(delta);
        }

        this.sceneManager.render();
    }

    // ==================== 网络事件（可重写） ====================

    /**
     * 绑定通用网络事件
     */
    bindNetworkEvents() {
        // 玩家移动
        this.network.on(GAME_EVENTS.PLAYER_MOVE, (data) => {
            this.onPlayerMove(data);
        });

        // 玩家动作
        this.network.on(GAME_EVENTS.PLAYER_ACTION, (data) => {
            this.onPlayerAction(data);
        });

        // 玩家断线
        this.network.on(GAME_EVENTS.PLAYER_DISCONNECTED, (data) => {
            this.onPlayerDisconnected(data);
        });

        // 游戏结束
        this.network.on(GAME_EVENTS.END, (data) => {
            this.onGameEnd(data);
        });
    }

    /**
     * 解绑网络事件
     */
    unbindNetworkEvents() {
        this.network.off(GAME_EVENTS.PLAYER_MOVE);
        this.network.off(GAME_EVENTS.PLAYER_ACTION);
        this.network.off(GAME_EVENTS.PLAYER_DISCONNECTED);
        this.network.off(GAME_EVENTS.END);
    }

    // ==================== 事件处理（可重写） ====================

    /**
     * 玩家移动处理
     * @param {Object} data - { id, x, y, z, rotation }
     */
    onPlayerMove(data) {
        // 子类实现
    }

    /**
     * 玩家动作处理
     * @param {Object} data - 动作数据
     */
    onPlayerAction(data) {
        // 子类实现
    }

    /**
     * 玩家断线处理
     * @param {Object} data - { id }
     */
    onPlayerDisconnected(data) {
        const player = this.players.get(data.id);
        if (player) {
            this.sceneManager.remove(player.mesh);
            this.players.delete(data.id);
        }
    }

    /**
     * 游戏结束处理
     * @param {Object} data - 结算数据
     */
    onGameEnd(data) {
        this.stop();
        this.eventBus.emit('game:ended', data);
    }

    // ==================== 工具方法 ====================

    /**
     * 发送玩家位置
     * @param {Object} position - { x, y, z }
     * @param {Object} rotation - { y, pitch }
     */
    sendPosition(position, rotation) {
        this.network.emit(GAME_EVENTS.PLAYER_MOVE, {
            ...position,
            ...rotation
        });
    }

    /**
     * 发送玩家动作
     * @param {string} action - 动作类型
     * @param {Object} data - 动作数据
     */
    sendAction(action, data = {}) {
        this.network.emit(GAME_EVENTS.PLAYER_ACTION, {
            action,
            ...data
        });
    }
}

export default GameBase;
