/**
 * 枪豆人 - 客户端游戏主类
 * 肉鸽模式：无限生存，经验升级，三选一技能
 */
import { network } from '../../core/Network.js';
import { GAME_EVENTS, GUNBEAN_EVENTS } from '../../../shared/Events.js';
import { GunBeanScene, ARENA } from './GunBeanScene.js';
import { GunBeanUI } from './GunBeanUI.js';
import { GunBeanInput } from './GunBeanInput.js';
import { GunBeanSkillPicker, GunBeanPauseIndicator } from './GunBeanSkillPicker.js';

// 游戏配置
const CONFIG = {
    BOAT_MAX_HP: 10,
    BULLET_SPEED: 800,      // 子弹速度翻倍，打击感更强
    REVIVE_DISTANCE: 80
};

export class GunBeanGame {
    constructor() {
        this.scene = null;
        this.ui = null;
        this.input = null;
        this.skillPicker = null;
        this.pauseIndicator = null;

        // 游戏状态
        this.boats = new Map();
        this.players = new Map();
        this.bullets = new Map();
        this.enemies = new Map();
        this.expOrbs = new Map();      // 经验球
        this.gameTime = 0;
        this.isRunning = false;
        this.isReady = false;
        this.isPaused = false;         // 暂停状态

        // 本地玩家信息
        this.localPlayerId = network.id;
        this.localPlayer = null;
        this.localBoat = null;
        this.boatHp = CONFIG.BOAT_MAX_HP;
        this.boatMaxHp = CONFIG.BOAT_MAX_HP;
        this.kills = 0;
        this.isDead = false;

        // 弹药系统
        this.ammo = 5;
        this.maxAmmo = 5;
        this.isReloading = false;

        // 肉鸽系统
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        this.skills = {};

        // 缓存的初始化数据
        this.pendingInitData = null;

        // 时间追踪
        this.lastTime = 0;
    }

    /**
     * 初始化游戏
     */
    async init() {
        console.log('[GunBeanGame] 初始化单船共享血量版本...');

        this.bindNetworkEvents();

        this.scene = new GunBeanScene();
        await this.scene.init();

        // 设置本地玩家ID，用于区分名字颜色
        this.scene.setLocalPlayerId(this.localPlayerId);

        this.ui = new GunBeanUI();
        this.ui.init();

        this.input = new GunBeanInput(this);
        this.input.init();

        // 初始化技能选择组件
        this.skillPicker = new GunBeanSkillPicker();
        this.pauseIndicator = new GunBeanPauseIndicator();

        this.isReady = true;

        if (this.pendingInitData) {
            console.log('[GunBeanGame] 处理缓存的初始化数据');
            this.processInitData(this.pendingInitData);
            this.pendingInitData = null;
        }

        console.log('[GunBeanGame] 初始化完成');
    }

