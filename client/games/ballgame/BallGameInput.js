/**
 * 抢球大战 - 输入控制
 * 支持键盘和触摸屏
 */
import { FIELD } from './BallGameScene.js';

export class BallGameInput {
    constructor(game) {
        this.game = game;

        // 移动状态
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };

        // 玩家位置
        this.playerX = 0;
        this.playerZ = 0;
        this.moveSpeed = 0.15;

        // 触摸控制
        this.joystick = null;
        this.joystickActive = false;
        this.joystickDelta = { x: 0, y: 0 };

        // 绑定方法
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
    }

    /**
     * 初始化
     */
    init() {
        // 键盘事件
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);

        // 检测移动端
        if ('ontouchstart' in window) {
            this.createMobileControls();
        }
    }

    /**
     * 创建移动端控制
     */
    createMobileControls() {
        const controls = document.createElement('div');
        controls.className = 'bg-mobile-controls';
        controls.innerHTML = `
            <div class="bg-joystick-zone" id="joystick-zone">
                <div class="bg-joystick-base">
                    <div class="bg-joystick-thumb"></div>
                </div>
            </div>
            <div class="bg-action-zone">
                <button class="bg-action-btn bg-jump-btn" id="jump-btn">跳</button>
                <button class="bg-action-btn" id="action-btn">捡/放</button>
            </div>
        `;
        document.body.appendChild(controls);

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .bg-mobile-controls {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 200px;
                pointer-events: none;
                z-index: 1000;
            }

            .bg-joystick-zone {
                position: absolute;
                left: 20px;
                bottom: 20px;
                width: 150px;
                height: 150px;
                pointer-events: auto;
            }

            .bg-joystick-base {
                width: 120px;
                height: 120px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .bg-joystick-thumb {
                width: 50px;
                height: 50px;
                background: rgba(0, 242, 255, 0.8);
                border-radius: 50%;
                transition: transform 0.05s;
            }

            .bg-action-zone {
                position: absolute;
                right: 20px;
                bottom: 50px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                pointer-events: auto;
            }

            .bg-action-btn {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: rgba(0, 242, 255, 0.3);
                border: 2px solid #00f2ff;
                color: #fff;
                font-size: 16px;
                font-weight: bold;
            }

            .bg-action-btn:active {
                background: rgba(0, 242, 255, 0.6);
            }

            .bg-jump-btn {
                background: rgba(68, 255, 68, 0.3);
                border-color: #44ff44;
            }

            .bg-jump-btn:active {
                background: rgba(68, 255, 68, 0.6);
            }
        `;
        document.head.appendChild(style);

        // 摇杆事件
        const joystickZone = document.getElementById('joystick-zone');
        this.joystickThumb = controls.querySelector('.bg-joystick-thumb');

        joystickZone.addEventListener('touchstart', this.onTouchStart, { passive: false });
        joystickZone.addEventListener('touchmove', this.onTouchMove, { passive: false });
        joystickZone.addEventListener('touchend', this.onTouchEnd);

        // 动作按钮
        const actionBtn = document.getElementById('action-btn');
        actionBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onAction();
        });

        // 跳跃按钮
        const jumpBtn = document.getElementById('jump-btn');
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.jump();
        });
    }

    /**
     * 键盘按下
     */
    onKeyDown(e) {
        const key = e.key.toLowerCase();

        if (key in this.keys) {
            this.keys[key] = true;
        }

        // 空格键 - 捡球/放球
        if (e.code === 'Space') {
            e.preventDefault();
            this.onAction();
        }

        // Shift 键 - 跳跃
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            e.preventDefault();
            this.game.jump();
        }
    }

    /**
     * 键盘松开
     */
    onKeyUp(e) {
        const key = e.key.toLowerCase();

        if (key in this.keys) {
            this.keys[key] = false;
        }
    }

    /**
     * 触摸开始
     */
    onTouchStart(e) {
        e.preventDefault();
        this.joystickActive = true;
        this.updateJoystick(e.touches[0]);
    }

    /**
     * 触摸移动
     */
    onTouchMove(e) {
        e.preventDefault();
        if (this.joystickActive) {
            this.updateJoystick(e.touches[0]);
        }
    }

    /**
     * 触摸结束
     */
    onTouchEnd() {
        this.joystickActive = false;
        this.joystickDelta = { x: 0, y: 0 };

        if (this.joystickThumb) {
            this.joystickThumb.style.transform = 'translate(0, 0)';
        }
    }

    /**
     * 更新摇杆
     */
    updateJoystick(touch) {
        const zone = document.getElementById('joystick-zone');
        if (!zone) return;

        const rect = zone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let deltaX = touch.clientX - centerX;
        let deltaY = touch.clientY - centerY;

        // 限制范围
        const maxDist = 40;
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (dist > maxDist) {
            deltaX = (deltaX / dist) * maxDist;
            deltaY = (deltaY / dist) * maxDist;
        }

        // 归一化
        this.joystickDelta = {
            x: deltaX / maxDist,
            y: deltaY / maxDist
        };

        // 更新摇杆视觉
        if (this.joystickThumb) {
            this.joystickThumb.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }
    }

    /**
     * 动作（捡球/投掷球）
     */
    onAction() {
        if (this.game.holdingBall) {
            // 持有球时，投掷向自己的球门
            const goal = this.game.getLocalGoalPosition();
            this.game.throwBall(goal.x, goal.z);
        } else {
            this.game.tryPickupBall();
        }
    }

    /**
     * 应用碰撞推开
     */
    applyPush(pushX, pushZ) {
        this.playerX += pushX;
        this.playerZ += pushZ;

        // 边界限制
        const FIELD = { WIDTH: 30, HEIGHT: 30 };
        const halfWidth = FIELD.WIDTH / 2 - 0.5;
        const halfHeight = FIELD.HEIGHT / 2 - 0.5;
        this.playerX = Math.max(-halfWidth, Math.min(halfWidth, this.playerX));
        this.playerZ = Math.max(-halfHeight, Math.min(halfHeight, this.playerZ));

        // 发送更新后的位置
        this.game.sendMove(this.playerX, this.playerZ);
    }

    /**
     * 更新（每帧调用）
     */
    update() {
        let dx = 0;
        let dz = 0;

        // 键盘输入
        if (this.keys.w) dz -= 1;
        if (this.keys.s) dz += 1;
        if (this.keys.a) dx -= 1;
        if (this.keys.d) dx += 1;

        // 摇杆输入
        if (this.joystickActive) {
            dx = this.joystickDelta.x;
            dz = this.joystickDelta.y;
        }

        // 归一化移动向量
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0) {
            dx = (dx / len) * this.moveSpeed;
            dz = (dz / len) * this.moveSpeed;

            // 预测新位置
            let newX = this.playerX + dx;
            let newZ = this.playerZ + dz;

            // 边界限制
            const halfWidth = FIELD.WIDTH / 2 - 0.5;
            const halfHeight = FIELD.HEIGHT / 2 - 0.5;
            newX = Math.max(-halfWidth, Math.min(halfWidth, newX));
            newZ = Math.max(-halfHeight, Math.min(halfHeight, newZ));

            // 碰撞检测（预测性）
            const collision = this.game.scene?.checkPlayerCollisions(
                this.game.localPlayerId, newX, newZ
            );

            if (collision) {
                // 有碰撞，使用安全位置
                newX = collision.x;
                newZ = collision.z;

                // 再次边界限制
                newX = Math.max(-halfWidth, Math.min(halfWidth, newX));
                newZ = Math.max(-halfHeight, Math.min(halfHeight, newZ));
            }

            // 更新位置
            this.playerX = newX;
            this.playerZ = newZ;

            // 发送移动
            this.game.sendMove(this.playerX, this.playerZ);
        }
    }

    /**
     * 设置玩家位置
     */
    setPosition(x, z) {
        this.playerX = x;
        this.playerZ = z;
    }

    /**
     * 销毁
     */
    destroy() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);

        const controls = document.querySelector('.bg-mobile-controls');
        if (controls) {
            document.body.removeChild(controls);
        }
    }
}
