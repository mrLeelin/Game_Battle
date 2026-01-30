/**
 * 设备检测工具
 * 用于检测设备类型、屏幕信息、触摸支持等
 */
class DeviceDetector {
    constructor() {
        this._cache = {};
        this._init();
    }

    /**
     * 初始化检测
     */
    _init() {
        // 缓存检测结果
        this._cache.isMobile = this._detectMobile();
        this._cache.isTablet = this._detectTablet();
        this._cache.isTouchDevice = this._detectTouch();
        this._cache.isIOS = this._detectIOS();
        this._cache.isAndroid = this._detectAndroid();
        this._cache.hasNotch = this._detectNotch();
    }

    /**
     * 检测是否为移动设备
     * @returns {boolean}
     */
    _detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
        return mobileRegex.test(userAgent.toLowerCase());
    }

    /**
     * 检测是否为平板设备
     * @returns {boolean}
     */
    _detectTablet() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
        return isTablet;
    }

    /**
     * 检测是否支持触摸
     * @returns {boolean}
     */
    _detectTouch() {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );
    }

    /**
     * 检测是否为 iOS 设备
     * @returns {boolean}
     */
    _detectIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * 检测是否为 Android 设备
     * @returns {boolean}
     */
    _detectAndroid() {
        return /android/i.test(navigator.userAgent);
    }

    /**
     * 检测是否有刘海屏（简单检测）
     * @returns {boolean}
     */
    _detectNotch() {
        // 通过 CSS 环境变量检测安全区域
        const div = document.createElement('div');
        div.style.paddingTop = 'env(safe-area-inset-top)';
        document.body.appendChild(div);
        const hasNotch = parseInt(getComputedStyle(div).paddingTop) > 0;
        document.body.removeChild(div);
        return hasNotch;
    }

    /**
     * 是否为移动设备
     * @returns {boolean}
     */
    isMobile() {
        return this._cache.isMobile;
    }

    /**
     * 是否为平板设备
     * @returns {boolean}
     */
    isTablet() {
        return this._cache.isTablet;
    }

    /**
     * 是否支持触摸
     * @returns {boolean}
     */
    isTouchDevice() {
        return this._cache.isTouchDevice;
    }

    /**
     * 是否为 iOS
     * @returns {boolean}
     */
    isIOS() {
        return this._cache.isIOS;
    }

    /**
     * 是否为 Android
     * @returns {boolean}
     */
    isAndroid() {
        return this._cache.isAndroid;
    }

    /**
     * 是否有刘海屏
     * @returns {boolean}
     */
    hasNotch() {
        return this._cache.hasNotch;
    }

    /**
     * 是否为横屏
     * @returns {boolean}
     */
    isLandscape() {
        return window.innerWidth > window.innerHeight;
    }

    /**
     * 是否为竖屏
     * @returns {boolean}
     */
    isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    /**
     * 获取屏幕信息
     * @returns {Object}
     */
    getScreenInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: this.isLandscape() ? 'landscape' : 'portrait',
            isMobile: this.isMobile(),
            isTablet: this.isTablet(),
            isTouchDevice: this.isTouchDevice(),
            isIOS: this.isIOS(),
            isAndroid: this.isAndroid(),
            hasNotch: this.hasNotch()
        };
    }

    /**
     * 是否需要显示虚拟控制器
     * @returns {boolean}
     */
    needsVirtualController() {
        return this.isTouchDevice() && (this.isMobile() || this.isTablet());
    }

    /**
     * 获取推荐的 UI 缩放比例
     * @returns {number}
     */
    getUIScale() {
        const baseWidth = 375; // 设计稿基准宽度
        const currentWidth = Math.min(window.innerWidth, window.innerHeight);
        return currentWidth / baseWidth;
    }
}

// 导出单例
export const deviceDetector = new DeviceDetector();
export default deviceDetector;