    /**
     * 绑定网络事件
     */
    bindNetworkEvents() {
        network.on(GAME_EVENTS.INIT, (data) => {
            this.handleGameInit(data);
        });

        network.on(GAME_EVENTS.START, () => {
            this.isRunning = true;
            this.isPaused = false;
            this.ui.showMessage('游戏开始！');
        });

        network.on(GAME_EVENTS.END, (data) => {
            this.handleGameEnd(data);
        });

        network.on(GUNBEAN_EVENTS.PLAYER_UPDATE, (data) => {
            this.handlePlayerUpdate(data);
        });

        network.on(GUNBEAN_EVENTS.BULLET_FIRED, (data) => {
            this.handleBulletFired(data);
        });

        network.on(GUNBEAN_EVENTS.BULLET_HIT, (data) => {
            this.handleBulletHit(data);
        });

        network.on(GUNBEAN_EVENTS.PLAYER_DIED, (data) => {
            this.handlePlayerDied(data);
        });

        network.on(GUNBEAN_EVENTS.PLAYER_REVIVED, (data) => {
            this.handlePlayerRevived(data);
        });

        network.on(GUNBEAN_EVENTS.ENEMY_SPAWNED, (data) => {
            this.handleEnemySpawned(data);
        });

        network.on(GUNBEAN_EVENTS.ENEMY_DIED, (data) => {
            this.handleEnemyDied(data);
        });

        network.on(GUNBEAN_EVENTS.ENEMY_UPDATE, (data) => {
            this.handleEnemyUpdate(data);
        });

        network.on(GUNBEAN_EVENTS.GAME_RESULT, (data) => {
            this.handleGameResult(data);
        });

        // 船只被摧毁事件
        network.on(GUNBEAN_EVENTS.BOAT_DESTROYED, (data) => {
            this.handleBoatDestroyed(data);
        });

        // 船只受伤事件（敌人碰撞，触发震屏）
        network.on(GUNBEAN_EVENTS.BOAT_DAMAGED, (data) => {
            this.handleBoatDamaged(data);
        });

        // ========== 肉鸽系统事件 ==========

        // 经验球生成
        network.on(GUNBEAN_EVENTS.EXP_ORB_SPAWNED, (data) => {
            this.handleExpOrbSpawned(data);
        });

        // 经验球被收集
        network.on(GUNBEAN_EVENTS.EXP_ORB_COLLECTED, (data) => {
            this.handleExpOrbCollected(data);
        });

        // 经验更新
        network.on(GUNBEAN_EVENTS.EXP_UPDATE, (data) => {
            if (data.playerId === this.localPlayerId) {
                this.level = data.level;
                this.exp = data.exp;
                this.expToNext = data.expToNext;
                if (data.skills) {
                    this.skills = data.skills;
                    this.ui.updateSkills(this.skills);
                }
                this.ui.updateLevel(this.level, this.exp, this.expToNext);
            }
        });

        // 升级
        network.on(GUNBEAN_EVENTS.LEVEL_UP, (data) => {
            if (data.playerId === this.localPlayerId) {
                this.ui.showLevelUp(data.level);
            }
        });

        // 技能选择
        network.on(GUNBEAN_EVENTS.SKILL_CHOICES, (data) => {
            this.handleSkillChoices(data);
        });

        // 技能选择结果
        network.on(GUNBEAN_EVENTS.SKILL_SELECTED, (data) => {
            this.skills = data.skills;
            this.ui.updateSkills(this.skills);
        });

        // 游戏暂停
        network.on(GUNBEAN_EVENTS.GAME_PAUSE, (data) => {
            this.isPaused = true;
            if (data.pausedBy !== this.localPlayerId) {
                this.pauseIndicator.show('等待玩家选择技能...');
            }
        });

        // 游戏恢复
        network.on(GUNBEAN_EVENTS.GAME_RESUME, () => {
            this.isPaused = false;
            this.pauseIndicator.hide();
        });

        // ========== 弹药系统事件 ==========

        // 弹药更新
        network.on(GUNBEAN_EVENTS.AMMO_UPDATE, (data) => {
            this.ammo = data.ammo;
            this.maxAmmo = data.maxAmmo;
            this.isReloading = data.isReloading || false;
            this.ui.updateAmmo(this.ammo, this.maxAmmo);
        });

        // 开始换弹
        network.on(GUNBEAN_EVENTS.RELOAD_START, (data) => {
            this.isReloading = true;
            this.ui.showReloading(data.reloadTime);
        });

        // 换弹完成
        network.on(GUNBEAN_EVENTS.RELOAD_COMPLETE, (data) => {
            this.ammo = data.ammo;
            this.maxAmmo = data.maxAmmo;
            this.isReloading = false;
            this.ui.updateAmmo(this.ammo, this.maxAmmo);
            this.ui.hideReloading();
        });
    }

    /**
     * 处理游戏初始化
     */
    handleGameInit(data) {
        console.log('[GunBeanGame] 收到初始化数据:', data);

        if (!this.isReady) {
            console.log('[GunBeanGame] 场景未就绪，缓存初始化数据');
            this.pendingInitData = data;
            return;
        }

        this.processInitData(data);
    }

