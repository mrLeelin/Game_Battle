/**
 * 枪豆人 - 服务端游戏处理器
 * 肉鸽模式：无限生存，经验升级，三选一技能
 */
import { GAME_EVENTS, GUNBEAN_EVENTS } from '../../../shared/Events.js';
import { DEFAULT_WEAPON, ALL_SKILLS, LEGENDARY_SKILLS, generateSkillChoices, getSkillById, getExpForLevel, EXP_ORB_CONFIG, checkFusionOptions } from './GunBeanSkillData.js';

// 敌人类型配置（8种小怪）
const ENEMY_TYPES = {
    // 类型1：普通小怪
    1: {
        type: 1,
        hpMultiplier: 1.0,      // 血量倍率
        speedMultiplier: 1.0,   // 速度倍率
        expMultiplier: 1.0,     // 经验倍率
        size: 45                // 尺寸 (30 * 1.5)
    },
    // 类型2：快速小怪（血少、速度快、经验少）
    2: {
        type: 2,
        hpMultiplier: 1.0,
        speedMultiplier: 1.5,
        expMultiplier: 0.8,
        size: 37.5              // (25 * 1.5)
    },
    // 类型3：重型小怪（血多、速度慢、经验多）
    3: {
        type: 3,
        hpMultiplier: 2.0,
        speedMultiplier: 0.6,
        expMultiplier: 1.5,
        size: 60                // (40 * 1.5)
    },
    // 类型4：平衡小怪
    4: {
        type: 4,
        hpMultiplier: 1.2,
        speedMultiplier: 1.2,
        expMultiplier: 1.2,
        size: 50
    },
    // 类型5：超速小怪（血少、极快、经验少）
    5: {
        type: 5,
        hpMultiplier: 0.8,
        speedMultiplier: 1.8,
        expMultiplier: 0.9,
        size: 35
    },
    // 类型6：坦克小怪（血多、慢速、经验多）
    6: {
        type: 6,
        hpMultiplier: 1.5,
        speedMultiplier: 0.8,
        expMultiplier: 1.3,
        size: 55
    },
    // 类型7：巨型小怪（血极多、极慢、经验极多）
    7: {
        type: 7,
        hpMultiplier: 2.5,
        speedMultiplier: 0.5,
        expMultiplier: 2.0,
        size: 65
    },
    // 类型8：微型小怪（血极少、极快、经验极少）
    8: {
        type: 8,
        hpMultiplier: 0.6,
        speedMultiplier: 2.0,
        expMultiplier: 0.7,
        size: 30
    }
};

