/**
 * 抢球大战 - 客户端游戏主类
 * 4队混战，抢球得分，60秒倒计时
 */
import * as THREE from 'three';
import { network } from '../../core/Network.js';
import { eventBus } from '../../core/EventBus.js';
import { GAME_EVENTS, BALLGAME_EVENTS } from '../../../shared/Events.js';
import { BallGameScene } from './BallGameScene.js';
import { BallGameUI } from './BallGameUI.js';
import { BallGameInput } from './BallGameInput.js';

// 队伍配置
export const TEAMS = {
    RED: { id: 0, name: '红队', color: 0xff4444, spawnAngle: 0 },
    BLUE: { id: 1, name: '蓝队', color: 0x4444ff, spawnAngle: Math.PI / 2 },
    GREEN: { id: 2, name: '绿队', color: 0x44ff44, spawnAngle: Math.PI },
    YELLOW: { id: 3, name: '黄队', color: 0xffff44, spawnAngle: Math.PI * 1.5 }
};

export class BallGame {
    constructor() {
        this.scene = null;
        this.ui = null;
        this.input = null;

        // 游戏状态
        this.players = new Map();       // 所有玩家
        this.balls = new Map();         // 场上的球
        this.teamScores = [0, 0, 0, 0]; // 4队分数
        this.countdown = 60;            // 倒计时
        this.isRunning = false;
        this.isReady = false;           // 场景是否准备好

        // 缓存的初始化数据（如果场景还没准备好）
        this.pendingInitData = null;

        // 本地玩家信息
        this.localPlayerId = network.id;
        this.localTeamId = 0;
        this.holdingBall = null;        // 正在持有的球ID
    }

    /**
     * 初始化游戏
     */
    async init() {
        console.log('[BallGame] 初始化...');

        // 先绑定网络事件（确保不丢失服务端消息）
        this.bindNetworkEvents();

        // 创建场景
        this.scene = new BallGameScene();
        await this.scene.init();

        // 创建UI
        this.ui = new BallGameUI();
        this.ui.init();

        // 创建输入控制
        this.input = new BallGameInput(this);
        this.input.init();

        // 标记场景准备好
        this.isReady = true;

        // 如果有缓存的初始化数据，现在处理
        if (this.pendingInitData) {
            console.log('[BallGame] 处理缓存的初始化数据');
            this.processInitData(this.pendingInitData);
            this.pendingInitData = null;
        }

        console.log('[BallGame] 初始化完成');
    }

    /**
     * 绑定网络事件
     */
    bindNetworkEvents() {
        // 游戏初始化数据
        network.on(GAME_EVENTS.INIT, (data) => {
            this.handleGameInit(data);
        });

        // 游戏开始
        network.on(GAME_EVENTS.START, () => {
            this.isRunning = true;
            this.ui.showMessage('游戏开始！');
        });

        // 游戏结束
        network.on(GAME_EVENTS.END, (data) => {
            this.handleGameEnd(data);
        });

        // 玩家状态同步
        network.on(GAME_EVENTS.STATE_SYNC, (data) => {
            this.handleStateSync(data);
        });

        // 球被捡起
        network.on(BALLGAME_EVENTS.BALL_PICKED, (data) => {
            this.handleBallPicked(data);
        });

        // 球被放下
        network.on(BALLGAME_EVENTS.BALL_DROPPED, (data) => {
            this.handleBallDropped(data);
        });

        // 进球得分
        network.on(BALLGAME_EVENTS.BALL_SCORED, (data) => {
            this.handleBallScored(data);
        });

        // 分数更新
        network.on(BALLGAME_EVENTS.TEAM_SCORES, (data) => {
            this.teamScores = data.scores;
            this.ui.updateScores(this.teamScores);
        });

        // 倒计时
        network.on(BALLGAME_EVENTS.GAME_COUNTDOWN, (data) => {
            this.countdown = data.time;
            this.ui.updateCountdown(this.countdown);
        });

        // 游戏结果
        network.on(BALLGAME_EVENTS.GAME_RESULT, (data) => {
            this.handleGameResult(data);
        });

        // 球被投掷
        network.on(BALLGAME_EVENTS.BALL_THROWN, (data) => {
            this.handleBallThrown(data);
        });
    }

