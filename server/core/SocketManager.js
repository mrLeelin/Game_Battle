/**
 * Socket 管理器 - 管理 Socket 连接
 */
class SocketManager {
    constructor(io, playerManager, roomManager) {
        this.io = io;
        this.playerManager = playerManager;
        this.roomManager = roomManager;
    }

    /**
     * 向房间广播消息
     * @param {string} roomId
     * @param {string} event
     * @param {*} data
     */
    broadcastToRoom(roomId, event, data) {
        this.io.to(roomId).emit(event, data);
    }

    /**
     * 向房间内除了指定玩家外广播
     * @param {string} roomId
     * @param {string} excludeId
     * @param {string} event
     * @param {*} data
     */
    broadcastToRoomExcept(roomId, excludeId, event, data) {
        this.io.to(roomId).except(excludeId).emit(event, data);
    }

    /**
     * 向所有人广播
     * @param {string} event
     * @param {*} data
     */
    broadcast(event, data) {
        this.io.emit(event, data);
    }

    /**
     * 向指定玩家发送消息
     * @param {string} socketId
     * @param {string} event
     * @param {*} data
     */
    sendTo(socketId, event, data) {
        this.io.to(socketId).emit(event, data);
    }
}

module.exports = { SocketManager };
