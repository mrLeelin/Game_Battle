/**
 * 服务端入口
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { SocketManager } = require('./core/SocketManager.js');
const { PlayerManager } = require('./core/PlayerManager.js');
const { RoomManager } = require('./lobby/RoomManager.js');
const { LobbyHandler } = require('./lobby/LobbyHandler.js');
const { GameRouter } = require('./games/GameRouter.js');
const { NETWORK } = require('../shared/Constants.js');

// Express 设置
const app = express();
app.use(cors());

const server = http.createServer(app);

// Socket.io 设置
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// 初始化管理器
const playerManager = new PlayerManager();
const roomManager = new RoomManager();
const socketManager = new SocketManager(io, playerManager, roomManager);

// 初始化处理器
const lobbyHandler = new LobbyHandler(io, playerManager, roomManager);
const gameRouter = new GameRouter(io, playerManager, roomManager);

// 连接处理
io.on('connection', (socket) => {
    console.log(`[Server] 玩家连接: ${socket.id}`);

    // 注册玩家
    playerManager.addPlayer(socket.id);

    // 发送房间列表
    socket.emit('lobby:roomList', roomManager.getRoomList());

    // 绑定大厅事件
    lobbyHandler.bindEvents(socket);

    // 绑定游戏事件
    gameRouter.bindEvents(socket);

    // 断开连接
    socket.on('disconnect', () => {
        console.log(`[Server] 玩家断开: ${socket.id}`);

        // 处理房间离开
        const player = playerManager.getPlayer(socket.id);
        if (player && player.roomId) {
            roomManager.leaveRoom(socket.id, player.roomId);
            lobbyHandler.broadcastRoomState(player.roomId);
            lobbyHandler.broadcastRoomList();
        }

        // 移除玩家
        playerManager.removePlayer(socket.id);
    });
});

// 启动服务器
const PORT = NETWORK?.SERVER_PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Server] FPS 服务器运行在端口 ${PORT}`);
});
