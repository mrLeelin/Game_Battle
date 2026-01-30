/**
 * 移动端适配器
 * 处理屏幕适配、安全区域、横竖屏等
 */
import { deviceDetector } from './DeviceDetector.js';

class MobileAdapter {
    constructor() {
        this.designWidth = 375;  // 设计稿宽度（竖屏基准）
        this.designHeight = 667; // 设计稿高度
        this.maxFontSize = 20;   // 最大根字体大小
        this.minFontSize = 12;   // 最小根字体大小
        this.baseFontSize = 16;  // 基准字体大小

        this._orientationLocked = false;
        this._orientationWarningEl = null;
        this._initialized = false;
    }

    /**
     * 初始化适配器
     * @param {Object} options - 配置选项
     */
    init(options = {}) {
        if (this._initialized) return;

        Object.assign(this, options);

        // 设置 rem 基准
        this._setRem();

        // 设置安全区域 CSS 变量
        this._setSafeArea();

        // 禁止双指缩放
        this._preventZoom();

        // 监听屏幕变化
        this._bindEvents();

        // 添加移动端标识类
        this._addDeviceClass();

        this._initialized = true;

        console.log('[MobileAdapter] 初始化完成', deviceDetector.getScreenInfo());
    }

    /**
     * 设置 rem 基准值
     */
    _setRem() {
        const docEl = document.documentElement;
        const clientWidth = docEl.clientWidth;

        // 根据屏幕宽度计算 rem 基准
        let fontSize = (clientWidth / this.designWidth) * this.baseFontSize;

        // 限制字体大小范围
        fontSize = Math.max(this.minFontSize, Math.min(this.maxFontSize, fontSize));

        docEl.style.fontSize = fontSize + 'px';

        // 同时设置 CSS 变量
        docEl.style.setProperty('--rem-base', fontSize + 'px');
        docEl.style.setProperty('--vw', clientWidth / 100 + 'px');
        docEl.style.setProperty('--vh', docEl.clientHeight / 100 + 'px');
    }

    /**
     * 设置安全区域 CSS 变量
     */
    _setSafeArea() {
        const docEl = document.documentElement;

        // 设置安全区域 CSS 变量（用于刘海屏适配）
        docEl.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
        docEl.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
        docEl.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
        docEl.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
    }

    /**
     * 禁止双指缩放和双击缩放
     */
    _preventZoom() {
        // 禁止双指缩放
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());

        // 禁止双击缩放（iOS）
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    /**
     * 绑定事件
     */
    _bindEvents() {
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this._setRem();
            this._checkOrientation();
        });

        // 监听屏幕方向变化
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this._setRem();
                this._checkOrientation();
            }, 100);
        });

        // 监听可视区域变化（处理虚拟键盘弹出）
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this._handleViewportChange();
            });
        }
    }

    /**
     * 添加设备标识类
     */
    _addDeviceClass() {
        const classList = document.documentElement.classList;

        if (deviceDetector.isMobile()) {
            classList.add('is-mobile');
        }
        if (deviceDetector.isTablet()) {
            classList.add('is-tablet');
        }
        if (deviceDetector.isTouchDevice()) {
            classList.add('is-touch');
        }
        if (deviceDetector.isIOS()) {
            classList.add('is-ios');
        }
        if (deviceDetector.isAndroid()) {
            classList.add('is-android');
        }
        if (deviceDetector.hasNotch()) {
            classList.add('has-notch');
        }
        if (deviceDetector.needsVirtualController()) {
            classList.add('needs-virtual-controller');
        }
    }

    /**
     * 锁定横屏方向
     * @param {boolean} showWarning - 是否在竖屏时显示提示
     */
    lockLandscape(showWarning = true) {
        this._orientationLocked = true;
        this._orientationWarningEnabled = showWarning;

        // 尝试使用 Screen Orientation API 锁定
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {
                // 锁定失败，使用提示方式
                console.log('[MobileAdapter] 屏幕方向锁定不支持，使用提示方式');
            });
        }

        this._checkOrientation();
    }

    /**
     * 解除方向锁定
     */
    unlockOrientation() {
        this._orientationLocked = false;
        this._hideOrientationWarning();

        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }

    /**
     * 检查屏幕方向
     */
    _checkOrientation() {
        if (!this._orientationLocked || !this._orientationWarningEnabled) return;

        if (deviceDetector.isPortrait() && deviceDetector.isMobile()) {
            this._showOrientationWarning();
        } else {
            this._hideOrientationWarning();
        }
    }

    /**
     * 显示横屏提示
     */
    _showOrientationWarning() {
        if (this._orientationWarningEl) return;

        this._orientationWarningEl = document.createElement('div');
        this._orientationWarningEl.id = 'orientation-warning';
        this._orientationWarningEl.innerHTML = `
            <div class="orientation-warning-content">
                <div class="orientation-icon">📱➡️📱</div>
                <div class="orientation-text">请将设备横屏以获得最佳体验</div>
            </div>
        `;
        document.body.appendChild(this._orientationWarningEl);
    }

    /**
     * 隐藏横屏提示
     */
    _hideOrientationWarning() {
        if (this._orientationWarningEl) {
            this._orientationWarningEl.remove();
            this._orientationWarningEl = null;
        }
    }

    /**
     * 处理可视区域变化（虚拟键盘）
     */
    _handleViewportChange() {
        const viewport = window.visualViewport;
        const docEl = document.documentElement;

        // 设置实际可视高度
        docEl.style.setProperty('--visual-vh', viewport.height / 100 + 'px');

        // 检测是否有键盘弹出
        const keyboardHeight = window.innerHeight - viewport.height;
        if (keyboardHeight > 100) {
            docEl.classList.add('keyboard-visible');
            docEl.style.setProperty('--keyboard-height', keyboardHeight + 'px');
        } else {
            docEl.classList.remove('keyboard-visible');
            docEl.style.setProperty('--keyboard-height', '0px');
        }
    }

    /**
     * 获取适配后的尺寸
     * @param {number} px - 设计稿像素值
     * @returns {number} - 适配后的像素值
     */
    px2Adapted(px) {
        const scale = document.documentElement.clientWidth / this.designWidth;
        return px * scale;
    }

    /**
     * 获取 rem 值
     * @param {number} px - 设计稿像素值
     * @returns {string} - rem 值
     */
    px2Rem(px) {
        return (px / this.baseFontSize) + 'rem';
    }

    /**
     * 获取 vw 值
     * @param {number} px - 设计稿像素值
     * @returns {string} - vw 值
     */
    px2Vw(px) {
        return (px / this.designWidth * 100) + 'vw';
    }
}

// 导出单例
export const mobileAdapter = new MobileAdapter();
export default mobileAdapter;
