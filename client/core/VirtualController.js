/**
 * 虚拟控制器
 * 提供移动端虚拟摇杆和按钮控制
 */
import nipplejs from 'nipplejs';
import { deviceDetector } from './DeviceDetector.js';

class VirtualController {
    constructor() {
        this.enabled = false;
        this.container = null;

        // 摇杆实例
        this.moveJoystick = null;
        this.lookJoystick = null;

        // 按钮元素
        this.buttons = {};

        // 输入状态
        this.inputState = {
            // 移动方向 (-1 到 1)
            moveX: 0,
            moveY: 0,
            // 视角方向
            lookX: 0,
            lookY: 0,
            // 按钮状态
            fire: false,
            jump: false,
            reload: false,
            interact: false
        };

        // 回调函数
        this.onMove = null;
        this.onLook = null;
        this.onButtonDown = null;
        this.onButtonUp = null;
    }

    /**
     * 初始化虚拟控制器
     * @param {Object} options - 配置选项
     */
    init(options = {}) {
        if (!deviceDetector.needsVirtualController()) {
            console.log('[VirtualController] 非触摸设备，跳过初始化');
            return;
        }

        this.onMove = options.onMove || null;
        this.onLook = options.onLook || null;
        this.onButtonDown = options.onButtonDown || null;
        this.onButtonUp = options.onButtonUp || null;

        // 创建容器
        this._createContainer();

        // 创建移动摇杆
        this._createMoveJoystick();

        // 创建视角控制区域
        this._createLookZone();

        // 创建动作按钮
        this._createActionButtons();

        this.enabled = true;

        console.log('[VirtualController] 初始化完成');
    }

    /**
     * 创建控制器容器
     */
    _createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'virtual-controller';
        this.container.className = 'virtual-controller';
        document.body.appendChild(this.container);
    }

    /**
     * 创建移动摇杆
     */
    _createMoveJoystick() {
        // 创建摇杆容器
        const joystickZone = document.createElement('div');
        joystickZone.id = 'move-joystick-zone';
        joystickZone.className = 'joystick-zone joystick-zone-left';
        this.container.appendChild(joystickZone);

        // 创建 nipplejs 摇杆
        this.moveJoystick = nipplejs.create({
            zone: joystickZone,
            mode: 'static',
            position: { left: '80px', bottom: '80px' },
            color: 'rgba(0, 242, 255, 0.5)',
            size: 120,
            restOpacity: 0.7,
            fadeTime: 0
        });

        // 绑定事件
        this.moveJoystick.on('move', (evt, data) => {
            if (data.vector) {
                this.inputState.moveX = data.vector.x;
                this.inputState.moveY = -data.vector.y; // 反转 Y 轴
                this.onMove?.(this.inputState.moveX, this.inputState.moveY);
            }
        });

        this.moveJoystick.on('end', () => {
            this.inputState.moveX = 0;
            this.inputState.moveY = 0;
            this.onMove?.(0, 0);
        });
    }

    /**
     * 创建视角控制区域
     */
    _createLookZone() {
        const lookZone = document.createElement('div');
        lookZone.id = 'look-zone';
        lookZone.className = 'look-zone';
        this.container.appendChild(lookZone);

        let startX = 0;
        let startY = 0;
        let isLooking = false;

        // 触摸开始
        lookZone.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                isLooking = true;
            }
        }, { passive: true });

        // 触摸移动
        lookZone.addEventListener('touchmove', (e) => {
            if (!isLooking || e.touches.length !== 1) return;

            const touch = e.touches[0];
            const deltaX = (touch.clientX - startX) * 0.005; // 灵敏度
            const deltaY = (touch.clientY - startY) * 0.005;

            this.inputState.lookX = deltaX;
            this.inputState.lookY = deltaY;
            this.onLook?.(deltaX, deltaY);

            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: true });

        // 触摸结束
        lookZone.addEventListener('touchend', () => {
            isLooking = false;
            this.inputState.lookX = 0;
            this.inputState.lookY = 0;
        });
    }

    /**
     * 创建动作按钮
     */
    _createActionButtons() {
        const buttonConfigs = [
            { id: 'fire', icon: '🔫', label: '射击', className: 'btn-fire' },
            { id: 'jump', icon: '⬆️', label: '跳跃', className: 'btn-jump' },
            { id: 'reload', icon: '🔄', label: '换弹', className: 'btn-reload' },
            { id: 'interact', icon: '✋', label: '互动', className: 'btn-interact' }
        ];

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'action-buttons';
        this.container.appendChild(buttonContainer);

        buttonConfigs.forEach(config => {
            const btn = document.createElement('button');
            btn.id = `btn-${config.id}`;
            btn.className = `action-btn ${config.className}`;
            btn.innerHTML = `<span class="btn-icon">${config.icon}</span>`;
            btn.setAttribute('data-action', config.id);

            // 触摸事件
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.inputState[config.id] = true;
                btn.classList.add('active');
                this.onButtonDown?.(config.id);
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.inputState[config.id] = false;
                btn.classList.remove('active');
                this.onButtonUp?.(config.id);
            });

            btn.addEventListener('touchcancel', () => {
                this.inputState[config.id] = false;
                btn.classList.remove('active');
                this.onButtonUp?.(config.id);
            });

            this.buttons[config.id] = btn;
            buttonContainer.appendChild(btn);
        });
    }

    /**
     * 显示控制器
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.enabled = true;
        }
    }

    /**
     * 隐藏控制器
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.enabled = false;
        }
    }

    /**
     * 显示/隐藏指定按钮
     * @param {string} buttonId - 按钮 ID
     * @param {boolean} visible - 是否显示
     */
    setButtonVisible(buttonId, visible) {
        const btn = this.buttons[buttonId];
        if (btn) {
            btn.style.display = visible ? 'flex' : 'none';
        }
    }

    /**
     * 设置按钮图标
     * @param {string} buttonId - 按钮 ID
     * @param {string} icon - 新图标
     */
    setButtonIcon(buttonId, icon) {
        const btn = this.buttons[buttonId];
        if (btn) {
            btn.querySelector('.btn-icon').textContent = icon;
        }
    }

    /**
     * 获取当前输入状态
     * @returns {Object}
     */
    getInputState() {
        return { ...this.inputState };
    }

    /**
     * 重置输入状态
     */
    resetInput() {
        this.inputState = {
            moveX: 0,
            moveY: 0,
            lookX: 0,
            lookY: 0,
            fire: false,
            jump: false,
            reload: false,
            interact: false
        };
    }

    /**
     * 销毁控制器
     */
    destroy() {
        if (this.moveJoystick) {
            this.moveJoystick.destroy();
            this.moveJoystick = null;
        }

        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        this.buttons = {};
        this.enabled = false;

        console.log('[VirtualController] 已销毁');
    }
}

// 导出单例
export const virtualController = new VirtualController();
export default virtualController;
