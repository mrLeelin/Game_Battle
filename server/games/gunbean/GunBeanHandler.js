/**
 * 枪豆人 - 服务端游戏处理器
 * 肉鸽模式：无限生存，经验升级，三选一技能
 */
import { GAME_EVENTS, GUNBEAN_EVENTS } from '../../../shared/Events.js';
import { DEFAULT_WEAPON, ALL_SKILLS, generateSkillChoices, getSkillById, getExpForLevel, EXP_ORB_CONFIG } from './GunBeanSkillData.js';

// 敌人类型配置（3种小怪）
const ENEMY_TYPES = {
    // 类型1：普通小怪
    1: {
        type: 1,
        hpMultiplier: 1.0,      // 血量倍率
        speedMultiplier: 1.0,   // 速度倍率
        expMultiplier: 1.0,     // 经验倍率
        size: 30                // 尺寸
    },
    // 类型2：快速小怪（血少、速度快、经验少）
    2: {
        type: 2,
        hpMultiplier: 0.6,
        speedMultiplier: 1.5,
        expMultiplier: 0.8,
        size: 25
    },
    // 类型3：重型小怪（血多、速度慢、经验多）
    3: {
        type: 3,
        hpMultiplier: 2.0,
        speedMultiplier: 0.6,
        expMultiplier: 1.5,
        size: 40
    }
};

// 游戏配置
const CONFIG = {
    ARENA_WIDTH: 1200,      // 场地宽度
    ARENA_HEIGHT: 800,      // 场地高度
    TEAM_MAX_HP: 20,        // 团队共享最大生命值（单船模式）
    BULLET_SPEED: 800,      // 子弹速度（像素/秒）- 翻倍提升打击感
    BULLET_LIFETIME: 2000,  // 子弹存活时间（毫秒）
    RECOIL_FORCE: 120,      // 后坐力
    KNOCKBACK_FORCE: 80,    // 子弹击退力度（新增）
    FRICTION: 0.97,         // 摩擦力
    REVIVE_DISTANCE: 80,    // 复活距离
    ENEMY_SPAWN_INTERVAL: 4000,  // 敌人生成间隔（毫秒）
    ENEMY_SPEED: 60,        // 敌人基础移动速度
    ENEMY_HP: 3,            // 敌人基础生命值
    ENEMY_EXP: 15,          // 敌人基础掉落经验
    BOAT_RADIUS: 50,        // 船碰撞半径
    BULLET_RADIUS: 6,       // 子弹碰撞半径
    ENEMY_RADIUS: 20,       // 敌人碰撞半径
    PLAYERS_PER_BOAT: 4,    // 每船玩家数
    BOUNCE_DAMPING: 0.7,    // 边界反弹衰减系数
    BULLET_DAMAGE: 1,       // 子弹对船只的伤害
    ENEMY_DAMAGE: 2,        // 敌人对船只的伤害
    // 弹药系统
    MAX_AMMO: 5,            // 默认弹匣容量
    RELOAD_TIME: 1500,      // 换弹时间（毫秒）
    // 经验系统
    EXP_ORB_RADIUS: EXP_ORB_CONFIG.RADIUS,
    EXP_ATTRACT_RANGE: EXP_ORB_CONFIG.ATTRACT_RANGE,
    EXP_ATTRACT_SPEED: EXP_ORB_CONFIG.ATTRACT_SPEED,
    // 难度递增
    DIFFICULTY_INTERVAL: 30000,  // 每30秒增加难度
    MAX_ENEMIES: 15              // 最大敌人数量
};

// 船只出生点（单船模式：中心位置）
function getBoatSpawnPoint(boatIndex) {
    // 单船模式，所有玩家在同一艘船，船在中心
    return { x: 0, y: 0 };
}

export class GunBeanHandler {
    constructor(io, playerManager, roomManager) {
        this.io = io;
        this.playerManager = playerManager;
        this.roomManager = roomManager;
        this.games = new Map();
    }

    /**
     * 绑定事件
     */
    bindEvents(socket) {
        // 射击
        socket.on(GUNBEAN_EVENTS.SHOOT, (data) => {
            this.handleShoot(socket, data);
        });

        // 复活
        socket.on(GUNBEAN_EVENTS.REVIVE, (data) => {
            this.handleRevive(socket, data);
        });

        // 玩家转向
        socket.on(GUNBEAN_EVENTS.PLAYER_ROTATE, (data) => {
            this.handlePlayerRotate(socket, data);
        });

        // 技能选择
        socket.on(GUNBEAN_EVENTS.SKILL_SELECT, (data) => {
            this.handleSkillSelect(socket, data);
        });

        // 手动换弹
        socket.on(GUNBEAN_EVENTS.RELOAD, () => {
            this.handleReload(socket);
        });
    }

