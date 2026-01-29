/**
 * FPS HUD - 游戏内界面
 */
import { animate as anime } from 'animejs';

export class FPSHUD {
    constructor() {
        this.elements = {};
        this.cacheElements();
    }

    /**
     * 缓存 DOM 元素
     */
    cacheElements() {
        this.elements = {
            uiLayer: document.getElementById('ui-layer'),
            instructions: document.getElementById('instructions'),
            healthBar: document.getElementById('health-bar-fill'),
            healthText: document.getElementById('health-text'),
            ammoCount: document.getElementById('ammo-count'),
            reloadMsg: document.getElementById('reload-msg'),
            hitIndicator: document.getElementById('hit-indicator'),
            crosshair: document.getElementById('crosshair')
        };
    }

    /**
     * 显示 HUD
     */
    show() {
        if (this.elements.uiLayer) {
            this.elements.uiLayer.style.display = 'block';
        }
        this.showInstructions();
    }

    /**
     * 隐藏 HUD
     */
    hide() {
        if (this.elements.uiLayer) {
            this.elements.uiLayer.style.display = 'none';
        }
    }

    /**
     * 显示操作说明
     */
    showInstructions() {
        if (this.elements.instructions) {
            this.elements.instructions.style.display = 'flex';
        }
    }

    /**
     * 隐藏操作说明
     */
    hideInstructions() {
        if (this.elements.instructions) {
            this.elements.instructions.style.display = 'none';
        }
    }

    /**
     * 更新血量
     * @param {number} hp - 当前血量
     */
    updateHealth(hp) {
        const { healthBar, healthText, uiLayer } = this.elements;

        const oldHp = parseInt(healthText?.textContent || '100');

        if (healthBar) {
            healthBar.style.width = `${hp}%`;

            if (hp <= 30) {
                healthBar.style.background = '#ff0055';
                healthBar.style.boxShadow = '0 0 20px #ff0055';
            } else {
                healthBar.style.background = '#00f2ff';
                healthBar.style.boxShadow = '0 0 20px #00f2ff';
            }
        }

        if (healthText) {
            healthText.textContent = hp;
        }

        // 受伤闪烁效果
        if (hp < oldHp && uiLayer) {
            uiLayer.style.background = 'radial-gradient(circle, rgba(255,0,0,0.2) 0%, rgba(255,0,0,0.5) 100%)';
            setTimeout(() => {
                uiLayer.style.background = 'radial-gradient(circle, transparent 60%, rgba(0, 5, 10, 0.4) 100%)';
            }, 100);
        }
    }

    /**
     * 更新弹药显示
     * @param {number} current - 当前弹药
     * @param {number} total - 总弹药
     */
    updateAmmo(current, total) {
        if (this.elements.ammoCount) {
            this.elements.ammoCount.textContent = `${current} / ${total}`;
            this.elements.ammoCount.style.color = current <= 5 ? 'red' : 'white';
        }
    }

    /**
     * 显示命中指示器
     */
    showHitIndicator() {
        const ind = this.elements.hitIndicator;
        if (!ind) return;

        ind.style.display = 'block';

        anime(ind, {
            opacity: [1, 0],
            scale: [2, 1],
            duration: 150,
            ease: 'outExpo',
            onComplete: () => {
                ind.style.display = 'none';
            }
        });
    }

    /**
     * 显示击杀信息
     * @param {string} killerName - 击杀者
     * @param {string} victimName - 被击杀者
     */
    showKillFeed(killerName, victimName) {
        // TODO: 实现击杀信息列表
        console.log(`${killerName} 击杀了 ${victimName}`);
    }
}

export default FPSHUD;
