/**
 * 枪豆人 - 2D Canvas 场景管理
 * 单船模式：所有玩家坐在同一艘船上，共享血量
 */
import monster1Url from '../../../texture/qiangdouren/monster_1.png';
import monster2Url from '../../../texture/qiangdouren/monster_2.png';
import monster3Url from '../../../texture/qiangdouren/monster_3.png';
import monster4Url from '../../../texture/qiangdouren/monster_4.png';
import monster5Url from '../../../texture/qiangdouren/monster_5.png';
import monster6Url from '../../../texture/qiangdouren/monster_6.png';
import monster7Url from '../../../texture/qiangdouren/monster_7.png';
import monster8Url from '../../../texture/qiangdouren/monster_8.png';
import water1Url from '../../../texture/qiangdouren/water_1.png';
import water2Url from '../../../texture/qiangdouren/water_2.png';
import { gunBeanAudio } from './GunBeanAudio.js';

// 场地配置（扩大到全屏）
const ARENA = {
    WIDTH: 1200,
    HEIGHT: 800,
    WATER_MARGIN: 50
};

// 贴图配置
const TEXTURE_CONFIG = {
    monsters: {
        1: monster1Url,
        2: monster2Url,
        3: monster3Url,
        4: monster4Url,
        5: monster5Url,
        6: monster6Url,
        7: monster7Url,
        8: monster8Url
    },
    water: {
        wave: water1Url,    // 上层（波纹）
        base: water2Url     // 底层
    }
};

// 玩家颜色配置（参考图：黄、青、白/彩虹、粉）
const PLAYER_COLORS = [
    '#ffe66d',   // 黄色
    '#4ecdc4',   // 青色
    '#ffffff',   // 白色
    '#ffb6c1'    // 粉色
];

// 船只配置（单船模式，根据玩家数量动态调整）
const BOAT_CONFIG = {
    WIDTH: 140,     // 船宽度
    HEIGHT: 50,
    // 根据玩家数量动态计算座位偏移
    getSeatOffsets: (playerCount) => {
        if (playerCount <= 1) return [0];
        if (playerCount === 2) return [-20, 20];
        if (playerCount === 3) return [-30, 0, 30];
        return [-45, -15, 15, 45];  // 4人
    }
};

export class GunBeanScene {
    constructor() {
        this.canvas = null;
        this.ctx = null;

        // 游戏对象容器
        this.boats = new Map();
        this.players = new Map();
        this.bullets = new Map();
        this.enemies = new Map();
        this.expOrbs = new Map();  // 经验球
        this.particles = [];
        this.physicsParticles = [];  // 物理粒子（带重力和地面碰撞）
        this.waterRipples = [];      // 水面浪花/波纹
        this.shells = [];            // 抛壳粒子
        this.floatingTexts = [];     // 飘字（伤害数字等）

        // 技能视觉效果
        this.explosiveEffects = [];  // 爆炸效果
        this.chainEffects = [];      // 闪电链效果

        // 贴图资源
        this.textures = {
            monsters: {},
            whiteMonsters: {}, // 预生成的白色剪影
            water: {}
        };
        this.texturesLoaded = false;

        // 本地玩家ID（用于区分名字颜色）
        this.localPlayerId = null;

        // 摄像机固定在中心（不再跟随）
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraFixed = true;

        // 动画相关
        this.time = 0;
        this.waveOffset = 0;

        // 插值系数
        this.lerpSpeed = 0.15;

        // 震屏效果
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeStartTime = 0;

        // 全屏泛白效果
        this.screenFlashAlpha = 0;
        this.screenFlashDuration = 0;
        this.screenFlashStartTime = 0;

        // 低血量警告效果
        this.lowHealthWarning = false;
        this.lowHealthIntensity = 0;
        this.lowHealthGradientCache = null;  // 缓存渐变对象
        this.lastCanvasSize = { w: 0, h: 0 }; // 缓存画布尺寸

        // 辅助画布 (用于处理闪白等特效的合成)
        this.helperCanvas = document.createElement('canvas');
        this.helperCanvas.width = 256;
        this.helperCanvas.height = 256;
        this.helperCtx = this.helperCanvas.getContext('2d');
    }

    /**
     * 设置本地玩家ID
     */
    setLocalPlayerId(playerId) {
        this.localPlayerId = playerId;
    }

