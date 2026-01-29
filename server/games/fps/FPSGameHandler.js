/**
 * FPS 游戏服务端处理器
 */
const { FPS_EVENTS, GAME_EVENTS } = require('../../../shared/Events.js');

class FPSGameHandler {
    constructor(io, playerManager, roomManager) {
        this.io = io;
        this.playerManager = playerManager;
        this.roomManager = roomManager;
    }

    /**
     * 绑定 FPS 专用事件
     * @param {Socket} socket
     */
    bindEvents(socket) {
        // 射击
        socket.on(FPS_EVENTS.SHOOT, () => {
            this.onShoot(socket);
        });

        // 命中
        socket.on(FPS_EVENTS.HIT, (data) => {
            this.onHit(socket, data);
        });

        // 换弹
        socket.on(FPS_EVENTS.RELOAD, () => {
            this.onReload(socket);
        });

        // 玩家移动 (FPS 版本)
        socket.on(GAME_EVENTS.PLAYER_MOVE, (data) => {
            this.onPlayerMove(socket, data);
        });
    }

    /**
     * 玩家移动
     */
    onPlayerMove(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        // 更新玩家数据
        this.playerManager.updatePlayer(socket.id, {
            x: data.x,
            y: data.y,
            z: data.z,
            rotation: data.rotation,
            pitch: data.pitch
        });

        // 广播给房间内其他玩家
        socket.to(player.roomId).emit(GAME_EVENTS.PLAYER_MOVE, {
            id: socket.id,
            x: data.x,
            y: data.y,
            z: data.z,
            rotation: data.rotation,
            pitch: data.pitch
        });
    }

    /**
     * 射击
     */
    onShoot(socket) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        // 广播射击事件
        socket.to(player.roomId).emit(FPS_EVENTS.SHOOT, {
            id: socket.id
        });
    }

    /**
     * 命中处理
     */
    onHit(socket, data) {
        const shooter = this.playerManager.getPlayer(socket.id);
        const victim = this.playerManager.getPlayer(data.targetId);

        if (!shooter || !victim) return;
        if (shooter.roomId !== victim.roomId) return;

        // 伤害计算
        const damage = 10;
        victim.health -= damage;

        // 通知受害者血量更新
        this.io.to(victim.id).emit(FPS_EVENTS.HEALTH_UPDATE, victim.health);

        // 死亡处理
        if (victim.health <= 0) {
            this.handleDeath(shooter, victim);
        }
    }

    /**
     * 死亡处理
     */
    handleDeath(killer, victim) {
        // 广播死亡事件
        this.io.to(victim.roomId).emit(FPS_EVENTS.DEATH, {
            killerId: killer.id,
            victimId: victim.id
        });

        // 重生
        this.respawnPlayer(victim);
    }

    /**
     * 重生玩家
     */
    respawnPlayer(player) {
        // 重置数据
        player.health = 100;
        player.x = (Math.random() - 0.5) * 50;
        player.z = (Math.random() - 0.5) * 50;
        player.y = 0;

        // 通知玩家重生
        this.io.to(player.id).emit(FPS_EVENTS.RESPAWN, {
            x: player.x,
            z: player.z,
            health: 100
        });

        // 广播新位置
        this.io.to(player.roomId).emit(GAME_EVENTS.PLAYER_MOVE, {
            id: player.id,
            x: player.x,
            y: player.y,
            z: player.z,
            rotation: player.rotation || 0,
            pitch: player.pitch || 0
        });
    }

    /**
     * 换弹
     */
    onReload(socket) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        socket.to(player.roomId).emit(FPS_EVENTS.RELOAD, {
            id: socket.id
        });
    }
}

module.exports = { FPSGameHandler };
