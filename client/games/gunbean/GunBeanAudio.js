import { audioManager } from '../../core/ProceduralAudio.js';

export class GunBeanAudio {
    constructor() {
        this.audioManager = audioManager;
        // 音效冷却控制（防止频繁播放导致卡顿）
        this.lastShootTime = 0;
        this.shootCooldown = 50; // 50ms冷却

        // 远程 Battle BGM
        this.battleBgm = new Audio('https://cdn1.suno.ai/d6ab5de2-3860-4cee-b184-4c6208709f5b.mp3');
        this.battleBgm.loop = true;
        this.battleBgm.volume = 0.3; // 默认音量
    }

    init() {
        // Procedural audio doesn't need file loading
        // We could verify context here
        if (this.audioManager.ctx.state === 'suspended') {
            window.addEventListener('click', () => {
                this.audioManager.resume();
                // 尝试预加载/播放一下以获取自动播放权限
                this.battleBgm.load();
            }, { once: true });
        }
    }

    playBgm(name) {
        // 先停止所有可能的音乐
        this.stopBgm();

        if (name === 'bgm_lobby') {
            this.audioManager.playBgm('lobby');
        } else if (name === 'bgm_battle') {
            // 播放远程 BGM
            this.battleBgm.play().catch(e => console.warn('Battle BGM play failed:', e));
        }
    }

    playSfx(name) {
        switch (name) {
            case 'shoot':
                // 射击音效冷却，避免频繁播放导致卡顿
                const now = Date.now();
                if (now - this.lastShootTime < this.shootCooldown) return;
                this.lastShootTime = now;
                this.audioManager.playShoot();
                break;
            case 'hit':
                this.audioManager.playHit();
                break;
            case 'explosion':
                this.audioManager.playExplosion();
                break;
            case 'lose': // death
                this.audioManager.playDeath();
                break;
            case 'win': // victory
                this.audioManager.playVictory();
                break;
        }
    }

    stopBgm() {
        this.audioManager.stopBgm();
        this.battleBgm.pause();
        this.battleBgm.currentTime = 0;
    }
}

export const gunBeanAudio = new GunBeanAudio();