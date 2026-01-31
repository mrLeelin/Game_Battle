/**
 * 抢球大战 - 服务端游戏处理器
 * 管理游戏状态、计分、倒计时
 */
import { GAME_EVENTS, BALLGAME_EVENTS } from '../../../shared/Events.js';

// 场地配置（与客户端一致）
const FIELD = {
    WIDTH: 30,
    HEIGHT: 30,
    GOAL_SIZE: 4,
    GOAL_DEPTH: 2
};

// 游戏配置
const GAME_CONFIG = {
    DURATION: 60,           // 游戏时长（秒）
    BALL_COUNT: 5,          // 初始球数量
    PICKUP_DISTANCE: 1.5,   // 捡球距离
    GOAL_DISTANCE: 2.5,     // 进球距离
    RESPAWN_DELAY: 2000,    // 球重生延迟（毫秒）
    ITEM_COUNT: 3,          // 初始道具数量
    ITEM_PICKUP_DISTANCE: 1.5, // 捡道具距离
    ITEM_RESPAWN_DELAY: 5000,  // 道具重生延迟（毫秒）
    STUN_DURATION: 2000,    // 眩晕时长（毫秒）
    ATTACK_RANGE: 2.0,      // 攻击范围
    ATTACK_ANGLE: 90        // 攻击角度（度）
};

// 道具类型
const ITEM_TYPES = {
    BASEBALL_BAT: 1         // 棒球棒
};

// 球门位置
const GOALS = [
    { teamId: 0, x: 0, z: -FIELD.HEIGHT / 2 - 1 },     // 红队 - 上
    { teamId: 1, x: FIELD.WIDTH / 2 + 1, z: 0 },       // 蓝队 - 右
    { teamId: 2, x: 0, z: FIELD.HEIGHT / 2 + 1 },      // 绿队 - 下
    { teamId: 3, x: -FIELD.WIDTH / 2 - 1, z: 0 }       // 黄队 - 左
];

// 出生点位置（靠近己方球门）
const SPAWN_POINTS = [
    [{ x: -2, z: -12 }, { x: 2, z: -12 }],   // 红队
    [{ x: 12, z: -2 }, { x: 12, z: 2 }],     // 蓝队
    [{ x: -2, z: 12 }, { x: 2, z: 12 }],     // 绿队
    [{ x: -12, z: -2 }, { x: -12, z: 2 }]    // 黄队
];

export class BallGameHandler {
    constructor(io, playerManager, roomManager) {
        this.io = io;
        this.playerManager = playerManager;
        this.roomManager = roomManager;

        // 游戏状态 (roomId -> GameState)
        this.games = new Map();
    }

    /**
     * 绑定事件
     */
    bindEvents(socket) {
        // 捡球
        socket.on(BALLGAME_EVENTS.PICKUP_BALL, () => {
            this.handlePickupBall(socket);
        });

        // 放球
        socket.on(BALLGAME_EVENTS.DROP_BALL, () => {
            this.handleDropBall(socket);
        });

        // 投掷球
        socket.on(BALLGAME_EVENTS.THROW_BALL, (data) => {
            this.handleThrowBall(socket, data);
        });

        // 玩家移动
        socket.on(GAME_EVENTS.PLAYER_MOVE, (data) => {
            this.handlePlayerMove(socket, data);
        });

        // 玩家攻击
        socket.on(BALLGAME_EVENTS.PLAYER_ATTACK, (data) => {
            this.handlePlayerAttack(socket, data);
        });

        // 玩家朝向更新
        socket.on(BALLGAME_EVENTS.PLAYER_ROTATE, (data) => {
            this.handlePlayerRotate(socket, data);
        });
    }

