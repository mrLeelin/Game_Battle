/**
 * 大厅事件处理器
 */
import { LOBBY_EVENTS, ROOM_EVENTS } from '../../shared/Events.js';

export class LobbyHandler {
    constructor(io, playerManager, roomManager) {
        this.io = io;
        this.playerManager = playerManager;
        this.roomManager = roomManager;
    }

    /**
     * 绑定事件
     * @param {Socket} socket
     */
    bindEvents(socket) {
        // 设置用户名
        socket.on(LOBBY_EVENTS.SET_USERNAME, (name) => {
            this.playerManager.setPlayerName(socket.id, name);
        });

        // 设置头像
        socket.on(LOBBY_EVENTS.SET_AVATAR, (avatar) => {
            this.handleSetAvatar(socket, avatar);
        });

        // 获取房间列表
        socket.on(LOBBY_EVENTS.GET_ROOM_LIST, () => {
            socket.emit(LOBBY_EVENTS.ROOM_LIST, this.roomManager.getRoomList());
        });

        // 创建房间
        socket.on(LOBBY_EVENTS.CREATE_ROOM, (data) => {
            this.handleCreateRoom(socket, data);
        });

        // 加入房间
        socket.on(LOBBY_EVENTS.JOIN_ROOM, (data) => {
            this.handleJoinRoom(socket, data);
        });

        // 离开房间
        socket.on(ROOM_EVENTS.LEAVE_ROOM, () => {
            this.handleLeaveRoom(socket);
        });

        // 切换准备状态
        socket.on(ROOM_EVENTS.TOGGLE_READY, () => {
            this.handleToggleReady(socket);
        });

        // 设置游戏类型
        socket.on(ROOM_EVENTS.SET_GAME_TYPE, (data) => {
            this.handleSetGameType(socket, data);
        });

        // 开始游戏
        socket.on(ROOM_EVENTS.START_GAME, () => {
            this.handleStartGame(socket);
        });

        // 发送弹幕
        socket.on(ROOM_EVENTS.DANMAKU_SEND, (data) => {
            this.handleDanmakuSend(socket, data);
        });
    }

    /**
     * 处理设置头像
     * @param {Socket} socket
     * @param {Object} avatar - { type: 'emoji'|'image', data: string }
     */
    handleSetAvatar(socket, avatar) {
        console.log(`[LobbyHandler] 收到头像设置请求: ${socket.id}, 类型: ${avatar?.type}`);
        this.playerManager.setPlayerAvatar(socket.id, avatar);

        // 如果在房间内，广播房间状态更新
        const player = this.playerManager.getPlayer(socket.id);
        if (player?.roomId) {
            console.log(`[LobbyHandler] 广播房间 ${player.roomId} 状态更新`);
            this.broadcastRoomState(player.roomId);
        }
    }

    /**
     * 处理创建房间
     */
    handleCreateRoom(socket, data) {
        const roomName = String(data?.name || '').trim().slice(0, 24);
        if (!roomName) {
            socket.emit(LOBBY_EVENTS.ERROR, { message: '房间名不能为空' });
            return;
        }

        // 创建并加入房间
        const room = this.roomManager.createRoom(roomName, socket.id);
        socket.join(roomName);
        this.playerManager.setPlayerRoom(socket.id, roomName);

        socket.emit(LOBBY_EVENTS.JOIN_SUCCESS, { room: this.getRoomState(roomName) });
        this.broadcastRoomList();
    }

