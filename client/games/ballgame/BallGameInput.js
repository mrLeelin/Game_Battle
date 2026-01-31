/**
 * 抢球大战 - 输入控制
 * GTA 风格：鼠标控制相机旋转，WASD 相对相机移动，角色自动转向
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

        // 玩家朝向（弧度）- 由移动方向自动决定
        this.playerRotation = 0;

        // 鼠标灵敏度
        this.mouseSensitivity = 0.003;

        // 触摸控制
        this.joystick = null;
        this.joystickActive = false;
        this.joystickDelta = { x: 0, y: 0 };

        // 绑定方法
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
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

        // 鼠标事件
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mousedown', this.onMouseDown);

        // 禁用右键菜单
        document.addEventListener('contextmenu', (e) => e.preventDefault());

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
            <div class="bg-camera-zone" id="camera-zone"></div>
            <div class="bg-action-zone">
                <button class="bg-action-btn bg-attack-btn" id="attack-btn">攻击</button>
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

            .bg-camera-zone {
                position: absolute;
                right: 150px;
                bottom: 0;
                width: calc(100% - 300px);
                height: 100%;
                pointer-events: auto;
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

            .bg-attack-btn {
                background: rgba(255, 68, 68, 0.3);
                border-color: #ff4444;
            }

            .bg-attack-btn:active {
                background: rgba(255, 68, 68, 0.6);
            }
        `;
        document.head.appendChild(style);

        // 摇杆事件
        const joystickZone = document.getElementById('joystick-zone');
        this.joystickThumb = controls.querySelector('.bg-joystick-thumb');

        joystickZone.addEventListener('touchstart', this.onTouchStart, { passive: false });
        joystickZone.addEventListener('touchmove', this.onTouchMove, { passive: false });
        joystickZone.addEventListener('touchend', this.onTouchEnd);

        // 相机区域触摸（用于旋转相机）
        const cameraZone = document.getElementById('camera-zone');
        let lastTouchX = 0;
        let lastTouchY = 0;

        cameraZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            }
        }, { passive: false });

        cameraZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const deltaX = e.touches[0].clientX - lastTouchX;
                const deltaY = e.touches[0].clientY - lastTouchY;
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;

                // 旋转相机
                if (this.game.scene) {
                    this.game.scene.rotateCamera(
                        deltaX * this.mouseSensitivity * 2,
                        deltaY * this.mouseSensitivity * 2
                    );
                }
            }
        }, { passive: false });

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

        // 攻击按钮
        const attackBtn = document.getElementById('attack-btn');
        attackBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.attack();
        });
    }

    /**
     * 鼠标移动 - GTA 风格：控制相机旋转
     */
    onMouseMove(e) {
        if (!this.game.scene) return;

        // 获取鼠标移动增量
        const deltaX = e.movementX || 0;
        const deltaY = e.movementY || 0;

        // 旋转相机
        this.game.scene.rotateCamera(
            deltaX * this.mouseSensitivity,
            deltaY * this.mouseSensitivity
        );
    }

    /**
     * 鼠标按下 - 左键攻击
     */
    onMouseDown(e) {
        // 左键攻击
        if (e.button === 0) {
            this.game.attack();
        }
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
        const halfWidth = FIELD.WIDTH / 2 - 0.5;
        const halfHeight = FIELD.HEIGHT / 2 - 0.5;
        this.playerX = Math.max(-halfWidth, Math.min(halfWidth, this.playerX));
        this.playerZ = Math.max(-halfHeight, Math.min(halfHeight, this.playerZ));

        // 发送更新后的位置
        this.game.sendMove(this.playerX, this.playerZ);
    }

    /**
     * 更新（每帧调用）- GTA 风格移动
     */
    update() {
        // 如果玩家眩晕，不处理移动
        if (this.game.isStunned) return;

        let inputX = 0;
        let inputZ = 0;

        // 键盘输入（相对于屏幕的原始输入）
        if (this.keys.w) inputZ -= 1;  // W = 向前（相机方向）
        if (this.keys.s) inputZ += 1;  // S = 向后
        if (this.keys.a) inputX -= 1;  // A = 向左
        if (this.keys.d) inputX += 1;  // D = 向右

        // 摇杆输入
        if (this.joystickActive) {
            inputX = this.joystickDelta.x;
            inputZ = this.joystickDelta.y;
        }

        // 归一化输入向量
        const inputLen = Math.sqrt(inputX * inputX + inputZ * inputZ);
        if (inputLen > 0) {
            inputX /= inputLen;
            inputZ /= inputLen;

            // 获取相机方向
            const forward = this.game.scene?.getCameraForward() || { x: 0, z: 1 };
            const right = this.game.scene?.getCameraRight() || { x: 1, z: 0 };

            // 计算世界空间移动方向（相对于相机）
            // W (inputZ < 0) = 相机前方
            // S (inputZ > 0) = 相机后方
            // A (inputX < 0) = 相机左方
            // D (inputX > 0) = 相机右方
            const worldDirX = forward.x * (-inputZ) + right.x * inputX;
            const worldDirZ = forward.z * (-inputZ) + right.z * inputX;

            // 应用移动速度
            const dx = worldDirX * this.moveSpeed;
            const dz = worldDirZ * this.moveSpeed;

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

            // === GTA 风格：角色自动转向移动方向 ===
            const moveRotation = Math.atan2(worldDirX, worldDirZ);
            this.playerRotation = moveRotation;

            // 更新角色朝向
            this.game.scene?.setPlayerRotation(this.game.localPlayerId, moveRotation);

            // 发送朝向到服务端
            this.game.sendRotation(moveRotation);
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
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mousedown', this.onMouseDown);

        const controls = document.querySelector('.bg-mobile-controls');
        if (controls) {
            document.body.removeChild(controls);
        }
    }
}
