/**
 * 枪豆人 - 商店UI组件
 * 显示枪械和技能卡片，处理购买逻辑
 */
import { network } from '../../core/Network.js';
import { GUNBEAN_EVENTS } from '../../../shared/Events.js';

export class GunBeanShop {
    constructor() {
        this.container = null;
        this.shopData = null;
        this.playerData = null;
        this.isReady = false;
        this.readyCount = 0;
        this.totalPlayers = 0;
        this.round = 1;
        this.nextRound = 2;
        this.maxRounds = 30;
    }

    /**
     * 显示商店
     * @param {Object} data 商店数据
     */
    show(data) {
        this.shopData = data.shopData;
        this.round = data.round;
        this.nextRound = data.nextRound;
        this.maxRounds = data.maxRounds;
        this.isReady = false;
        this.readyCount = 0;
        this.totalPlayers = Object.keys(data.players).length;

        // 获取当前玩家数据
        this.playerData = data.players[network.id] || {
            coins: 0,
            weapon: { id: 'pistol', name: '手枪' },
            skills: {}
        };

        this.createUI();
        this.bindEvents();
    }

    /**
     * 创建商店UI
     */
    createUI() {
        // 移除旧的
        this.destroy();

        this.container = document.createElement('div');
        this.container.id = 'gb-shop';
        this.container.innerHTML = this.getTemplate();
        document.body.appendChild(this.container);

        this.addStyles();
        this.updateUI();
    }