    /**
     * 处理初始化数据（肉鸽模式）
     */
    processInitData(data) {
        // 初始化船只
        if (data.boats) {
            data.boats.forEach(b => {
                this.addBoat(b);
            });
        }

        // 初始化玩家
        data.players.forEach(p => {
            this.addPlayer(p);

            if (p.id === this.localPlayerId) {
                this.localPlayer = this.players.get(p.id);
                this.localBoat = this.boats.get(p.boatId);

                // 初始化等级和经验
                this.level = p.level || 1;
                this.exp = p.exp || 0;
                this.expToNext = p.expToNext || 100;
                this.skills = p.skills || {};
                this.ui.updateLevel(this.level, this.exp, this.expToNext);
                this.ui.updateSkills(this.skills);

                // 初始化弹药
                this.ammo = p.ammo || 5;
                this.maxAmmo = p.maxAmmo || 5;
                this.isReloading = false;
                this.ui.updateAmmo(this.ammo, this.maxAmmo);

                // 使用船只HP（团队共享血量）
                if (this.localBoat) {
                    this.boatHp = this.localBoat.hp || CONFIG.BOAT_MAX_HP;
                    this.boatMaxHp = this.localBoat.maxHp || CONFIG.BOAT_MAX_HP;
                    this.ui.updateBoatHealth(this.boatHp, this.boatMaxHp);
                }
            }
        });

        // 初始化敌人
        if (data.enemies) {
            data.enemies.forEach(e => {
                this.addEnemy(e);
            });
        }

        // 更新UI
        this.ui.updateAlive(data.players.filter(p => !p.isDead).length);
    }

    /**
     * 添加船只
     */
    addBoat(boatData) {
        const boat = this.scene.createBoat(boatData);
        this.boats.set(boatData.id, {
            ...boatData,
            sceneBoat: boat
        });
        return boat;
    }

    /**
     * 添加玩家
     */
    addPlayer(playerData) {
        const mesh = this.scene.createPlayer(playerData);
        const player = {
            ...playerData,
            mesh
        };
        this.players.set(playerData.id, player);
        return player;
    }

    /**
     * 添加敌人
     */
    addEnemy(enemyData) {
        const mesh = this.scene.createEnemy(enemyData);
        this.enemies.set(enemyData.id, {
            ...enemyData,
            mesh
        });
    }

    /**
     * 处理玩家状态更新（船只HP）
     */
    handlePlayerUpdate(data) {
        // 更新游戏时间
        if (data.gameTime !== undefined) {
            this.gameTime = data.gameTime;
            this.ui.updateGameTime(this.gameTime);
        }

        // 更新暂停状态
        if (data.isPaused !== undefined) {
            this.isPaused = data.isPaused;
        }

        // 更新船只位置和HP
        if (data.boats) {
            data.boats.forEach(b => {
                const boat = this.boats.get(b.id);
                if (boat) {
                    boat.x = b.x;
                    boat.y = b.y;
                    boat.vx = b.vx;
                    boat.vy = b.vy;
                    boat.hp = b.hp;
                    boat.maxHp = b.maxHp;
                    boat.shield = b.shield || 0;
                    this.scene.updateBoatPosition(b.id, b.x, b.y, b.vx, b.vy, b.hp, b.maxHp);
                }

                // 更新本地玩家船只的HP和护盾显示
                if (this.localPlayer && this.localPlayer.boatId === b.id) {
                    this.boatHp = b.hp;
                    this.boatMaxHp = b.maxHp;
                    this.ui.updateBoatHealth(this.boatHp, this.boatMaxHp);
                    this.ui.updateShield(b.shield || 0);
                }
            });
        }

        // 更新玩家状态（无HP）
        if (data.players) {
            data.players.forEach(p => {
                const player = this.players.get(p.id);
                if (player) {
                    player.isDead = p.isDead;
                    player.boatId = p.boatId;
                    player.seatIndex = p.seatIndex;

                    // 更新场景中的玩家
                    const scenePlayer = this.scene.players.get(p.id);
                    if (scenePlayer) {
                        scenePlayer.isDead = p.isDead;
                        scenePlayer.boatId = p.boatId;
                        scenePlayer.seatIndex = p.seatIndex;
                        if (p.aimAngle !== undefined) {
                            scenePlayer.aimAngle = p.aimAngle;
                        }
                    }
                }
            });
        }

        // 更新经验球位置
        if (data.expOrbs) {
            data.expOrbs.forEach(o => {
                const orb = this.expOrbs.get(o.id);
                if (orb) {
                    orb.x = o.x;
                    orb.y = o.y;
                    this.scene.updateExpOrbPosition(o.id, o.x, o.y);
                } else {
                    // 新的经验球，创建它
                    this.expOrbs.set(o.id, o);
                    this.scene.createExpOrb(o);
                }
            });
        }

        // 更新存活人数
        const aliveCount = Array.from(this.players.values()).filter(p => !p.isDead).length;
        this.ui.updateAlive(aliveCount);
    }

