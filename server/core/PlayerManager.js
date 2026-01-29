/**
 * 玩家管理器 - 管理所有在线玩家数据
 */
export class PlayerManager {
    constructor() {
        // socketId -> PlayerData
        this.players = new Map();
    }

    /**
     * 添加玩家
     * @param {string} socketId
     * @returns {Object} 玩家数据
     */
    addPlayer(socketId) {
        const player = {
            id: socketId,
            name: `玩家-${socketId.slice(0, 4)}`,
            roomId: null,
            ready: false,
            // 游戏内数据
            x: 0,
            y: 0,
            z: 0,
            rotation: 0,
            pitch: 0,
            health: 100
        };

        this.players.set(socketId, player);
        return player;
    }

    /**
     * 移除玩家
     * @param {string} socketId
     */
    removePlayer(socketId) {
        this.players.delete(socketId);
    }

    /**
     * 获取玩家
     * @param {string} socketId
     * @returns {Object|undefined}
     */
    getPlayer(socketId) {
        return this.players.get(socketId);
    }

    /**
     * 更新玩家数据
     * @param {string} socketId
     * @param {Object} data
     */
    updatePlayer(socketId, data) {
        const player = this.players.get(socketId);
        if (player) {
            Object.assign(player, data);
        }
    }

    /**
     * 设置玩家名称
     * @param {string} socketId
     * @param {string} name
     */
    setPlayerName(socketId, name) {
        const player = this.players.get(socketId);
        if (player) {
            player.name = String(name || '').trim().slice(0, 16) || player.name;
        }
    }

    /**
     * 设置玩家房间
     * @param {string} socketId
     * @param {string|null} roomId
     */
    setPlayerRoom(socketId, roomId) {
        const player = this.players.get(socketId);
        if (player) {
            player.roomId = roomId;
            player.ready = false;
        }
    }

    /**
     * 切换准备状态
     * @param {string} socketId
     * @returns {boolean} 新的准备状态
     */
    toggleReady(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            player.ready = !player.ready;
            return player.ready;
        }
        return false;
    }

    /**
     * 重置游戏数据
     * @param {string} socketId
     */
    resetGameData(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            player.x = 0;
            player.y = 0;
            player.z = 0;
            player.rotation = 0;
            player.pitch = 0;
            player.health = 100;
        }
    }

    /**
     * 获取房间内的玩家
     * @param {string} roomId
     * @returns {Array}
     */
    getPlayersInRoom(roomId) {
        const result = [];
        for (const player of this.players.values()) {
            if (player.roomId === roomId) {
                result.push(player);
            }
        }
        return result;
    }

    /**
     * 获取在线玩家数量
     * @returns {number}
     */
    getOnlineCount() {
        return this.players.size;
    }
}
