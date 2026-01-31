/**
 * 枪豆人 - 2D Canvas 场景管理
 * 四人船版本：四名玩家坐在一艘船上，位置插值平滑移动
 */

// 场地配置（扩大到全屏）
const ARENA = {
    WIDTH: 1200,
    HEIGHT: 800,
    WATER_MARGIN: 50
};

// 玩家颜色配置（参考图：黄、青、白/彩虹、粉）
const PLAYER_COLORS = [
    '#ffe66d',   // 黄色
    '#4ecdc4',   // 青色
    '#ffffff',   // 白色
    '#ffb6c1'    // 粉色
];

// 船只配置（加宽容纳4人）
const BOAT_CONFIG = {
    WIDTH: 140,     // 加宽容纳4人
    HEIGHT: 50,
    SEAT_OFFSETS: [-45, -15, 15, 45]  // 4个座位的X偏移
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
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());
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
            vy: bulletData.vy
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
            enemy.rotation += 0.05;
        }
    }

    /**
     * 移除敌人
     */
    removeEnemy(enemyId) {
        const enemy = this.enemies.get(enemyId);
        if (enemy) {
            this.createExplosion(enemy.x, enemy.y);
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

        // 插值更新船只位置（平滑移动）
        this.boats.forEach(boat => {
            boat.x += (boat.targetX - boat.x) * this.lerpSpeed;
            boat.y += (boat.targetY - boat.y) * this.lerpSpeed;
        });

        // 插值更新敌人位置
        this.enemies.forEach(enemy => {
            enemy.x += (enemy.targetX - enemy.x) * this.lerpSpeed;
            enemy.y += (enemy.targetY - enemy.y) * this.lerpSpeed;
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

        // 更新粒子
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= deltaTime * 2;
            p.radius *= 0.98;
            return p.life > 0;
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

        // 绘制海洋背景
        this.drawOcean(ctx, w, h);

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
    }

    /**
     * 绘制海洋背景
     */
    drawOcean(ctx, w, h) {
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#1a5276');
        gradient.addColorStop(0.5, '#2874a6');
        gradient.addColorStop(1, '#1a5276');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // 波浪线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            const baseY = (i / 8) * h;
            for (let x = 0; x < w; x += 10) {
                const y = baseY + Math.sin((x + this.waveOffset * 50 + i * 100) * 0.02) * 15;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
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

        ctx.save();
        ctx.translate(pos.x, pos.y);

        // 船身半透明（如果被摧毁）
        if (isDestroyed) {
            ctx.globalAlpha = 0.4;
        }

        // 绘制船头水花（白色波浪）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 5; i++) {
            const waveX = -width * 0.3 + i * width * 0.15;
            const waveY = -height * 0.7 - Math.sin(this.time * 5 + i) * 3;
            ctx.beginPath();
            ctx.arc(waveX, waveY, 6 * this.scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // 船身主体（棕色木船，矩形带圆角）
        ctx.fillStyle = '#8B4513';
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

        // 船边框（深棕色）
        ctx.strokeStyle = '#5D3A1A';
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

        // 4人座位偏移
        const seatOffsets = BOAT_CONFIG.SEAT_OFFSETS;
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
     * 绘制经验球（闪烁发光的蓝色球体）
     */
    drawExpOrb(ctx, orb) {
        const pos = this.gameToScreen(orb.x, orb.y);
        const baseRadius = 10 * this.scale;

        // 脉动效果
        const pulse = Math.sin(this.time * 5 + (orb.pulsePhase || 0)) * 0.2 + 1;
        const radius = baseRadius * pulse;

        // 发光效果
        ctx.save();
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 15 * this.scale;

        // 外圈（半透明）
        ctx.fillStyle = 'rgba(0, 242, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 内圈（实心）
        const gradient = ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.4, '#00f2ff');
        gradient.addColorStop(1, '#0088aa');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 绘制敌人
     */
    drawEnemy(ctx, enemy) {
        const pos = this.gameToScreen(enemy.x, enemy.y);
        const size = 30 * this.scale;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(enemy.rotation);

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-size / 2, -size / 2, size, size);

        ctx.strokeStyle = '#aa0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size / 2, -size / 2, size, size);

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

        ctx.restore();
    }

    /**
     * 绘制子弹
     */
    drawBullet(ctx, bullet) {
        const pos = this.gameToScreen(bullet.x, bullet.y);
        const radius = 6 * this.scale;

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        const angle = Math.atan2(bullet.vy, bullet.vx);
        ctx.strokeStyle = '#ff8800';
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
     * 绘制粒子
     */
    drawParticles(ctx) {
        this.particles.forEach(p => {
            const pos = this.gameToScreen(p.x, p.y);
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.radius * this.scale, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
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

        this.canvas = null;
        this.ctx = null;
    }
}

export { ARENA, PLAYER_COLORS };