    /**
     * 处理子弹发射
     */
    handleBulletFired(data) {
        this.scene.createBullet({
            id: data.bulletId,
            x: data.x,
            y: data.y,
            vx: data.dirX * CONFIG.BULLET_SPEED,
            vy: data.dirY * CONFIG.BULLET_SPEED
        });
    }

    /**
     * 处理子弹命中（更新船只HP）
     */
    handleBulletHit(data) {
        this.scene.removeBullet(data.bulletId);

        if (data.hitType === 'enemy') {
            // 敌人受击闪白效果
            this.scene.flashEntity('enemy', data.enemyId, 80);
            this.ui.showMessage('命中！', 'success');
        } else if (data.hitType === 'boat') {
            // 更新被击中船只的HP
            const hitBoat = this.boats.get(data.hitBoatId);
            if (hitBoat && data.boatHp !== undefined) {
                hitBoat.hp = data.boatHp;
                hitBoat.maxHp = data.boatMaxHp;

                // 更新场景中船只的HP
                const sceneBoat = this.scene.boats.get(data.hitBoatId);
                if (sceneBoat) {
                    sceneBoat.hp = data.boatHp;
                    sceneBoat.maxHp = data.boatMaxHp;
                }
            }

            // 检查是否是自己的船被击中
            const localPlayer = this.players.get(this.localPlayerId);
            if (localPlayer && data.hitBoatId === localPlayer.boatId) {
                this.boatHp = data.boatHp;
                this.boatMaxHp = data.boatMaxHp;
                this.ui.updateBoatHealth(this.boatHp, this.boatMaxHp);
                this.ui.showMessage('船被击中！', 'warning');

                // 船只受击：闪白 + 震屏
                this.scene.flashEntity('boat', data.hitBoatId, 150);
                this.scene.startScreenShake(12, 250);

                // 创建受击粒子效果
                const boat = this.scene.boats.get(data.hitBoatId);
                if (boat) {
                    this.scene.createHitParticles(boat.x, boat.y);
                }
            }
        }
    }

    /**
     * 处理玩家死亡
     */
    handlePlayerDied(data) {
        const player = this.players.get(data.playerId);
        if (player) {
            player.isDead = true;
            this.scene.setPlayerDead(data.playerId, true);
        }

        if (data.playerId === this.localPlayerId) {
            this.isDead = true;
            this.ui.showDeathOverlay(true);
            this.ui.hideCrosshair();
        }

        const aliveCount = Array.from(this.players.values()).filter(p => !p.isDead).length;
        this.ui.updateAlive(aliveCount);
    }

    /**
     * 处理玩家复活（恢复船只HP）
     */
    handlePlayerRevived(data) {
        const player = this.players.get(data.playerId);
        if (player) {
            player.isDead = false;
            this.scene.setPlayerDead(data.playerId, false);
        }

        // 恢复船只HP
        if (data.boatId !== undefined) {
            const boat = this.boats.get(data.boatId);
            if (boat) {
                boat.hp = data.boatHp || CONFIG.BOAT_MAX_HP;
                boat.maxHp = data.boatMaxHp || CONFIG.BOAT_MAX_HP;

                const sceneBoat = this.scene.boats.get(data.boatId);
                if (sceneBoat) {
                    sceneBoat.hp = boat.hp;
                    sceneBoat.maxHp = boat.maxHp;
                }
            }
        }

        if (data.playerId === this.localPlayerId) {
            this.isDead = false;
            this.boatHp = data.boatHp || CONFIG.BOAT_MAX_HP;
            this.boatMaxHp = data.boatMaxHp || CONFIG.BOAT_MAX_HP;
            this.ui.showDeathOverlay(false);
            this.ui.showCrosshair();
            this.ui.updateBoatHealth(this.boatHp, this.boatMaxHp);
            this.ui.showMessage('已复活！', 'success');
        }

        if (data.reviverId === this.localPlayerId) {
            this.ui.showMessage('复活了队友！', 'success');
        }

        const aliveCount = Array.from(this.players.values()).filter(p => !p.isDead).length;
        this.ui.updateAlive(aliveCount);
    }