    /**
     * 获取模板
     */
    getTemplate() {
        return `
            <div class="gb-shop-overlay">
                <div class="gb-shop-container">
                    <!-- 标题 -->
                    <div class="gb-shop-header">
                        <h2 class="gb-shop-title">🛒 商店 - 第 ${this.round} 轮结束</h2>
                        <div class="gb-shop-coins">
                            <span class="gb-shop-coins-icon">🪙</span>
                            <span class="gb-shop-coins-value">${this.playerData.coins}</span>
                        </div>
                    </div>

                    <!-- 当前装备 -->
                    <div class="gb-shop-current">
                        <span>当前武器: </span>
                        <span class="gb-shop-current-weapon">${this.playerData.weapon.name}</span>
                    </div>

                    <!-- 武器区域 -->
                    <div class="gb-shop-section">
                        <h3 class="gb-shop-section-title">🔫 武器</h3>
                        <div class="gb-shop-items gb-shop-weapons">
                            ${this.renderWeapons()}
                        </div>
                    </div>

                    <!-- 技能区域 -->
                    <div class="gb-shop-section">
                        <h3 class="gb-shop-section-title">✨ 技能</h3>
                        <div class="gb-shop-items gb-shop-skills">
                            ${this.renderSkills()}
                        </div>
                    </div>

                    <!-- 底部按钮 -->
                    <div class="gb-shop-footer">
                        <div class="gb-shop-status">
                            等待玩家准备: <span class="gb-shop-ready-count">${this.readyCount}</span>/<span class="gb-shop-total-count">${this.totalPlayers}</span>
                        </div>
                        <button class="gb-shop-complete-btn" id="gb-shop-complete">
                            ✓ 完成 (${this.readyCount}/${this.totalPlayers})
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染武器卡片
     */
    renderWeapons() {
        if (!this.shopData?.weapons) return '';

        return this.shopData.weapons.map(weapon => {
            const isEquipped = this.playerData.weapon.id === weapon.id;
            const canAfford = this.playerData.coins >= weapon.price;
            const disabled = isEquipped || !canAfford;

            return `
                <div class="gb-shop-card ${disabled ? 'disabled' : ''} ${isEquipped ? 'equipped' : ''}"
                     data-type="weapon" data-id="${weapon.id}">
                    <div class="gb-shop-card-name">${weapon.name}</div>
                    <div class="gb-shop-card-desc">${weapon.description}</div>
                    <div class="gb-shop-card-stats">
                        <span>伤害: ${weapon.damage}</span>
                        <span>射速: ${Math.round(1000 / weapon.fireRate * 10) / 10}/s</span>
                    </div>
                    <div class="gb-shop-card-price ${!canAfford ? 'unaffordable' : ''}">
                        ${weapon.price === 0 ? '免费' : `🪙 ${weapon.price}`}
                    </div>
                    ${isEquipped ? '<div class="gb-shop-card-badge">已装备</div>' : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * 渲染技能卡片
     */
    renderSkills() {
        if (!this.shopData?.skills) return '';

        return this.shopData.skills.map(skill => {
            const currentLevel = this.playerData.skills[skill.id] || 0;
            const isMaxed = currentLevel >= skill.maxLevel;
            const canAfford = this.playerData.coins >= skill.price;
            const disabled = isMaxed || !canAfford;

            return `
                <div class="gb-shop-card skill-card ${disabled ? 'disabled' : ''} ${isMaxed ? 'maxed' : ''}"
                     data-type="skill" data-id="${skill.id}">
                    <div class="gb-shop-card-name">${skill.name}</div>
                    <div class="gb-shop-card-desc">${skill.description}</div>
                    <div class="gb-shop-card-effect">${skill.effectPerLevel}</div>
                    <div class="gb-shop-card-level">
                        Lv.${currentLevel}/${skill.maxLevel}
                    </div>
                    <div class="gb-shop-card-price ${!canAfford ? 'unaffordable' : ''}">
                        🪙 ${skill.price}
                    </div>
                    ${isMaxed ? '<div class="gb-shop-card-badge">已满级</div>' : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * 添加样式
     */
    addStyles() {
        if (document.getElementById('gb-shop-styles')) return;

        const style = document.createElement('style');
        style.id = 'gb-shop-styles';
        style.textContent = `
            #gb-shop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
                font-family: 'Orbitron', 'Rajdhani', sans-serif;
            }

            .gb-shop-overlay {
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: gbShopFadeIn 0.3s ease-out;
            }

            @keyframes gbShopFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .gb-shop-container {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #00f2ff;
                border-radius: 15px;
                padding: 25px;
                max-width: 900px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 0 30px rgba(0, 242, 255, 0.3);
            }

            .gb-shop-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }

            .gb-shop-title {
                color: #00f2ff;
                font-size: 28px;
                margin: 0;
                text-shadow: 0 0 10px #00f2ff;
            }

            .gb-shop-coins {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(255, 215, 0, 0.2);
                padding: 10px 20px;
                border-radius: 25px;
                border: 1px solid #ffd700;
            }

            .gb-shop-coins-icon {
                font-size: 24px;
            }

            .gb-shop-coins-value {
                color: #ffd700;
                font-size: 24px;
                font-weight: bold;
            }

            .gb-shop-current {
                text-align: center;
                color: #aaa;
                margin-bottom: 20px;
                font-size: 14px;
            }

            .gb-shop-current-weapon {
                color: #00f2ff;
                font-weight: bold;
            }

            .gb-shop-section {
                margin-bottom: 25px;
            }

            .gb-shop-section-title {
                color: #fff;
                font-size: 18px;
                margin: 0 0 15px 0;
                padding-left: 10px;
                border-left: 3px solid #00f2ff;
            }

            .gb-shop-items {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
                justify-content: center;
            }

            .gb-shop-card {
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                padding: 15px;
                width: 150px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }

            .gb-shop-card:hover:not(.disabled) {
                border-color: #00f2ff;
                background: rgba(0, 242, 255, 0.1);
                transform: translateY(-5px);
                box-shadow: 0 5px 20px rgba(0, 242, 255, 0.3);
            }

            .gb-shop-card.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .gb-shop-card.equipped {
                border-color: #44ff44;
                background: rgba(68, 255, 68, 0.1);
            }

            .gb-shop-card.maxed {
                border-color: #888;
            }

            .gb-shop-card-name {
                color: #fff;
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 8px;
            }

            .gb-shop-card-desc {
                color: #aaa;
                font-size: 12px;
                margin-bottom: 8px;
                min-height: 30px;
            }

            .gb-shop-card-stats {
                color: #888;
                font-size: 11px;
                margin-bottom: 8px;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .gb-shop-card-effect {
                color: #44ff44;
                font-size: 12px;
                margin-bottom: 5px;
            }

            .gb-shop-card-level {
                color: #00f2ff;
                font-size: 12px;
                margin-bottom: 8px;
            }

            .gb-shop-card-price {
                color: #ffd700;
                font-size: 14px;
                font-weight: bold;
            }

            .gb-shop-card-price.unaffordable {
                color: #ff4444;
            }

            .gb-shop-card-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #44ff44;
                color: #000;
                font-size: 10px;
                padding: 3px 8px;
                border-radius: 10px;
                font-weight: bold;
            }

            .gb-shop-card.maxed .gb-shop-card-badge {
                background: #888;
                color: #fff;
            }

            .skill-card {
                width: 130px;
            }

            .gb-shop-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
            }

            .gb-shop-status {
                color: #888;
                font-size: 14px;
            }

            .gb-shop-complete-btn {
                background: linear-gradient(135deg, #44ff44 0%, #22aa22 100%);
                color: #000;
                border: none;
                padding: 15px 40px;
                font-size: 18px;
                font-weight: bold;
                border-radius: 10px;
                cursor: pointer;
                font-family: inherit;
                transition: all 0.2s;
            }

            .gb-shop-complete-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(68, 255, 68, 0.5);
            }

            .gb-shop-complete-btn.ready {
                background: linear-gradient(135deg, #888 0%, #666 100%);
                color: #fff;
            }

            /* 购买成功动画 */
            @keyframes gbPurchaseSuccess {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            .gb-shop-card.purchased {
                animation: gbPurchaseSuccess 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 卡片点击
        this.container.querySelectorAll('.gb-shop-card').forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('disabled')) return;

                const type = card.dataset.type;
                const itemId = card.dataset.id;

                network.emit(GUNBEAN_EVENTS.SHOP_BUY, { type, itemId });
            });
        });

