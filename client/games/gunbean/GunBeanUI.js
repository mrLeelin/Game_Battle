/**
 * 枪豆人 - UI管理
 * 肉鸽模式：显示等级、经验条、技能、游戏时间
 */
import bulletFullUrl from '../../../texture/qiangdouren/bullet_slot_1.png';
import bulletEmptyUrl from '../../../texture/qiangdouren/bullet_slot_2.png';

export class GunBeanUI {
    constructor() {
        this.container = null;
    }

    /**
     * 初始化UI
     */
    init() {
        this.container = document.createElement('div');
        this.container.id = 'gunbean-ui';
        this.container.innerHTML = this.getTemplate();
        document.body.appendChild(this.container);

        this.addStyles();
        this.initCrosshairFollow();

        // 隐藏鼠标光标
        document.body.classList.add('gb-hide-cursor');
    }

    /**
     * 初始化准星跟随鼠标
     */
    initCrosshairFollow() {
        const crosshair = this.container.querySelector('.gb-crosshair');
        if (!crosshair) return;

        this._onMouseMove = (e) => {
            crosshair.style.left = e.clientX + 'px';
            crosshair.style.top = e.clientY + 'px';
        };

        document.addEventListener('mousemove', this._onMouseMove);
    }

    /**
     * 获取UI模板
     */
    getTemplate() {
        return `
            <div class="gb-hud-top">
                <!-- 游戏时间 -->
                <div class="gb-game-time">
                    <span class="gb-time-value">0:00</span>
                </div>

                <!-- 右上角分数面板 -->
                <div class="gb-score-panel">
                    <div class="gb-score-item">
                        <span class="gb-icon">☠️</span>
                        <span class="gb-score-value" id="gb-kills">0</span>
                    </div>
                    <div class="gb-score-item">
                        <span class="gb-icon">👥</span>
                        <span class="gb-score-value gb-alive" id="gb-alive">4</span>
                    </div>
                </div>
            </div>

            <!-- 左下角核心 HUD 面板 -->
            <div class="gb-hud-bottom-left">
                <!-- 经验条 (置于顶部) -->
                <div class="gb-exp-container">
                    <div class="gb-exp-bar-wrap">
                        <div class="gb-exp-fill"></div>
                    </div>
                    <div class="gb-level-info">
                        <span class="gb-level-label">RANK</span>
                        <span class="gb-level-value">1</span>
                    </div>
                    <span class="gb-exp-text">0/100</span>
                </div>

                <!-- 生命值面板 -->
                <div class="gb-health-panel">
                    <div class="gb-hearts"></div>
                </div>
                
                <!-- 辅助面板 (护盾和弹药) -->
                <div class="gb-sub-panels">
                    <div class="gb-shield-panel" style="display:none">
                        <span class="gb-icon">🛡️</span>
                        <span class="gb-shield-value">0</span>
                    </div>

                    <div class="gb-ammo-panel">
                        <span class="gb-ammo-icon">🔫</span>
                        <div class="gb-ammo-info">
                            <span class="gb-ammo-value">5/5</span>
                            <div class="gb-reload-bar-container" style="display:none">
                                <div class="gb-reload-fill"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 技能列表 (右下角) -->
            <div class="gb-skills-panel"></div>

            <!-- 准星 + 弹药图标 -->
            <div class="gb-crosshair">
                <div class="gb-crosshair-dot"></div>
                <div class="gb-crosshair-ring"></div>
                <!-- 右侧半圆弧弹药图标 -->
                <div class="gb-ammo-arc"></div>
                <!-- 换弹旋转动画 -->
                <div class="gb-reload-arc" style="display:none">
                    <svg viewBox="0 0 40 40">
                        <circle class="gb-reload-track" cx="20" cy="20" r="16"/>
                        <circle class="gb-reload-progress" cx="20" cy="20" r="16"/>
                    </svg>
                </div>
            </div>

            <!-- 消息提示 -->
            <div class="gb-message-container"></div>

            <!-- 死亡提示 -->
            <div class="gb-death-overlay" style="display:none">
                <div class="gb-death-content">
                    <div class="gb-death-title">DEFEATED</div>
                    <div class="gb-death-desc">WAITING FOR REVIVE...</div>
                </div>
            </div>

            <!-- 底部操作提示 -->
            <div class="gb-controls-hint">
                <span>🖱️ AIM & SHOOT</span>
                <span>R RELOAD</span>
                <span>❤️ TEAM HP</span>
            </div>

            <!-- 结算界面 -->
            <div class="gb-result" style="display:none">
                <div class="gb-result-card">
                    <h2 class="gb-result-title">MISSION END</h2>
                    <div class="gb-result-summary"></div>
                    <div class="gb-result-grid"></div>
                    <button class="gb-result-btn" onclick="location.reload()">RESTART</button>
                </div>
            </div>
        `;
    }

