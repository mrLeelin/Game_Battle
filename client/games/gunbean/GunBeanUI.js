/**
 * 枪豆人 - UI管理
 * 肉鸽模式：显示等级、经验条、技能、游戏时间
 */

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
    }

    /**
     * 获取UI模板
     */
    getTemplate() {
        return `
            <!-- 游戏时间 -->
            <div class="gb-game-time">
                <span class="gb-time-icon">⏱️</span>
                <span class="gb-time-value">0:00</span>
            </div>

            <!-- 等级和经验条 -->
            <div class="gb-level-bar">
                <div class="gb-level">
                    <span class="gb-level-text">Lv.</span>
                    <span class="gb-level-value">1</span>
                </div>
                <div class="gb-exp-bar">
                    <div class="gb-exp-fill"></div>
                    <span class="gb-exp-text">0 / 100</span>
                </div>
            </div>

            <!-- 左上角状态 -->
            <div class="gb-status">
                <div class="gb-health">
                    <span class="gb-health-icon">🚢</span>
                    <div class="gb-health-bar">
                        <div class="gb-health-fill"></div>
                    </div>
                    <span class="gb-health-text">10/10</span>
                </div>
                <div class="gb-shield" style="display:none">
                    <span class="gb-shield-icon">🛡️</span>
                    <span class="gb-shield-text">0</span>
                </div>
            </div>

            <!-- 技能列表 -->
            <div class="gb-skills"></div>

            <!-- 分数 -->
            <div class="gb-score">
                <div class="gb-score-item">
                    <span class="gb-score-label">击杀</span>
                    <span class="gb-score-value" id="gb-kills">0</span>
                </div>
                <div class="gb-score-item">
                    <span class="gb-score-label">存活</span>
                    <span class="gb-score-value gb-alive" id="gb-alive">4</span>
                </div>
            </div>

            <!-- 准星 -->
            <div class="gb-crosshair">
                <div class="gb-crosshair-dot"></div>
                <div class="gb-crosshair-ring"></div>
            </div>

            <!-- 消息提示 -->
            <div class="gb-message" style="display:none"></div>

            <!-- 死亡提示 -->
            <div class="gb-death-overlay" style="display:none">
                <div class="gb-death-text">你倒下了！</div>
                <div class="gb-death-hint">等待队友复活...</div>
            </div>

            <!-- 操作提示 -->
            <div class="gb-controls">
                <div class="gb-control-hint">🚤 鼠标瞄准 | 点击/空格 射击 | 击杀敌人获得经验升级！</div>
            </div>

            <!-- 结算界面 -->
            <div class="gb-result" style="display:none">
                <div class="gb-result-content">
                    <h2 class="gb-result-title">游戏结束</h2>
                    <div class="gb-result-summary"></div>
                    <div class="gb-result-stats"></div>
                    <button class="gb-result-btn" onclick="location.reload()">返回大厅</button>
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
            #gunbean-ui {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                font-family: 'Orbitron', 'Rajdhani', sans-serif;
                z-index: 100;
            }

            /* 游戏时间 */
            .gb-game-time {
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                padding: 10px 30px;
                border: 2px solid #00f2ff;
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .gb-time-icon {
                font-size: 24px;
            }

            .gb-time-value {
                font-size: 36px;
                font-weight: bold;
                color: #00f2ff;
                text-shadow: 0 0 10px #00f2ff;
                min-width: 80px;
                text-align: center;
            }

            /* 等级和经验条 */
            .gb-level-bar {
                position: absolute;
                top: 85px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 15px;
                background: rgba(0, 0, 0, 0.6);
                padding: 8px 20px;
                border-radius: 20px;
            }

            .gb-level {
                display: flex;
                align-items: baseline;
                color: #ffd700;
                font-weight: bold;
            }

            .gb-level-text {
                font-size: 14px;
            }

            .gb-level-value {
                font-size: 24px;
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            }

            .gb-exp-bar {
                width: 200px;
                height: 16px;
                background: #333;
                border-radius: 8px;
                overflow: hidden;
                position: relative;
            }

            .gb-exp-fill {
                height: 100%;
                background: linear-gradient(90deg, #00aaff, #00f2ff);
                width: 0%;
                transition: width 0.3s ease;
            }

            .gb-exp-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 11px;
                color: #fff;
                text-shadow: 0 0 3px #000;
            }

            /* 状态栏 */
            .gb-status {
                position: absolute;
                top: 20px;
                left: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .gb-health {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(0, 0, 0, 0.6);
                padding: 8px 15px;
                border-radius: 5px;
            }

            .gb-health-icon {
                font-size: 20px;
            }

            .gb-health-bar {
                width: 120px;
                height: 12px;
                background: #333;
                border-radius: 6px;
                overflow: hidden;
            }

            .gb-health-fill {
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, #ff4444, #ff6666);
                transition: width 0.3s;
            }

            .gb-health-text {
                color: #fff;
                font-size: 16px;
                min-width: 55px;
            }

            .gb-shield {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(0, 100, 255, 0.3);
                padding: 8px 15px;
                border-radius: 5px;
                border: 1px solid #4488ff;
            }

            .gb-shield-icon {
                font-size: 20px;
            }

            .gb-shield-text {
                color: #4488ff;
                font-size: 20px;
                font-weight: bold;
            }

            /* 技能列表 */
            .gb-skills {
                position: absolute;
                bottom: 80px;
                left: 20px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                max-width: 300px;
            }

            .gb-skill-item {
                background: rgba(0, 0, 0, 0.6);
                padding: 5px 10px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 14px;
                color: #fff;
            }

            .gb-skill-item.common { border-left: 3px solid #888; }
            .gb-skill-item.rare { border-left: 3px solid #4488ff; }
            .gb-skill-item.epic { border-left: 3px solid #aa44ff; }

            .gb-skill-item-icon {
                font-size: 16px;
            }

            .gb-skill-item-level {
                color: #ffd700;
                font-weight: bold;
            }

            /* 分数 */
            .gb-score {
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .gb-score-item {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(0, 0, 0, 0.6);
                padding: 8px 15px;
                border-radius: 5px;
            }

            .gb-score-label {
                color: #888;
                font-size: 14px;
            }

            .gb-score-value {
                color: #fff;
                font-size: 24px;
                font-weight: bold;
            }

            .gb-score-value.gb-alive {
                color: #44ff44;
            }

            /* 准星 */
            .gb-crosshair {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            }

            .gb-crosshair-dot {
                width: 6px;
                height: 6px;
                background: #fff;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            .gb-crosshair-ring {
                width: 30px;
                height: 30px;
                border: 2px solid rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            /* 消息提示 */
            .gb-message {
                position: absolute;
                top: 30%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
                padding: 15px 40px;
                font-size: 24px;
                border-radius: 10px;
                animation: gbMessagePopup 0.3s ease-out;
            }

            .gb-message.success { color: #44ff44; border: 2px solid #44ff44; }
            .gb-message.warning { color: #ffff44; border: 2px solid #ffff44; }
            .gb-message.error { color: #ff4444; border: 2px solid #ff4444; }
            .gb-message.levelup {
                color: #ffd700;
                border: 2px solid #ffd700;
                font-size: 32px;
                animation: gbLevelUp 0.5s ease-out;
            }

            @keyframes gbMessagePopup {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }

            @keyframes gbLevelUp {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }

            /* 死亡遮罩 */
            .gb-death-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(139, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .gb-death-text {
                font-size: 48px;
                color: #fff;
                text-shadow: 0 0 20px #ff0000;
                margin-bottom: 20px;
            }

            .gb-death-hint {
                font-size: 24px;
                color: #ffaaaa;
                animation: gbBlink 1s infinite;
            }

            @keyframes gbBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* 操作提示 */
            .gb-controls {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.5);
                padding: 10px 20px;
                border-radius: 5px;
            }

            .gb-control-hint {
                color: #888;
                font-size: 14px;
            }

            /* 结算界面 */
            .gb-result {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: auto;
            }

            .gb-result-content {
                text-align: center;
                color: #fff;
            }

            .gb-result-title {
                font-size: 48px;
                margin-bottom: 30px;
                color: #00f2ff;
                text-shadow: 0 0 20px #00f2ff;
            }

            .gb-result-summary {
                font-size: 36px;
                margin-bottom: 30px;
            }

            .gb-result-summary.win { color: #44ff44; }
            .gb-result-summary.lose { color: #ff4444; }

            .gb-result-stats {
                display: flex;
                justify-content: center;
                gap: 40px;
                margin-bottom: 40px;
                flex-wrap: wrap;
            }

            .gb-result-stat {
                background: rgba(255, 255, 255, 0.1);
                padding: 20px 30px;
                border-radius: 10px;
            }

            .gb-result-stat-value {
                font-size: 48px;
                font-weight: bold;
                color: #00f2ff;
            }

            .gb-result-stat-label {
                font-size: 14px;
                color: #888;
                margin-top: 5px;
            }

            .gb-result-btn {
                padding: 15px 40px;
                font-size: 18px;
                background: #00f2ff;
                color: #000;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-family: inherit;
                font-weight: bold;
                transition: all 0.2s;
            }

            .gb-result-btn:hover {
                background: #fff;
                box-shadow: 0 0 20px #00f2ff;
            }

            /* 移动端适配 */
            @media (max-width: 768px) {
                .gb-time-value { font-size: 24px; }
                .gb-level-bar { top: 70px; }
                .gb-status { top: 110px; left: 10px; }
                .gb-score { top: 110px; right: 10px; }
                .gb-controls { display: none; }
                .gb-crosshair { display: none; }
                .gb-skills { bottom: 20px; max-width: 200px; }
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
        if (expText) expText.textContent = `${exp} / ${expToNext}`;
    }

    /**
     * 更新技能列表
     */
    updateSkills(skills) {
        const container = this.container.querySelector('.gb-skills');
        if (!container) return;

        // 技能图标映射
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

        container.innerHTML = Object.entries(skills)
            .filter(([id, level]) => level > 0)
            .map(([id, level]) => `
                <div class="gb-skill-item ${skillRarity[id] || 'common'}">
                    <span class="gb-skill-item-icon">${skillIcons[id] || '⭐'}</span>
                    <span class="gb-skill-item-level">${level}</span>
                </div>
            `).join('');
    }

    /**
     * 更新护盾显示
     */
    updateShield(count) {
        const container = this.container.querySelector('.gb-shield');
        const text = this.container.querySelector('.gb-shield-text');
        if (container) {
            container.style.display = count > 0 ? 'flex' : 'none';
        }
        if (text) text.textContent = count;
    }

    /**
     * 更新船只血量
     */
    updateBoatHealth(hp, maxHp) {
        const fill = this.container.querySelector('.gb-health-fill');
        const text = this.container.querySelector('.gb-health-text');

        if (fill) {
            const ratio = Math.max(0, hp / maxHp) * 100;
            fill.style.width = `${ratio}%`;

            if (ratio <= 33) {
                fill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
            } else if (ratio <= 66) {
                fill.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc00)';
            } else {
                fill.style.background = 'linear-gradient(90deg, #44ff44, #66ff66)';
            }
        }

        if (text) text.textContent = `${hp}/${maxHp}`;
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
        // 肉鸽模式无倒计时，此方法保留兼容性
    }

    /**
     * 显示消息
     */
    showMessage(text, type = 'info') {
        const el = this.container.querySelector('.gb-message');
        if (el) {
            el.textContent = text;
            el.className = 'gb-message';
            if (type !== 'info') el.classList.add(type);
            el.style.display = 'block';

            setTimeout(() => {
                el.style.display = 'none';
            }, 2000);
        }
    }

    /**
     * 显示升级消息
     */
    showLevelUp(level) {
        this.showMessage(`🎉 升级到 Lv.${level}！`, 'levelup');
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
        const statsEl = this.container.querySelector('.gb-result-stats');

        if (!resultEl || !summaryEl || !statsEl) return;

        const isWin = data.isWin;
        summaryEl.textContent = isWin ? '🎉 胜利！' : '😢 挑战结束';
        summaryEl.className = 'gb-result-summary ' + (isWin ? 'win' : 'lose');

        // 格式化时间
        const mins = Math.floor((data.gameTime || 0) / 60);
        const secs = (data.gameTime || 0) % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        statsEl.innerHTML = `
            <div class="gb-result-stat">
                <div class="gb-result-stat-value">${data.maxLevel || 1}</div>
                <div class="gb-result-stat-label">最高等级</div>
            </div>
            <div class="gb-result-stat">
                <div class="gb-result-stat-value">${timeStr}</div>
                <div class="gb-result-stat-label">存活时间</div>
            </div>
            <div class="gb-result-stat">
                <div class="gb-result-stat-value">${data.totalKills || 0}</div>
                <div class="gb-result-stat-label">总击杀</div>
            </div>
        `;

        resultEl.style.display = 'flex';
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
     * 销毁
     */
    destroy() {
        if (this.container) {
            document.body.removeChild(this.container);
            this.container = null;
        }
    }
}