    /**
     * 处理玩家转向
     */
    handlePlayerRotate(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game || !game.isRunning) return;

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer || gamePlayer.isDead) return;

        gamePlayer.aimAngle = data.aimAngle;
    }

    /**
     * 初始化游戏
     */
    initGame(roomId, players) {
        console.log(`[GunBeanHandler] 初始化游戏 房间:${roomId} 玩家:${players.length}`);

        const gameState = {
            roomId,
            boats: new Map(),
            players: new Map(),
            bullets: new Map(),
            enemies: new Map(),
            expOrbs: new Map(),      // 经验球
            isRunning: false,
            isPaused: false,         // 暂停状态（升级选技能时）
            pausedByPlayers: new Set(), // 正在选技能的玩家
            bulletIdCounter: 0,
            enemyIdCounter: 0,
            expOrbIdCounter: 0,
            gameTime: 0,             // 游戏时间（秒）
            difficultyLevel: 1,      // 难度等级
            timers: {
                sync: null,
                physics: null,
                enemySpawn: null,
                difficulty: null,
                gameTime: null
            }
        };

        // 单船模式：只创建1艘船，所有玩家在同一艘船上
        const spawn = getBoatSpawnPoint(0);
        gameState.boats.set(0, {
            id: 0,
            x: spawn.x,
            y: spawn.y,
            vx: 0,
            vy: 0,
            hp: CONFIG.TEAM_MAX_HP,
            maxHp: CONFIG.TEAM_MAX_HP,
            playerIds: [],
            shield: 0
        });

        const boat = gameState.boats.get(0);

        // 所有玩家分配到同一艘船
        players.forEach((playerId, index) => {
            const playerInfo = this.playerManager.getPlayer(playerId);
            const playerName = playerInfo?.name || `玩家${playerId.slice(-4)}`;
            const seatIndex = index; // 座位按顺序分配

            const player = {
                id: playerId,
                name: playerName,
                colorIndex: index,
                boatId: 0,  // 都是0号船
                seatIndex: seatIndex,
                isDead: false,
                kills: 0,
                revives: 0,
                aimAngle: 0,
                // 经验系统
                level: 1,
                exp: 0,
                expToNext: getExpForLevel(1),
                // 技能
                skills: {},
                // 统一武器
                weapon: { ...DEFAULT_WEAPON },
                // 弹药系统
                ammo: CONFIG.MAX_AMMO,
                maxAmmo: CONFIG.MAX_AMMO,
                isReloading: false,
                reloadEndTime: 0
            };

            gameState.players.set(playerId, player);
            boat.playerIds.push(playerId);
        });

        this.games.set(roomId, gameState);

        // 延迟发送初始化数据
        setTimeout(() => {
            const initData = {
                boats: Array.from(gameState.boats.values()).map(b => ({
                    ...b,
                    hp: b.hp,
                    maxHp: b.maxHp
                })),
                players: Array.from(gameState.players.values()).map(p => ({
                    ...p,
                    x: gameState.boats.get(p.boatId).x,
                    y: gameState.boats.get(p.boatId).y
                })),
                enemies: Array.from(gameState.enemies.values())
            };

            players.forEach(playerId => {
                const socket = this.io.sockets.sockets.get(playerId);
                if (socket) {
                    socket.emit(GAME_EVENTS.INIT, initData);
                }
            });
        }, 500);

        // 延迟开始游戏
        setTimeout(() => {
            this.startGame(roomId);
        }, 2500);

        return gameState;
    }

    /**
     * 开始游戏
     */
    startGame(roomId) {
        const game = this.games.get(roomId);
        if (!game) return;

        game.isRunning = true;
        game.isPaused = false;

        this.io.to(roomId).emit(GAME_EVENTS.START);

        // 物理更新 (60fps)
        game.timers.physics = setInterval(() => {
            if (!game.isPaused) {
                this.updatePhysics(roomId);
            }
        }, 1000 / 60);

        // 状态同步 (20fps)
        game.timers.sync = setInterval(() => {
            this.syncState(roomId);
        }, 50);

        // 敌人生成
        game.timers.enemySpawn = setInterval(() => {
            if (!game.isPaused) {
                this.spawnEnemy(roomId);
            }
        }, CONFIG.ENEMY_SPAWN_INTERVAL);

        // 游戏时间计时
        game.timers.gameTime = setInterval(() => {
            if (!game.isPaused) {
                game.gameTime++;
            }
        }, 1000);

        // 难度递增
        game.timers.difficulty = setInterval(() => {
            if (!game.isPaused) {
                game.difficultyLevel++;
                console.log(`[GunBeanHandler] 难度提升到 ${game.difficultyLevel}`);
            }
        }, CONFIG.DIFFICULTY_INTERVAL);

        // 初始生成敌人
        for (let i = 0; i < 3; i++) {
            this.spawnEnemy(roomId);
        }
    }

    /**
     * 暂停游戏（玩家升级选技能时）
     */
    pauseGame(roomId, playerId) {
        const game = this.games.get(roomId);
        if (!game) return;

        game.pausedByPlayers.add(playerId);

        if (!game.isPaused) {
            game.isPaused = true;
            this.io.to(roomId).emit(GUNBEAN_EVENTS.GAME_PAUSE, {
                pausedBy: playerId
            });
        }
    }

    /**
     * 恢复游戏
     */
    resumeGame(roomId, playerId) {
        const game = this.games.get(roomId);
        if (!game) return;

        game.pausedByPlayers.delete(playerId);

        // 只有所有人都选完技能才恢复
        if (game.pausedByPlayers.size === 0 && game.isPaused) {
            game.isPaused = false;
            this.io.to(roomId).emit(GUNBEAN_EVENTS.GAME_RESUME);
        }
    }

    /**
     * 处理技能选择
     */
    handleSkillSelect(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game) return;

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer) return;

        const { skillId } = data;
        const skill = getSkillById(skillId);
        if (!skill) return;

        // 检查技能是否可以升级
        const currentLevel = gamePlayer.skills[skillId] || 0;
        if (currentLevel >= skill.maxLevel) return;

        // 升级技能
        gamePlayer.skills[skillId] = currentLevel + 1;

        // 立即生效的技能
        if (skill.immediate && skill.id === 'heal') {
            const boat = game.boats.get(gamePlayer.boatId);
            if (boat) {
                boat.hp = Math.min(boat.hp + 3, boat.maxHp);
            }
        }

        // 护盾技能增加护盾层数
        if (skill.id === 'shield') {
            const boat = game.boats.get(gamePlayer.boatId);
            if (boat) {
                boat.shield = (boat.shield || 0) + 1;
            }
        }

        // 通知技能选择结果
        socket.emit(GUNBEAN_EVENTS.SKILL_SELECTED, {
            skillId,
            level: gamePlayer.skills[skillId],
            skills: gamePlayer.skills
        });

        // 广播给其他玩家
        this.io.to(player.roomId).emit(GUNBEAN_EVENTS.EXP_UPDATE, {
            playerId: socket.id,
            level: gamePlayer.level,
            exp: gamePlayer.exp,
            expToNext: gamePlayer.expToNext,
            skills: gamePlayer.skills
        });

        // 恢复游戏
        this.resumeGame(player.roomId, socket.id);

        console.log(`[GunBeanHandler] 玩家 ${gamePlayer.name} 选择技能 ${skill.name} Lv.${gamePlayer.skills[skillId]}`);
    }

    /**
     * 玩家升级
     */
    playerLevelUp(game, gamePlayer) {
        gamePlayer.level++;
        gamePlayer.exp -= gamePlayer.expToNext;
        gamePlayer.expToNext = getExpForLevel(gamePlayer.level);

        console.log(`[GunBeanHandler] 玩家 ${gamePlayer.name} 升级到 Lv.${gamePlayer.level}`);

        // 暂停游戏
        this.pauseGame(game.roomId, gamePlayer.id);

        // 生成三选一技能
        const luckLevel = gamePlayer.skills['luck'] || 0;
        const choices = generateSkillChoices(3, gamePlayer.skills, luckLevel);

        // 发送升级通知和技能选项
        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.LEVEL_UP, {
            playerId: gamePlayer.id,
            level: gamePlayer.level
        });

        const socket = this.io.sockets.sockets.get(gamePlayer.id);
        if (socket) {
            socket.emit(GUNBEAN_EVENTS.SKILL_CHOICES, {
                level: gamePlayer.level,
                choices: choices.map(s => ({
                    id: s.id,
                    name: s.name,
                    icon: s.icon,
                    rarity: s.rarity,
                    description: s.description,
                    effectPerLevel: s.effectPerLevel,
                    currentLevel: gamePlayer.skills[s.id] || 0,
                    maxLevel: s.maxLevel
                }))
            });
        }
    }

    /**
     * 收集经验球
     */
    collectExpOrb(game, gamePlayer, expOrb) {
        // 获取磁铁技能加成
        const magnetLevel = gamePlayer.skills['magnet'] || 0;
        const expMultiplier = 1 + magnetLevel * 0.1; // 每级增加10%经验

        gamePlayer.exp += Math.round(expOrb.exp * expMultiplier);
        game.expOrbs.delete(expOrb.id);

        // 通知经验球被收集
        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXP_ORB_COLLECTED, {
            orbId: expOrb.id,
            playerId: gamePlayer.id
        });

        // 检查升级
        while (gamePlayer.exp >= gamePlayer.expToNext) {
            this.playerLevelUp(game, gamePlayer);
        }

        // 更新经验
        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXP_UPDATE, {
            playerId: gamePlayer.id,
            level: gamePlayer.level,
            exp: gamePlayer.exp,
            expToNext: gamePlayer.expToNext
        });
    }

    /**
     * 生成经验球
     */
    spawnExpOrb(game, x, y, exp) {
        const orbId = `exp_${game.expOrbIdCounter++}`;
        const orb = {
            id: orbId,
            x: x,
            y: y,
            exp: exp,
            createdAt: Date.now()
        };

        game.expOrbs.set(orbId, orb);

        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXP_ORB_SPAWNED, orb);
    }

    /**
     * 停止所有定时器
     */
    stopTimers(game) {
        Object.values(game.timers).forEach(timer => {
            if (timer) {
                clearInterval(timer);
                clearTimeout(timer);
            }
        });
        game.timers = {
            sync: null,
            physics: null,
            enemySpawn: null,
            difficulty: null,
            gameTime: null
        };
    }

    /**
     * 结束游戏
     */
    endGame(roomId, reason) {
        const game = this.games.get(roomId);
        if (!game) return;

        game.isRunning = false;
        game.isPaused = false;

        this.stopTimers(game);

        // 计算结果
        const players = Array.from(game.players.values());
        const maxLevel = Math.max(...players.map(p => p.level));
        const totalKills = players.reduce((sum, p) => sum + p.kills, 0);

        // 发送结果
        this.io.to(roomId).emit(GUNBEAN_EVENTS.GAME_RESULT, {
            isWin: false,
            reason,
            gameTime: game.gameTime,
            maxLevel,
            totalKills,
            players: players.map(p => ({
                id: p.id,
                name: p.name,
                level: p.level,
                kills: p.kills,
                revives: p.revives,
                skills: p.skills,
                isDead: p.isDead
            }))
        });

        this.io.to(roomId).emit(GAME_EVENTS.END, { isWin: false });

        setTimeout(() => {
            this.games.delete(roomId);
        }, 5000);

        console.log(`[GunBeanHandler] 游戏结束 房间:${roomId} 原因:${reason} 时间:${game.gameTime}秒 最高等级:${maxLevel}`);
    }

    /**
     * 更新物理
     */
    updatePhysics(roomId) {
        const game = this.games.get(roomId);
        if (!game || !game.isRunning || game.isPaused) return;

        const deltaTime = 1 / 60;
        const now = Date.now();

        // 更新船只位置
        game.boats.forEach(boat => {
            if (boat.hp <= 0) return;

            boat.x += boat.vx * deltaTime;
            boat.y += boat.vy * deltaTime;
            boat.vx *= CONFIG.FRICTION;
            boat.vy *= CONFIG.FRICTION;

            // 边界反弹
            const halfW = CONFIG.ARENA_WIDTH / 2 - CONFIG.BOAT_RADIUS;
            const halfH = CONFIG.ARENA_HEIGHT / 2 - CONFIG.BOAT_RADIUS;

            if (boat.x < -halfW) {
                boat.x = -halfW;
                boat.vx = Math.abs(boat.vx) * CONFIG.BOUNCE_DAMPING;
            } else if (boat.x > halfW) {
                boat.x = halfW;
                boat.vx = -Math.abs(boat.vx) * CONFIG.BOUNCE_DAMPING;
            }

            if (boat.y < -halfH) {
                boat.y = -halfH;
                boat.vy = Math.abs(boat.vy) * CONFIG.BOUNCE_DAMPING;
            } else if (boat.y > halfH) {
                boat.y = halfH;
                boat.vy = -Math.abs(boat.vy) * CONFIG.BOUNCE_DAMPING;
            }
        });

        // 更新子弹
        game.bullets.forEach((bullet, bulletId) => {
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;

            const lifetime = bullet.lifetime || CONFIG.BULLET_LIFETIME;
            if (now - bullet.createdAt > lifetime) {
                game.bullets.delete(bulletId);
                return;
            }

            // 边界弹跳
            const halfW = CONFIG.ARENA_WIDTH / 2;
            const halfH = CONFIG.ARENA_HEIGHT / 2;

            if (bullet.x < -halfW || bullet.x > halfW) {
                if (bullet.bounceLeft > 0) {
                    bullet.bounceLeft--;
                    bullet.vx = -bullet.vx;
                    bullet.x = Math.max(-halfW, Math.min(halfW, bullet.x));
                } else {
                    game.bullets.delete(bulletId);
                    return;
                }
            }

            if (bullet.y < -halfH || bullet.y > halfH) {
                if (bullet.bounceLeft > 0) {
                    bullet.bounceLeft--;
                    bullet.vy = -bullet.vy;
                    bullet.y = Math.max(-halfH, Math.min(halfH, bullet.y));
                } else {
                    game.bullets.delete(bulletId);
                    return;
                }
            }

            // 碰撞敌人
            game.enemies.forEach((enemy, enemyId) => {
                const dx = enemy.x - bullet.x;
                const dy = enemy.y - bullet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.ENEMY_RADIUS + CONFIG.BULLET_RADIUS) {
                    this.hitEnemy(game, bullet, enemy);

                    if (bullet.pierceLeft > 0) {
                        bullet.pierceLeft--;
                    } else {
                        game.bullets.delete(bulletId);
                    }
                }
            });
        });

        // 更新敌人
        game.enemies.forEach(enemy => {
            // 应用冰冻减速
            const speedMult = enemy.frozen ? (1 - enemy.frozenAmount) : 1;

            // 找最近的存活船只
            let nearestBoat = null;
            let nearestDist = Infinity;

            game.boats.forEach(boat => {
                const hasAlive = boat.playerIds.some(pid => {
                    const p = game.players.get(pid);
                    return p && !p.isDead;
                });
                if (!hasAlive) return;

                const dx = boat.x - enemy.x;
                const dy = boat.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestBoat = boat;
                }
            });

            if (nearestBoat) {
                const dx = nearestBoat.x - enemy.x;
                const dy = nearestBoat.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 30) {
                    // 使用敌人自身的速度倍率
                    const enemySpeedMult = enemy.speedMultiplier || 1.0;
                    const speed = CONFIG.ENEMY_SPEED * speedMult * enemySpeedMult * (1 + game.difficultyLevel * 0.05);
                    enemy.x += (dx / dist) * speed * deltaTime;
                    enemy.y += (dy / dist) * speed * deltaTime;
                }

                if (dist < CONFIG.ENEMY_RADIUS + CONFIG.BOAT_RADIUS) {
                    this.enemyHitBoat(game, enemy, nearestBoat);
                }
            }

            // 毒素伤害
            if (enemy.poisoned && now - enemy.lastPoisonTick > 1000) {
                enemy.hp -= 1;
                enemy.lastPoisonTick = now;
                if (enemy.hp <= 0) {
                    this.killEnemy(game, enemy, enemy.poisonOwner);
                }
            }

            // 清除过期状态
            if (enemy.frozenUntil && now > enemy.frozenUntil) {
                enemy.frozen = false;
            }
            if (enemy.poisonedUntil && now > enemy.poisonedUntil) {
                enemy.poisoned = false;
            }
        });

        // 更新经验球（吸附逻辑）
        game.expOrbs.forEach((orb, orbId) => {
            // 检查存活时间
            if (now - orb.createdAt > EXP_ORB_CONFIG.LIFETIME) {
                game.expOrbs.delete(orbId);
                return;
            }

            // 找最近的存活玩家
            let nearestPlayer = null;
            let nearestDist = Infinity;

            game.players.forEach(player => {
                if (player.isDead) return;
                const boat = game.boats.get(player.boatId);
                if (!boat || boat.hp <= 0) return;

                const magnetLevel = player.skills['magnet'] || 0;
                const attractRange = CONFIG.EXP_ATTRACT_RANGE * (1 + magnetLevel * 0.5);

                const dx = boat.x - orb.x;
                const dy = boat.y - orb.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < attractRange && dist < nearestDist) {
                    nearestDist = dist;
                    nearestPlayer = player;
                }
            });

            if (nearestPlayer) {
                const boat = game.boats.get(nearestPlayer.boatId);
                const dx = boat.x - orb.x;
                const dy = boat.y - orb.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // 吸附移动
                if (dist > 5) {
                    const speed = CONFIG.EXP_ATTRACT_SPEED;
                    orb.x += (dx / dist) * speed * deltaTime;
                    orb.y += (dy / dist) * speed * deltaTime;
                }

                // 收集
                if (dist < CONFIG.BOAT_RADIUS) {
                    this.collectExpOrb(game, nearestPlayer, orb);
                }
            }
        });
    }

    /**
     * 处理射击
     */
    handleShoot(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game || !game.isRunning || game.isPaused) return;

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer || gamePlayer.isDead) return;

        // 弹药检查：正在换弹或没有子弹时不能射击
        if (gamePlayer.isReloading) return;
        if (gamePlayer.ammo <= 0) {
            // 自动开始换弹
            this.startReload(game, gamePlayer);
            return;
        }

        const boat = game.boats.get(gamePlayer.boatId);
        if (!boat) return;

        const dirX = data.dirX || 0;
        const dirY = data.dirY || data.dirZ || 0;
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len === 0) return;

        // 消耗弹药
        gamePlayer.ammo--;

        // 发送弹药更新
        socket.emit(GUNBEAN_EVENTS.AMMO_UPDATE, {
            ammo: gamePlayer.ammo,
            maxAmmo: gamePlayer.maxAmmo,
            isReloading: false
        });

        // 弹药用完自动换弹
        if (gamePlayer.ammo <= 0) {
            this.startReload(game, gamePlayer);
        }

        const normX = dirX / len;
        const normY = dirY / len;

        const weapon = gamePlayer.weapon || DEFAULT_WEAPON;

        // 动态座位偏移（根据玩家数量）
        const playerCount = game.players.size;
        const getSeatOffsets = (count) => {
            if (count <= 1) return [0];
            if (count === 2) return [-20, 20];
            if (count === 3) return [-30, 0, 30];
            return [-45, -15, 15, 45];
        };
        const seatOffsets = getSeatOffsets(playerCount);
        const seatOffset = seatOffsets[gamePlayer.seatIndex] || 0;
        const startX = boat.x + seatOffset;
        const startY = boat.y;

        // 计算子弹数量（双发 + 散射）
        const doubleLevel = gamePlayer.skills['double'] || 0;
        const scatterLevel = gamePlayer.skills['scatter'] || 0;
        const multishotLevel = gamePlayer.skills['multishot'] || 0;
        let totalBullets = weapon.bulletCount + doubleLevel + scatterLevel * 2;

        // 计算属性加成
        const damageLevel = gamePlayer.skills['damage'] || 0;
        const totalDamage = weapon.damage + damageLevel;

        const recoilLevel = gamePlayer.skills['recoil'] || 0;
        const recoilMultiplier = Math.max(0.25, 1 - recoilLevel * 0.15);

        const speedLevel = gamePlayer.skills['speed'] || 0;
        const speedMultiplier = 1 + speedLevel * 0.15;

        const rangeLevel = gamePlayer.skills['range'] || 0;
        const lifetimeMultiplier = 1 + rangeLevel * 0.2;

        const bounceLevel = gamePlayer.skills['bounce'] || 0;
        const pierceLevel = gamePlayer.skills['pierce'] || 0;
        const homingLevel = gamePlayer.skills['homing'] || 0;
        const freezeLevel = gamePlayer.skills['freeze'] || 0;
        const poisonLevel = gamePlayer.skills['poison'] || 0;
        const explosiveLevel = gamePlayer.skills['explosive'] || 0;
        const chainLevel = gamePlayer.skills['chain'] || 0;

        // 发射方向（多重射击技能）
        const shootDirections = [{ x: normX, y: normY }];
        if (multishotLevel >= 1) {
            shootDirections.push({ x: -normX, y: -normY }); // 反向
        }
        if (multishotLevel >= 2) {
            shootDirections.push({ x: -normY, y: normX }); // 侧向
            shootDirections.push({ x: normY, y: -normX }); // 另一侧
        }

        shootDirections.forEach(dir => {
            for (let i = 0; i < totalBullets; i++) {
                let spreadAngle = 0;
                if (totalBullets > 1) {
                    const spreadRange = weapon.spread || 0.3 + scatterLevel * 0.15;
                    spreadAngle = (i - (totalBullets - 1) / 2) * spreadRange / totalBullets;
                }

                const cos = Math.cos(spreadAngle);
                const sin = Math.sin(spreadAngle);
                const bulletDirX = dir.x * cos - dir.y * sin;
                const bulletDirY = dir.x * sin + dir.y * cos;

                const bulletStartX = startX + bulletDirX * 25;
                const bulletStartY = startY + bulletDirY * 25;

                const bulletId = `bullet_${game.bulletIdCounter++}`;
                const bullet = {
                    id: bulletId,
                    ownerId: socket.id,
                    boatId: gamePlayer.boatId,
                    x: bulletStartX,
                    y: bulletStartY,
                    vx: bulletDirX * CONFIG.BULLET_SPEED,
                    vy: bulletDirY * CONFIG.BULLET_SPEED,
                    damage: totalDamage,
                    bounceLeft: bounceLevel,
                    pierceLeft: pierceLevel,
                    homing: homingLevel,
                    freeze: freezeLevel,
                    poison: poisonLevel,
                    explosive: explosiveLevel,
                    chain: chainLevel,
                    createdAt: Date.now(),
                    lifetime: CONFIG.BULLET_LIFETIME * lifetimeMultiplier
                };
                game.bullets.set(bulletId, bullet);

                this.io.to(player.roomId).emit(GUNBEAN_EVENTS.BULLET_FIRED, {
                    bulletId,
                    playerId: socket.id,
                    boatId: gamePlayer.boatId,
                    x: bullet.x,
                    y: bullet.y,
                    dirX: bulletDirX,
                    dirY: bulletDirY,
                    damage: totalDamage
                });
            }
        });

        // 后坐力（只算主方向一次）
        const recoilForce = CONFIG.RECOIL_FORCE * recoilMultiplier * speedMultiplier;
        boat.vx -= normX * recoilForce;
        boat.vy -= normY * recoilForce;

        gamePlayer.aimAngle = Math.atan2(normX, -normY);
    }

    /**
     * 开始换弹
     */
    startReload(game, gamePlayer) {
        if (gamePlayer.isReloading) return;
        if (gamePlayer.ammo >= gamePlayer.maxAmmo) return;

        gamePlayer.isReloading = true;

        // 计算换弹时间（受技能影响）
        const reloadLevel = gamePlayer.skills['reload'] || 0;
        const reloadTimeMultiplier = Math.max(0.4, 1 - reloadLevel * 0.12); // 每级减少12%，最低40%
        const reloadTime = CONFIG.RELOAD_TIME * reloadTimeMultiplier;

        gamePlayer.reloadEndTime = Date.now() + reloadTime;

        // 通知客户端开始换弹
        const socket = this.io.sockets.sockets.get(gamePlayer.id);
        if (socket) {
            socket.emit(GUNBEAN_EVENTS.RELOAD_START, {
                reloadTime: reloadTime
            });
        }

        // 设置定时器完成换弹
        setTimeout(() => {
            this.finishReload(game, gamePlayer);
        }, reloadTime);
    }

    /**
     * 完成换弹
     */
    finishReload(game, gamePlayer) {
        if (!gamePlayer.isReloading) return;

        // 计算最大弹药（受技能影响）
        const ammoCapacityLevel = gamePlayer.skills['ammoCapacity'] || 0;
        gamePlayer.maxAmmo = CONFIG.MAX_AMMO + ammoCapacityLevel * 2; // 每级+2发

        gamePlayer.ammo = gamePlayer.maxAmmo;
        gamePlayer.isReloading = false;
        gamePlayer.reloadEndTime = 0;

        // 通知客户端换弹完成
        const socket = this.io.sockets.sockets.get(gamePlayer.id);
        if (socket) {
            socket.emit(GUNBEAN_EVENTS.RELOAD_COMPLETE, {
                ammo: gamePlayer.ammo,
                maxAmmo: gamePlayer.maxAmmo
            });
        }
    }

    /**
     * 处理手动换弹请求
     */
    handleReload(socket) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game || !game.isRunning || game.isPaused) return;

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer || gamePlayer.isDead) return;

        // 弹药未满才能换弹
        if (gamePlayer.ammo < gamePlayer.maxAmmo) {
            this.startReload(game, gamePlayer);
        }
    }

    /**
     * 子弹命中敌人
     */
    hitEnemy(game, bullet, enemy) {
        const killer = game.players.get(bullet.ownerId);
        let damage = bullet.damage || 1;

        // 暴击
        if (killer) {
            const critLevel = killer.skills['crit'] || 0;
            const critChance = critLevel * 0.1;
            if (Math.random() < critChance) {
                damage *= 2;
            }
        }

        enemy.hp -= damage;

        // ========== 击退效果 ==========
        // 根据子弹方向给敌人施加击退力
        const bulletSpeed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
        if (bulletSpeed > 0) {
            const knockbackX = (bullet.vx / bulletSpeed) * CONFIG.KNOCKBACK_FORCE;
            const knockbackY = (bullet.vy / bulletSpeed) * CONFIG.KNOCKBACK_FORCE;
            enemy.x += knockbackX * 0.5;  // 立即位移
            enemy.y += knockbackY * 0.5;
        }

        // 应用特殊效果
        if (bullet.freeze > 0) {
            enemy.frozen = true;
            enemy.frozenAmount = Math.min(0.6, bullet.freeze * 0.15);
            enemy.frozenUntil = Date.now() + 3000;
        }

        if (bullet.poison > 0) {
            enemy.poisoned = true;
            enemy.poisonDamage = 1;
            enemy.poisonedUntil = Date.now() + bullet.poison * 1000;
            enemy.poisonOwner = bullet.ownerId;
            enemy.lastPoisonTick = Date.now();
        }

        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.BULLET_HIT, {
            bulletId: bullet.id,
            hitType: 'enemy',
            enemyId: enemy.id,
            damage: damage
        });

        if (enemy.hp <= 0) {
            this.killEnemy(game, enemy, bullet.ownerId);

            // 爆炸效果
            if (bullet.explosive > 0) {
                this.explosiveEffect(game, enemy.x, enemy.y, bullet.explosive, bullet.ownerId);
            }

            // 闪电链效果
            if (bullet.chain > 0) {
                this.chainEffect(game, enemy, bullet.chain, bullet.damage, bullet.ownerId);
            }
        }
    }

    /**
     * 击杀敌人
     */
    killEnemy(game, enemy, killerId) {
        game.enemies.delete(enemy.id);

        // 生成经验球（使用敌人的经验倍率）
        const expMult = enemy.expMultiplier || 1.0;
        const expAmount = Math.ceil((CONFIG.ENEMY_EXP + Math.floor(game.difficultyLevel * 2)) * expMult);
        this.spawnExpOrb(game, enemy.x, enemy.y, expAmount);

        const killer = game.players.get(killerId);
        if (killer) {
            killer.kills++;

            // 吸血
            const lifestealLevel = killer.skills['lifesteal'] || 0;
            if (lifestealLevel > 0) {
                const boat = game.boats.get(killer.boatId);
                if (boat && boat.hp < boat.maxHp) {
                    boat.hp = Math.min(boat.hp + lifestealLevel, boat.maxHp);
                }
            }
        }

        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.ENEMY_DIED, {
            enemyId: enemy.id,
            killerId: killerId
        });
    }

    /**
     * 爆炸效果
     */
    explosiveEffect(game, x, y, level, ownerId) {
        const radius = 50 + level * 15;
        const damage = 2;

        game.enemies.forEach(enemy => {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius) {
                enemy.hp -= damage;
                if (enemy.hp <= 0) {
                    this.killEnemy(game, enemy, ownerId);
                }
            }
        });
    }

    /**
     * 闪电链效果
     */
    chainEffect(game, sourceEnemy, chainCount, damage, ownerId) {
        let currentX = sourceEnemy.x;
        let currentY = sourceEnemy.y;
        const hitEnemies = new Set([sourceEnemy.id]);

        for (let i = 0; i < chainCount; i++) {
            let nearestEnemy = null;
            let nearestDist = 150; // 链接距离

            game.enemies.forEach(enemy => {
                if (hitEnemies.has(enemy.id)) return;
                const dx = enemy.x - currentX;
                const dy = enemy.y - currentY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            });

            if (nearestEnemy) {
                hitEnemies.add(nearestEnemy.id);
                nearestEnemy.hp -= Math.ceil(damage * 0.7);
                currentX = nearestEnemy.x;
                currentY = nearestEnemy.y;

                if (nearestEnemy.hp <= 0) {
                    this.killEnemy(game, nearestEnemy, ownerId);
                }
            } else {
                break;
            }
        }
    }

    /**
     * 敌人碰撞船只
     */
    enemyHitBoat(game, enemy, boat) {
        // 检查护盾
        if (boat.shield > 0) {
            boat.shield--;
        } else {
            boat.hp -= CONFIG.ENEMY_DAMAGE;
        }

        // 通知客户端船只受伤（用于触发震屏效果）
        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.BOAT_DAMAGED, {
            boatId: boat.id,
            damage: CONFIG.ENEMY_DAMAGE,
            hp: boat.hp,
            maxHp: boat.maxHp
        });

        game.enemies.delete(enemy.id);
        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.ENEMY_DIED, {
            enemyId: enemy.id,
            killerId: null
        });

        if (boat.hp <= 0) {
            this.destroyBoat(game, boat, null);
        }

        this.syncState(game.roomId);
    }

    /**
     * 摧毁船只
     */
    destroyBoat(game, boat, killerId) {
        boat.hp = 0;

        boat.playerIds.forEach(pid => {
            this.killPlayer(game, pid, 'boatDestroyed');
        });

        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.BOAT_DESTROYED, {
            boatId: boat.id,
            killerId: killerId
        });

        // 检查是否所有船只都被摧毁
        const aliveBoats = Array.from(game.boats.values()).filter(b => b.hp > 0);
        if (aliveBoats.length === 0) {
            this.endGame(game.roomId, 'allBoatsDestroyed');
        }
    }

    /**
     * 击杀玩家
     */
    killPlayer(game, playerId, reason) {
        const player = game.players.get(playerId);
        if (!player || player.isDead) return;

        player.isDead = true;

        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.PLAYER_DIED, {
            playerId,
            reason
        });
    }

    /**
     * 处理复活
     */
    handleRevive(socket, data) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game || !game.isRunning || game.isPaused) return;

        const reviver = game.players.get(socket.id);
        if (!reviver || reviver.isDead) return;

        const target = game.players.get(data.targetId);
        if (!target || !target.isDead) return;

        const reviverBoat = game.boats.get(reviver.boatId);
        const targetBoat = game.boats.get(target.boatId);

        if (!reviverBoat || !targetBoat) return;

        const dx = targetBoat.x - reviverBoat.x;
        const dy = targetBoat.y - reviverBoat.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 单船模式：同船队友可以直接复活
        if (reviver.boatId !== target.boatId) return; // 理论上不会发生

        target.isDead = false;
        reviver.revives++;
        // 复活不恢复船只血量，保持共享血量机制

        this.io.to(player.roomId).emit(GUNBEAN_EVENTS.PLAYER_REVIVED, {
            playerId: target.id,
            reviverId: socket.id,
            boatId: target.boatId,
            boatHp: targetBoat.hp,
            boatMaxHp: targetBoat.maxHp
        });
    }

    /**
     * 生成敌人
     */
    spawnEnemy(roomId) {
        const game = this.games.get(roomId);
        if (!game || !game.isRunning || game.isPaused) return;

        // 根据难度限制敌人数量
        const maxEnemies = Math.min(CONFIG.MAX_ENEMIES, 5 + game.difficultyLevel);
        if (game.enemies.size >= maxEnemies) return;

        const halfW = CONFIG.ARENA_WIDTH / 2 - 30;
        const halfH = CONFIG.ARENA_HEIGHT / 2 - 30;
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch (side) {
            case 0: x = (Math.random() - 0.5) * CONFIG.ARENA_WIDTH * 0.8; y = -halfH; break;
            case 1: x = (Math.random() - 0.5) * CONFIG.ARENA_WIDTH * 0.8; y = halfH; break;
            case 2: x = -halfW; y = (Math.random() - 0.5) * CONFIG.ARENA_HEIGHT * 0.8; break;
            case 3: x = halfW; y = (Math.random() - 0.5) * CONFIG.ARENA_HEIGHT * 0.8; break;
        }

        // 随机选择敌人类型（1-3）
        const enemyType = Math.floor(Math.random() * 3) + 1;
        const typeConfig = ENEMY_TYPES[enemyType];

        // 根据难度和类型计算敌人属性
        const baseHp = CONFIG.ENEMY_HP + Math.floor(game.difficultyLevel * 0.5);
        const enemyHp = Math.ceil(baseHp * typeConfig.hpMultiplier);

        const enemyId = `enemy_${game.enemyIdCounter++}`;
        const enemy = {
            id: enemyId,
            x: x,
            y: y,
            hp: enemyHp,
            maxHp: enemyHp,
            type: enemyType,                              // 敌人类型
            speedMultiplier: typeConfig.speedMultiplier,  // 速度倍率
            expMultiplier: typeConfig.expMultiplier,      // 经验倍率
            size: typeConfig.size                         // 尺寸
        };

        game.enemies.set(enemyId, enemy);
        this.io.to(roomId).emit(GUNBEAN_EVENTS.ENEMY_SPAWNED, enemy);
    }

    /**
     * 同步状态
     */
    syncState(roomId) {
        const game = this.games.get(roomId);
        if (!game) return;

        this.io.to(roomId).emit(GUNBEAN_EVENTS.PLAYER_UPDATE, {
            boats: Array.from(game.boats.values()).map(b => ({
                id: b.id,
                x: b.x,
                y: b.y,
                vx: b.vx,
                vy: b.vy,
                hp: b.hp,
                maxHp: b.maxHp,
                shield: b.shield || 0
            })),
            players: Array.from(game.players.values()).map(p => ({
                id: p.id,
                boatId: p.boatId,
                seatIndex: p.seatIndex,
                isDead: p.isDead,
                aimAngle: p.aimAngle,
                level: p.level
            })),
            expOrbs: Array.from(game.expOrbs.values()).map(o => ({
                id: o.id,
                x: o.x,
                y: o.y,
                exp: o.exp
            })),
            gameTime: game.gameTime,
            isPaused: game.isPaused
        });

        this.io.to(roomId).emit(GUNBEAN_EVENTS.ENEMY_UPDATE, {
            enemies: Array.from(game.enemies.values()).map(e => ({
                id: e.id,
                x: e.x,
                y: e.y,
                hp: e.hp,
                maxHp: e.maxHp,
                type: e.type || 1,           // 敌人类型
                size: e.size || 30,          // 敌人尺寸
                frozen: e.frozen || false,
                poisoned: e.poisoned || false
            }))
        });
    }

    /**
     * 玩家断开连接
     */
    onPlayerDisconnect(playerId, roomId) {
        const game = this.games.get(roomId);
        if (!game) return;

        const player = game.players.get(playerId);
        if (player) {
            player.isDead = true;
        }

        // 如果正在选技能，取消暂停
        this.resumeGame(roomId, playerId);

        const alivePlayers = Array.from(game.players.values()).filter(p => !p.isDead);
        if (alivePlayers.length === 0) {
            this.endGame(roomId, 'allDisconnected');
        }
    }
}