    /**
     * 处理敌人生成
     */
    handleEnemySpawned(data) {
        this.addEnemy(data);
    }

    /**
     * 处理敌人死亡
     */
    handleEnemyDied(data) {
        this.scene.removeEnemy(data.enemyId);
        this.enemies.delete(data.enemyId);

        // 敌人死亡震屏效果
        this.scene.startScreenShake(8, 150);

        if (data.killerId === this.localPlayerId) {
            this.ui.showMessage('+1 击杀！', 'success');
        }
    }

    /**
     * 处理敌人更新
     */
    handleEnemyUpdate(data) {
        data.enemies?.forEach(e => {
            const enemy = this.enemies.get(e.id);
            if (enemy) {
                enemy.x = e.x;
                enemy.y = e.y;
                this.scene.updateEnemyPosition(e.id, e.x, e.y);
            }
        });
    }

    // ========== 肉鸽系统处理方法 ==========

    /**
     * 处理经验球生成
     */
    handleExpOrbSpawned(data) {
        const orb = {
            id: data.id,
            x: data.x,
            y: data.y,
            exp: data.exp
        };
        this.expOrbs.set(data.id, orb);
        this.scene.createExpOrb(orb);
    }

    /**
     * 处理经验球被收集
     */
    handleExpOrbCollected(data) {
        this.expOrbs.delete(data.orbId);
        this.scene.removeExpOrb(data.orbId);

        // 如果是本地玩家收集，显示收集效果
        if (data.playerId === this.localPlayerId) {
            // 可以添加收集音效或粒子效果
        }
    }

    /**
     * 处理技能选择界面
     */
    handleSkillChoices(data) {
        console.log('[GunBeanGame] 收到技能选择:', data);
        this.skillPicker.show(data);
    }

    /**
     * 处理游戏结果
     */
    handleGameResult(data) {
        this.isRunning = false;
        this.isShopOpen = false;

        // 关闭商店（如果开着的话）
        if (this.shop) {
            this.shop.hide();
        }

        const localData = data.players?.find(p => p.id === this.localPlayerId);
        this.ui.showResult({
            isWin: data.isWin,
            kills: localData?.kills || this.kills,
            surviveTime: data.surviveTime || this.countdown,
            revives: localData?.revives || 0,
            finalRound: data.finalRound || this.currentRound,
            maxRounds: data.maxRounds || this.maxRounds,
            coins: localData?.coins || this.coins
        });
    }

    /**
     * 处理商店开启
     */
    handleShopOpen(data) {
        console.log('[GunBeanGame] 商店开启', data);

        this.isRunning = false;
        this.isShopOpen = true;

        // 显示商店UI
        if (this.shop) {
            this.shop.show(data);
        }

        // 隐藏死亡界面（如果有）
        this.ui.showDeathOverlay(false);

        this.ui.showMessage(`第 ${data.round} 轮结束，进入商店！`, 'success');
    }

    /**
     * 处理船只被摧毁
     */
    handleBoatDestroyed(data) {
        const boat = this.boats.get(data.boatId);
        if (boat) {
            boat.hp = 0;
        }

        const sceneBoat = this.scene.boats.get(data.boatId);
        if (sceneBoat) {
            sceneBoat.hp = 0;
            // 船只摧毁时创建大型爆炸效果
            this.scene.createDeathExplosion(sceneBoat.x, sceneBoat.y);
        }

        // 如果是本地玩家的船
        const localPlayer = this.players.get(this.localPlayerId);
        if (localPlayer && localPlayer.boatId === data.boatId) {
            this.boatHp = 0;
            this.ui.updateBoatHealth(0, this.boatMaxHp);
            this.ui.showMessage('船被摧毁了！', 'error');

            // 强烈震屏效果
            this.scene.startScreenShake(25, 500);
        }
    }

