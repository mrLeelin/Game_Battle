/**
 * 房间管理器 - 管理所有房间
 */
const { ROOM } = require('../../shared/Constants.js');
const { isValidGameType } = require('../../shared/GameTypes.js');

class RoomManager {
    constructor() {
        // roomId -> RoomData
        this.rooms = new Map();
    }

    /**
     * 创建房间
     * @param {string} roomId - 房间ID/名称
     * @param {string} hostId - 房主 Socket ID
     * @returns {Object} 房间数据
     */
    createRoom(roomId, hostId) {
        if (this.rooms.has(roomId)) {
            return this.rooms.get(roomId);
        }

        const room = {
            id: roomId,
            name: roomId,
            hostId: hostId,
            gameType: null,
            status: ROOM.STATUS.WAITING,
            players: new Set([hostId]),
            createdAt: Date.now()
        };

        this.rooms.set(roomId, room);
        console.log(`[RoomManager] 房间创建: ${roomId}`);
        return room;
    }

    /**
     * 加入房间
     * @param {string} socketId
     * @param {string} roomId
     * @returns {Object} { success, reason, room }
     */
    joinRoom(socketId, roomId) {
        const room = this.rooms.get(roomId);

        if (!room) {
            // 房间不存在，创建新房间
            const newRoom = this.createRoom(roomId, socketId);
            return { success: true, room: newRoom };
        }

        // 检查房间状态
        if (room.status === ROOM.STATUS.RUNNING) {
            return { success: false, reason: '游戏进行中，无法加入' };
        }

        // 检查人数
        if (room.players.size >= ROOM.MAX_PLAYERS) {
            return { success: false, reason: '房间已满' };
        }

        room.players.add(socketId);
        return { success: true, room };
    }

    /**
     * 离开房间
     * @param {string} socketId
     * @param {string} roomId
     */
    leaveRoom(socketId, roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.players.delete(socketId);

        // 房间空了，删除房间
        if (room.players.size === 0) {
            this.rooms.delete(roomId);
            console.log(`[RoomManager] 房间删除: ${roomId}`);
            return;
        }

        // 如果离开的是房主，转移房主
        if (room.hostId === socketId) {
            room.hostId = Array.from(room.players)[0];
            console.log(`[RoomManager] 房主转移: ${room.hostId}`);
        }
    }

    /**
     * 设置游戏类型
     * @param {string} roomId
     * @param {string} gameType
     * @param {string} requesterId - 请求者ID（必须是房主）
     * @returns {boolean}
     */
    setGameType(roomId, gameType, requesterId) {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        // 只有房主可以设置
        if (room.hostId !== requesterId) return false;

        // 游戏中不能修改
        if (room.status === ROOM.STATUS.RUNNING) return false;

        // 验证游戏类型
        if (!isValidGameType(gameType)) return false;

        room.gameType = gameType;
        return true;
    }

    /**
     * 开始游戏
     * @param {string} roomId
     * @param {string} requesterId
     * @returns {Object} { success, reason }
     */
    startGame(roomId, requesterId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, reason: '房间不存在' };
        }

        if (room.hostId !== requesterId) {
            return { success: false, reason: '只有房主可以开始游戏' };
        }

        if (!room.gameType) {
            return { success: false, reason: '请先选择游戏类型' };
        }

        if (room.players.size < ROOM.MIN_PLAYERS) {
            return { success: false, reason: `需要至少 ${ROOM.MIN_PLAYERS} 名玩家` };
        }

        room.status = ROOM.STATUS.RUNNING;
        return { success: true, gameType: room.gameType };
    }

    /**
     * 结束游戏
     * @param {string} roomId
     */
    endGame(roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.status = ROOM.STATUS.WAITING;
        }
    }

    /**
     * 获取房间
     * @param {string} roomId
     * @returns {Object|undefined}
     */
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    /**
     * 获取房间列表（用于大厅显示）
     * @returns {Array}
     */
    getRoomList() {
        const list = [];
        for (const room of this.rooms.values()) {
            list.push({
                id: room.id,
                name: room.name,
                playerCount: room.players.size,
                maxPlayers: ROOM.MAX_PLAYERS,
                status: room.status,
                gameType: room.gameType
            });
        }
        return list;
    }

    /**
     * 获取房间状态（用于房间内显示）
     * @param {string} roomId
     * @param {Function} getPlayerFn - 获取玩家数据的函数
     * @returns {Object|null}
     */
    getRoomState(roomId, getPlayerFn) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        const players = [];
        for (const playerId of room.players) {
            const player = getPlayerFn(playerId);
            if (player) {
                players.push({
                    id: player.id,
                    name: player.name,
                    ready: player.ready
                });
            }
        }

        return {
            id: room.id,
            name: room.name,
            hostId: room.hostId,
            gameType: room.gameType,
            status: room.status,
            players
        };
    }

    /**
     * 检查是否所有非房主玩家都已准备
     * @param {string} roomId
     * @param {Function} getPlayerFn
     * @returns {boolean}
     */
    isAllReady(roomId, getPlayerFn) {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        for (const playerId of room.players) {
            if (playerId === room.hostId) continue;
            const player = getPlayerFn(playerId);
            if (!player || !player.ready) return false;
        }

        return true;
    }
}

module.exports = { RoomManager };
