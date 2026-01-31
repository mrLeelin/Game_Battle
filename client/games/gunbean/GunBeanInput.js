/**
 * 枪豆人 - 输入控制
 * 2D版本：鼠标瞄准、点击射击、E键复活
 */

export class GunBeanInput {
    constructor(game) {
        this.game = game;

        // 鼠标位置（屏幕坐标）
        this.mouseX = 0;
        this.mouseY = 0;

        // 瞄准角度（弧度）
        this.aimAngle = 0;

        // 射击状态
        this.isShooting = false;
        this.shootCooldown = 0;
        this.shootInterval = 200; // 射击间隔（毫秒）

        // 复活按键状态
        this.reviveKeyPressed = false;

        // 绑定方法
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
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
        // 鼠标事件
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);

        // 键盘事件
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);

        // 移动端
        if ('ontouchstart' in window) {
            this.createMobileControls();
        }

        // 设置瞄准光标样式
        document.body.style.cursor = 'crosshair';
    }

    /**
     * 创建移动端控制
     */
    createMobileControls() {
        const controls = document.createElement('div');
        controls.className = 'gb-mobile-controls';
        controls.innerHTML = `
            <div class="gb-joystick-zone" id="gb-aim-zone">
                <div class="gb-joystick-base">
                    <div class="gb-joystick-thumb"></div>
                </div>
            </div>
            <div class="gb-action-zone">
                <button class="gb-action-btn gb-shoot-btn" id="gb-shoot-btn">🔫</button>
                <button class="gb-action-btn gb-revive-btn" id="gb-revive-btn">💚</button>
            </div>
        `;
        document.body.appendChild(controls);

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .gb-mobile-controls {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 200px;
                pointer-events: none;
                z-index: 1000;
            }

            .gb-joystick-zone {
                position: absolute;
                left: 20px;
                bottom: 20px;
                width: 150px;
                height: 150px;
                pointer-events: auto;
            }

            .gb-joystick-base {
                width: 120px;
                height: 120px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .gb-joystick-thumb {
                width: 50px;
                height: 50px;
                background: rgba(0, 242, 255, 0.8);
                border-radius: 50%;
                transition: transform 0.05s;
            }

            .gb-action-zone {
                position: absolute;
                right: 20px;
                bottom: 50px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                pointer-events: auto;
            }

            .gb-action-btn {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: rgba(255, 100, 100, 0.4);
                border: 3px solid #ff6666;
                color: #fff;
                font-size: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .gb-action-btn:active {
                background: rgba(255, 100, 100, 0.7);
                transform: scale(0.95);
            }

            .gb-revive-btn {
                background: rgba(100, 255, 100, 0.4);
                border-color: #66ff66;
            }

            .gb-revive-btn:active {
                background: rgba(100, 255, 100, 0.7);
            }
        `;
        document.head.appendChild(style);

        // 瞄准摇杆
        const aimZone = document.getElementById('gb-aim-zone');
        this.aimThumb = controls.querySelector('.gb-joystick-thumb');

        aimZone.addEventListener('touchstart', this.onTouchStart, { passive: false });
        aimZone.addEventListener('touchmove', this.onTouchMove, { passive: false });
        aimZone.addEventListener('touchend', this.onTouchEnd);

        // 射击按钮
        const shootBtn = document.getElementById('gb-shoot-btn');
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isShooting = true;
        });
        shootBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isShooting = false;
        });

        // 复活按钮
        const reviveBtn = document.getElementById('gb-revive-btn');
        reviveBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.tryRevive();
        });
    }

    /**
     * 鼠标移动 - 更新瞄准方向
     * 从玩家在屏幕上的位置到鼠标位置的角度
     */
    onMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        // 获取玩家在屏幕上的实际位置
        const playerScreenPos = this.game.getLocalPlayerScreenPosition();
        const dx = this.mouseX - playerScreenPos.x;
        const dy = this.mouseY - playerScreenPos.y;

        // 2D 坐标系：角度从正上方开始，顺时针增加
        // atan2(dx, -dy) 使得：上=0, 右=π/2, 下=π, 左=-π/2
        this.aimAngle = Math.atan2(dx, -dy);

        // 通知游戏更新瞄准
        this.game.updateAim(this.aimAngle);
    }

    /**
     * 鼠标按下 - 开始射击
     */
    onMouseDown(e) {
        if (e.button === 0) { // 左键
            this.isShooting = true;
            // 开火时隐藏鼠标
            if (this.game.ui && this.game.isRunning && !this.game.isDead && !this.game.isPaused) {
                this.game.ui.hideCursor();
                this.game.ui.showCrosshair();
            }
        }
    }

    /**
     * 鼠标松开 - 停止射击
     */
    onMouseUp(e) {
        if (e.button === 0) {
            this.isShooting = false;
        }
    }

    /**
     * 键盘按下
     */
    onKeyDown(e) {
        // ESC键显示鼠标
        if (e.code === 'Escape') {
            e.preventDefault();
            if (this.game.ui) {
                this.game.ui.showCursor();
                this.game.ui.hideCrosshair();
            }
        }

        // 空格键射击
        if (e.code === 'Space') {
            e.preventDefault();
            this.isShooting = true;
            // 开火时隐藏鼠标
            if (this.game.ui && this.game.isRunning && !this.game.isDead && !this.game.isPaused) {
                this.game.ui.hideCursor();
                this.game.ui.showCrosshair();
            }
        }

        // E键复活
        if (e.code === 'KeyE') {
            e.preventDefault();
            if (!this.reviveKeyPressed) {
                this.reviveKeyPressed = true;
                this.game.tryRevive();
            }
        }

        // R键换弹
        if (e.code === 'KeyR') {
            e.preventDefault();
            this.game.reload();
        }

        // P键GM模式：增加20%经验值
        if (e.code === 'KeyP') {
            e.preventDefault();
            this.game.gmAddExp();
        }
    }

    /**
     * 键盘松开
     */
    onKeyUp(e) {
        if (e.code === 'Space') {
            this.isShooting = false;
        }

        if (e.code === 'KeyE') {
            this.reviveKeyPressed = false;
        }
    }

    /**
     * 触摸开始（瞄准摇杆）
     */
    onTouchStart(e) {
        e.preventDefault();
        this.updateAimFromTouch(e.touches[0]);
    }

    /**
     * 触摸移动（瞄准摇杆）
     */
    onTouchMove(e) {
        e.preventDefault();
        this.updateAimFromTouch(e.touches[0]);
    }

    /**
     * 触摸结束
     */
    onTouchEnd() {
        if (this.aimThumb) {
            this.aimThumb.style.transform = 'translate(0, 0)';
        }
    }

    /**
     * 从触摸位置更新瞄准
     */
    updateAimFromTouch(touch) {
        const zone = document.getElementById('gb-aim-zone');
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

        // 更新瞄准角度（2D坐标系）
        if (dist > 5) {
            this.aimAngle = Math.atan2(deltaX, -deltaY);
            this.game.updateAim(this.aimAngle);
        }

        // 更新摇杆视觉
        if (this.aimThumb) {
            this.aimThumb.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }
    }

    /**
     * 获取射击方向向量（2D: x, y）
     */
    getShootDirection() {
        return {
            x: Math.sin(this.aimAngle),
            y: -Math.cos(this.aimAngle)
        };
    }

    /**
     * 更新（每帧调用）
     */
    update(deltaTime) {
        // 更新射击冷却
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime * 1000;
        }

        // 处理持续射击
        if (this.isShooting && this.shootCooldown <= 0) {
            const direction = this.getShootDirection();
            this.game.shoot(direction.x, direction.y);
            this.shootCooldown = this.shootInterval;
        }
    }

    /**
     * 销毁
     */
    destroy() {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);

        // 恢复默认光标
        document.body.style.cursor = 'default';

        // 移除移动端控件
        const controls = document.querySelector('.gb-mobile-controls');
        if (controls) {
            document.body.removeChild(controls);
        }
    }
}