    /**
     * 处理加入房间
     */
    handleJoinRoom(socket, data) {
        const roomId = data?.roomId;
        if (!roomId) {
            socket.emit(LOBBY_EVENTS.JOIN_FAILED, { reason: '无效的房间ID' });
            return;
        }

        // 先离开当前房间
        const currentPlayer = this.playerManager.getPlayer(socket.id);
        if (currentPlayer?.roomId) {
            this.handleLeaveRoom(socket);
        }

        // 加入新房间
        const result = this.roomManager.joinRoom(socket.id, roomId);

        if (!result.success) {
            socket.emit(LOBBY_EVENTS.JOIN_FAILED, { reason: result.reason });
            return;
        }

        socket.join(roomId);
        this.playerManager.setPlayerRoom(socket.id, roomId);

        // 通知加入成功
        socket.emit(LOBBY_EVENTS.JOIN_SUCCESS, { room: this.getRoomState(roomId) });

        // 通知房间内其他玩家
        socket.to(roomId).emit(ROOM_EVENTS.PLAYER_JOINED, {
            id: socket.id,
            name: this.playerManager.getPlayer(socket.id)?.name
        });

        // 广播房间状态
        this.broadcastRoomState(roomId);
        this.broadcastRoomList();
    }

    /**
     * 处理离开房间
     */
    handleLeaveRoom(socket) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const roomId = player.roomId;

        socket.leave(roomId);
        this.roomManager.leaveRoom(socket.id, roomId);
        this.playerManager.setPlayerRoom(socket.id, null);

        // 通知房间内其他玩家
        this.io.to(roomId).emit(ROOM_EVENTS.PLAYER_LEFT, { id: socket.id });

        // 广播房间状态
        this.broadcastRoomState(roomId);
        this.broadcastRoomList();
    }

    /**
     * 处理准备状态切换
     */
    handleToggleReady(socket) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        this.playerManager.toggleReady(socket.id);
        this.broadcastRoomState(player.roomId);
    }

    /**
     * 处理设置游戏类型
     */
    handleSetGameType(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const success = this.roomManager.setGameType(
            player.roomId,
            data?.gameType,
            socket.id
        );

        if (success) {
            this.io.to(player.roomId).emit(ROOM_EVENTS.GAME_TYPE_CHANGED, {
                gameType: data.gameType
            });
            this.broadcastRoomState(player.roomId);
        }
    }

    /**
     * 处理开始游戏
     */
    handleStartGame(socket) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const roomId = player.roomId;

        // 检查是否所有人都准备
        const allReady = this.roomManager.isAllReady(
            roomId,
            (id) => this.playerManager.getPlayer(id)
        );

        if (!allReady) {
            socket.emit(LOBBY_EVENTS.ERROR, { message: '等待所有玩家准备' });
            return;
        }

        // 开始游戏
        const result = this.roomManager.startGame(roomId, socket.id);

        if (!result.success) {
            socket.emit(LOBBY_EVENTS.ERROR, { message: result.reason });
            return;
        }

        // 通知房间内所有玩家游戏开始
        this.io.to(roomId).emit(ROOM_EVENTS.GAME_STARTING, {
            gameType: result.gameType
        });

        this.broadcastRoomList();
    }

    /**
     * 获取房间状态
     */
    getRoomState(roomId) {
        return this.roomManager.getRoomState(
            roomId,
            (id) => this.playerManager.getPlayer(id)
        );
    }

    /**
     * 广播房间状态
     */
    broadcastRoomState(roomId) {
        const state = this.getRoomState(roomId);
        if (state) {
            this.io.to(roomId).emit(ROOM_EVENTS.STATE_UPDATE, state);
        }
    }

    /**
     * 广播房间列表
     */
    broadcastRoomList() {
        this.io.emit(LOBBY_EVENTS.ROOM_LIST, this.roomManager.getRoomList());
    }

    /**
     * 处理弹幕发送
     * @param {Socket} socket
     * @param {Object} data - { text: string }
     */
    handleDanmakuSend(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        // 校验弹幕文本
        const text = String(data?.text || '').trim().slice(0, 50);
        if (!text) return;

        // 简单的 XSS 防护（转义 HTML 字符）
        const safeText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // 广播给房间内所有玩家（包括发送者）
        this.io.to(player.roomId).emit(ROOM_EVENTS.DANMAKU_BROADCAST, {
            text: safeText,
            playerName: player.name || '匿名',
            playerId: socket.id
        });
    }
}