// 游戏配置
const CONFIG = {
    ARENA_WIDTH: 1200,      // 场地宽度
    ARENA_HEIGHT: 800,      // 场地高度
    TEAM_MAX_HP: 5,         // 团队共享最大生命值（5颗心）
    BULLET_SPEED: 1040,     // 子弹速度（像素/秒）- ×1.3
    BULLET_LIFETIME: 2000,  // 子弹存活时间（毫秒）
    RECOIL_FORCE: 800,      // 后坐力（爆发式）
    KNOCKBACK_FORCE: 320,   // 子弹击退力度（4倍）
    FRICTION: 0.92,         // 摩擦力（降低，滑行更远）
    REVIVE_DISTANCE: 80,    // 复活距离
    ENEMY_SPAWN_INTERVAL: 4000,  // 敌人生成间隔（毫秒）
    ENEMY_SPEED: 60,        // 敌人基础移动速度
    ENEMY_HP: 2,            // 敌人基础生命值
    ENEMY_EXP: 15,          // 敌人基础掉落经验
    BOAT_RADIUS: 50,        // 船碰撞半径
    BULLET_RADIUS: 6,       // 子弹碰撞半径
    ENEMY_RADIUS: 20,       // 敌人碰撞半径
    PLAYERS_PER_BOAT: 4,    // 每船玩家数
    BOUNCE_DAMPING: 0.3,    // 边界反弹衰减系数（0-1，撞墙后速度保留比例）
    BULLET_DAMAGE: 1,       // 子弹对船只的伤害
    ENEMY_DAMAGE: 1,        // 敌人对船只的伤害（1颗心）
    // 弹药系统
    MAX_AMMO: 3,            // 默认弹匣容量（3发）
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

        // GM模式：增加经验值
        socket.on(GUNBEAN_EVENTS.GM_ADD_EXP, () => {
            this.handleGmAddExp(socket);
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
            blackHoles: new Map(),   // 黑洞（第四阶段技能）
            isRunning: false,
            isPaused: false,         // 暂停状态（升级选技能时）
            pausedByPlayers: new Set(), // 正在选技能的玩家
            bulletIdCounter: 0,
            enemyIdCounter: 0,
            expOrbIdCounter: 0,
            blackHoleIdCounter: 0,   // 黑洞ID计数器
            gameTime: 0,             // 游戏时间（秒）
            difficultyLevel: 1,      // 难度等级
            lastRegenTime: 0,        // 上次再生时间（用于再生技能）
            lastEmpTime: 0,          // 上次电磁脉冲时间
            lastLaserTime: 0,        // 上次激光炮时间
            lastTimeFreezeTime: 0,   // 上次时间冻结时间（传说技能）
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
            shield: 0,
            invincibleUntil: 0  // 无敌状态结束时间（幽灵船技能）
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
                reloadEndTime: 0,
                // 连击系统
                comboCount: 0,          // 当前连击数
                lastHitTime: 0          // 上次命中时间
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
        console.log(`[GunBeanHandler] 收到技能选择: socketId=${socket.id}, data=`, data);

        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) {
            console.error(`[GunBeanHandler] 技能选择失败: 玩家不存在或没有房间, socketId=${socket.id}`);
            return;
        }

        const game = this.games.get(player.roomId);
        if (!game) {
            console.error(`[GunBeanHandler] 技能选择失败: 游戏不存在, roomId=${player.roomId}`);
            return;
        }

        const gamePlayer = game.players.get(socket.id);
        if (!gamePlayer) {
            console.error(`[GunBeanHandler] 技能选择失败: 游戏玩家不存在, socketId=${socket.id}, 游戏中的玩家:`, Array.from(game.players.keys()));
            return;
        }

        const { skillId, isFusion } = data;
        console.log(`[GunBeanHandler] 玩家 ${gamePlayer.name} 选择技能: skillId=${skillId}, isFusion=${isFusion}`);

        const skill = getSkillById(skillId);
        if (!skill) {
            console.error(`[GunBeanHandler] 技能选择失败: 技能不存在, skillId=${skillId}`);
            return;
        }

        // ========== 融合技能处理 ==========
        if (isFusion && skill.rarity === 'legendary' && skill.recipe) {
            // 检查融合条件
            const [skillA, skillB] = skill.recipe;
            const levelA = gamePlayer.skills[skillA] || 0;
            const levelB = gamePlayer.skills[skillB] || 0;

            if (levelA < 3 || levelB < 3) {
                console.log(`[GunBeanHandler] 融合条件不满足: ${skillA}=${levelA}, ${skillB}=${levelB}`);
                return;
            }

            // 移除原料技能
            delete gamePlayer.skills[skillA];
            delete gamePlayer.skills[skillB];

            // 获得传说技能
            gamePlayer.skills[skillId] = 1;

            console.log(`[GunBeanHandler] 玩家 ${gamePlayer.name} 融合技能 ${skill.name}！消耗 ${skillA} 和 ${skillB}`);

            // 通知融合成功
            socket.emit(GUNBEAN_EVENTS.SKILL_FUSED, {
                skillId,
                skillName: skill.name,
                consumedSkills: [skillA, skillB],
                skills: gamePlayer.skills
            });
        } else {
            // ========== 普通技能升级 ==========
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

            // 生命护盾传说技能增加护盾
            if (skill.id === 'lifeShield') {
                const boat = game.boats.get(gamePlayer.boatId);
                if (boat) {
                    const shieldBonus = 5 + (gamePlayer.skills[skillId] - 1) * 3;
                    boat.shield = (boat.shield || 0) + shieldBonus;
                }
            }

            console.log(`[GunBeanHandler] 玩家 ${gamePlayer.name} 选择技能 ${skill.name} Lv.${gamePlayer.skills[skillId]}`);
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

        // 检查是否还需要继续升级（处理一次收集大量经验的情况）
        if (gamePlayer.exp >= gamePlayer.expToNext) {
            // 还有足够经验继续升级，触发下一次升级
            this.playerLevelUp(game, gamePlayer);
        } else {
            // 恢复游戏
            this.resumeGame(player.roomId, socket.id);
        }
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

        // 检查融合选项
        const fusionOptions = checkFusionOptions(gamePlayer.skills);

        console.log(`[GunBeanHandler] 生成技能选项: ${choices.length}个`, choices.map(s => s.name));
        if (fusionOptions.length > 0) {
            console.log(`[GunBeanHandler] 可用融合选项: ${fusionOptions.length}个`, fusionOptions.map(s => s.name));
        }

        // 发送升级通知和技能选项
        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.LEVEL_UP, {
            playerId: gamePlayer.id,
            level: gamePlayer.level
        });

        // 构建技能选项数据
        const choicesData = choices.map(s => ({
            id: s.id,
            name: s.name,
            icon: s.icon,
            rarity: s.rarity,
            description: s.description,
            effectPerLevel: s.effectPerLevel,
            currentLevel: gamePlayer.skills[s.id] || 0,
            maxLevel: s.maxLevel,
            isFusion: false
        }));

        // 添加融合选项
        const fusionData = fusionOptions.filter(f => f.canFuse).map(s => ({
            id: s.id,
            name: s.name,
            icon: s.icon,
            rarity: s.rarity,
            description: s.description,
            effectPerLevel: s.effectPerLevel,
            currentLevel: 0,
            maxLevel: s.maxLevel,
            isFusion: true,
            ingredients: s.ingredients
        }));

        const socket = this.io.sockets.sockets.get(gamePlayer.id);
        if (socket) {
            console.log(`[GunBeanHandler] 发送技能选择界面给玩家 ${gamePlayer.name}`);
            socket.emit(GUNBEAN_EVENTS.SKILL_CHOICES, {
                playerId: gamePlayer.id,
                level: gamePlayer.level,
                choices: choicesData,
                fusionOptions: fusionData
            });
        } else {
            console.error(`[GunBeanHandler] 无法获取玩家 ${gamePlayer.name} 的socket，playerId: ${gamePlayer.id}`);
            // 尝试使用房间广播作为备用方案
            this.io.to(game.roomId).emit(GUNBEAN_EVENTS.SKILL_CHOICES, {
                playerId: gamePlayer.id,
                level: gamePlayer.level,
                choices: choicesData,
                fusionOptions: fusionData
            });
        }
    }

    /**
     * 收集经验球（团队共享经验）
     */
    collectExpOrb(game, collectorPlayer, expOrb) {
        game.expOrbs.delete(expOrb.id);

        // 通知经验球被收集
        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXP_ORB_COLLECTED, {
            orbId: expOrb.id,
            playerId: collectorPlayer.id
        });

        // 所有存活玩家都获得经验（团队共享）
        game.players.forEach(gamePlayer => {
            if (gamePlayer.isDead) return;

            // 获取经验加成技能
            const expBonusLevel = gamePlayer.skills['expBonus'] || 0;
            const expMultiplier = 1 + expBonusLevel * 0.15; // 每级增加15%经验

            gamePlayer.exp += Math.round(expOrb.exp * expMultiplier);

            // 检查升级（每次只处理一次升级，避免连续升级时技能选择界面被覆盖）
            if (gamePlayer.exp >= gamePlayer.expToNext) {
                this.playerLevelUp(game, gamePlayer);
            }

            // 更新经验
            this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXP_UPDATE, {
                playerId: gamePlayer.id,
                level: gamePlayer.level,
                exp: gamePlayer.exp,
                expToNext: gamePlayer.expToNext
            });
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

        // 预计算边界值（优化：避免每艘船重复计算）
        const halfW = CONFIG.ARENA_WIDTH / 2 - CONFIG.BOAT_RADIUS;
        const halfH = CONFIG.ARENA_HEIGHT / 2 - CONFIG.BOAT_RADIUS;
        const leftBound = -halfW;
        const rightBound = halfW;
        const topBound = -halfH;
        const bottomBound = halfH;
        const bounceDamping = CONFIG.BOUNCE_DAMPING;

        // 更新船只位置（优化版：减少 Math.abs 调用）
        game.boats.forEach(boat => {
            if (boat.hp <= 0) return;

            boat.x += boat.vx * deltaTime;
            boat.y += boat.vy * deltaTime;
            boat.vx *= CONFIG.FRICTION;
            boat.vy *= CONFIG.FRICTION;

            // 边界反弹（优化：用条件判断替代 Math.abs）
            if (boat.x < leftBound) {
                boat.x = leftBound;
                boat.vx = boat.vx < 0 ? -boat.vx * bounceDamping : boat.vx * bounceDamping;
            } else if (boat.x > rightBound) {
                boat.x = rightBound;
                boat.vx = boat.vx > 0 ? -boat.vx * bounceDamping : -boat.vx * bounceDamping;
            }

            if (boat.y < topBound) {
                boat.y = topBound;
                boat.vy = boat.vy < 0 ? -boat.vy * bounceDamping : boat.vy * bounceDamping;
            } else if (boat.y > bottomBound) {
                boat.y = bottomBound;
                boat.vy = boat.vy > 0 ? -boat.vy * bounceDamping : -boat.vy * bounceDamping;
            }
        });

        // 更新子弹
        game.bullets.forEach((bullet, bulletId) => {
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;

            // ========== 回旋镖效果 ==========
            if (bullet.boomerang > 0 && bullet.boomerangReturns > 0 && !bullet.returning) {
                // 计算子弹飞行距离
                const dx = bullet.x - bullet.startX;
                const dy = bullet.y - bullet.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // 达到最大距离后反转方向
                if (distance >= bullet.maxDistance) {
                    bullet.vx = -bullet.vx;
                    bullet.vy = -bullet.vy;
                    bullet.returning = true;
                    bullet.boomerangReturns--;
                    // 更新起始位置为当前位置，用于下次返回判断
                    bullet.startX = bullet.x;
                    bullet.startY = bullet.y;
                }
            } else if (bullet.returning && bullet.boomerangReturns > 0) {
                // 返回后再次飞出
                const dx = bullet.x - bullet.startX;
                const dy = bullet.y - bullet.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance >= bullet.maxDistance) {
                    bullet.vx = -bullet.vx;
                    bullet.vy = -bullet.vy;
                    bullet.returning = false;
                    bullet.boomerangReturns--;
                    bullet.startX = bullet.x;
                    bullet.startY = bullet.y;
                }
            }

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
            // ========== 眩晕状态检查 ==========
            if (enemy.stunned) {
                if (now > enemy.stunnedUntil) {
                    enemy.stunned = false;
                } else {
                    // 眩晕时敌人不移动，跳过移动逻辑
                    return;
                }
            }

            // 应用冰冻减速
            let speedMult = enemy.frozen ? (1 - enemy.frozenAmount) : 1;

            // ========== 时间减缓效果 ==========
            // 检查敌人是否在任何船只的时间减缓范围内
            game.boats.forEach(boat => {
                if (boat.hp <= 0) return;

                // 计算船上所有存活玩家的最高时间减缓等级
                let maxTimeSlowLevel = 0;
                boat.playerIds.forEach(pid => {
                    const p = game.players.get(pid);
                    if (p && !p.isDead) {
                        const level = p.skills['timeSlow'] || 0;
                        if (level > maxTimeSlowLevel) {
                            maxTimeSlowLevel = level;
                        }
                    }
                });

                if (maxTimeSlowLevel > 0) {
                    // 基础范围150，每级增加10%
                    const slowRange = 150 * (1 + maxTimeSlowLevel * 0.1);
                    const dx = boat.x - enemy.x;
                    const dy = boat.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < slowRange) {
                        // 在范围内减速30%
                        speedMult *= 0.7;
                        enemy.timeSlowed = true;
                    }
                }
            });

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
                    // 使用敌人自身的速度倍率（难度翻倍：每级增加10%速度而不是5%）
                    const enemySpeedMult = enemy.speedMultiplier || 1.0;
                    const speed = CONFIG.ENEMY_SPEED * speedMult * enemySpeedMult * (1 + game.difficultyLevel * 0.1);
                    enemy.x += (dx / dist) * speed * deltaTime;
                    enemy.y += (dy / dist) * speed * deltaTime;
                }

                if (dist < CONFIG.ENEMY_RADIUS + CONFIG.BOAT_RADIUS) {
                    // ========== 护盾冲撞效果 ==========
                    // 计算船上所有存活玩家的护盾冲撞等级总和
                    let totalShieldRamLevel = 0;
                    nearestBoat.playerIds.forEach(pid => {
                        const p = game.players.get(pid);
                        if (p && !p.isDead) {
                            totalShieldRamLevel += p.skills['shieldRam'] || 0;
                        }
                    });

                    if (totalShieldRamLevel > 0) {
                        // 每级造成2点撞击伤害
                        const ramDamage = totalShieldRamLevel * 2;
                        enemy.hp -= ramDamage;

                        // 如果敌人被撞死，不触发敌人对船只的伤害
                        if (enemy.hp <= 0) {
                            // 找一个存活玩家作为击杀者
                            let killerId = null;
                            nearestBoat.playerIds.forEach(pid => {
                                const p = game.players.get(pid);
                                if (p && !p.isDead && !killerId) {
                                    killerId = pid;
                                }
                            });
                            this.killEnemy(game, enemy, killerId);
                            return; // 跳过敌人对船只的伤害
                        }
                    }

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

            // ========== 燃烧伤害 ==========
            if (enemy.burning && now - enemy.lastBurnTick > 1000) {
                enemy.hp -= enemy.burnDamage || 1;
                enemy.lastBurnTick = now;
                if (enemy.hp <= 0) {
                    this.killEnemy(game, enemy, enemy.burnOwner);
                }
            }

            // 清除过期状态
            if (enemy.frozenUntil && now > enemy.frozenUntil) {
                enemy.frozen = false;
            }
            if (enemy.poisonedUntil && now > enemy.poisonedUntil) {
                enemy.poisoned = false;
            }
            if (enemy.burningUntil && now > enemy.burningUntil) {
                enemy.burning = false;
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

        // ========== 再生技能效果 ==========
        // 每10秒触发一次再生
        if (now - game.lastRegenTime >= 10000) {
            game.lastRegenTime = now;

            // 遍历所有船只，计算再生效果
            game.boats.forEach(boat => {
                if (boat.hp <= 0 || boat.hp >= boat.maxHp) return;

                // 取船上所有存活玩家的再生等级总和
                let totalRegenLevel = 0;
                boat.playerIds.forEach(pid => {
                    const p = game.players.get(pid);
                    if (p && !p.isDead) {
                        totalRegenLevel += p.skills['regen'] || 0;
                    }
                });

                if (totalRegenLevel > 0) {
                    // 每级每10秒恢复0.5HP，向上取整
                    const regenAmount = Math.ceil(totalRegenLevel * 0.5);
                    boat.hp = Math.min(boat.hp + regenAmount, boat.maxHp);
                }
            });
        }

        // ========== 电磁脉冲效果 ==========
        // 每8秒触发一次电磁脉冲
        if (now - game.lastEmpTime >= 8000) {
            game.lastEmpTime = now;

            // 遍历所有船只，检查是否有电磁脉冲技能
            game.boats.forEach(boat => {
                if (boat.hp <= 0) return;

                // 计算船上所有存活玩家的最高电磁脉冲等级
                let maxEmpLevel = 0;
                boat.playerIds.forEach(pid => {
                    const p = game.players.get(pid);
                    if (p && !p.isDead) {
                        const level = p.skills['empPulse'] || 0;
                        if (level > maxEmpLevel) {
                            maxEmpLevel = level;
                        }
                    }
                });

                if (maxEmpLevel > 0) {
                    // 脉冲范围200像素
                    const pulseRange = 200;
                    // 眩晕时间 = 0.5秒 × 等级
                    const stunDuration = maxEmpLevel * 500;

                    // 对范围内的敌人施加眩晕
                    game.enemies.forEach(enemy => {
                        const dx = boat.x - enemy.x;
                        const dy = boat.y - enemy.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < pulseRange) {
                            enemy.stunned = true;
                            enemy.stunnedUntil = now + stunDuration;
                        }
                    });

                    // 通知客户端电磁脉冲效果
                    this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EMP_PULSE, {
                        boatId: boat.id,
                        x: boat.x,
                        y: boat.y,
                        range: pulseRange,
                        duration: stunDuration
                    });
                }
            });
        }

        // ========== 黑洞效果 ==========
        game.blackHoles.forEach((blackHole, blackHoleId) => {
            // 检查黑洞是否过期
            if (now - blackHole.createdAt > blackHole.lifetime) {
                game.blackHoles.delete(blackHoleId);
                this.io.to(game.roomId).emit(GUNBEAN_EVENTS.BLACK_HOLE_EXPIRED, {
                    blackHoleId: blackHoleId
                });
                return;
            }

            // 吸引范围内的敌人
            game.enemies.forEach(enemy => {
                const dx = blackHole.x - enemy.x;
                const dy = blackHole.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < blackHole.range && dist > 10) {
                    // 吸引速度
                    const pullSpeed = 150;
                    enemy.x += (dx / dist) * pullSpeed * deltaTime;
                    enemy.y += (dy / dist) * pullSpeed * deltaTime;
                }
            });
        });

        // ========== 激光炮效果 ==========
        // 基础冷却20秒，每级减少5秒
        game.boats.forEach(boat => {
            if (boat.hp <= 0) return;

            // 计算船上所有存活玩家的最高激光炮等级
            let maxLaserLevel = 0;
            boat.playerIds.forEach(pid => {
                const p = game.players.get(pid);
                if (p && !p.isDead) {
                    const level = p.skills['laserGun'] || 0;
                    if (level > maxLaserLevel) {
                        maxLaserLevel = level;
                    }
                }
            });

            if (maxLaserLevel > 0) {
                // 冷却时间 = 20秒 - 等级 × 5秒，最低5秒
                const laserCooldown = Math.max(5000, 20000 - maxLaserLevel * 5000);

                if (now - game.lastLaserTime >= laserCooldown) {
                    game.lastLaserTime = now;

                    // 找最近的敌人作为目标
                    let nearestEnemy = null;
                    let nearestDist = Infinity;

                    game.enemies.forEach(enemy => {
                        const dx = enemy.x - boat.x;
                        const dy = enemy.y - boat.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestEnemy = enemy;
                        }
                    });

                    if (nearestEnemy) {
                        // 计算激光方向
                        const dx = nearestEnemy.x - boat.x;
                        const dy = nearestEnemy.y - boat.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const dirX = dx / dist;
                        const dirY = dy / dist;

                        // 激光伤害（穿透所有敌人）
                        const laserDamage = 5 + maxLaserLevel * 2;
                        const laserLength = 600;

                        // 对激光路径上的所有敌人造成伤害
                        game.enemies.forEach(enemy => {
                            // 计算敌人到激光线的距离
                            const ex = enemy.x - boat.x;
                            const ey = enemy.y - boat.y;
                            const projection = ex * dirX + ey * dirY;

                            if (projection > 0 && projection < laserLength) {
                                const perpX = ex - projection * dirX;
                                const perpY = ey - projection * dirY;
                                const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);

                                if (perpDist < 30) {  // 激光宽度
                                    enemy.hp -= laserDamage;
                                    if (enemy.hp <= 0) {
                                        // 找一个存活玩家作为击杀者
                                        let killerId = null;
                                        boat.playerIds.forEach(pid => {
                                            const p = game.players.get(pid);
                                            if (p && !p.isDead && !killerId) {
                                                killerId = pid;
                                            }
                                        });
                                        this.killEnemy(game, enemy, killerId);
                                    }
                                }
                            }
                        });

                        // 巨大后坐力（翻倍）
                        const laserRecoil = 600;
                        boat.vx -= dirX * laserRecoil;
                        boat.vy -= dirY * laserRecoil;

                        // 通知客户端激光效果
                        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.LASER_FIRED, {
                            boatId: boat.id,
                            startX: boat.x,
                            startY: boat.y,
                            dirX: dirX,
                            dirY: dirY,
                            length: laserLength,
                            damage: laserDamage
                        });
                    }
                }
            }
        });

        // ========== 传说技能：时间冻结 ==========
        game.boats.forEach(boat => {
            if (boat.hp <= 0) return;

            // 计算船上所有存活玩家的最高时间冻结等级
            let maxTimeFreezeLevel = 0;
            boat.playerIds.forEach(pid => {
                const p = game.players.get(pid);
                if (p && !p.isDead) {
                    const level = p.skills['timeFreeze'] || 0;
                    if (level > maxTimeFreezeLevel) {
                        maxTimeFreezeLevel = level;
                    }
                }
            });

            if (maxTimeFreezeLevel > 0) {
                // 冷却时间 = 15秒 - 等级 × 3秒，最低6秒
                const freezeCooldown = Math.max(6000, 15000 - maxTimeFreezeLevel * 3000);
                // 冻结时间 = 2秒 + 等级 × 1秒
                const freezeDuration = 2000 + maxTimeFreezeLevel * 1000;

                if (now - game.lastTimeFreezeTime >= freezeCooldown) {
                    game.lastTimeFreezeTime = now;

                    // 冻结所有敌人
                    game.enemies.forEach(enemy => {
                        enemy.frozen = true;
                        enemy.frozenAmount = 1.0;  // 完全冻结
                        enemy.frozenUntil = now + freezeDuration;
                    });

                    // 通知客户端时间冻结效果
                    this.io.to(game.roomId).emit(GUNBEAN_EVENTS.TIME_FREEZE, {
                        boatId: boat.id,
                        duration: freezeDuration
                    });

                    console.log(`[GunBeanHandler] 时间冻结触发！冻结 ${game.enemies.size} 个敌人 ${freezeDuration}ms`);
                }
            }
        });

        // ========== 传说技能：引力场 ==========
        game.boats.forEach(boat => {
            if (boat.hp <= 0) return;

            // 计算船上所有存活玩家的最高引力场等级
            let maxGravityLevel = 0;
            boat.playerIds.forEach(pid => {
                const p = game.players.get(pid);
                if (p && !p.isDead) {
                    const level = p.skills['gravityField'] || 0;
                    if (level > maxGravityLevel) {
                        maxGravityLevel = level;
                    }
                }
            });

            if (maxGravityLevel > 0) {
                // 引力场覆盖全屏，吸引速度随等级增加
                const pullSpeed = 100 * (1 + maxGravityLevel * 0.5);

                // 吸引所有敌人
                game.enemies.forEach(enemy => {
                    const dx = boat.x - enemy.x;
                    const dy = boat.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 50) {
                        enemy.x += (dx / dist) * pullSpeed * deltaTime;
                        enemy.y += (dy / dist) * pullSpeed * deltaTime;
                    }
                });

                // 吸引所有经验球（加速吸引）
                game.expOrbs.forEach(orb => {
                    const dx = boat.x - orb.x;
                    const dy = boat.y - orb.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 5) {
                        const orbPullSpeed = pullSpeed * 2;
                        orb.x += (dx / dist) * orbPullSpeed * deltaTime;
                        orb.y += (dy / dist) * orbPullSpeed * deltaTime;
                    }
                });
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

        // 正在换弹时不能射击
        if (gamePlayer.isReloading) return;

        // 空枪射击：没有子弹时，只应用后坐力，重新计算换弹时间
        if (gamePlayer.ammo <= 0 || data.isEmpty) {
            // 重新开始换弹（重置换弹计时器）
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

        // 计算子弹数量（双发 + 散射 + 弹幕风暴）
        const doubleLevel = gamePlayer.skills['double'] || 0;
        const scatterLevel = gamePlayer.skills['scatter'] || 0;
        const multishotLevel = gamePlayer.skills['multishot'] || 0;
        const bulletStormLevel = gamePlayer.skills['bulletStorm'] || 0;  // 弹幕风暴传说技能

        // 弹幕风暴：基础8颗，每级+4颗
        let totalBullets = weapon.bulletCount + doubleLevel + scatterLevel * 2;
        if (bulletStormLevel > 0) {
            totalBullets = 8 + (bulletStormLevel - 1) * 4;
        }

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
        const bulletSpeedLevel = gamePlayer.skills['bulletSpeed'] || 0;
        const bulletSpeedMultiplier = 1 + bulletSpeedLevel * 0.2; // 每级增加20%弹速
        const fireLevel = gamePlayer.skills['fireBullet'] || 0;  // 火焰弹技能
        const splitLevel = gamePlayer.skills['splitBullet'] || 0;  // 分裂弹技能
        const boomerangLevel = gamePlayer.skills['boomerang'] || 0;  // 回旋镖技能
        const orbitalLevel = gamePlayer.skills['orbitalBullet'] || 0;  // 弹幕技能

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
                const finalBulletSpeed = CONFIG.BULLET_SPEED * bulletSpeedMultiplier;
                const bullet = {
                    id: bulletId,
                    ownerId: socket.id,
                    boatId: gamePlayer.boatId,
                    x: bulletStartX,
                    y: bulletStartY,
                    vx: bulletDirX * finalBulletSpeed,
                    vy: bulletDirY * finalBulletSpeed,
                    damage: totalDamage,
                    bounceLeft: bounceLevel,
                    pierceLeft: pierceLevel,
                    homing: homingLevel,
                    freeze: freezeLevel,
                    poison: poisonLevel,
                    explosive: explosiveLevel,
                    chain: chainLevel,
                    fire: fireLevel,  // 火焰弹
                    split: splitLevel,  // 分裂弹
                    boomerang: boomerangLevel,  // 回旋镖
                    boomerangReturns: boomerangLevel,  // 剩余返回次数
                    startX: bulletStartX,  // 起始位置（用于回旋镖）
                    startY: bulletStartY,
                    maxDistance: 300,  // 回旋镖最大飞行距离
                    returning: false,  // 是否正在返回
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
                    damage: totalDamage,
                    // 技能效果数据
                    poison: poisonLevel,
                    fire: fireLevel,
                    freeze: freezeLevel,
                    explosive: explosiveLevel,
                    chain: chainLevel,
                    bounceLeft: bounceLevel,
                    pierceLeft: pierceLevel,
                    split: splitLevel,
                    boomerang: boomerangLevel
                });
            }
        });

        // 后坐力（只算主方向一次）
        const recoilForce = CONFIG.RECOIL_FORCE * recoilMultiplier * speedMultiplier;
        boat.vx -= normX * recoilForce;
        boat.vy -= normY * recoilForce;

        gamePlayer.aimAngle = Math.atan2(normX, -normY);

        // ========== 弹幕（环绕子弹）==========
        if (orbitalLevel > 0) {
            const orbitalCount = orbitalLevel;  // 每级1颗环绕弹
            for (let i = 0; i < orbitalCount; i++) {
                // 环绕子弹均匀分布在圆周上
                const angle = (Math.PI * 2 / orbitalCount) * i + Math.random() * 0.5;
                const orbitalDirX = Math.cos(angle);
                const orbitalDirY = Math.sin(angle);

                const orbitalBulletId = `bullet_${game.bulletIdCounter++}`;
                const orbitalBullet = {
                    id: orbitalBulletId,
                    ownerId: socket.id,
                    boatId: gamePlayer.boatId,
                    x: startX + orbitalDirX * 30,
                    y: startY + orbitalDirY * 30,
                    vx: orbitalDirX * CONFIG.BULLET_SPEED * 0.8,
                    vy: orbitalDirY * CONFIG.BULLET_SPEED * 0.8,
                    damage: Math.max(1, totalDamage - 1),  // 伤害略低
                    bounceLeft: 0,
                    pierceLeft: 0,
                    homing: 0,
                    freeze: freezeLevel,
                    poison: poisonLevel,
                    explosive: 0,
                    chain: 0,
                    fire: fireLevel,
                    split: 0,
                    boomerang: 0,
                    boomerangReturns: 0,
                    startX: startX,
                    startY: startY,
                    maxDistance: 200,
                    returning: false,
                    createdAt: Date.now(),
                    lifetime: CONFIG.BULLET_LIFETIME * 0.6,  // 存活时间较短
                    isOrbital: true  // 标记为环绕子弹
                };
                game.bullets.set(orbitalBulletId, orbitalBullet);

                this.io.to(player.roomId).emit(GUNBEAN_EVENTS.BULLET_FIRED, {
                    bulletId: orbitalBulletId,
                    playerId: socket.id,
                    boatId: gamePlayer.boatId,
                    x: orbitalBullet.x,
                    y: orbitalBullet.y,
                    dirX: orbitalDirX,
                    dirY: orbitalDirY,
                    damage: orbitalBullet.damage,
                    isOrbital: true,
                    // 技能效果数据
                    poison: poisonLevel,
                    fire: fireLevel,
                    freeze: freezeLevel
                });
            }
        }
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
     * 处理GM模式：增加20%经验值
     */
    handleGmAddExp(socket) {
        const player = this.playerManager.getPlayer(socket.id);
        if (!player?.roomId) return;

        const game = this.games.get(player.roomId);
        if (!game || !game.isRunning) return;

        console.log(`[GunBeanHandler] GM模式: ${player.name} 触发 +20% 经验值`);

        // 给所有存活玩家增加 20% 经验值
        game.players.forEach(gamePlayer => {
            if (gamePlayer.isDead) return;

            // 计算增加的经验值（升级所需经验的20%）
            const bonusExp = Math.ceil(gamePlayer.expToNext * 0.2);
            gamePlayer.exp += bonusExp;

            console.log(`[GunBeanHandler] ${gamePlayer.name} 获得 ${bonusExp} 经验值 (当前: ${gamePlayer.exp}/${gamePlayer.expToNext})`);

            // 广播经验更新
            this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXP_UPDATE, {
                playerId: gamePlayer.id,
                level: gamePlayer.level,
                exp: gamePlayer.exp,
                expToNext: gamePlayer.expToNext
            });

            // 检查升级
            if (gamePlayer.exp >= gamePlayer.expToNext) {
                this.playerLevelUp(game, gamePlayer);
            }
        });
    }

    /**
     * 子弹命中敌人
     */
    hitEnemy(game, bullet, enemy) {
        const killer = game.players.get(bullet.ownerId);
        let damage = bullet.damage || 1;
        const now = Date.now();
        let isCrit = false;

        // 暴击
        if (killer) {
            const critLevel = killer.skills['crit'] || 0;
            const destructionLevel = killer.skills['destructionStrike'] || 0;

            // 毁灭打击传说技能：增加暴击率和暴击伤害
            const baseCritChance = critLevel * 0.1;
            const bonusCritChance = destructionLevel * 0.1;  // 每级+10%暴击率
            const totalCritChance = baseCritChance + bonusCritChance + (destructionLevel > 0 ? 0.2 : 0);  // 基础+20%

            if (Math.random() < totalCritChance) {
                isCrit = true;
                // 毁灭打击：暴击伤害3倍起，每级+0.5倍
                const critMultiplier = destructionLevel > 0 ? (3 + (destructionLevel - 1) * 0.5) : 2;
                damage = Math.ceil(damage * critMultiplier);
            }

            // ========== 连击系统 ==========
            const comboLevel = killer.skills['combo'] || 0;
            if (comboLevel > 0) {
                // 2秒内连续命中算连击
                if (now - killer.lastHitTime < 2000) {
                    killer.comboCount++;
                } else {
                    killer.comboCount = 1;
                }
                killer.lastHitTime = now;

                // 每级每次连击增加5%伤害
                const comboBonus = 1 + (killer.comboCount - 1) * comboLevel * 0.05;
                damage = Math.ceil(damage * comboBonus);
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
            enemy.poisonDamage = bullet.poison;  // 使用技能等级作为伤害值
            enemy.poisonedUntil = Date.now() + bullet.poison * 1000;
            enemy.poisonOwner = bullet.ownerId;
            enemy.lastPoisonTick = Date.now();
        }

        // ========== 火焰弹效果 ==========
        if (bullet.fire > 0) {
            enemy.burning = true;
            enemy.burnDamage = bullet.fire;  // 使用技能等级作为伤害值
            enemy.burningUntil = Date.now() + bullet.fire * 1000;
            enemy.burnOwner = bullet.ownerId;
            enemy.lastBurnTick = Date.now();
        }

        // ========== 分裂弹效果 ==========
        if (bullet.split > 0 && !bullet.isSplitBullet) {
            const splitCount = bullet.split * 2;  // 每级2颗分裂弹
            for (let i = 0; i < splitCount; i++) {
                const angle = (Math.PI * 2 / splitCount) * i;
                const splitDirX = Math.cos(angle);
                const splitDirY = Math.sin(angle);

                const splitBulletId = `bullet_${game.bulletIdCounter++}`;
                const splitBullet = {
                    id: splitBulletId,
                    ownerId: bullet.ownerId,
                    boatId: bullet.boatId,
                    x: enemy.x + splitDirX * 10,
                    y: enemy.y + splitDirY * 10,
                    vx: splitDirX * CONFIG.BULLET_SPEED * 0.6,
                    vy: splitDirY * CONFIG.BULLET_SPEED * 0.6,
                    damage: Math.max(1, Math.ceil(bullet.damage * 0.5)),  // 伤害减半
                    bounceLeft: 0,
                    pierceLeft: 0,
                    homing: 0,
                    freeze: bullet.freeze,
                    poison: bullet.poison,
                    explosive: 0,
                    chain: 0,
                    fire: bullet.fire,
                    split: 0,  // 分裂弹不再分裂
                    boomerang: 0,
                    boomerangReturns: 0,
                    startX: enemy.x,
                    startY: enemy.y,
                    maxDistance: 150,
                    returning: false,
                    createdAt: Date.now(),
                    lifetime: CONFIG.BULLET_LIFETIME * 0.5,
                    isSplitBullet: true  // 标记为分裂弹
                };
                game.bullets.set(splitBulletId, splitBullet);

                this.io.to(game.roomId).emit(GUNBEAN_EVENTS.BULLET_FIRED, {
                    bulletId: splitBulletId,
                    playerId: bullet.ownerId,
                    boatId: bullet.boatId,
                    x: splitBullet.x,
                    y: splitBullet.y,
                    dirX: splitDirX,
                    dirY: splitDirY,
                    damage: splitBullet.damage,
                    isSplit: true,
                    // 技能效果数据（继承原子弹）
                    poison: splitBullet.poison,
                    fire: splitBullet.fire,
                    freeze: splitBullet.freeze
                });
            }
        }

        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.BULLET_HIT, {
            bulletId: bullet.id,
            hitType: 'enemy',
            enemyId: enemy.id,
            damage: damage
        });

        // ========== 闪电链效果（命中时立即触发，不等待死亡）==========
        if (bullet.chain > 0) {
            this.chainEffect(game, enemy, bullet.chain, damage, bullet.ownerId);
        }

        if (enemy.hp <= 0) {
            this.killEnemy(game, enemy, bullet.ownerId);

            // 爆炸效果（敌人死亡时触发）
            if (bullet.explosive > 0) {
                this.explosiveEffect(game, enemy.x, enemy.y, bullet.explosive, bullet.ownerId);
            }
        }
    }

    /**
     * 击杀敌人
     */
    killEnemy(game, enemy, killerId) {
        game.enemies.delete(enemy.id);

        // 生成经验球（使用敌人的经验倍率，难度翻倍：每级增加4经验而不是2）
        const expMult = enemy.expMultiplier || 1.0;
        const expAmount = Math.ceil((CONFIG.ENEMY_EXP + Math.floor(game.difficultyLevel * 4)) * expMult);
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
                    // 广播血量更新（让客户端看到吸血效果）
                    this.syncState(game.roomId);
                }
            }

            // ========== 黑洞效果 ==========
            const blackHoleLevel = killer.skills['blackHole'] || 0;
            if (blackHoleLevel > 0) {
                // 基础范围100，每级增加20%
                const blackHoleRange = 100 * (1 + blackHoleLevel * 0.2);
                const blackHoleId = `blackhole_${game.blackHoleIdCounter++}`;
                const blackHole = {
                    id: blackHoleId,
                    x: enemy.x,
                    y: enemy.y,
                    range: blackHoleRange,
                    ownerId: killerId,
                    createdAt: Date.now(),
                    lifetime: 3000  // 黑洞存在3秒
                };
                game.blackHoles.set(blackHoleId, blackHole);

                // 通知客户端黑洞生成
                this.io.to(game.roomId).emit(GUNBEAN_EVENTS.BLACK_HOLE_SPAWNED, blackHole);
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

        // 发送爆炸视觉反馈
        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXPLOSIVE_EFFECT, {
            x: x,
            y: y,
            radius: radius,
            level: level
        });

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
        const chainTargets = [];  // 记录闪电链目标位置，用于视觉反馈
        chainTargets.push({ x: sourceEnemy.x, y: sourceEnemy.y });

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
                chainTargets.push({ x: nearestEnemy.x, y: nearestEnemy.y });

                if (nearestEnemy.hp <= 0) {
                    this.killEnemy(game, nearestEnemy, ownerId);
                }
            } else {
                break;
            }
        }

        // 发送闪电链视觉反馈（如果有至少2个目标）
        if (chainTargets.length >= 2) {
            this.io.to(game.roomId).emit(GUNBEAN_EVENTS.CHAIN_EFFECT, {
                targets: chainTargets
            });
        }
    }

    /**
     * 敌人碰撞船只
     */
    enemyHitBoat(game, enemy, boat) {
        const now = Date.now();

        // ========== 幽灵船效果（无敌状态）==========
        if (boat.invincibleUntil && now < boat.invincibleUntil) {
            // 无敌状态下不受伤害，但敌人仍然消失
            game.enemies.delete(enemy.id);
            this.io.to(game.roomId).emit(GUNBEAN_EVENTS.ENEMY_DIED, {
                enemyId: enemy.id,
                killerId: null
            });
            return;
        }

        // 计算减伤（取船上所有存活玩家的最高减伤等级）
        let maxDamageReductionLevel = 0;
        let maxGhostShipLevel = 0;
        let maxRevengeLevel = 0;
        boat.playerIds.forEach(pid => {
            const p = game.players.get(pid);
            if (p && !p.isDead) {
                const dmgRedLevel = p.skills['damageReduction'] || 0;
                if (dmgRedLevel > maxDamageReductionLevel) {
                    maxDamageReductionLevel = dmgRedLevel;
                }
                const ghostLevel = p.skills['ghostShip'] || 0;
                if (ghostLevel > maxGhostShipLevel) {
                    maxGhostShipLevel = ghostLevel;
                }
                const revLevel = p.skills['revenge'] || 0;
                if (revLevel > maxRevengeLevel) {
                    maxRevengeLevel = revLevel;
                }
            }
        });
        const damageReduction = maxDamageReductionLevel * 0.1; // 每级减少10%伤害
        const actualDamage = Math.max(1, Math.round(CONFIG.ENEMY_DAMAGE * (1 - damageReduction)));

        // 检查护盾
        if (boat.shield > 0) {
            boat.shield--;
        } else {
            boat.hp -= actualDamage;
        }

        // ========== 幽灵船效果（触发无敌）==========
        if (maxGhostShipLevel > 0) {
            // 每级0.3秒无敌时间
            const invincibleDuration = maxGhostShipLevel * 300;
            boat.invincibleUntil = now + invincibleDuration;

            // 通知客户端幽灵船效果
            this.io.to(game.roomId).emit(GUNBEAN_EVENTS.GHOST_SHIP, {
                boatId: boat.id,
                duration: invincibleDuration
            });
        }

        // ========== 复仇效果 ==========
        if (maxRevengeLevel > 0) {
            // 基础范围100，每级增加50%
            const revengeRange = 100 * (1 + maxRevengeLevel * 0.5);
            const revengeDamage = 2;  // 固定2点反伤

            // 对范围内的敌人造成伤害
            game.enemies.forEach((nearbyEnemy, nearbyEnemyId) => {
                if (nearbyEnemyId === enemy.id) return;  // 跳过当前敌人

                const dx = boat.x - nearbyEnemy.x;
                const dy = boat.y - nearbyEnemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < revengeRange) {
                    nearbyEnemy.hp -= revengeDamage;
                    if (nearbyEnemy.hp <= 0) {
                        // 找一个存活玩家作为击杀者
                        let killerId = null;
                        boat.playerIds.forEach(pid => {
                            const p = game.players.get(pid);
                            if (p && !p.isDead && !killerId) {
                                killerId = pid;
                            }
                        });
                        this.killEnemy(game, nearbyEnemy, killerId);
                    }
                }
            });

            // 通知客户端复仇效果
            this.io.to(game.roomId).emit(GUNBEAN_EVENTS.REVENGE, {
                boatId: boat.id,
                x: boat.x,
                y: boat.y,
                range: revengeRange
            });
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

        // 根据难度限制敌人数量（难度翻倍：每个难度等级增加2个敌人而不是1个）
        const maxEnemies = Math.min(CONFIG.MAX_ENEMIES, 5 + game.difficultyLevel * 2);
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

        // 随机选择敌人类型（1-8）
        const enemyType = Math.floor(Math.random() * 8) + 1;
        const typeConfig = ENEMY_TYPES[enemyType];

        // 根据难度和类型计算敌人属性（难度翻倍：每级增加1 HP而不是0.5）
        const baseHp = CONFIG.ENEMY_HP + Math.floor(game.difficultyLevel * 1);
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
                y: e.y
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