    /**
     * 处理船只受伤（敌人碰撞）
     */
    handleBoatDamaged(data) {
        // 更新船只血量
        const boat = this.boats.get(data.boatId);
        if (boat) {
            boat.hp = data.hp;
            boat.maxHp = data.maxHp;
        }

        const sceneBoat = this.scene.boats.get(data.boatId);
        if (sceneBoat) {
            sceneBoat.hp = data.hp;
            sceneBoat.maxHp = data.maxHp;
        }

        // 检查是否是自己的船
        const localPlayer = this.players.get(this.localPlayerId);
        if (localPlayer && data.boatId === localPlayer.boatId) {
            this.boatHp = data.hp;
            this.boatMaxHp = data.maxHp;
            this.ui.updateBoatHealth(this.boatHp, this.boatMaxHp);
            this.ui.showMessage('敌人撞击！', 'warning');

            // 船只受击效果：闪白 + 震屏 + 粒子
            this.scene.flashEntity('boat', data.boatId, 150);
            this.scene.startScreenShake(15, 300);

            // 创建受击粒子
            if (sceneBoat) {
                this.scene.createHitParticles(sceneBoat.x, sceneBoat.y);
            }
        }
    }

    /**
     * 处理游戏结束
     */
    handleGameEnd(data) {
        this.isRunning = false;
        console.log('[GunBeanGame] 游戏结束');
    }

    /**
     * 开始游戏循环
     */
    start() {
        console.log('[GunBeanGame] 开始运行');
        this.lastTime = performance.now();
        this.gameLoop();
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.scene) return;

        requestAnimationFrame(() => this.gameLoop());

        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        if (this.isRunning && !this.isDead) {
            this.input.update(deltaTime);
        }

        this.scene.update(deltaTime);

        // 摄像机固定在中心，不再跟随船只
        this.scene.updateCamera(0, 0);