    /**
     * 处理游戏初始化
     */
    handleGameInit(data) {
        console.log('[BallGame] 收到初始化数据:', data);

        // 如果场景还没准备好，先缓存数据
        if (!this.isReady) {
            console.log('[BallGame] 场景未就绪，缓存初始化数据');
            this.pendingInitData = data;
            return;
        }

        this.processInitData(data);
    }

    /**
     * 处理初始化数据
     */
    processInitData(data) {
        // 设置本地队伍
        this.localTeamId = data.teamId;

        // 初始化玩家
        data.players.forEach(p => {
            this.addPlayer(p);
        });

        // 初始化球
        data.balls.forEach(b => {
            this.addBall(b);
        });

        // 设置本地玩家初始位置
        const localPlayer = data.players.find(p => p.id === this.localPlayerId);
        if (localPlayer && this.input) {
            this.input.setPosition(localPlayer.x, localPlayer.z);
        }

        // 更新UI
        this.ui?.setLocalTeam(this.localTeamId);
        this.ui?.updateScores(data.scores || [0, 0, 0, 0]);
    }

    /**
     * 添加玩家
     */
    addPlayer(playerData) {
        const mesh = this.scene.createPlayer(playerData);
        this.players.set(playerData.id, {
            ...playerData,
            mesh
        });
    }

    /**
     * 添加球
     */
    addBall(ballData) {
        const mesh = this.scene.createBall(ballData);
        this.balls.set(ballData.id, {
            ...ballData,
            mesh
        });
    }

    /**
     * 处理状态同步
     */
    handleStateSync(data) {
        // 更新玩家位置（使用动画系统）
        data.players?.forEach(p => {
            const player = this.players.get(p.id);
            if (player && p.id !== this.localPlayerId) {
                // 设置目标位置，动画系统会平滑移动
                this.scene.setPlayerTarget(p.id, p.x, p.z);
                player.x = p.x;
                player.z = p.z;
                player.holdingBall = p.holdingBall;
            }
        });

        // 更新球位置
        data.balls?.forEach(b => {
            const ball = this.balls.get(b.id);
            if (ball && !b.heldBy) {
                ball.mesh.position.set(b.x, 0.3, b.z);
                ball.mesh.visible = true;
            }
        });
    }

    /**
     * 处理球被捡起
     */
    handleBallPicked(data) {
        const ball = this.balls.get(data.ballId);
        if (ball) {
            ball.mesh.visible = false;
            ball.heldBy = data.playerId;
        }

        // 显示球在玩家头顶
        this.scene.playerHoldBall(data.playerId, data.ballId);

        if (data.playerId === this.localPlayerId) {
            this.holdingBall = data.ballId;
            this.ui.showMessage('捡起球了！');
        }
    }

    /**
     * 处理球被放下
     */
    handleBallDropped(data) {
        const ball = this.balls.get(data.ballId);
        if (ball) {
            ball.mesh.position.set(data.x, 0.3, data.z);
            ball.mesh.visible = true;
            ball.heldBy = null;
        }

        // 隐藏玩家头顶的球
        this.scene.playerDropBall(data.playerId);

        if (data.playerId === this.localPlayerId) {
            this.holdingBall = null;
        }
    }

    /**
     * 处理进球得分
     */
    handleBallScored(data) {
        const ball = this.balls.get(data.ballId);
        if (ball) {
            // 球消失，稍后重新生成
            ball.mesh.visible = false;
        }

        // 隐藏玩家头顶的球（如果是手持得分）
        if (data.playerId) {
            this.scene.playerDropBall(data.playerId);
        }

        if (data.playerId === this.localPlayerId) {
            this.holdingBall = null;
            this.ui.showMessage(`+1 得分！`, 'success');
        } else if (data.teamId === this.localTeamId) {
            this.ui.showMessage(`队友得分！`, 'success');
        }

        // 更新分数
        this.teamScores = data.scores;
        this.ui.updateScores(this.teamScores);
    }

    /**
     * 处理球被投掷
     */
    handleBallThrown(data) {
        // 隐藏玩家头顶的球
        this.scene.playerDropBall(data.playerId);

        // 隐藏原来的球
        const ball = this.balls.get(data.ballId);
        if (ball) {
            ball.mesh.visible = false;
        }

        if (data.playerId === this.localPlayerId) {
            this.holdingBall = null;
        }

        // 播放投掷动画
        this.scene.throwBall(
            data.fromX, data.fromZ,
            data.toX, data.toZ,
            data.ballId,
            () => {
                // 动画完成后，如果进球了服务端会发 BALL_SCORED
                // 如果没进，服务端会发 BALL_DROPPED
            }
        );
    }

