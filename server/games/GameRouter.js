/**
 * 游戏路由器 - 根据游戏类型分发事件到对应处理器
 */
import { GAME_EVENTS } from '../../shared/Events.js';
import { FPSGameHandler } from './fps/FPSGameHandler.js';
import { BallGameHandler } from './ballgame/BallGameHandler.js';
import { GunBeanHandler } from './gunbean/GunBeanHandler.js';

export class GameRouter {
    constructor(io, playerManager, roomManager) {
        this.io = io;
        this.playerManager = playerManager;
        this.roomManager = roomManager;

        // 游戏处理器
        this.handlers = {
            fps: new FPSGameHandler(io, playerManager, roomManager),
            ballgame: new BallGameHandler(io, playerManager, roomManager),
            gunbean: new GunBeanHandler(io, playerManager, roomManager)
        };
    }

    /**
     * 绑定事件
     * @param {Socket} socket
     */
    bindEvents(socket) {
        // 通用游戏事件
        socket.on(GAME_EVENTS.PLAYER_MOVE, (data) => {
            this.routeEvent(socket, 'onPlayerMove', data);
        });

        socket.on(GAME_EVENTS.PLAYER_ACTION, (data) => {
            this.routeEvent(socket, 'onPlayerAction', data);
        });

        // FPS 专用事件 - 直接绑定到 FPS 处理器
        this.handlers.fps?.bindEvents(socket);

        // BallGame 专用事件
        this.handlers.ballgame?.bindEvents(socket);

        // GunBean 专用事件
        this.handlers.gunbean?.bindEvents(socket);
    }

    /**
     * 路由事件到对应的游戏处理器
     */
    routeEvent(socket, method, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const room = this.roomManager.getRoom(player.roomId);
        if (!room?.gameType) return;

        const handler = this.handlers[room.gameType];
        if (handler && typeof handler[method] === 'function') {
            handler[method](socket, data);
        }
    }

    /**
     * 获取游戏处理器
     * @param {string} gameType
     * @returns {Object|undefined}
     */
    getHandler(gameType) {
        return this.handlers[gameType];
    }
}