    /**
     * 添加样式
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@500;700&display=swap');

            :root {
                --gb-primary: #00f2ff;
                --gb-secondary: #ffd700;
                --gb-danger: #ff4444;
                --gb-success: #44ff44;
                --gb-bg-dark: rgba(0, 0, 0, 0.65);
                --gb-glass: rgba(255, 255, 255, 0.05);
                --gb-font-main: 'Orbitron', 'Rajdhani', sans-serif;
            }

            #gunbean-ui {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none;
                font-family: var(--gb-font-main);
                z-index: 100;
                color: #fff;
                user-select: none;
                text-transform: uppercase;
                cursor: none;
            }

            /* 隐藏整个页面的鼠标光标 */
            body.gb-hide-cursor,
            body.gb-hide-cursor * {
                cursor: none !important;
            }

            /* 准星 - 增强高亮版 */
            .gb-crosshair { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 9999; }
            .gb-crosshair-dot {
                width: 6px; height: 6px;
                background: #fff;
                border-radius: 50%;
                position: absolute; top:50%; left:50%; transform:translate(-50%,-50%);
                box-shadow: 0 0 12px #fff, 0 0 24px rgba(0, 242, 255, 0.8);
            }
            .gb-crosshair-ring {
                width: 40px; height: 40px;
                border: 3px solid rgba(0, 242, 255, 0.8);
                border-radius: 50%;
                position: absolute; top:50%; left:50%; transform:translate(-50%,-50%);
                box-shadow: 0 0 15px rgba(0, 242, 255, 0.5), inset 0 0 10px rgba(0, 242, 255, 0.2);
            }
            .gb-hud-top {
                display: flex;
                justify-content: space-between;
                padding: 25px 35px;
            }

            .gb-game-time {
                background: var(--gb-bg-dark);
                padding: 10px 20px;
                border-radius: 4px;
                border-top: 2px solid var(--gb-primary);
                backdrop-filter: none;
                box-shadow: 0 5px 15px rgba(0,0,0,0.4);
            }
            .gb-time-value { font-size: 28px; font-weight: 900; letter-spacing: 2px; color: var(--gb-primary); }

            .gb-score-panel { display: flex; gap: 15px; }
            .gb-score-item {
                background: var(--gb-bg-dark);
                padding: 8px 18px;
                border-radius: 4px;
                display: flex; align-items: center; gap: 10px;
                backdrop-filter: none;
            }
            .gb-score-value { font-size: 22px; font-weight: 700; }
            .gb-alive { color: var(--gb-success); text-shadow: 0 0 10px var(--gb-success); }

            /* 左下角核心 HUD */
            .gb-hud-bottom-left {
                position: absolute;
                bottom: 30px;
                left: 30px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-width: 280px;
            }