    /**
     * 初始化场景
     */
    async init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gunbean-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '50';
        // 引入后期处理效果 (CSS 滤镜模拟)
        // 增加对比度和饱和度，模拟电影感
        this.canvas.style.filter = 'contrast(1.15) saturate(1.2) brightness(1.05)';
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d', { alpha: false }); // 优化：关闭透明通道 (如果背景是不透明的)

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 加载资源
        await this.loadResources();
    }

    /**
     * 加载资源
     */
    async loadResources() {
        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`[GunBeanScene] 贴图加载失败: ${src}`);
                    resolve(null);
                };
                img.src = src;
            });
        };

        const promises = [];

        // 加载小怪贴图
        Object.entries(TEXTURE_CONFIG.monsters).forEach(([type, src]) => {
            promises.push(loadImage(src).then(img => {
                if (img) {
                    this.textures.monsters[type] = img;
                    // 预生成白色剪影
                    this.textures.whiteMonsters[type] = this.createWhiteTexture(img);
                }
            }));
        });

        // 加载水面贴图
        Object.entries(TEXTURE_CONFIG.water).forEach(([type, src]) => {
            promises.push(loadImage(src).then(img => {
                if (img) {
                    this.textures.water[type] = img;
                    // 预生成 Pattern (渲染管线优化)
                    if (this.ctx) {
                        this.textures.water[type + 'Pattern'] = this.ctx.createPattern(img, 'repeat');
                    }
                }
            }));
        });

        await Promise.all(promises);
        this.texturesLoaded = true;
        console.log('[GunBeanScene] 资源加载完成');
    }

    /**
     * 创建白色剪影贴图
     */
    createWhiteTexture(sourceImage) {
        const canvas = document.createElement('canvas');
        canvas.width = sourceImage.width;
        canvas.height = sourceImage.height;
        const ctx = canvas.getContext('2d');

        // 绘制原图
        ctx.drawImage(sourceImage, 0, 0);

        // 使用 source-in 填充白色
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return canvas;
    }

    /**
     * 调整画布大小
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const scaleX = this.canvas.width / (ARENA.WIDTH + ARENA.WATER_MARGIN * 2);
        const scaleY = this.canvas.height / (ARENA.HEIGHT + ARENA.WATER_MARGIN * 2);
        this.scale = Math.min(scaleX, scaleY, 1.5);
    }

    /**
     * 游戏坐标转屏幕坐标
     */
    gameToScreen(x, y) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        return {
            x: centerX + (x - this.cameraX) * this.scale,
            y: centerY + (y - this.cameraY) * this.scale
        };
    }

    /**
     * 更新摄像机（固定模式不跟随）
     */
    updateCamera(targetX, targetY) {
        // 摄像机固定在中心，不再跟随目标
        if (this.cameraFixed) {
            this.cameraX = 0;
            this.cameraY = 0;
        } else {
            this.cameraX += (targetX - this.cameraX) * 0.08;
            this.cameraY += (targetY - this.cameraY) * 0.08;
        }
    }

    // ========== 视觉效果方法 ==========

    /**
     * 开始震屏效果
     * @param {number} intensity 震动强度（像素）
     * @param {number} duration 持续时间（毫秒）
     */
    startScreenShake(intensity = 10, duration = 200) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeStartTime = Date.now();
    }

    /**
     * 获取当前震屏偏移
     */
    getShakeOffset() {
        if (this.shakeIntensity <= 0) return { x: 0, y: 0 };

        const elapsed = Date.now() - this.shakeStartTime;
        if (elapsed >= this.shakeDuration) {
            this.shakeIntensity = 0;
            return { x: 0, y: 0 };
        }

        // 震动强度随时间衰减
        const progress = 1 - (elapsed / this.shakeDuration);
        const currentIntensity = this.shakeIntensity * progress;

        return {
            x: (Math.random() - 0.5) * 2 * currentIntensity,
            y: (Math.random() - 0.5) * 2 * currentIntensity
        };
    }

    /**
     * 开始全屏泛白效果
     * @param {number} intensity 初始透明度（0-1）
     * @param {number} duration 持续时间（毫秒）
     */
    startScreenFlash(intensity = 0.5, duration = 300) {
        this.screenFlashAlpha = intensity;
        this.screenFlashDuration = duration;
        this.screenFlashStartTime = Date.now();
    }

    /**
     * 获取当前全屏泛白透明度
     */
    getScreenFlashAlpha() {
        if (this.screenFlashAlpha <= 0) return 0;

        const elapsed = Date.now() - this.screenFlashStartTime;
        if (elapsed >= this.screenFlashDuration) {
            this.screenFlashAlpha = 0;
            return 0;
        }

        // 透明度随时间衰减
        const progress = 1 - (elapsed / this.screenFlashDuration);
        return this.screenFlashAlpha * progress;
    }

    /**
     * 触发实体闪白效果
     * @param {string} entityType 实体类型 ('enemy' | 'boat' | 'player')
     * @param {string|number} entityId 实体ID
     * @param {number} duration 闪白持续时间（毫秒）
     */
    flashEntity(entityType, entityId, duration = 100) {
        let entity = null;
        if (entityType === 'enemy') {
            entity = this.enemies.get(entityId);
        } else if (entityType === 'boat') {
            entity = this.boats.get(entityId);
        } else if (entityType === 'player') {
            entity = this.players.get(entityId);
        }

        if (entity) {
            entity.flashEndTime = Date.now() + duration;
            entity.flashDuration = duration;  // 保存持续时间用于计算
        }
    }

    /**
     * 触发射击效果 (后坐力、音效、抛壳、震屏)
     * @param {string} playerId 玩家ID
     * @param {number} angle 射击角度
     */
    triggerShootEffect(playerId, angle) {
        const player = this.players.get(playerId);
        if (player) {
            // 1. 后坐力动画 (设置 offset, 在 drawPlayer 中衰减)
            player.recoilOffset = 6; // 向后 6px
            
            // 2. 抛壳
            // 计算枪口位置 (大致在右侧)
            // 简单起见，从玩家中心抛出
            // 抛壳方向：射击方向的右侧 (angle + PI/2)
            const shellDir = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            const boat = this.boats.get(player.boatId);
            if (boat) {
                // 需要计算玩家在船上的世界坐标
                const playerCount = boat.playerIds ? boat.playerIds.length : this.players.size;
                const seatOffsets = BOAT_CONFIG.getSeatOffsets(playerCount);
                const seatOffset = (seatOffsets[player.seatIndex] || 0);
                const px = boat.x + seatOffset;
                const py = boat.y;
                
                this.createShell(px, py, shellDir);
            }

            // 3. 播放音效
            gunBeanAudio.playSfx('shoot');

            // 4. 开枪震屏已移除
        }
    }

    /**
     * 播放射击音效 (Placeholder)
     */
    playShootSound() {
        // const audio = new Audio('/audio/shoot.mp3');
        // audio.volume = 0.3;
        // audio.play().catch(() => {});
    }

    /**
     * 创建弹壳
     */
    createShell(x, y, dir) {
        const speed = 100 + Math.random() * 50;
        this.shells.push({
            x: x,
            y: y,
            vx: Math.cos(dir) * speed,
            vy: Math.sin(dir) * speed - 150, // 向上抛
            angle: Math.random() * Math.PI * 2,
            vAngle: (Math.random() - 0.5) * 10, // 旋转速度
            life: 1.0,
            maxLife: 1.0
        });
    }

    /**
     * 绘制弹壳
     */
    drawShells(ctx) {
        ctx.save();
        this.shells.forEach(s => {
            const pos = this.gameToScreen(s.x, s.y);
            ctx.translate(pos.x, pos.y);
            ctx.rotate(s.angle);
            
            ctx.fillStyle = '#ffd700'; // 金色
            ctx.fillRect(-2 * this.scale, -1 * this.scale, 4 * this.scale, 2 * this.scale);
            
            ctx.rotate(-s.angle);
            ctx.translate(-pos.x, -pos.y);
        });
        ctx.restore();
    }

    /**
     * 创建物理死亡粒子（带重力和地面碰撞）
     * 增强版：更多粒子、更大力度、更夸张的爆炸效果
     * @param {number} x
     * @param {number} y
     * @param {string} color
     * @param {object} direction {x, y} normalized vector
     */
    createDeathExplosion(x, y, color = '#ff4444', direction = null) {
        const particleCount = 30;  // 粒子数量翻倍
        const colors = ['#ff4444', '#ff6600', '#ffaa00', '#ffffff', '#ffff00'];

        for (let i = 0; i < particleCount; i++) {
            let angle;
            let speed = 300 + Math.random() * 400;

            if (direction) {
                // 如果有方向，限制在前方 90 度扇形内
                const baseAngle = Math.atan2(direction.y, direction.x);
                const spread = (Math.random() - 0.5) * Math.PI * 0.8; // +/- 72度 spread
                angle = baseAngle + spread;
                speed *= 1.2; // 定向爆破速度更快
            } else {
                angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
            }

            this.physicsParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 250,  // 更强的向上爆发力
                color: colors[Math.floor(Math.random() * colors.length)],
                radius: (8 + Math.random() * 12) * 0.7,  // 粒子大小缩放到 0.7
                life: 2.0 + Math.random() * 0.8,  // 更长的生命
                gravity: 800,  // 更强的重力
                bounce: 0.6 + Math.random() * 0.25,  // 更强的弹性
                friction: 0.85
            });
        }
    }

    /**
     * 创建船只受击粒子 (这里也复用于怪物受击，增强效果)
     */
    createHitParticles(x, y) {
        const particleCount = 12; // 增加粒子数量
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150; // 提高速度
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed * 0.05,
                vy: Math.sin(angle) * speed * 0.05,
                color: Math.random() > 0.5 ? '#ff4444' : '#ffffff', // 红白相间
                radius: 4 + Math.random() * 4,
                life: 0.6
            });
        }
    }

    /**
     * 创建船只（包含生命值）
     */
    createBoat(boatData) {
        const boat = {
            id: boatData.id,
            x: boatData.x || 0,
            y: boatData.y || 0,
            targetX: boatData.x || 0,
            targetY: boatData.y || 0,
            vx: 0,
            vy: 0,
            hp: boatData.hp || 10,
            maxHp: boatData.maxHp || 10,
            playerIds: boatData.playerIds || []
        };
        this.boats.set(boatData.id, boat);
        return boat;
    }

    /**
     * 更新船只位置和HP（带插值）
     */
    updateBoatPosition(boatId, x, y, vx, vy, hp, maxHp) {
        const boat = this.boats.get(boatId);
        if (boat) {
            boat.targetX = x;
            boat.targetY = y;
            boat.vx = vx || 0;
            boat.vy = vy || 0;
            if (hp !== undefined) boat.hp = hp;
            if (maxHp !== undefined) boat.maxHp = maxHp;
        }
    }

    /**
     * 创建玩家（无生命值）
     */
    createPlayer(playerData) {
        const colorIndex = playerData.colorIndex || 0;
        const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];

        const player = {
            id: playerData.id,
            name: playerData.name || `玩家${playerData.id.slice(-4)}`,
            color: color,
            colorIndex: colorIndex,
            boatId: playerData.boatId,
            seatIndex: playerData.seatIndex || 0,
            aimAngle: 0,
            isDead: false
        };

        this.players.set(playerData.id, player);
        return player;
    }

    /**
     * 更新玩家瞄准方向
     */
    updatePlayerAim(playerId, aimAngle) {
        const player = this.players.get(playerId);
        if (player) {
            player.aimAngle = aimAngle;
        }
    }

    /**
     * 更新玩家位置（通过船只）
     */
    updatePlayerPosition(playerId, x, y, vx, vy) {
        // 在双人船模式下，位置由船只决定
        // 这个方法保留用于兼容
    }

    /**
     * 更新玩家血量
     */
    updatePlayerHealth(playerId, hp, maxHp) {
        const player = this.players.get(playerId);
        if (player) {
            player.hp = hp;
            player.maxHp = maxHp;
        }
    }

    /**
     * 设置玩家死亡状态
     */
    setPlayerDead(playerId, isDead) {
        const player = this.players.get(playerId);
        if (player) {
            player.isDead = isDead;
        }
    }

    /**
     * 创建子弹
     */
    createBullet(bulletData) {
        const bullet = {
            id: bulletData.id,
            x: bulletData.x,
            y: bulletData.y,
            vx: bulletData.vx,
            vy: bulletData.vy,
            // 技能效果数据
            poison: bulletData.poison || 0,
            fire: bulletData.fire || 0,
            freeze: bulletData.freeze || 0,
            explosive: bulletData.explosive || 0,
            chain: bulletData.chain || 0,
            bounceLeft: bulletData.bounceLeft || 0,
            pierceLeft: bulletData.pierceLeft || 0,
            split: bulletData.split || 0,
            boomerang: bulletData.boomerang || 0,
            isOrbital: bulletData.isOrbital || false,
            isSplit: bulletData.isSplit || false
        };
        this.bullets.set(bulletData.id, bullet);
        return bullet;
    }

    /**
     * 移除子弹
     */
    removeBullet(bulletId) {
        this.bullets.delete(bulletId);
    }

    /**
     * 创建敌人
     */
    createEnemy(enemyData) {
        const enemy = {
            id: enemyData.id,
            x: enemyData.x || 0,
            y: enemyData.y || 0,
            targetX: enemyData.x || 0,
            targetY: enemyData.y || 0,
            hp: enemyData.hp || 3,
            type: enemyData.type || 1,    // 敌人类型（1-3）
            size: enemyData.size || 30,   // 敌人尺寸
            rotation: 0
        };
        this.enemies.set(enemyData.id, enemy);
        return enemy;
    }

    /**
     * 更新敌人位置（带插值）
     */
    updateEnemyPosition(enemyId, x, y) {
        const enemy = this.enemies.get(enemyId);
        if (enemy) {
            enemy.targetX = x;
            enemy.targetY = y;
            // enemy.rotation += 0.05; // 移除旋转
        }
    }

    /**
     * 移除敌人（带夸张死亡粒子效果）
     */
    removeEnemy(enemyId, hitDirection = null) {
        const enemy = this.enemies.get(enemyId);
        if (enemy) {
            // 使用物理粒子创建夸张的死亡效果
            this.createDeathExplosion(enemy.x, enemy.y, '#ff4444', hitDirection);
            // 同时保留普通爆炸效果叠加
            this.createExplosion(enemy.x, enemy.y);
            
            // 播放死亡音效
            gunBeanAudio.playSfx('lose');
            
            this.enemies.delete(enemyId);
        }
    }

    // ========== 经验球相关方法 ==========

    /**
     * 创建经验球
     */
    createExpOrb(orbData) {
        const orb = {
            id: orbData.id,
            x: orbData.x || 0,
            y: orbData.y || 0,
            targetX: orbData.x || 0,
            targetY: orbData.y || 0,
            exp: orbData.exp || 10,
            pulsePhase: Math.random() * Math.PI * 2  // 随机初相位
        };
        this.expOrbs.set(orbData.id, orb);
        return orb;
    }

    /**
     * 更新经验球位置（带插值）
     */
    updateExpOrbPosition(orbId, x, y) {
        const orb = this.expOrbs.get(orbId);
        if (orb) {
            orb.targetX = x;
            orb.targetY = y;
        }
    }

    /**
     * 移除经验球（带收集效果）
     */
    removeExpOrb(orbId) {
        const orb = this.expOrbs.get(orbId);
        if (orb) {
            // 创建收集粒子效果
            this.createExpCollectEffect(orb.x, orb.y);
            this.expOrbs.delete(orbId);
        }
    }

    /**
     * 创建经验球收集效果
     */
    createExpCollectEffect(x, y) {
        const particleCount = 6;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 1.5 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#00f2ff',
                radius: 3 + Math.random() * 3,
                life: 0.6
            });
        }
    }

    /**
     * 创建爆炸效果
     */
    createExplosion(x, y) {
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: Math.random() > 0.5 ? '#ff4444' : '#ff8800',
                radius: 4 + Math.random() * 4,
                life: 1
            });
        }
    }

    /**
     * 创建技能爆炸效果（大范围爆炸）
     */
    createExplosiveEffect(x, y, radius) {
        this.explosiveEffects.push({
            x: x,
            y: y,
            maxRadius: radius,
            currentRadius: 0,
            life: 0.5,      // 持续时间（秒）
            maxLife: 0.5
        });
    }

    /**
     * 创建闪电链效果
     */
    createChainEffect(targets) {
        this.chainEffects.push({
            targets: targets,
            life: 0.3,      // 持续时间（秒）
            maxLife: 0.3
        });
    }

    /**
     * 创建场景内飘字（伤害数字、治疗等）
     * @param {number} x 游戏坐标X
     * @param {number} y 游戏坐标Y
     * @param {string} text 显示的文字
     * @param {string} color 文字颜色
     * @param {number} fontSize 字体大小
     */
    createFloatingText(x, y, text, color = '#ff4444', fontSize = 24) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            fontSize: fontSize,
            life: 1.0,        // 生命周期（秒）
            maxLife: 1.0,
            offsetY: 0,       // 上浮偏移
            scale: 1.5        // 初始放大（弹出效果）
        });
    }

    /**
     * 检测是否在场地内
     */
    isOnPlatform(x, y) {
        const halfW = ARENA.WIDTH / 2;
        const halfH = ARENA.HEIGHT / 2;
        return x >= -halfW && x <= halfW && y >= -halfH && y <= halfH;
    }

    /**
     * 更新所有动画
     */
    update(deltaTime) {
        this.time += deltaTime;
        this.waveOffset += deltaTime * 2;

        // 插值更新船只位置（优化版：简化计算，减少卡顿）
        this.boats.forEach(boat => {
            const dx = boat.targetX - boat.x;
            const dy = boat.targetY - boat.y;
            const distSq = dx * dx + dy * dy;

            // 简化的动态插值：使用距离平方阈值直接判断
            // 避免复杂的除法和缓动计算
            let dynamicLerp;
            if (distSq < 100) {
                // 距离 < 10px，使用最慢速度
                dynamicLerp = this.lerpSpeed;
            } else if (distSq < 900) {
                // 距离 10-30px，使用中速
                dynamicLerp = 0.3;
            } else if (distSq < 2500) {
                // 距离 30-50px，使用快速
                dynamicLerp = 0.5;
            } else {
                // 距离 > 50px，使用最快速度（后坐力爆发）
                dynamicLerp = 0.75;
            }

            boat.x += dx * dynamicLerp;
            boat.y += dy * dynamicLerp;

            // 生成船只浪花（降低频率优化性能）
            if (Math.random() < 0.1 && this.waterRipples.length < 30) {
                this.createWaterRipple(
                    boat.x + (Math.random() - 0.5) * 40,
                    boat.y + 20 + (Math.random() - 0.5) * 5,
                    10 + Math.random() * 10
                );
            }
        });

        // 插值更新敌人位置
        this.enemies.forEach(enemy => {
            enemy.x += (enemy.targetX - enemy.x) * this.lerpSpeed;
            enemy.y += (enemy.targetY - enemy.y) * this.lerpSpeed;

            // 生成敌人浪花（降低频率优化性能）
            if (Math.random() < 0.02 && this.waterRipples.length < 30) {
                const size = (enemy.size || 30) * this.scale;
                this.createWaterRipple(
                    enemy.x + (Math.random() - 0.5) * 10,
                    enemy.y + size * 0.25 + (Math.random() - 0.5) * 5,
                    5 + Math.random() * 5
                );
            }
        });

        // 插值更新经验球位置
        this.expOrbs.forEach(orb => {
            orb.x += (orb.targetX - orb.x) * this.lerpSpeed * 1.5;  // 经验球移动更快
            orb.y += (orb.targetY - orb.y) * this.lerpSpeed * 1.5;
        });

        // 更新子弹位置
        this.bullets.forEach(bullet => {
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
        });

        // 更新普通粒子
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= deltaTime * 2;
            p.radius *= 0.98;
            return p.life > 0;
        });

        // 更新物理粒子（带重力和地面碰撞）- 优化版
        const groundY = ARENA.HEIGHT / 2 - 20;  // 地面位置（场地底部）
        const boundX = ARENA.WIDTH / 2 - 10;    // 侧边界（缓存避免重复计算）
        const stopBounceThreshold = 20;          // 停止反弹的阈值
        const stopBounceThresholdSq = stopBounceThreshold * stopBounceThreshold; // 使用平方比较

        this.physicsParticles = this.physicsParticles.filter(p => {
            // 应用重力
            p.vy += p.gravity * deltaTime;

            // 更新位置
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // 地面碰撞检测和反弹（优化：使用平方比较避免 Math.abs）
            if (p.y > groundY) {
                p.y = groundY;
                p.vy = -p.vy * p.bounce;
                p.vx *= p.friction;

                // 速度太小时停止反弹（使用平方比较避免 Math.sqrt）
                if (p.vy * p.vy < stopBounceThresholdSq) {
                    p.vy = 0;
                }
            }

            // 侧边界碰撞（优化：减少 Math.max/min 调用）
            if (p.x < -boundX) {
                p.vx = -p.vx * p.bounce;
                p.x = -boundX;
            } else if (p.x > boundX) {
                p.vx = -p.vx * p.bounce;
                p.x = boundX;
            }

            // 生命值衰减
            p.life -= deltaTime;
            p.radius *= 0.995;

            return p.life > 0 && p.radius > 0.5;
        });

        // 更新水面浪花
        this.waterRipples = this.waterRipples.filter(r => {
            r.life -= deltaTime;
            // 半径随时间扩散
            const progress = 1 - (r.life / r.maxLife);
            r.currentRadius = r.radius + (r.maxRadius - r.radius) * progress;
            return r.life > 0;
        });

        // 更新弹壳（优化版：减少条件判断）
        const shellGroundY = 50;  // 弹壳地面位置
        const gravity = 800;      // 重力（缓存常量）

        this.shells = this.shells.filter(s => {
            s.x += s.vx * deltaTime;
            s.y += s.vy * deltaTime;
            s.vy += gravity * deltaTime;
            s.angle += s.vAngle * deltaTime;
            s.life -= deltaTime;

            // 地面碰撞（优化：减少条件分支）
            if (s.y > shellGroundY) {
                s.y = shellGroundY;
                if (s.vy > 0) {
                    s.vy = -s.vy * 0.5;
                    s.vx *= 0.8;
                }
            }
            return s.life > 0;
        });

        // 更新飘字
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.life -= deltaTime;
            ft.offsetY -= 50 * deltaTime;  // 上浮
            ft.scale = Math.max(1.0, ft.scale - deltaTime * 2);  // 缩放回正常大小
            return ft.life > 0;
        });

        // 更新爆炸效果
        this.explosiveEffects = this.explosiveEffects.filter(e => {
            e.life -= deltaTime;
            const progress = 1 - (e.life / e.maxLife);
            e.currentRadius = e.maxRadius * progress;
            return e.life > 0;
        });

        // 更新闪电链效果
        this.chainEffects = this.chainEffects.filter(c => {
            c.life -= deltaTime;
            return c.life > 0;
        });

        // 更新玩家后坐力回弹
        this.players.forEach(player => {
            if (player.recoilOffset > 0) {
                player.recoilOffset -= 20 * deltaTime; // 线性回弹
                if (player.recoilOffset < 0) player.recoilOffset = 0;
            }
        });
    }

    /**
     * 创建水面浪花
     */
    createWaterRipple(x, y, radius) {
        this.waterRipples.push({
            x,
            y,
            radius,         // 初始半径
            maxRadius: radius * 3, // 最大扩散半径
            currentRadius: radius,
            life: 1.5,      // 生命周期
            maxLife: 1.5
        });
    }

    /**
     * 渲染场景
     */
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 应用震屏偏移
        const shake = this.getShakeOffset();
        ctx.save();
        ctx.translate(shake.x, shake.y);

        // 绘制海洋背景
        this.drawOcean(ctx, w, h);

        // 绘制水面浪花 (在实体之下，改为涟漪)
        this.drawWaterRipples(ctx);

        // 绘制场地边界
        this.drawArena(ctx);

        // 绘制经验球
        this.expOrbs.forEach(orb => {
            this.drawExpOrb(ctx, orb);
        });

        // 绘制敌人
        this.enemies.forEach(enemy => {
            this.drawEnemy(ctx, enemy);
        });

        // 绘制子弹
        this.bullets.forEach(bullet => {
            this.drawBullet(ctx, bullet);
        });

        // 绘制船只和玩家
        this.boats.forEach(boat => {
            this.drawBoat(ctx, boat);
        });

        // 绘制粒子
        this.drawParticles(ctx);

        // 绘制物理粒子
        this.drawPhysicsParticles(ctx);
        
        // 绘制弹壳
        this.drawShells(ctx);

        // 绘制爆炸效果
        this.drawExplosiveEffects(ctx);

        // 绘制闪电链效果
        this.drawChainEffects(ctx);

        // 绘制场景内飘字（伤害数字等）
        this.drawFloatingTexts(ctx);

        // 恢复震屏偏移
        ctx.restore();

        // 绘制全屏泛红效果（在最上层）
        const flashAlpha = this.getScreenFlashAlpha();
        if (flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
            ctx.fillRect(0, 0, w, h);
        }

        // 低血量屏幕边缘泛红效果（2颗心以下）
        if (this.lowHealthWarning) {
            this.drawLowHealthVignette(ctx, w, h);
        }
    }

    /**
     * 设置低血量警告状态
     * @param {boolean} enabled 是否启用
     * @param {number} intensity 强度 (0-1)
     */
    setLowHealthWarning(enabled, intensity = 1) {
        this.lowHealthWarning = enabled;
        this.lowHealthIntensity = intensity;
    }

    /**
     * 绘制低血量屏幕边缘泛红效果（优化版：使用缓存Canvas）
     */
    drawLowHealthVignette(ctx, w, h) {
        const intensity = this.lowHealthIntensity || 1;
        // 脉动效果
        const pulse = 0.3 + Math.sin(this.time * 4) * 0.15;
        const alpha = pulse * intensity;

        // 仅当画布尺寸变化时重新创建缓存Canvas
        if (!this.lowHealthCanvas || this.lastCanvasSize.w !== w || this.lastCanvasSize.h !== h) {
            // 创建离屏Canvas缓存渐变
            this.lowHealthCanvas = document.createElement('canvas');
            this.lowHealthCanvas.width = w;
            this.lowHealthCanvas.height = h;
            const offCtx = this.lowHealthCanvas.getContext('2d');

            const gradient = offCtx.createRadialGradient(
                w / 2, h / 2, Math.min(w, h) * 0.3,
                w / 2, h / 2, Math.max(w, h) * 0.8
            );
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
            gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(139, 0, 0, 0.6)');

            offCtx.fillStyle = gradient;
            offCtx.fillRect(0, 0, w, h);

            this.lastCanvasSize.w = w;
            this.lastCanvasSize.h = h;
        }

        // 使用 globalAlpha 控制脉动，直接绘制缓存的Canvas
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(this.lowHealthCanvas, 0, 0);
        ctx.restore();
    }

    /**
     * 绘制海洋背景
     */
    drawOcean(ctx, w, h) {
        // 如果贴图未加载，使用兜底渐变
        if (!this.texturesLoaded || !this.textures.water.base || !this.textures.water.wave) {
            const gradient = ctx.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, '#1a5276');
            gradient.addColorStop(0.5, '#2874a6');
            gradient.addColorStop(1, '#1a5276');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
            return;
        }

        // 1. 绘制底层（静态）- water_2
        // 使用 pattern 重复铺满
        const patternBase = ctx.createPattern(this.textures.water.base, 'repeat');
        ctx.fillStyle = patternBase;
        
        ctx.save();
        // 稍微放大一点纹理
        const scale = 1.0; 
        ctx.scale(scale, scale);
        ctx.fillRect(0, 0, w / scale, h / scale);
        ctx.restore();

        // 2. 绘制上层（波纹，向左移动）- water_1
        // 计算偏移量 (循环移动)
        const scrollSpeed = 30; // 像素/秒
        // 假设贴图宽度 512 (或者任意大小，pattern会自动处理)
        const offsetX = (this.time * scrollSpeed); 
        
        ctx.globalAlpha = 0.5; // 半透明叠加
        const patternWave = ctx.createPattern(this.textures.water.wave, 'repeat');
        
        ctx.save();
        // 设置 pattern 的变换矩阵来实现滚动
        const matrix = new DOMMatrix();
        matrix.translateSelf(-offsetX, 0); // 向左移动
        patternWave.setTransform(matrix);
        
        ctx.fillStyle = patternWave;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
        
        ctx.globalAlpha = 1.0;
    }

    /**
     * 绘制场地边界
     */
    drawArena(ctx) {
        const halfW = ARENA.WIDTH / 2;
        const halfH = ARENA.HEIGHT / 2;

        const tl = this.gameToScreen(-halfW, -halfH);
        const br = this.gameToScreen(halfW, halfH);

        const arenaW = (br.x - tl.x);
        const arenaH = (br.y - tl.y);

        ctx.fillStyle = 'rgba(64, 164, 223, 0.3)';
        ctx.fillRect(tl.x, tl.y, arenaW, arenaH);

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(tl.x, tl.y, arenaW, arenaH);
        ctx.setLineDash([]);

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 15;
        ctx.strokeRect(tl.x + 8, tl.y + 8, arenaW - 16, arenaH - 16);
    }

    /**
     * 绘制水面浪花 (涟漪效果)
     */
    drawWaterRipples(ctx) {
        ctx.save();
        this.waterRipples.forEach(r => {
            const pos = this.gameToScreen(r.x, r.y);
            const progress = 1 - (r.life / r.maxLife);
            const alpha = (1 - progress) * 0.6; // 随扩散渐隐
            
            ctx.beginPath();
            // 使用椭圆来模拟透视感 (压扁一点)
            ctx.ellipse(
                pos.x, 
                pos.y, 
                r.currentRadius * this.scale, 
                r.currentRadius * 0.7 * this.scale, // Y轴缩放0.7
                0, 0, Math.PI * 2
            );
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2 * (1 - progress) * this.scale; // 线条随扩散变细
            ctx.stroke();
        });
        ctx.restore();
    }

    /**
     * 绘制船只（四人船，参考图样式）
     */
    drawBoat(ctx, boat) {
        const pos = this.gameToScreen(boat.x, boat.y);
        const width = BOAT_CONFIG.WIDTH * this.scale;
        const height = BOAT_CONFIG.HEIGHT * this.scale;

        // 获取船上的玩家
        const playersOnBoat = [];
        this.players.forEach(player => {
            if (player.boatId === boat.id) {
                playersOnBoat.push(player);
            }
        });

        // 检查船只是否被摧毁
        const isDestroyed = boat.hp <= 0;

        // 检测是否在闪白状态
        const isFlashing = boat.flashEndTime && Date.now() < boat.flashEndTime;

        ctx.save();
        ctx.translate(pos.x, pos.y);

        // 阴影位置恢复到中心/底部
        if (!isDestroyed) {
            ctx.save();
            ctx.translate(0, height * 0.2); // 稍微往下移一点点
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetY = 3;
            // 绘制阴影椭圆
            ctx.beginPath();
            ctx.ellipse(0, 0, width * 0.45, height * 0.2, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fill();
            ctx.restore();
        }

        // 船身半透明（如果被摧毁）
        if (isDestroyed) {
            ctx.globalAlpha = 0.4;
        }

        // 绘制船头水花（白色波浪）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 5; i++) {
            const waveX = -width * 0.3 + i * width * 0.15;
            const waveY = -height * 0.1 - Math.sin(this.time * 5 + i) * 3;
            ctx.beginPath();
            ctx.arc(waveX, waveY, 6 * this.scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // 船身主体（闪白时使用白色，否则棕色木船）
        ctx.fillStyle = isFlashing ? '#ffffff' : '#8B4513';
        ctx.beginPath();
        const shipLeft = -width * 0.5;
        const shipRight = width * 0.5;
        const shipTop = -height * 0.3;
        const shipBottom = height * 0.3;
        const radius = 8 * this.scale;

        ctx.moveTo(shipLeft + radius, shipTop);
        ctx.lineTo(shipRight - radius, shipTop);
        ctx.quadraticCurveTo(shipRight, shipTop, shipRight, shipTop + radius);
        ctx.lineTo(shipRight, shipBottom - radius);
        ctx.quadraticCurveTo(shipRight, shipBottom, shipRight - radius, shipBottom);
        ctx.lineTo(shipLeft + radius, shipBottom);
        ctx.quadraticCurveTo(shipLeft, shipBottom, shipLeft, shipBottom - radius);
        ctx.lineTo(shipLeft, shipTop + radius);
        ctx.quadraticCurveTo(shipLeft, shipTop, shipLeft + radius, shipTop);
        ctx.closePath();
        ctx.fill();

        // 船边框（闪白时使用浅灰色，否则深棕色）
        ctx.strokeStyle = isFlashing ? '#cccccc' : '#5D3A1A';
        ctx.lineWidth = 3 * this.scale;
        ctx.stroke();

        // 甲板横线纹理
        ctx.strokeStyle = '#6B4423';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(shipLeft + 5, i * height * 0.1);
            ctx.lineTo(shipRight - 5, i * height * 0.1);
            ctx.stroke();
        }

        // --- 水下部分染色 (已移除) ---

        ctx.restore();

        // 绘制船上的玩家（按座位顺序排列）
        playersOnBoat.sort((a, b) => a.seatIndex - b.seatIndex);
        playersOnBoat.forEach(player => {
            this.drawPlayerOnBoat(ctx, boat, player);
        });

        // 绘制船只血量条
        if (!isDestroyed) {
            this.drawHealthBar(ctx, pos.x, pos.y - height * 0.8, boat.hp, boat.maxHp, width * 0.6);
        }
    }

    /**
     * 绘制船上的玩家（参考图样式：圆形豆子 + 手持枪）
     */
    drawPlayerOnBoat(ctx, boat, player) {
        const pos = this.gameToScreen(boat.x, boat.y);

        // 动态座位偏移（根据船上玩家数量）
        const playerCount = boat.playerIds ? boat.playerIds.length : this.players.size;
        const seatOffsets = BOAT_CONFIG.getSeatOffsets(playerCount);
        const offsetX = (seatOffsets[player.seatIndex] || 0) * this.scale;

        const playerX = pos.x + offsetX;
        const playerY = pos.y;
        const size = 14 * this.scale;  // 角色大小

        ctx.save();

        if (player.isDead) {
            ctx.globalAlpha = 0.4;
        }

        const color = player.isDead ? '#666666' : player.color;

        // === 绘制角色身体（圆形豆子）===
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(playerX, playerY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // === 绘制眼睛（两个小黑点）===
        ctx.fillStyle = '#333';
        const eyeOffset = size * 0.3;
        const eyeSize = size * 0.18;
        ctx.beginPath();
        ctx.arc(playerX - eyeOffset, playerY - size * 0.1, eyeSize, 0, Math.PI * 2);
        ctx.arc(playerX + eyeOffset, playerY - size * 0.1, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // === 绘制手持枪（根据瞄准角度旋转，补偿-90度）===
        ctx.save();
        ctx.translate(playerX, playerY);
        // 补偿90度：aimAngle=0 表示向上，但枪画在右侧，需要旋转-90度
        ctx.rotate(player.aimAngle - Math.PI / 2);
        
        // 应用后坐力偏移 (向后移动)
        if (player.recoilOffset > 0) {
            ctx.translate(-player.recoilOffset * this.scale, 0);
        }

        // 手臂（小圆）
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(size * 0.9, 0, size * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // 枪身（黑色矩形）
        ctx.fillStyle = '#333';
        ctx.fillRect(size * 0.7, -size * 0.12, size * 1.0, size * 0.24);

        // 枪口（小圆）
        ctx.beginPath();
        ctx.arc(size * 1.7, 0, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        ctx.restore();

        // === 玩家名字（自己绿色，队友蓝色）===
        if (!player.isDead) {
            const isLocalPlayer = player.id === this.localPlayerId;
            ctx.fillStyle = isLocalPlayer ? '#00ff00' : '#00bfff';  // 绿色 / 蓝色
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.font = `bold ${11 * this.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.strokeText(player.name, playerX, playerY - size * 1.4);
            ctx.fillText(player.name, playerX, playerY - size * 1.4);
        } else {
            // 死亡标记
            ctx.font = `${18 * this.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💀', playerX, playerY + 5);
        }
    }

    /**
     * 绘制血量条
     */
    drawHealthBar(ctx, x, y, hp, maxHp, barWidth = 40) {
        barWidth *= this.scale;
        const barHeight = 6 * this.scale;
        const ratio = Math.max(0, hp / maxHp);

        ctx.fillStyle = '#333';
        ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

        let color = '#44ff44';
        if (ratio <= 0.33) color = '#ff4444';
        else if (ratio <= 0.66) color = '#ffaa00';

        ctx.fillStyle = color;
        ctx.fillRect(x - barWidth / 2, y, barWidth * ratio, barHeight);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
    }

    /**
     * 绘制经验球（优化版：移除渐变，使用纯色）
     */
    drawExpOrb(ctx, orb) {
        const pos = this.gameToScreen(orb.x, orb.y);
        const baseRadius = 10 * this.scale;

        // 脉动效果
        const pulse = Math.sin(this.time * 5 + (orb.pulsePhase || 0)) * 0.2 + 1;
        const radius = baseRadius * pulse;

        ctx.save();

        // 外圈（半透明）
        ctx.fillStyle = 'rgba(0, 242, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 内圈（纯色，移除渐变优化性能）
        ctx.fillStyle = '#00f2ff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 高光点（白色小圆）
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 触发敌人受击效果
     * @param {string} enemyId 敌人ID
     */
    triggerEnemyHit(enemyId) {
        const enemy = this.enemies.get(enemyId);
        if (enemy) {
            // 1. 设置受击动画状态 (持续 200ms)
            enemy.hitAnimStartTime = Date.now();
            enemy.hitAnimDuration = 200;

            // 2. 播放受击特效
            this.createHitParticles(enemy.x, enemy.y);
            this.createHitRing(enemy.x, enemy.y);

            // 3. 播放受击音效
            gunBeanAudio.playSfx('hit');
        }
    }

    /**
     * 播放受击音效 (Placeholder) - 已废弃
     */
    playHitSound() {
        // gunBeanAudio.playSfx('hit');
    }

    /**
     * 创建受击光环特效（增强版）
     */
    createHitRing(x, y) {
        // 主光环 - 白色
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            radius: 15,
            maxRadius: 80,
            life: 0.5,
            maxLife: 0.5,
            type: 'ring',
            color: '#ffffff'
        });
        // 次光环 - 橙色，延迟出现效果
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            radius: 10,
            maxRadius: 60,
            life: 0.4,
            maxLife: 0.4,
            type: 'ring',
            color: '#ff6600'
        });
    }

    /**
     * 绘制敌人（使用贴图）
     */
    drawEnemy(ctx, enemy) {
        const pos = this.gameToScreen(enemy.x, enemy.y);
        const size = (enemy.size || 30) * this.scale;

        // 动画参数配置（根据怪物类型调整风格）
        let waddleSpeed = 8;   // 摆动速度
        let waddleAmp = 0.12;  // 摆动幅度（弧度）
        let bobSpeed = 4;      // 上下浮动速度
        let bobAmp = 6 * this.scale; // 上下浮动幅度
        let scaleSpeed = 4;    // 呼吸速度
        
        if (enemy.type === 2) { // 快速怪：动作频率快，幅度小
            waddleSpeed = 15;
            waddleAmp = 0.15;
            bobSpeed = 8;
            bobAmp = 3 * this.scale;
            scaleSpeed = 8;
        } else if (enemy.type === 3) { // 重型怪：动作笨重缓慢
            waddleSpeed = 4;
            waddleAmp = 0.08;
            bobSpeed = 2;
            bobAmp = 8 * this.scale;
            scaleSpeed = 2;
        }

        // 计算动画相位（利用ID错开动画，避免整齐划一）
        const idNum = parseInt((enemy.id || '0').replace(/\D/g, '') || 0);
        const animPhase = idNum * 1.5; 
        const t = this.time;

        // 1. 左右摆动 (Waddle)
        const rotation = Math.sin(t * waddleSpeed + animPhase) * waddleAmp;
        
        // 2. 上下浮动 (Bob) - 模拟漂浮或跳跃
        const offsetY = Math.sin(t * bobSpeed + animPhase) * bobAmp;

        // 3. 呼吸缩放 (Breathing)
        let scalePulse = 1.0 + Math.sin(t * scaleSpeed + animPhase) * 0.03;

        // ========== 受击动画 (膨胀) ========== 
        if (enemy.hitAnimStartTime) {
            const elapsed = Date.now() - enemy.hitAnimStartTime;
            if (elapsed < enemy.hitAnimDuration) {
                const progress = elapsed / enemy.hitAnimDuration;
                // 膨胀：前半段快速变大，后半段恢复
                // 增大膨胀幅度到 0.5
                const hitScale = Math.sin(progress * Math.PI) * 0.5; 
                scalePulse += hitScale;
            } else {
                enemy.hitAnimStartTime = 0; // 动画结束
            }
        }

        // 检测是否在闪白状态
        const isFlashing = enemy.flashEndTime && Date.now() < enemy.flashEndTime;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        
        // 应用动画变换
        ctx.translate(0, offsetY);      // 浮动
        ctx.rotate(rotation);           // 摆动
        ctx.scale(scalePulse, scalePulse); // 呼吸 + 受击膨胀

        // 应用虚化 (模糊) - 已移除
        // if (blurAmount > 0) {
        //     ctx.filter = `blur(${blurAmount}px)`;
        // }

        // 添加阴影 (半透明黑色，模糊5px，偏移0,3)
        // 阴影位置调整到水面 (实体底部往上 25% 处)
        // 实体中心在 (0,0), 高度 size. 底部是 size/2. 水面是 size/2 - size*0.25 = size/4
        const waterLineY = size / 4;
        
        ctx.save();
        ctx.translate(0, waterLineY);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        // ctx.shadowBlur = 5; // 已移除优化性能
        ctx.shadowOffsetY = 3;
        // 绘制一个不可见的点来产生阴影，或者画一个扁的椭圆作为阴影
        // 原来的阴影是跟随着贴图绘制产生的。现在贴图被分成了两半。
        // 为了简单且效果好，我们单独画一个阴影椭圆在水面上
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.4, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();
        ctx.restore();

        // 获取敌人类型对应的贴图
        const texture = this.textures.monsters[enemy.type || 1];
        const whiteTexture = this.textures.whiteMonsters[enemy.type || 1];

        if (texture && this.texturesLoaded) {
            const imgW = texture.width;
            const imgH = texture.height;
            
            // 1. 绘制水上部分 (Top 75%)
            ctx.drawImage(
                texture, 
                0, 0, imgW, imgH * 0.75, 
                -size / 2, -size / 2, size, size * 0.75
            );

            // 2. 闪白效果 (增强版 - 更明显)
            if (isFlashing && whiteTexture) {
                const now = Date.now();
                const timeLeft = enemy.flashEndTime - now;
                const totalDuration = enemy.flashDuration || 150;

                // 计算透明度: 1.0 -> 0 (完全白色开始)
                let alpha = (timeLeft / totalDuration);
                alpha = Math.max(0, Math.min(1.0, alpha));

                ctx.save();

                // 添加发光效果（已移除shadowBlur优化性能）
                // ctx.shadowColor = '#ffffff';
                // ctx.shadowBlur = 20 * alpha;

                // 第一层：完全白色覆盖
                ctx.globalAlpha = alpha;
                ctx.drawImage(
                    whiteTexture,
                    0, 0, imgW, imgH * 0.75,
                    -size / 2, -size / 2, size, size * 0.75
                );

                // 第二层：额外白色加厚（更明显）
                ctx.globalAlpha = alpha * 0.7;
                ctx.drawImage(
                    whiteTexture,
                    0, 0, imgW, imgH * 0.75,
                    -size / 2, -size / 2, size, size * 0.75
                );

                ctx.restore();
            }

            // 3. 绘制水下部分 (Bottom 25%) - 半透明 + 偏蓝
            ctx.save();
            ctx.globalAlpha = 0.5; // 水下半透明
            // 可以叠加一个蓝色滤镜，这里简单用透明度区分
            ctx.drawImage(
                texture, 
                0, imgH * 0.75, imgW, imgH * 0.25, 
                -size / 2, size / 4, size, size * 0.25
            );
            
            // 水下部分加一层蓝色覆盖，增强“浸入感”
            ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
            ctx.fillRect(-size / 2, size / 4, size, size * 0.25);
            ctx.restore();
        } else {
            // 贴图未加载时使用备用颜色绘制
            const fallbackColors = {
                1: '#ff0000',  // 普通：红色
                2: '#00ff00',  // 快速：绿色
                3: '#0000ff'   // 重型：蓝色
            };
            ctx.fillStyle = isFlashing ? '#ffffff' : (fallbackColors[enemy.type] || '#ff0000');
            ctx.fillRect(-size / 2, -size / 2, size, size);

            ctx.strokeStyle = isFlashing ? '#cccccc' : '#aa0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(-size / 2, -size / 2, size, size);

            // 闪白时不绘制眼睛细节
            if (!isFlashing) {
                ctx.fillStyle = '#ffff00';
                const eyeSize = size * 0.2;
                ctx.beginPath();
                ctx.arc(-size * 0.2, -size * 0.1, eyeSize, 0, Math.PI * 2);
                ctx.arc(size * 0.2, -size * 0.1, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-size * 0.2, -size * 0.1, eyeSize * 0.5, 0, Math.PI * 2);
                ctx.arc(size * 0.2, -size * 0.1, eyeSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    /**
     * 绘制子弹（根据技能效果显示不同样式）
     */
    drawBullet(ctx, bullet) {
        const pos = this.gameToScreen(bullet.x, bullet.y);
        const radius = 6 * this.scale;

        // 根据技能效果选择颜色
        let bulletColor = '#ffff00';  // 默认黄色
        let bulletGlow = false;

        if (bullet.isOrbital) {
            bulletColor = '#00ffff';  // 环绕弹：青色
            bulletGlow = true;
        } else if (bullet.isSplit) {
            bulletColor = '#ff88ff';  // 分裂弹：粉色
        } else if (bullet.fire > 0) {
            bulletColor = '#ff4400';  // 火焰弹：橙红色
            bulletGlow = true;
        } else if (bullet.poison > 0) {
            bulletColor = '#00ff00';  // 毒素：绿色
            bulletGlow = true;
        } else if (bullet.freeze > 0) {
            bulletColor = '#88ffff';  // 冰冻：冰蓝色
            bulletGlow = true;
        } else if (bullet.explosive > 0) {
            bulletColor = '#ff8800';  // 爆炸：橙色
            bulletGlow = true;
        } else if (bullet.chain > 0) {
            bulletColor = '#ffff88';  // 闪电链：亮黄色
            bulletGlow = true;
        } else if (bullet.boomerang > 0) {
            bulletColor = '#aa00ff';  // 回旋镖：紫色
        }

        // 绘制发光效果
        if (bulletGlow) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = bulletColor;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius * 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 绘制子弹主体
        ctx.fillStyle = bulletColor;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 绘制尾迹
        const angle = Math.atan2(bullet.vy, bullet.vx);
        ctx.strokeStyle = bulletColor;
        ctx.lineWidth = 4 * this.scale;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(
            pos.x - Math.cos(angle) * 15 * this.scale,
            pos.y - Math.sin(angle) * 15 * this.scale
        );
        ctx.stroke();
    }

    /**
     * 绘制粒子（优化版：移除 shadowBlur）
     */
    drawParticles(ctx) {
        this.particles.forEach(p => {
            const pos = this.gameToScreen(p.x, p.y);
            ctx.globalAlpha = p.life;

            // 特殊处理 ring 类型粒子（扩散光环）
            if (p.type === 'ring') {
                const progress = 1 - (p.life / p.maxLife);
                const currentRadius = p.radius + (p.maxRadius - p.radius) * progress;
                const lineWidth = Math.max(2, (1 - progress) * 6) * this.scale;

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, currentRadius * this.scale, 0, Math.PI * 2);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            } else {
                // 普通粒子
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, p.radius * this.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
    }

    /**
     * 绘制物理粒子（带重力和碰撞的粒子）
     */
    drawPhysicsParticles(ctx) {
        this.physicsParticles.forEach(p => {
            const pos = this.gameToScreen(p.x, p.y);

            // 透明度随生命值衰减
            ctx.globalAlpha = Math.min(1, p.life);

            // 发光效果已移除优化性能
            // ctx.shadowColor = p.color;
            // ctx.shadowBlur = 8;

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.radius * this.scale, 0, Math.PI * 2);
            ctx.fill();

            // ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;
    }

    /**
     * 绘制场景内飘字（伤害数字等）
     */
    drawFloatingTexts(ctx) {
        this.floatingTexts.forEach(ft => {
            const pos = this.gameToScreen(ft.x, ft.y + ft.offsetY);
            const alpha = ft.life / ft.maxLife;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${ft.fontSize * ft.scale * this.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 描边（黑色轮廓）
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4 * this.scale;
            ctx.strokeText(ft.text, pos.x, pos.y);

            // 填充（主色）
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, pos.x, pos.y);

            ctx.restore();
        });
    }

    /**
     * 绘制爆炸效果
     */
    drawExplosiveEffects(ctx) {
        ctx.save();
        this.explosiveEffects.forEach(e => {
            const pos = this.gameToScreen(e.x, e.y);
            const progress = 1 - (e.life / e.maxLife);
            const alpha = progress;  // 随扩散渐隐

            // 绘制爆炸圆环
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, e.currentRadius * this.scale, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 136, 0, ${alpha})`;
            ctx.lineWidth = 8 * this.scale * (1 - progress * 0.5);
            ctx.stroke();

            // 绘制填充区域
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.3})`;
            ctx.fill();
        });
        ctx.restore();
    }

    /**
     * 绘制闪电链效果
     */
    drawChainEffects(ctx) {
        ctx.save();
        this.chainEffects.forEach(c => {
            const alpha = c.life / c.maxLife;

            // 绘制闪电路径
            ctx.strokeStyle = `rgba(255, 255, 100, ${alpha})`;
            ctx.lineWidth = 4 * this.scale;
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 15;
            ctx.beginPath();

            c.targets.forEach((target, index) => {
                const pos = this.gameToScreen(target.x, target.y);
                if (index === 0) {
                    ctx.moveTo(pos.x, pos.y);
                } else {
                    ctx.lineTo(pos.x, pos.y);
                }
            });

            ctx.stroke();

            // 在每个目标点绘制闪电球
            c.targets.forEach(target => {
                const pos = this.gameToScreen(target.x, target.y);
                ctx.fillStyle = `rgba(255, 255, 150, ${alpha})`;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 8 * this.scale, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        ctx.restore();
    }

    /**
     * 销毁
     */
    destroy() {
        window.removeEventListener('resize', () => this.resize());

        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        this.boats.clear();
        this.players.clear();
        this.bullets.clear();
        this.enemies.clear();
        this.expOrbs.clear();
        this.particles = [];
        this.physicsParticles = [];

        this.canvas = null;
        this.ctx = null;
    }
}

export { ARENA, PLAYER_COLORS };