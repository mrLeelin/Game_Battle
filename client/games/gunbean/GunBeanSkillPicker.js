/**
 * 枪豆人 - 技能选择UI组件
 * 升级时显示三选一技能界面
 */
import { network } from '../../core/Network.js';
import { GUNBEAN_EVENTS } from '../../../shared/Events.js';

export class GunBeanSkillPicker {
    constructor() {
        this.container = null;
        this.choices = [];
        this.level = 1;
        this.onSelect = null;
    }

    /**
     * 显示技能选择界面
     * @param {Object} data 技能选择数据
     */
    show(data) {
        this.level = data.level;
        this.choices = data.choices;

        this.createUI();
        this.bindEvents();
    }

    /**
     * 创建UI
     */
    createUI() {
        this.destroy();

        this.container = document.createElement('div');
        this.container.id = 'gb-skill-picker';
        this.container.innerHTML = this.getTemplate();
        document.body.appendChild(this.container);

        this.addStyles();

        // 入场动画
        requestAnimationFrame(() => {
            this.container.classList.add('show');
        });
    }

    /**
     * 获取模板
     */
    getTemplate() {
        const rarityColors = {
            common: '#888888',
            rare: '#4488ff',
            epic: '#aa44ff'
        };

        const rarityNames = {
            common: '普通',
            rare: '稀有',
            epic: '史诗'
        };

        const choicesHtml = this.choices.map((skill, index) => `
            <div class="gb-skill-card" data-skill-id="${skill.id}" data-index="${index}"
                 style="--rarity-color: ${rarityColors[skill.rarity] || rarityColors.common}">
                <div class="gb-skill-rarity">${rarityNames[skill.rarity] || '普通'}</div>
                <div class="gb-skill-icon">${skill.icon}</div>
                <div class="gb-skill-name">${skill.name}</div>
                <div class="gb-skill-level">
                    ${skill.currentLevel > 0 ? `Lv.${skill.currentLevel} → Lv.${skill.currentLevel + 1}` : 'Lv.1'}
                    ${skill.currentLevel >= skill.maxLevel - 1 ? '<span class="max">MAX</span>' : ''}
                </div>
                <div class="gb-skill-desc">${skill.description}</div>
                <div class="gb-skill-effect">${skill.effectPerLevel}</div>
            </div>
        `).join('');

        return `
            <div class="gb-skill-overlay">
                <div class="gb-skill-container">
                    <div class="gb-skill-header">
                        <div class="gb-skill-title">🎉 升级到 Lv.${this.level}！</div>
                        <div class="gb-skill-subtitle">选择一个技能</div>
                    </div>
                    <div class="gb-skill-cards">
                        ${choicesHtml}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 添加样式
     */
    addStyles() {
        if (document.getElementById('gb-skill-picker-styles')) return;

        const style = document.createElement('style');
        style.id = 'gb-skill-picker-styles';
        style.textContent = `
            #gb-skill-picker {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            #gb-skill-picker.show {
                opacity: 1;
            }

            .gb-skill-overlay {
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .gb-skill-container {
                text-align: center;
                animation: skillContainerIn 0.5s ease;
            }

            @keyframes skillContainerIn {
                from {
                    transform: scale(0.8);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            .gb-skill-header {
                margin-bottom: 30px;
            }

            .gb-skill-title {
                font-size: 36px;
                color: #ffd700;
                text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
                margin-bottom: 10px;
            }

            .gb-skill-subtitle {
                font-size: 18px;
                color: #aaa;
            }

            .gb-skill-cards {
                display: flex;
                gap: 20px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .gb-skill-card {
                width: 200px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid var(--rarity-color);
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                animation: cardIn 0.5s ease backwards;
            }

            .gb-skill-card:nth-child(1) { animation-delay: 0.1s; }
            .gb-skill-card:nth-child(2) { animation-delay: 0.2s; }
            .gb-skill-card:nth-child(3) { animation-delay: 0.3s; }

            @keyframes cardIn {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .gb-skill-card:hover {
                transform: translateY(-10px) scale(1.05);
                box-shadow: 0 10px 40px var(--rarity-color);
                border-color: #fff;
            }

            .gb-skill-rarity {
                font-size: 12px;
                color: var(--rarity-color);
                text-transform: uppercase;
                margin-bottom: 10px;
                letter-spacing: 2px;
            }

            .gb-skill-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }

            .gb-skill-name {
                font-size: 20px;
                color: #fff;
                font-weight: bold;
                margin-bottom: 8px;
            }

            .gb-skill-level {
                font-size: 14px;
                color: #888;
                margin-bottom: 12px;
            }

            .gb-skill-level .max {
                color: #ffd700;
                font-weight: bold;
                margin-left: 5px;
            }

            .gb-skill-desc {
                font-size: 14px;
                color: #ccc;
                margin-bottom: 10px;
                line-height: 1.4;
            }

            .gb-skill-effect {
                font-size: 14px;
                color: #4f4;
                background: rgba(68, 255, 68, 0.1);
                padding: 8px;
                border-radius: 4px;
            }

            /* 暂停提示 */
            .gb-pause-indicator {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 215, 0, 0.9);
                color: #000;
                padding: 10px 30px;
                border-radius: 20px;
                font-size: 16px;
                font-weight: bold;
                z-index: 1999;
                animation: pulse 1s ease infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        const cards = this.container.querySelectorAll('.gb-skill-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const skillId = card.dataset.skillId;
                this.selectSkill(skillId);
            });
        });
    }

    /**
     * 选择技能
     */
    selectSkill(skillId) {
        // 发送选择到服务端
        network.socket.emit(GUNBEAN_EVENTS.SKILL_SELECT, { skillId });

        // 播放选择动画
        const card = this.container.querySelector(`[data-skill-id="${skillId}"]`);
        if (card) {
            card.style.transform = 'scale(1.2)';
            card.style.boxShadow = '0 0 50px #ffd700';
        }

        // 关闭界面
        setTimeout(() => {
            this.hide();
            if (this.onSelect) {
                this.onSelect(skillId);
            }
        }, 300);
    }

    /**
     * 隐藏界面
     */
    hide() {
        if (this.container) {
            this.container.classList.remove('show');
            setTimeout(() => {
                this.destroy();
            }, 300);
        }
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

/**
 * 暂停提示组件
 */
export class GunBeanPauseIndicator {
    constructor() {
        this.element = null;
    }

    show(message = '游戏暂停 - 等待玩家选择技能') {
        this.hide();

        this.element = document.createElement('div');
        this.element.className = 'gb-pause-indicator';
        this.element.textContent = message;
        document.body.appendChild(this.element);
    }

    hide() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}