            /* 经验等级条 - 置于底部左侧 */
            .gb-exp-container {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 5px;
                background: var(--gb-bg-dark);
                padding: 12px 18px;
                border-radius: 6px;
                border-right: 4px solid var(--gb-secondary);
                backdrop-filter: none;
            }
            .gb-exp-bar-wrap {
                width: 100%;
                height: 4px;
                background: rgba(255,255,255,0.1);
                border-radius: 2px;
                overflow: hidden;
            }
            .gb-exp-fill {
                height: 100%; width: 0%;
                background: linear-gradient(90deg, #0088ff, var(--gb-primary));
                box-shadow: 0 0 12px var(--gb-primary);
                transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .gb-level-info { display: flex; align-items: baseline; gap: 8px; }
            .gb-level-label { font-size: 11px; color: #888; font-weight: 800; }
            .gb-level-value { font-size: 26px; color: var(--gb-secondary); font-weight: 900; line-height: 1; }
            .gb-exp-text { position: absolute; right: 18px; bottom: 12px; font-size: 11px; color: #aaa; font-weight: 700; }

            /* 生命值 */
            .gb-health-panel {
                background: var(--gb-bg-dark);
                padding: 12px 18px;
                border-radius: 6px;
                border-left: 4px solid var(--gb-danger);
                backdrop-filter: none;
                box-shadow: 0 8px 25px rgba(0,0,0,0.5);
            }
            .gb-hearts { display: flex; flex-wrap: wrap; gap: 8px; }
            .gb-heart { font-size: 24px; transition: all 0.3s; }
            .gb-heart.full { filter: drop-shadow(0 0 8px var(--gb-danger)); }
            .gb-heart.empty { filter: grayscale(1) opacity(0.15); transform: scale(0.8); }

            /* 辅助状态 (并排) */
            .gb-sub-panels { display: flex; gap: 10px; align-items: flex-end; }
            
            .gb-shield-panel {
                background: rgba(0, 80, 200, 0.6);
                padding: 8px 15px;
                border-radius: 4px;
                border: 1px solid var(--gb-primary);
                display: flex; align-items: center; gap: 8px;
                backdrop-filter: none;
            }
            .gb-shield-value { color: var(--gb-primary); font-weight: 900; font-size: 22px; }

            .gb-ammo-panel {
                background: var(--gb-bg-dark);
                padding: 8px 20px;
                border-radius: 4px;
                display: flex; align-items: center; gap: 15px;
                backdrop-filter: none;
                border-bottom: 2px solid rgba(255,255,255,0.2);
            }
            .gb-ammo-value { font-size: 32px; font-weight: 900; color: var(--gb-secondary); }
            .gb-ammo-value.empty { color: var(--gb-danger); animation: gb-blink 0.5s infinite; }
            .gb-reload-bar-container { width: 100px; height: 3px; background: rgba(255,255,255,0.1); margin-top: 4px; }
            .gb-reload-fill { height: 100%; background: var(--gb-secondary); width: 0%; }

            /* 技能列表 */
            .gb-skills-panel {
                position: absolute; bottom: 35px; right: 35px;
                display: flex; flex-direction: column-reverse; gap: 10px; align-items: flex-end;
            }
            .gb-skill-item {
                background: var(--gb-bg-dark);
                padding: 10px 18px;
                border-radius: 4px;
                display: flex; align-items: center; gap: 12px;
                border-right: 4px solid #444;
                backdrop-filter: none;
                animation: gb-slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .gb-skill-item.rare { border-color: var(--gb-primary); }
            .gb-skill-item.epic { border-color: #aa44ff; }
            .gb-skill-item-level { color: var(--gb-secondary); font-weight: 900; font-size: 20px; }

            /* 准星 */
            /* 弹药半圆弧 */
            .gb-ammo-arc {
                position: absolute;
                top: 50%; left: 50%;
                width: 60px; height: 60px;
                transform: translate(-50%, -50%);
                pointer-events: none;
            }
            .gb-ammo-bullet {
                position: absolute;
                width: 16px; height: 16px;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                transform-origin: center center;
                transition: all 0.2s ease;
                filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
            }
            .gb-ammo-bullet.empty {
                filter: none;
                opacity: 0.6;
            }
            .gb-ammo-bullet.fired {
                animation: gb-bullet-fire 0.15s ease-out;
            }
            @keyframes gb-bullet-fire {
                0% { transform: scale(1.5); opacity: 1; }
                100% { transform: scale(0.5); opacity: 0.3; }
            }

            /* 换弹旋转动画 */
            .gb-reload-arc {
                position: absolute;
                top: 50%; left: 50%;
                width: 50px; height: 50px;
                transform: translate(-50%, -50%);
            }
            .gb-reload-arc svg { width: 100%; height: 100%; transform: rotate(-90deg); }
            .gb-reload-track {
                fill: none;
                stroke: rgba(255,255,255,0.15);
                stroke-width: 3;
            }
            .gb-reload-progress {
                fill: none;
                stroke: var(--gb-secondary);
                stroke-width: 3;
                stroke-linecap: round;
                stroke-dasharray: 100.5;
                stroke-dashoffset: 100.5;
                filter: drop-shadow(0 0 6px var(--gb-secondary));
            }
            .gb-reload-arc.active .gb-reload-progress {
                animation: gb-reload-spin 1s linear forwards;
            }
            @keyframes gb-reload-spin {
                to { stroke-dashoffset: 0; }
            }

            /* 动画定义 */
            @keyframes gb-blink { 50% { opacity: 0.3; } }
            @keyframes gb-slide-in { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

            /* 消息 */
            .gb-message-container { position: absolute; top: 25%; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 15px; }
            .gb-message { background: rgba(0,0,0,0.9); padding: 15px 40px; border-radius: 4px; font-size: 24px; font-weight: 900; border-left: 6px solid var(--gb-primary); animation: gb-msg-in 3s forwards; }
            .gb-message.levelup { color: var(--gb-secondary); border-color: var(--gb-secondary); font-size: 42px; box-shadow: 0 0 40px rgba(255,215,0,0.3); }
            @keyframes gb-msg-in { 0% { transform: scale(0.8); opacity: 0; } 10% { transform: scale(1.1); opacity: 1; } 20% { transform: scale(1); opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(-50px); opacity: 0; } }

            /* 结算界面 */
            .gb-result {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                pointer-events: auto;
                animation: gb-fade-in 0.5s ease;
            }
            @keyframes gb-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .gb-result-card {
                background: linear-gradient(135deg, rgba(20, 30, 50, 0.95), rgba(10, 15, 30, 0.98));
                border: 2px solid var(--gb-primary);
                border-radius: 12px;
                padding: 40px 60px;
                text-align: center;
                box-shadow: 0 0 60px rgba(0, 242, 255, 0.3), inset 0 0 30px rgba(0, 242, 255, 0.05);
                animation: gb-card-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes gb-card-in {
                from { transform: scale(0.8) translateY(30px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .gb-result-title {
                font-size: 36px;
                font-weight: 900;
                color: var(--gb-primary);
                margin-bottom: 20px;
                text-shadow: 0 0 20px var(--gb-primary);
                letter-spacing: 4px;
            }
            .gb-result-summary {
                font-size: 48px;
                font-weight: 900;
                margin-bottom: 30px;
                letter-spacing: 6px;
            }
            .gb-result-summary.win {
                color: var(--gb-success);
                text-shadow: 0 0 30px var(--gb-success);
            }
            .gb-result-summary.lose {
                color: var(--gb-danger);
                text-shadow: 0 0 30px var(--gb-danger);
            }
            .gb-result-grid {
                display: flex;
                justify-content: center;
                gap: 40px;
                margin-bottom: 35px;
            }
            .gb-result-stat {
                background: rgba(0, 0, 0, 0.4);
                padding: 20px 30px;
                border-radius: 8px;
                border-bottom: 3px solid var(--gb-secondary);
            }
            .gb-result-stat-value {
                font-size: 36px;
                font-weight: 900;
                color: var(--gb-secondary);
                text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
            }
            .gb-result-stat-label {
                font-size: 12px;
                color: #888;
                margin-top: 5px;
                letter-spacing: 2px;
            }
            .gb-result-btn {
                background: linear-gradient(135deg, var(--gb-primary), #0088cc);
                border: none;
                color: #fff;
                font-family: var(--gb-font-main);
                font-size: 18px;
                font-weight: 700;
                padding: 15px 50px;
                border-radius: 6px;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 3px;
                transition: all 0.3s ease;
                box-shadow: 0 5px 20px rgba(0, 242, 255, 0.4);
            }
            .gb-result-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 30px rgba(0, 242, 255, 0.6);
            }

            /* 死亡遮罩 */
            .gb-death-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9000;
            }
            .gb-death-content {
                text-align: center;
            }
            .gb-death-title {
                font-size: 64px;
                font-weight: 900;
                color: var(--gb-danger);
                text-shadow: 0 0 30px var(--gb-danger);
                letter-spacing: 8px;
                animation: gb-pulse 1.5s infinite;
            }
            .gb-death-desc {
                font-size: 20px;
                color: #888;
                margin-top: 20px;
                letter-spacing: 3px;
            }
            @keyframes gb-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }

            /* 适配移动端 */
            @media (max-width: 768px) {
                .gb-hud-bottom-left { left: 15px; bottom: 15px; scale: 0.85; transform-origin: left bottom; }
                .gb-hud-top { padding: 15px; }
                .gb-exp-container { min-width: 180px; }
                .gb-skills-panel { right: 15px; bottom: 90px; scale: 0.8; transform-origin: right bottom; }
                .gb-result-card { padding: 30px 40px; }
                .gb-result-title { font-size: 28px; }
                .gb-result-summary { font-size: 36px; }
                .gb-result-grid { gap: 20px; }
                .gb-result-stat { padding: 15px 20px; }
                .gb-result-stat-value { font-size: 28px; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 更新游戏时间
     */
    updateGameTime(seconds) {
        const el = this.container.querySelector('.gb-time-value');
        if (el) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    /**
     * 更新等级和经验
     */
    updateLevel(level, exp, expToNext) {
        const levelEl = this.container.querySelector('.gb-level-value');
        const expFill = this.container.querySelector('.gb-exp-fill');
        const expText = this.container.querySelector('.gb-exp-text');

        if (levelEl) levelEl.textContent = level;
        if (expFill) {
            const ratio = Math.min(100, (exp / expToNext) * 100);
            expFill.style.width = `${ratio}%`;
        }
        if (expText) expText.textContent = `${exp}/${expToNext}`;
    }

    /**
     * 更新技能列表
     */
    updateSkills(skills) {
        const container = this.container.querySelector('.gb-skills-panel');
        if (!container) return;

        const skillIcons = {
            bounce: '🔄', pierce: '➡️', heal: '💚', speed: '💨',
            shield: '🛡️', double: '✌️', damage: '💪', reload: '⚡',
            lifesteal: '🩸', crit: '💥', range: '🎯', scatter: '🌟',
            chain: '⚡', explosive: '💣', homing: '🎯', freeze: '❄️',
            poison: '☠️', magnet: '🧲', luck: '🍀', multishot: '🔫'
        };

        const skillRarity = {
            bounce: 'common', pierce: 'common', heal: 'common', speed: 'common',
            shield: 'rare', double: 'rare', damage: 'common', reload: 'common',
            lifesteal: 'rare', crit: 'rare', range: 'common', scatter: 'rare',
            chain: 'epic', explosive: 'epic', homing: 'rare', freeze: 'rare',
            poison: 'rare', magnet: 'common', luck: 'rare', multishot: 'epic'
        };

        const fragment = document.createDocumentFragment();
        Object.entries(skills)
            .filter(([id, level]) => level > 0)
            .forEach(([id, level]) => {
                const div = document.createElement('div');
                div.className = `gb-skill-item ${skillRarity[id] || 'common'}`;
                div.innerHTML = `
                    <span class="gb-skill-item-icon">${skillIcons[id] || '⭐'}</span>
                    <span class="gb-skill-item-level">${level}</span>
                `;
                fragment.appendChild(div);
            });
            
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    /**
     * 更新护盾显示
     */
    updateShield(count) {
        const container = this.container.querySelector('.gb-shield-panel');
        const text = this.container.querySelector('.gb-shield-value');
        if (container) {
            container.style.display = count > 0 ? 'flex' : 'none';
        }
        if (text) text.textContent = count;
    }

    /**
     * 更新弹药显示（准星右侧半圆弧图标）
     */
    updateAmmo(ammo, maxAmmo) {
        // 更新左下角数字显示（保留兼容）
        const text = this.container.querySelector('.gb-ammo-value');
        if (text) {
            text.textContent = `${ammo}/${maxAmmo}`;
            text.classList.remove('empty', 'reloading');
            if (ammo === 0) text.classList.add('empty');
        }

        // 更新准星右侧的半圆弧弹药图标
        const arcContainer = this.container.querySelector('.gb-ammo-arc');
        if (!arcContainer) return;

        // 右侧弧形均匀排列子弹图标（60度弧，间距缩小）
        let bulletsHtml = '';
        const radius = 35;       // 圆弧半径
        const startAngle = -30;  // 起始角度（右上方）
        const endAngle = 30;     // 结束角度（右下方）
        const angleStep = maxAmmo > 1 ? (endAngle - startAngle) / (maxAmmo - 1) : 0;

        for (let i = 0; i < maxAmmo; i++) {
            const angle = (startAngle + angleStep * i) * (Math.PI / 180);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isEmpty = i >= ammo;
            const bgUrl = isEmpty ? bulletEmptyUrl : bulletFullUrl;

            bulletsHtml += `<div class="gb-ammo-bullet ${isEmpty ? 'empty' : ''}"
                style="left: calc(50% + ${x}px); top: calc(50% + ${y}px);
                       transform: translate(-50%, -50%);
                       background-image: url('${bgUrl}');"></div>`;
        }
        arcContainer.innerHTML = bulletsHtml;
    }

    /**
     * 显示换弹进度（圆弧动画）
     */
    showReloading(reloadTime) {
        const text = this.container.querySelector('.gb-ammo-value');
        const bar = this.container.querySelector('.gb-reload-bar-container');
        const fill = this.container.querySelector('.gb-reload-fill');

        if (text) {
            text.textContent = 'RELOADING';
            text.classList.add('reloading');
        }

        if (bar && fill) {
            bar.style.display = 'block';
            fill.style.transition = 'none';
            fill.style.width = '0%';
            void fill.offsetWidth;
            fill.style.transition = `width ${reloadTime}ms linear`;
            fill.style.width = '100%';
        }

        // 准星旁的换弹圆弧动画
        const arcContainer = this.container.querySelector('.gb-ammo-arc');
        const reloadArc = this.container.querySelector('.gb-reload-arc');
        const reloadProgress = this.container.querySelector('.gb-reload-progress');

        if (arcContainer) arcContainer.style.display = 'none';
        if (reloadArc && reloadProgress) {
            reloadArc.style.display = 'block';
            reloadArc.classList.remove('active');
            // 设置动画时长
            reloadProgress.style.animation = 'none';
            void reloadProgress.offsetWidth;
            reloadProgress.style.animation = `gb-reload-spin ${reloadTime}ms linear forwards`;
            reloadArc.classList.add('active');
        }
    }

    /**
     * 隐藏换弹进度
     */
    hideReloading() {
        const bar = this.container.querySelector('.gb-reload-bar-container');
        const fill = this.container.querySelector('.gb-reload-fill');
        if (bar) bar.style.display = 'none';
        if (fill) {
            fill.style.transition = 'none';
            fill.style.width = '0%';
        }

        // 恢复准星旁的弹药图标，隐藏换弹动画
        const arcContainer = this.container.querySelector('.gb-ammo-arc');
        const reloadArc = this.container.querySelector('.gb-reload-arc');

        if (arcContainer) arcContainer.style.display = 'block';
        if (reloadArc) {
            reloadArc.style.display = 'none';
            reloadArc.classList.remove('active');
        }
    }

    /**
     * 更新船只血量（心形显示）
     */
    updateBoatHealth(hp, maxHp) {
        const heartsContainer = this.container.querySelector('.gb-hearts');
        if (!heartsContainer) return;

        const prevHp = this._prevHp || maxHp;
        this._prevHp = hp;

        let heartsHtml = '';
        for (let i = 0; i < maxHp; i++) {
            const isFull = i < hp;
            const isDamaged = i >= hp && i < prevHp;
            heartsHtml += `<span class="gb-heart ${isFull ? 'full' : 'empty'} ${isDamaged ? 'damaged' : ''}">❤️</span>`;
        }
        heartsContainer.innerHTML = heartsHtml;
    }

    /**
     * 更新血量（兼容旧接口）
     */
    updateHealth(hp, maxHp) {
        this.updateBoatHealth(hp, maxHp);
    }

    /**
     * 更新击杀数
     */
    updateKills(kills) {
        const el = this.container.querySelector('#gb-kills');
        if (el) el.textContent = kills;
    }

    /**
     * 更新存活人数
     */
    updateAlive(count) {
        const el = this.container.querySelector('#gb-alive');
        if (el) el.textContent = count;
    }

    /**
     * 更新倒计时（保留兼容）
     */
    updateCountdown(time) {
    }

    /**
     * 显示消息
     */
    showMessage(text, type = 'info') {
        const container = this.container.querySelector('.gb-message-container');
        if (container) {
            const msg = document.createElement('div');
            msg.className = 'gb-message';
            msg.textContent = text;
            if (type !== 'info') msg.classList.add(type);
            container.appendChild(msg);
            setTimeout(() => {
                if (msg.parentNode) msg.parentNode.removeChild(msg);
            }, 3000);
        }
    }

    /**
     * 显示升级消息
     */
    showLevelUp(level) {
        this.showMessage(`LEVEL UP! ${level}`, 'levelup');
    }

    /**
     * 显示/隐藏死亡遮罩
     */
    showDeathOverlay(show) {
        const el = this.container.querySelector('.gb-death-overlay');
        if (el) el.style.display = show ? 'flex' : 'none';
    }

    /**
     * 显示结算界面
     */
    showResult(data) {
        const resultEl = this.container.querySelector('.gb-result');
        const summaryEl = this.container.querySelector('.gb-result-summary');
        const gridEl = this.container.querySelector('.gb-result-grid');
        if (!resultEl || !summaryEl || !gridEl) return;

        const isWin = data.isWin;
        summaryEl.textContent = isWin ? 'VICTORY' : 'DEFEATED';
        summaryEl.className = 'gb-result-summary ' + (isWin ? 'win' : 'lose');

        const mins = Math.floor((data.gameTime || 0) / 60);
        const secs = (data.gameTime || 0) % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        gridEl.innerHTML = `
            <div class="gb-result-stat">
                <div class="gb-result-stat-value">${data.maxLevel || 1}</div>
                <div class="gb-result-stat-label">LEVEL</div>
            </div>
            <div class="gb-result-stat">
                <div class="gb-result-stat-value">${timeStr}</div>
                <div class="gb-result-stat-label">TIME</div>
            </div>
            <div class="gb-result-stat">
                <div class="gb-result-stat-value">${data.totalKills || 0}</div>
                <div class="gb-result-stat-label">KILLS</div>
            </div>
        `;
        resultEl.style.display = 'flex';
    }

    /**
     * 显示鼠标光标
     */
    showCursor() {
        document.body.style.cursor = 'default';
    }

    /**
     * 隐藏鼠标光标 (使用瞄准准星)
     */
    hideCursor() {
        document.body.style.cursor = 'none';
    }

    /**
     * 隐藏准星
     */
    hideCrosshair() {
        const el = this.container.querySelector('.gb-crosshair');
        if (el) el.style.display = 'none';
    }

    /**
     * 显示准星
     */
    showCrosshair() {
        const el = this.container.querySelector('.gb-crosshair');
        if (el) el.style.display = 'block';
    }

    /**
     * 显示鼠标光标
     */
    showCursor() {
        document.body.classList.remove('gb-hide-cursor');
    }

    /**
     * 隐藏鼠标光标
     */
    hideCursor() {
        document.body.classList.add('gb-hide-cursor');
    }

    /**
     * 销毁
     */
    destroy() {
        // 移除鼠标监听
        if (this._onMouseMove) {
            document.removeEventListener('mousemove', this._onMouseMove);
        }

        // 恢复鼠标光标
        document.body.classList.remove('gb-hide-cursor');

        if (this.container) {
            document.body.removeChild(this.container);
            this.container = null;
        }
    }
}