    /**
     * 初始化游戏
     */
    initGame(roomId, players) {
        console.log(`[BallGameHandler] 初始化游戏 房间:${roomId} 玩家:${players.length}`);

        // 创建游戏状态
        const gameState = {
            roomId,
            players: new Map(),
            balls: new Map(),
            items: new Map(),           // 场上道具
            scores: [0, 0, 0, 0],
            countdown: GAME_CONFIG.DURATION,
            isRunning: false,
            timer: null,
            syncTimer: null
        };

        // 分配队伍
        const teamCounts = [0, 0, 0, 0];
        players.forEach((playerId, index) => {
            // 轮流分配队伍
            const teamId = index % 4;
            const playerIndex = teamCounts[teamId]++;
            const spawn = SPAWN_POINTS[teamId][playerIndex] || SPAWN_POINTS[teamId][0];

            // 获取玩家名字
            const playerInfo = this.playerManager.getPlayer(playerId);
            const playerName = playerInfo?.name || `玩家${playerId.slice(-4)}`;

            gameState.players.set(playerId, {
                id: playerId,
                name: playerName,
                teamId,
                x: spawn.x,
                z: spawn.z,
                rotation: 0,            // 玩家朝向（弧度）
                holdingBall: null,
                holdingItem: null,      // 当前持有的道具 { type, uses }
                isStunned: false,       // 是否眩晕
                stunEndTime: 0          // 眩晕结束时间
            });
        });

        // 生成球
        for (let i = 0; i < GAME_CONFIG.BALL_COUNT; i++) {
            const ballId = `ball_${i}`;
            gameState.balls.set(ballId, {
                id: ballId,
                x: (Math.random() - 0.5) * 10,
                z: (Math.random() - 0.5) * 10,
                heldBy: null
            });
        }

        // 生成道具（棒球棒）
        for (let i = 0; i < GAME_CONFIG.ITEM_COUNT; i++) {
            const itemId = `item_${i}`;
            gameState.items.set(itemId, {
                id: itemId,
                type: ITEM_TYPES.BASEBALL_BAT,
                x: (Math.random() - 0.5) * 20,
                z: (Math.random() - 0.5) * 20,
                isActive: true          // 是否可捡取
            });
        }

        this.games.set(roomId, gameState);

        // 延迟发送初始化数据，等待客户端准备好
        setTimeout(() => {
            // 发送初始化数据给每个玩家
            players.forEach(playerId => {
                const playerState = gameState.players.get(playerId);
                const socket = this.io.sockets.sockets.get(playerId);

                if (socket) {
                    socket.emit(GAME_EVENTS.INIT, {
                        teamId: playerState.teamId,
                        players: Array.from(gameState.players.values()),
                        balls: Array.from(gameState.balls.values()),
                        items: Array.from(gameState.items.values()),
                        scores: gameState.scores
                    });
                }
            });
        }, 500);  // 等待500ms让客户端加载模块

        // 延迟开始游戏
        setTimeout(() => {
            this.startGame(roomId);
        }, 2500);  // 增加到2.5秒

        return gameState;
    }

    /**
     * 开始游戏
     */
    startGame(roomId) {
        const game = this.games.get(roomId);
        if (!game) return;

        game.isRunning = true;
        this.io.to(roomId).emit(GAME_EVENTS.START);

        // 倒计时
        game.timer = setInterval(() => {
            game.countdown--;
            this.io.to(roomId).emit(BALLGAME_EVENTS.GAME_COUNTDOWN, { time: game.countdown });

            if (game.countdown <= 0) {
                this.endGame(roomId);
            }
        }, 1000);

        // 状态同步（每100ms）
        game.syncTimer = setInterval(() => {
            this.syncState(roomId);
        }, 100);
    }

    /**
     * 结束游戏
     */
    endGame(roomId) {
        const game = this.games.get(roomId);
        if (!game) return;

        game.isRunning = false;

        // 清理定时器
        if (game.timer) clearInterval(game.timer);
        if (game.syncTimer) clearInterval(game.syncTimer);

        // 计算胜者
        const maxScore = Math.max(...game.scores);
        const winners = game.scores
            .map((score, teamId) => ({ score, teamId }))
            .filter(t => t.score === maxScore)
            .map(t => t.teamId);

        // 发送结果
        this.io.to(roomId).emit(BALLGAME_EVENTS.GAME_RESULT, {
            winners,
            scores: game.scores
        });

        this.io.to(roomId).emit(GAME_EVENTS.END, { winners });

        // 清理游戏状态
        setTimeout(() => {
            this.games.delete(roomId);
        }, 5000);

        console.log(`[BallGameHandler] 游戏结束 房间:${roomId} 胜者:${winners}`);
    }