        // 完成按钮
        const completeBtn = this.container.querySelector('#gb-shop-complete');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => {
                if (!this.isReady) {
                    this.isReady = true;
                    completeBtn.classList.add('ready');
                    completeBtn.textContent = '✓ 已准备';
                    network.emit(GUNBEAN_EVENTS.SHOP_COMPLETE);
                }
            });
        }
    }

    /**
     * 更新UI（购买后刷新）
     */
    updateUI() {
        // 更新金币显示
        const coinsEl = this.container.querySelector('.gb-shop-coins-value');
        if (coinsEl) {
            coinsEl.textContent = this.playerData.coins;
        }

        // 更新当前武器
        const weaponEl = this.container.querySelector('.gb-shop-current-weapon');
        if (weaponEl) {
            weaponEl.textContent = this.playerData.weapon.name;
        }

        // 重新渲染卡片
        const weaponsContainer = this.container.querySelector('.gb-shop-weapons');
        if (weaponsContainer) {
            weaponsContainer.innerHTML = this.renderWeapons();
            // 重新绑定事件
            weaponsContainer.querySelectorAll('.gb-shop-card').forEach(card => {
                card.addEventListener('click', () => {
                    if (card.classList.contains('disabled')) return;
                    network.emit(GUNBEAN_EVENTS.SHOP_BUY, {
                        type: card.dataset.type,
                        itemId: card.dataset.id
                    });
                });
            });
        }

        const skillsContainer = this.container.querySelector('.gb-shop-skills');
        if (skillsContainer) {
            skillsContainer.innerHTML = this.renderSkills();
            skillsContainer.querySelectorAll('.gb-shop-card').forEach(card => {
                card.addEventListener('click', () => {
                    if (card.classList.contains('disabled')) return;
                    network.emit(GUNBEAN_EVENTS.SHOP_BUY, {
                        type: card.dataset.type,
                        itemId: card.dataset.id
                    });
                });
            });
        }
    }

    /**
     * 处理购买结果
     */
    handleBuyResult(data) {
        if (data.success) {
            // 更新本地数据
            this.playerData.coins = data.coins;
            this.playerData.weapon = data.weapon;
            this.playerData.skills = data.skills;

            // 刷新UI
            this.updateUI();

            // 显示成功消息
            this.showMessage(data.message, 'success');
        } else {
            // 显示失败消息
            this.showMessage(data.message, 'error');
        }
    }

    /**
     * 更新准备状态
     */
    updateReadyStatus(readyCount, totalPlayers) {
        this.readyCount = readyCount;
        this.totalPlayers = totalPlayers;

        const readyEl = this.container.querySelector('.gb-shop-ready-count');
        const totalEl = this.container.querySelector('.gb-shop-total-count');
        const btnEl = this.container.querySelector('#gb-shop-complete');

        if (readyEl) readyEl.textContent = readyCount;
        if (totalEl) totalEl.textContent = totalPlayers;
        if (btnEl && !this.isReady) {
            btnEl.textContent = `✓ 完成 (${readyCount}/${totalPlayers})`;
        }
    }

    /**
     * 显示消息
     */
    showMessage(text, type = 'info') {
        const msg = document.createElement('div');
        msg.className = `gb-shop-message ${type}`;
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? 'rgba(68, 255, 68, 0.9)' : 'rgba(255, 68, 68, 0.9)'};
            color: #fff;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 18px;
            z-index: 1001;
            animation: gbShopFadeIn 0.3s ease-out;
        `;
        document.body.appendChild(msg);

        setTimeout(() => {
            msg.remove();
        }, 1500);
    }

    /**
     * 隐藏商店
     */
    hide() {
        if (this.container) {
            this.container.style.animation = 'gbShopFadeIn 0.3s ease-out reverse';
            setTimeout(() => {
                this.destroy();
            }, 300);
        }
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
}
