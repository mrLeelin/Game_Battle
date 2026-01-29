/**
 * 大厅管理器 - 处理登录、房间列表、创建/加入房间
 * 与游戏类型完全解耦
 */
import { network } from '../core/Network.js';
import { eventBus } from '../core/EventBus.js';
import { LOBBY_EVENTS, ROOM_EVENTS } from '../../shared/Events.js';
import { ROOM } from '../../shared/Constants.js';
import { getGameList } from '../../shared/GameTypes.js';

class LobbyManager {
    constructor() {
        this.username = '';
        this.currentRoom = null;
        this.roomList = [];
        this.isInRoom = false;
    }

    /**
     * 初始化大厅管理器
     */
    init() {
        this.bindNetworkEvents();
        console.log('[LobbyManager] 初始化完成');
    }

    /**
     * 绑定网络事件
     */
    bindNetworkEvents() {
        // 房间列表更新
        network.on(LOBBY_EVENTS.ROOM_LIST, (rooms) => {
            this.roomList = rooms;
            eventBus.emit('lobby:roomListUpdated', rooms);
        });

        // 加入房间成功
        network.on(LOBBY_EVENTS.JOIN_SUCCESS, (data) => {
            this.currentRoom = data.room;
            this.isInRoom = true;
            eventBus.emit('lobby:joinedRoom', data);
        });

        // 加入房间失败
        network.on(LOBBY_EVENTS.JOIN_FAILED, (data) => {
            eventBus.emit('lobby:joinFailed', data);
        });

        // 房间状态更新
        network.on(ROOM_EVENTS.STATE_UPDATE, (state) => {
            this.currentRoom = state;
            eventBus.emit('room:stateUpdated', state);
        });

        // 游戏开始
        network.on(ROOM_EVENTS.GAME_STARTING, (data) => {
            eventBus.emit('room:gameStarting', data);
        });

        // 错误处理
        network.on(LOBBY_EVENTS.ERROR, (error) => {
            console.error('[LobbyManager] 错误:', error);
            eventBus.emit('lobby:error', error);
        });
    }

    /**
     * 设置用户名
     * @param {string} name - 用户名
     */
    setUsername(name) {
        const safeName = String(name || '').trim().slice(0, 16);
        if (!safeName) {
            throw new Error('用户名不能为空');
        }
        this.username = safeName;
        network.emit(LOBBY_EVENTS.SET_USERNAME, safeName);
    }

    /**
     * 请求房间列表
     */
    requestRoomList() {
        network.emit(LOBBY_EVENTS.GET_ROOM_LIST);
    }

    /**
     * 创建房间
     * @param {string} roomName - 房间名称
     */
    createRoom(roomName) {
        const safeName = String(roomName || '').trim().slice(0, 24);
        if (!safeName) {
            throw new Error('房间名不能为空');
        }
        network.emit(LOBBY_EVENTS.CREATE_ROOM, { name: safeName });
    }

    /**
     * 加入房间
     * @param {string} roomId - 房间ID
     */
    joinRoom(roomId) {
        network.emit(LOBBY_EVENTS.JOIN_ROOM, { roomId });
    }

    /**
     * 离开房间
     */
    leaveRoom() {
        if (this.isInRoom) {
            network.emit(ROOM_EVENTS.LEAVE_ROOM);
            this.currentRoom = null;
            this.isInRoom = false;
            eventBus.emit('room:left');
        }
    }

    /**
     * 切换准备状态
     */
    toggleReady() {
        if (this.isInRoom) {
            network.emit(ROOM_EVENTS.TOGGLE_READY);
        }
    }

    /**
     * 设置游戏类型（仅房主）
     * @param {string} gameType - 游戏类型ID
     */
    setGameType(gameType) {
        if (this.isInRoom && this.isHost()) {
            network.emit(ROOM_EVENTS.SET_GAME_TYPE, { gameType });
        }
    }

    /**
     * 开始游戏（仅房主）
     */
    startGame() {
        if (this.isInRoom && this.isHost() && this.canStartGame()) {
            network.emit(ROOM_EVENTS.START_GAME);
        }
    }

    /**
     * 检查当前用户是否是房主
     * @returns {boolean}
     */
    isHost() {
        return this.currentRoom?.hostId === network.id;
    }

    /**
     * 检查是否可以开始游戏
     * @returns {boolean}
     */
    canStartGame() {
        if (!this.currentRoom) return false;

        const players = this.currentRoom.players || [];
        const hostId = this.currentRoom.hostId;

        // 检查人数
        if (players.length < ROOM.MIN_PLAYERS) return false;

        // 检查是否选择了游戏类型
        if (!this.currentRoom.gameType) return false;

        // 检查所有非房主玩家是否准备
        const othersReady = players
            .filter(p => p.id !== hostId)
            .every(p => p.ready);

        return othersReady;
    }

    /**
     * 获取可选游戏列表
     * @returns {Array}
     */
    getAvailableGames() {
        return getGameList();
    }

    /**
     * 检查房间是否可加入
     * @param {Object} room - 房间信息
     * @returns {boolean}
     */
    canJoinRoom(room) {
        return room.status === ROOM.STATUS.WAITING &&
               room.playerCount < ROOM.MAX_PLAYERS;
    }

    /**
     * 销毁
     */
    destroy() {
        this.leaveRoom();
        this.username = '';
        this.roomList = [];
    }
}

// 全局单例
export const lobbyManager = new LobbyManager();
export default LobbyManager;