    /**
     * 同步状态
     */
    syncState(roomId) {
        const game = this.games.get(roomId);
        if (!game) return;

        const now = Date.now();

        // 检查眩晕状态和自动捡道具
        game.players.forEach((gamePlayer, playerId) => {
            // 检查眩晕是否结束
            if (gamePlayer.isStunned && now >= gamePlayer.stunEndTime) {
                gamePlayer.isStunned = false;
                this.io.to(roomId).emit(BALLGAME_EVENTS.PLAYER_UNSTUN, {
                    playerId: playerId
                });
            }

            // 自动捡道具（如果不在眩晕状态）
            if (!gamePlayer.isStunned) {
                this.tryAutoPickupItem(game, gamePlayer);
            }
        });

        this.io.to(roomId).emit(GAME_EVENTS.STATE_SYNC, {
            players: Array.from(game.players.values()),
            balls: Array.from(game.balls.values()),
            items: Array.from(game.items.values()).filter(item => item.isActive)
        });
    }

    /**
     * 处理玩家移动
     */
    handlePlayerMove(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game || !game.isRunning) return;

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer) return;

        // 眩晕状态不能移动
        if (gamePlayer.isStunned) return;

        // 更新位置
        gamePlayer.x = Math.max(-FIELD.WIDTH / 2, Math.min(FIELD.WIDTH / 2, data.x));
        gamePlayer.z = Math.max(-FIELD.HEIGHT / 2, Math.min(FIELD.HEIGHT / 2, data.z));

        // 如果持有球，检查是否进入己方球门
        if (gamePlayer.holdingBall) {
            const goal = GOALS[gamePlayer.teamId];
            const dist = this.getDistance(gamePlayer.x, gamePlayer.z, goal.x, goal.z);

            if (dist < GAME_CONFIG.GOAL_DISTANCE) {
                this.scoreBall(game, gamePlayer);
            }
        }
    }

    /**
     * 处理捡球
     */
    handlePickupBall(socket) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game || !game.isRunning) return;

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer || gamePlayer.holdingBall) return;

        // 查找最近的可捡球
        let nearestBall = null;
        let nearestDist = GAME_CONFIG.PICKUP_DISTANCE;

        game.balls.forEach(ball => {
            if (ball.heldBy) return; // 已被持有

            const dist = this.getDistance(gamePlayer.x, gamePlayer.z, ball.x, ball.z);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestBall = ball;
            }
        });

        // 检查是否可以从别人球门偷球
        if (!nearestBall) {
            GOALS.forEach(goal => {
                if (goal.teamId === gamePlayer.teamId) return; // 不能从自己球门拿

                const dist = this.getDistance(gamePlayer.x, gamePlayer.z, goal.x, goal.z);
                if (dist < GAME_CONFIG.GOAL_DISTANCE && game.scores[goal.teamId] > 0) {
                    // 可以偷球
                    this.stealBall(game, gamePlayer, goal.teamId);
                }
            });
            return;
        }

        // 捡起球
        nearestBall.heldBy = socket.id;
        gamePlayer.holdingBall = nearestBall.id;

        this.io.to(player.roomId).emit(BALLGAME_EVENTS.BALL_PICKED, {
            ballId: nearestBall.id,
            playerId: socket.id
        });
    }

    /**
     * 处理放球
     */
    handleDropBall(socket) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game || !game.isRunning) return;

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer || !gamePlayer.holdingBall) return;

        const ball = game.balls.get(gamePlayer.holdingBall);
        if (!ball) return;

        // 普通放下
        ball.heldBy = null;
        ball.x = gamePlayer.x;
        ball.z = gamePlayer.z;
        gamePlayer.holdingBall = null;

        this.io.to(player.roomId).emit(BALLGAME_EVENTS.BALL_DROPPED, {
            ballId: ball.id,
            playerId: socket.id,
            x: ball.x,
            z: ball.z
        });
    }

    /**
     * 处理投掷球
     */
    handleThrowBall(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game || !game.isRunning) return;

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer || !gamePlayer.holdingBall) return;

        const ball = game.balls.get(gamePlayer.holdingBall);
        if (!ball) return;

        const targetX = data.targetX;
        const targetZ = data.targetZ;

        // 广播投掷动画
        this.io.to(player.roomId).emit(BALLGAME_EVENTS.BALL_THROWN, {
            ballId: ball.id,
            playerId: socket.id,
            fromX: gamePlayer.x,
            fromZ: gamePlayer.z,
            toX: targetX,
            toZ: targetZ
        });

        // 清除玩家持球状态
        gamePlayer.holdingBall = null;
        ball.heldBy = null;

        // 延迟检测是否进球（等待动画完成）
        setTimeout(() => {
            if (!game.isRunning) return;

            // 检测是否落入己方球门
            const goal = GOALS[gamePlayer.teamId];
            const dist = this.getDistance(targetX, targetZ, goal.x, goal.z);

            if (dist < GAME_CONFIG.GOAL_DISTANCE + 1) {
                // 进球得分
                game.scores[gamePlayer.teamId]++;

                this.io.to(player.roomId).emit(BALLGAME_EVENTS.BALL_SCORED, {
                    ballId: ball.id,
                    playerId: socket.id,
                    teamId: gamePlayer.teamId,
                    scores: game.scores
                });

                // 球重生
                setTimeout(() => {
                    if (game.isRunning) {
                        ball.x = (Math.random() - 0.5) * 10;
                        ball.z = (Math.random() - 0.5) * 10;

                        this.io.to(player.roomId).emit(BALLGAME_EVENTS.BALL_SPAWNED, {
                            ballId: ball.id,
                            x: ball.x,
                            z: ball.z
                        });
                    }
                }, GAME_CONFIG.RESPAWN_DELAY);
            } else {
                // 没进球，球落地
                ball.x = targetX;
                ball.z = targetZ;

                // 限制在场地内
                ball.x = Math.max(-FIELD.WIDTH / 2, Math.min(FIELD.WIDTH / 2, ball.x));
                ball.z = Math.max(-FIELD.HEIGHT / 2, Math.min(FIELD.HEIGHT / 2, ball.z));

                this.io.to(player.roomId).emit(BALLGAME_EVENTS.BALL_DROPPED, {
                    ballId: ball.id,
                    playerId: socket.id,
                    x: ball.x,
                    z: ball.z
                });
            }
        }, 500); // 0.5秒后判定（与客户端动画时间一致）
    }

    /**
     * 进球得分
     */
    scoreBall(game, gamePlayer) {
        const ball = game.balls.get(gamePlayer.holdingBall);
        if (!ball) return;

        // 增加分数
        game.scores[gamePlayer.teamId]++;

        // 球消失
        ball.heldBy = null;
        ball.x = 0;
        ball.z = 0;
        gamePlayer.holdingBall = null;

        // 广播得分
        this.io.to(game.roomId).emit(BALLGAME_EVENTS.BALL_SCORED, {
            ballId: ball.id,
            playerId: gamePlayer.id,
            teamId: gamePlayer.teamId,
            scores: game.scores
        });

        // 球重生
        setTimeout(() => {
            if (game.isRunning) {
                ball.x = (Math.random() - 0.5) * 10;
                ball.z = (Math.random() - 0.5) * 10;

                this.io.to(game.roomId).emit(BALLGAME_EVENTS.BALL_SPAWNED, {
                    ballId: ball.id,
                    x: ball.x,
                    z: ball.z
                });
            }
        }, GAME_CONFIG.RESPAWN_DELAY);
    }

    /**
     * 偷球（从别人球门拿球）
     */
    stealBall(game, gamePlayer, targetTeamId) {
        if (game.scores[targetTeamId] <= 0) return;
        if (gamePlayer.holdingBall) return;

        // 减少对方分数
        game.scores[targetTeamId]--;

        // 创建临时球给玩家
        const ballId = `stolen_${Date.now()}`;
        const ball = {
            id: ballId,
            x: gamePlayer.x,
            z: gamePlayer.z,
            heldBy: gamePlayer.id
        };

        game.balls.set(ballId, ball);
        gamePlayer.holdingBall = ballId;

        // 广播
        this.io.to(game.roomId).emit(BALLGAME_EVENTS.BALL_STOLEN, {
            playerId: gamePlayer.id,
            fromTeamId: targetTeamId,
            ballId
        });

        this.io.to(game.roomId).emit(BALLGAME_EVENTS.TEAM_SCORES, {
            scores: game.scores
        });
    }

    /**
     * 计算距离
     */
    getDistance(x1, z1, x2, z2) {
        return Math.sqrt((x1 - x2) ** 2 + (z1 - z2) ** 2);
    }

    /**
     * 玩家断开连接
     */
    onPlayerDisconnect(playerId, roomId) {
        const game = this.games.get(roomId);
        if (!game) return;

        const gamePlayer = game.players.get(playerId);
        if (gamePlayer?.holdingBall) {
            const ball = game.balls.get(gamePlayer.holdingBall);
            if (ball) {
                ball.heldBy = null;
                ball.x = gamePlayer.x;
                ball.z = gamePlayer.z;
            }
        }

        game.players.delete(playerId);
    }

    /**
     * 处理玩家朝向更新
     */
    handlePlayerRotate(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game) return;

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer) return;

        gamePlayer.rotation = data.rotation;
    }

    /**
     * 自动捡道具（单道具模式：捡新的会丢弃旧的）
     */
    tryAutoPickupItem(game, gamePlayer) {
        const now = Date.now();

        game.items.forEach(item => {
            if (!item.isActive) return;

            // 检查道具是否在冷却期（刚丢弃的道具1秒内不能被捡起）
            if (item.dropTime && now - item.dropTime < 1000) return;

            const dist = this.getDistance(gamePlayer.x, gamePlayer.z, item.x, item.z);
            if (dist < GAME_CONFIG.ITEM_PICKUP_DISTANCE) {
                // 如果已经持有道具，先丢弃旧道具
                if (gamePlayer.holdingItem) {
                    // 旧道具掉落在稍微偏移的位置，避免立即被捡起
                    const offsetAngle = Math.random() * Math.PI * 2;
                    const offsetDist = 2.0;  // 掉落在2单位远的地方
                    const dropX = gamePlayer.x + Math.cos(offsetAngle) * offsetDist;
                    const dropZ = gamePlayer.z + Math.sin(offsetAngle) * offsetDist;

                    const droppedItemId = `dropped_${Date.now()}`;
                    game.items.set(droppedItemId, {
                        id: droppedItemId,
                        type: gamePlayer.holdingItem.type,
                        x: Math.max(-FIELD.WIDTH / 2, Math.min(FIELD.WIDTH / 2, dropX)),
                        z: Math.max(-FIELD.HEIGHT / 2, Math.min(FIELD.HEIGHT / 2, dropZ)),
                        isActive: true,
                        dropTime: now  // 记录掉落时间，用于冷却判断
                    });

                    // 广播道具掉落
                    this.io.to(game.roomId).emit(BALLGAME_EVENTS.ITEM_SPAWNED, {
                        itemId: droppedItemId,
                        type: gamePlayer.holdingItem.type,
                        x: dropX,
                        z: dropZ
                    });
                }

                // 捡起新道具
                item.isActive = false;
                gamePlayer.holdingItem = {
                    type: item.type,
                    uses: 1  // 棒球棒用1次
                };

                // 广播道具被捡起
                this.io.to(game.roomId).emit(BALLGAME_EVENTS.ITEM_PICKED, {
                    itemId: item.id,
                    playerId: gamePlayer.id,
                    itemType: item.type,
                    holdingItem: gamePlayer.holdingItem
                });

                // 道具重生
                setTimeout(() => {
                    if (game.isRunning) {
                        item.x = (Math.random() - 0.5) * 20;
                        item.z = (Math.random() - 0.5) * 20;
                        item.isActive = true;
                        item.dropTime = null;  // 清除掉落时间

                        this.io.to(game.roomId).emit(BALLGAME_EVENTS.ITEM_SPAWNED, {
                            itemId: item.id,
                            type: item.type,
                            x: item.x,
                            z: item.z
                        });
                    }
                }, GAME_CONFIG.ITEM_RESPAWN_DELAY);
            }
        });
    }

    /**
     * 处理玩家攻击
     */
    handlePlayerAttack(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game || !game.isRunning) return;

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer) return;

        // 眩晕状态不能攻击
        if (gamePlayer.isStunned) return;

        // 检查是否有道具可用
        if (!gamePlayer.holdingItem || gamePlayer.holdingItem.type !== ITEM_TYPES.BASEBALL_BAT) return;

        // 消耗道具
        gamePlayer.holdingItem.uses--;
        if (gamePlayer.holdingItem.uses <= 0) {
            gamePlayer.holdingItem = null;
        }

        // 广播攻击动作
        this.io.to(player.roomId).emit(BALLGAME_EVENTS.ATTACK_PERFORMED, {
            playerId: socket.id,
            rotation: gamePlayer.rotation,
            itemType: ITEM_TYPES.BASEBALL_BAT
        });

        // 通知道具使用
        this.io.to(player.roomId).emit(BALLGAME_EVENTS.ITEM_USED, {
            playerId: socket.id,
            holdingItem: gamePlayer.holdingItem
        });

        // 检测是否击中敌人
        const attackDir = gamePlayer.rotation;
        const attackRange = GAME_CONFIG.ATTACK_RANGE;
        const attackAngleRad = (GAME_CONFIG.ATTACK_ANGLE / 2) * (Math.PI / 180);

        game.players.forEach((target, targetId) => {
            if (targetId === socket.id) return; // 不打自己
            if (target.teamId === gamePlayer.teamId) return; // 不打队友
            if (target.isStunned) return; // 已眩晕的不重复打

            const dx = target.x - gamePlayer.x;
            const dz = target.z - gamePlayer.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > attackRange) return;

            // 检查角度
            const angleToTarget = Math.atan2(dx, dz);
            let angleDiff = Math.abs(angleToTarget - attackDir);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            if (angleDiff <= attackAngleRad) {
                // 击中！
                this.applyStun(game, target, socket.id);
            }
        });
    }

    /**
     * 应用眩晕效果
     */
    applyStun(game, targetPlayer, attackerId) {
        targetPlayer.isStunned = true;
        targetPlayer.stunEndTime = Date.now() + GAME_CONFIG.STUN_DURATION;

        // 如果持有球，掉落
        if (targetPlayer.holdingBall) {
            const ball = game.balls.get(targetPlayer.holdingBall);
            if (ball) {
                ball.heldBy = null;
                ball.x = targetPlayer.x;
                ball.z = targetPlayer.z;

                this.io.to(game.roomId).emit(BALLGAME_EVENTS.BALL_DROPPED, {
                    ballId: ball.id,
                    playerId: targetPlayer.id,
                    x: ball.x,
                    z: ball.z
                });
            }
            targetPlayer.holdingBall = null;
        }

        // 广播眩晕
        this.io.to(game.roomId).emit(BALLGAME_EVENTS.PLAYER_STUNNED, {
            playerId: targetPlayer.id,
            attackerId: attackerId,
            duration: GAME_CONFIG.STUN_DURATION
        });

        // 广播击中
        this.io.to(game.roomId).emit(BALLGAME_EVENTS.PLAYER_HIT, {
            playerId: targetPlayer.id,
            attackerId: attackerId
        });
    }
}