        this.scene.render();
    }

    /**
     * 更新瞄准方向
     */
    updateAim(angle) {
        if (this.isDead) return;

        this.scene.updatePlayerAim(this.localPlayerId, angle);

        // 发送瞄准角度给服务端，让其他玩家看到实时转向
        network.emit(GUNBEAN_EVENTS.PLAYER_ROTATE, { aimAngle: angle });
    }

    /**
     * 获取本地玩家在屏幕上的位置
     * @returns {{ x: number, y: number }} 屏幕坐标
     */
    getLocalPlayerScreenPosition() {
        const localPlayer = this.players.get(this.localPlayerId);
        if (!localPlayer) {
            // 默认返回屏幕中心
            return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        }

        const boat = this.boats.get(localPlayer.boatId);
        if (!boat || !this.scene) {
            return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        }

        // 动态座位偏移（根据玩家数量）
        const playerCount = this.players.size;
        const getSeatOffsets = (count) => {
            if (count <= 1) return [0];
            if (count === 2) return [-20, 20];
            if (count === 3) return [-30, 0, 30];
            return [-45, -15, 15, 45];
        };
        const seatOffsets = getSeatOffsets(playerCount);
        const seatOffset = seatOffsets[localPlayer.seatIndex] || 0;
        const playerGameX = boat.x + seatOffset;
        const playerGameY = boat.y;

        // 转换为屏幕坐标
        return this.scene.gameToScreen(playerGameX, playerGameY);
    }

    /**
     * 射击
     */
    shoot(dirX, dirY) {
        if (!this.isRunning || this.isDead) return;

        // 正在换弹时不能射击
        if (this.isReloading) {
            this.ui.showMessage('换弹中...', 'warning');
            return;
        }

        // 没有弹药时提示
        if (this.ammo <= 0) {
            this.ui.showMessage('弹药用尽！', 'warning');
            return;
        }

        network.emit(GUNBEAN_EVENTS.SHOOT, {
            dirX,
            dirY
        });
    }

    /**
     * 手动换弹
     */
    reload() {
        if (!this.isRunning || this.isDead) return;
        if (this.isReloading) return;
        if (this.ammo >= this.maxAmmo) return;

        network.emit(GUNBEAN_EVENTS.RELOAD);
    }

    /**
     * 尝试复活队友
     */
    tryRevive() {
        if (!this.isRunning || this.isDead) return;

        const localPlayer = this.players.get(this.localPlayerId);
        if (!localPlayer) return;

        const localBoat = this.boats.get(localPlayer.boatId);
        if (!localBoat) return;

        // 查找附近死亡的队友（优先同船）
        let nearestDead = null;
        let nearestDist = CONFIG.REVIVE_DISTANCE;

        this.players.forEach((player, id) => {
            if (id === this.localPlayerId) return;
            if (!player.isDead) return;

            // 同船可以直接复活
            if (player.boatId === localPlayer.boatId) {
                nearestDead = player;
                nearestDist = 0;
                return;
            }

            // 不同船需要检查距离
            const otherBoat = this.boats.get(player.boatId);
            if (!otherBoat) return;

            const dx = otherBoat.x - localBoat.x;
            const dy = otherBoat.y - localBoat.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < nearestDist) {
                nearestDist = dist;
                nearestDead = player;
            }
        });

        if (nearestDead) {
            network.emit(GUNBEAN_EVENTS.REVIVE, {
                targetId: nearestDead.id
            });
        } else {
            this.ui.showMessage('附近没有倒下的队友', 'warning');
        }
    }

    /**
     * 销毁游戏
     */
    destroy() {
        console.log('[GunBeanGame] 销毁');

        // 清理基础事件
        network.off(GAME_EVENTS.INIT);
        network.off(GAME_EVENTS.START);
        network.off(GAME_EVENTS.END);
        network.off(GUNBEAN_EVENTS.PLAYER_UPDATE);
        network.off(GUNBEAN_EVENTS.BULLET_FIRED);
        network.off(GUNBEAN_EVENTS.BULLET_HIT);
        network.off(GUNBEAN_EVENTS.PLAYER_DIED);
        network.off(GUNBEAN_EVENTS.PLAYER_REVIVED);
        network.off(GUNBEAN_EVENTS.ENEMY_SPAWNED);
        network.off(GUNBEAN_EVENTS.ENEMY_DIED);
        network.off(GUNBEAN_EVENTS.ENEMY_UPDATE);
        network.off(GUNBEAN_EVENTS.GAME_RESULT);
        network.off(GUNBEAN_EVENTS.BOAT_DESTROYED);
        network.off(GUNBEAN_EVENTS.BOAT_DAMAGED);

        // 清理肉鸽系统事件
        network.off(GUNBEAN_EVENTS.EXP_ORB_SPAWNED);
        network.off(GUNBEAN_EVENTS.EXP_ORB_COLLECTED);
        network.off(GUNBEAN_EVENTS.EXP_UPDATE);
        network.off(GUNBEAN_EVENTS.LEVEL_UP);
        network.off(GUNBEAN_EVENTS.SKILL_CHOICES);
        network.off(GUNBEAN_EVENTS.SKILL_SELECTED);
        network.off(GUNBEAN_EVENTS.GAME_PAUSE);
        network.off(GUNBEAN_EVENTS.GAME_RESUME);

        // 清理弹药系统事件
        network.off(GUNBEAN_EVENTS.AMMO_UPDATE);
        network.off(GUNBEAN_EVENTS.RELOAD_START);
        network.off(GUNBEAN_EVENTS.RELOAD_COMPLETE);

        this.scene?.destroy();
        this.ui?.destroy();
        this.input?.destroy();
        this.skillPicker?.destroy();
        this.pauseIndicator?.hide();

        this.scene = null;
        this.ui = null;
        this.input = null;
        this.skillPicker = null;
        this.pauseIndicator = null;
    }
}