    /**
     * 处理游戏结果
     */
    handleGameResult(data) {
        this.isRunning = false;
        this.ui.showResult(data.winners, data.scores, this.localTeamId);
    }

    /**
     * 处理游戏结束
     */
    handleGameEnd(data) {
        this.isRunning = false;
        console.log('[BallGame] 游戏结束');
    }

    /**
     * 开始游戏
     */
    start() {
        console.log('[BallGame] 开始运行');
        this.lastTime = performance.now();
        this.gameLoop();
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.scene) return;

        requestAnimationFrame(() => this.gameLoop());

        // 计算 deltaTime
        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // 处理输入
        if (this.isRunning) {
            this.input.update();
        }

        // 更新动画
        this.scene.updatePlayerAnimations(deltaTime);

        // 更新飞行中的球
        this.scene.updateFlyingBalls(deltaTime);

        // 更新摄像机跟随本地玩家
        const localPlayer = this.players.get(this.localPlayerId);
        if (localPlayer) {
            this.scene.updateCamera(localPlayer.x, localPlayer.z);
        }

        // 渲染场景
        this.scene.render();
    }

    /**
     * 发送移动数据
     */
    sendMove(x, z) {
        network.emit(GAME_EVENTS.PLAYER_MOVE, { x, z });

        // 本地预测 - 设置目标位置（动画系统会平滑移动）
        const localPlayer = this.players.get(this.localPlayerId);
        if (localPlayer) {
            this.scene.setPlayerTarget(this.localPlayerId, x, z);
            localPlayer.x = x;
            localPlayer.z = z;
        }
    }

    /**
     * 跳跃
     */
    jump() {
        this.scene.makePlayerJump(this.localPlayerId);
    }

    /**
     * 尝试捡球
     */
    tryPickupBall() {
        if (this.holdingBall) return;

        network.emit(BALLGAME_EVENTS.PICKUP_BALL);
    }

    /**
     * 尝试放球/得分
     */
    tryDropBall() {
        if (!this.holdingBall) return;

        network.emit(BALLGAME_EVENTS.DROP_BALL);
    }

    /**
     * 投掷球
     */
    throwBall(targetX, targetZ) {
        if (!this.holdingBall) return;

        network.emit(BALLGAME_EVENTS.THROW_BALL, {
            targetX,
            targetZ
        });
    }

    /**
     * 获取本地玩家的球门位置
     */
    getLocalGoalPosition() {
        // 球门位置与服务端一致
        const FIELD_WIDTH = 30;
        const FIELD_HEIGHT = 30;
        const goals = [
            { x: 0, z: -FIELD_HEIGHT / 2 - 1 },     // 红队 - 上
            { x: FIELD_WIDTH / 2 + 1, z: 0 },       // 蓝队 - 右
            { x: 0, z: FIELD_HEIGHT / 2 + 1 },      // 绿队 - 下
            { x: -FIELD_WIDTH / 2 - 1, z: 0 }       // 黄队 - 左
        ];
        return goals[this.localTeamId] || goals[0];
    }

    /**
     * 销毁游戏
     */
    destroy() {
        console.log('[BallGame] 销毁');

        // 移除网络事件监听
        network.off(GAME_EVENTS.INIT);
        network.off(GAME_EVENTS.START);
        network.off(GAME_EVENTS.END);
        network.off(GAME_EVENTS.STATE_SYNC);
        network.off(BALLGAME_EVENTS.BALL_PICKED);
        network.off(BALLGAME_EVENTS.BALL_DROPPED);
        network.off(BALLGAME_EVENTS.BALL_SCORED);
        network.off(BALLGAME_EVENTS.TEAM_SCORES);
        network.off(BALLGAME_EVENTS.GAME_COUNTDOWN);
        network.off(BALLGAME_EVENTS.GAME_RESULT);
        network.off(BALLGAME_EVENTS.BALL_THROWN);

        // 销毁子模块
        this.scene?.destroy();
        this.ui?.destroy();
        this.input?.destroy();

        this.scene = null;
        this.ui = null;
        this.input = null;
    }
}
