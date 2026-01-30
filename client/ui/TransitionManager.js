/**
 * 界面过渡动画管理器
 * 提供统一的屏幕切换动画控制
 */

// 动画类型配置
const TRANSITIONS = {
    // 缩放模糊 - 登录/大厅
    zoom: {
        enter: 'anim-zoom-in',
        exit: 'anim-zoom-out',
        duration: 600
    },
    // 滑动 - 进入房间
    slideRight: {
        enter: 'anim-slide-in-right',
        exit: 'anim-slide-out-left',
        duration: 500
    },
    // 滑动 - 离开房间
    slideLeft: {
        enter: 'anim-slide-in-left',
        exit: 'anim-slide-out-right',
        duration: 500
    },
    // 故障效果 - 特殊切换
    glitch: {
        enter: 'anim-glitch-in',
        exit: 'anim-glitch-out',
        duration: 600
    },
    // 扭曲效果 - 空间跳跃
    warp: {
        enter: 'anim-warp-in',
        exit: 'anim-warp-out',
        duration: 700
    },
    // 扫描效果 - 启动感
    scan: {
        enter: 'anim-scan-in',
        exit: 'anim-zoom-out',
        duration: 800
    }
};

// 所有动画类名列表（用于清理）
const ALL_ANIMATION_CLASSES = [
    'anim-zoom-in', 'anim-zoom-out',
    'anim-slide-in-right', 'anim-slide-out-left',
    'anim-slide-in-left', 'anim-slide-out-right',
    'anim-glitch-in', 'anim-glitch-out',
    'anim-warp-in', 'anim-warp-out',
    'anim-scan-in',
    'anim-flash', 'anim-pulse-border',
    'anim-fade-up', 'anim-neon-breathe',
    'anim-slide-up', 'anim-slide-down',
    'anim-slide-from-left', 'anim-slide-from-right',
    'anim-scale-in', 'anim-scale-down', 'anim-rotate-in',
    'fade-out',
    'delay-1', 'delay-2', 'delay-3', 'delay-4',
    'delay-5', 'delay-6', 'delay-7', 'delay-8'
];

// 子元素动画类型
const CHILD_ANIMATIONS = {
    slideUp: 'anim-slide-up',
    slideDown: 'anim-slide-down',
    slideFromLeft: 'anim-slide-from-left',
    slideFromRight: 'anim-slide-from-right',
    scaleIn: 'anim-scale-in',
    scaleDown: 'anim-scale-down',
    rotateIn: 'anim-rotate-in',
    fadeUp: 'anim-fade-up'
};

class TransitionManager {
    constructor() {
        this._isTransitioning = false;
    }

    /**
     * 清理元素上的所有动画类
     * @param {HTMLElement} element
     */
    clearAnimations(element) {
        if (!element) return;
        element.classList.remove(...ALL_ANIMATION_CLASSES);
    }

    /**
     * 执行屏幕切换
     * @param {HTMLElement} enterScreen - 要进入的屏幕
     * @param {HTMLElement} exitScreen - 要退出的屏幕
     * @param {string} type - 动画类型: 'zoom', 'slideRight', 'slideLeft', 'glitch', 'warp', 'scan'
     * @returns {Promise} 动画完成后 resolve
     */
    async transition(enterScreen, exitScreen, type = 'zoom') {
        if (this._isTransitioning) {
            console.warn('[TransitionManager] 动画进行中，忽略新请求');
            return;
        }

        const config = TRANSITIONS[type] || TRANSITIONS.zoom;
        this._isTransitioning = true;

        const promises = [];

        // 处理退出屏幕
        if (exitScreen && exitScreen.style.display !== 'none') {
            promises.push(this._animateOut(exitScreen, config.exit, config.duration));
        }

        // 处理进入屏幕
        if (enterScreen) {
            promises.push(this._animateIn(enterScreen, config.enter, config.duration));
        }

        await Promise.all(promises);
        this._isTransitioning = false;
    }

    /**
     * 进入动画
     * @private
     */
    _animateIn(element, animClass, duration) {
        return new Promise(resolve => {
            // 清理旧动画
            this.clearAnimations(element);

            // 显示元素
            element.style.display = 'flex';

            // 强制重排
            void element.offsetHeight;

            // 添加动画类
            element.classList.add(animClass);

            // 动画结束后清理
            const onEnd = () => {
                element.removeEventListener('animationend', onEnd);
                resolve();
            };
            element.addEventListener('animationend', onEnd);

            // 超时保护
            setTimeout(() => {
                element.removeEventListener('animationend', onEnd);
                resolve();
            }, duration + 100);
        });
    }

    /**
     * 退出动画
     * @private
     */
    _animateOut(element, animClass, duration) {
        return new Promise(resolve => {
            // 清理旧动画
            this.clearAnimations(element);

            // 添加退出动画
            element.classList.add(animClass);

            const onEnd = () => {
                element.style.display = 'none';
                this.clearAnimations(element);
                element.removeEventListener('animationend', onEnd);
                resolve();
            };
            element.addEventListener('animationend', onEnd);

            // 超时保护
            setTimeout(() => {
                element.style.display = 'none';
                this.clearAnimations(element);
                element.removeEventListener('animationend', onEnd);
                resolve();
            }, duration + 100);
        });
    }

    /**
     * 播放闪光效果
     * @param {HTMLElement} element
     * @param {number} duration - 持续时间（毫秒）
     */
    flash(element = document.body, duration = 400) {
        element.classList.add('anim-flash');
        setTimeout(() => {
            element.classList.remove('anim-flash');
        }, duration);
    }

    /**
     * 添加脉冲边框效果
     * @param {HTMLElement} element
     */
    addPulseBorder(element) {
        element.classList.add('anim-pulse-border');
    }

    /**
     * 移除脉冲边框效果
     * @param {HTMLElement} element
     */
    removePulseBorder(element) {
        element.classList.remove('anim-pulse-border');
    }

    /**
     * 添加霓虹呼吸效果
     * @param {HTMLElement} element
     */
    addNeonBreathe(element) {
        element.classList.add('anim-neon-breathe');
    }

    /**
     * 移除霓虹呼吸效果
     * @param {HTMLElement} element
     */
    removeNeonBreathe(element) {
        element.classList.remove('anim-neon-breathe');
    }

    /**
     * 为子元素添加渐入效果
     * @param {HTMLElement} container - 容器元素
     * @param {string} selector - 子元素选择器
     * @param {number} stagger - 每个元素的延迟间隔（毫秒）
     */
    staggerFadeIn(container, selector = '*', stagger = 100) {
        const children = container.querySelectorAll(selector);
        children.forEach((child, index) => {
            const delay = index * stagger;

            child.style.animationDelay = `${delay}ms`;
            child.classList.add('anim-fade-up');

            const onEnd = () => {
                child.style.animationDelay = '';
                child.classList.remove('anim-fade-up');
                child.removeEventListener('animationend', onEnd);
            };
            child.addEventListener('animationend', onEnd);

            // 超时保护
            setTimeout(() => {
                child.style.animationDelay = '';
                child.classList.remove('anim-fade-up');
                child.removeEventListener('animationend', onEnd);
            }, delay + 600);
        });
    }

    /**
     * 为多个子元素配置不同的入场动画
     * @param {Array<Object>} configs - 动画配置数组
     * @param {string} configs[].selector - CSS 选择器
     * @param {string} configs[].animation - 动画类型: slideUp, slideDown, slideFromLeft, slideFromRight, scaleIn, scaleDown, rotateIn, fadeUp
     * @param {number} configs[].delay - 延迟时间（毫秒）
     * @param {HTMLElement} container - 容器元素（默认 document）
     */
    animateChildren(configs, container = document) {
        configs.forEach(config => {
            const elements = container.querySelectorAll(config.selector);
            const animClass = CHILD_ANIMATIONS[config.animation] || CHILD_ANIMATIONS.fadeUp;
            const delay = config.delay || 0;

            elements.forEach(el => {
                // 清理旧动画
                this.clearChildAnimation(el);

                // 先设置初始隐藏状态
                el.style.opacity = '0';
                el.style.animationDelay = `${delay}ms`;

                // 强制重排，确保初始状态生效
                void el.offsetHeight;

                // 添加动画类
                el.classList.add(animClass);

                // 动画结束后清理
                const onEnd = () => {
                    el.style.opacity = '';
                    el.style.animationDelay = '';
                    el.classList.remove(animClass);
                    el.removeEventListener('animationend', onEnd);
                };
                el.addEventListener('animationend', onEnd);

                // 超时保护：确保元素最终可见
                setTimeout(() => {
                    el.style.opacity = '';
                    el.style.animationDelay = '';
                    el.classList.remove(animClass);
                    el.removeEventListener('animationend', onEnd);
                }, delay + 800);
            });
        });
    }

    /**
     * 清理子元素的动画类
     * @param {HTMLElement} element
     */
    clearChildAnimation(element) {
        if (!element) return;
        Object.values(CHILD_ANIMATIONS).forEach(cls => {
            element.classList.remove(cls);
        });
        element.style.opacity = '';
        element.style.animationDelay = '';
    }

    /**
     * 批量为容器内的子元素添加交错动画
     * @param {HTMLElement} container - 容器元素
     * @param {string} selector - 子元素选择器
     * @param {string} animation - 动画类型
     * @param {number} stagger - 每个元素的延迟间隔（毫秒）
     * @param {number} baseDelay - 基础延迟（毫秒）
     */
    staggerChildren(container, selector, animation = 'slideUp', stagger = 50, baseDelay = 0) {
        const children = container.querySelectorAll(selector);
        const animClass = CHILD_ANIMATIONS[animation] || CHILD_ANIMATIONS.slideUp;

        children.forEach((child, index) => {
            // 清理旧动画
            this.clearChildAnimation(child);

            const delay = baseDelay + index * stagger;

            // 设置动画延迟
            child.style.animationDelay = `${delay}ms`;

            // 强制重排
            void child.offsetHeight;

            // 添加动画类
            child.classList.add(animClass);

            // 动画结束后清理
            const onEnd = () => {
                child.style.animationDelay = '';
                child.classList.remove(animClass);
                child.removeEventListener('animationend', onEnd);
            };
            child.addEventListener('animationend', onEnd);

            // 超时保护
            setTimeout(() => {
                child.style.animationDelay = '';
                child.classList.remove(animClass);
                child.removeEventListener('animationend', onEnd);
            }, delay + 600);
        });
    }

    /**
     * 检查是否正在过渡
     */
    get isTransitioning() {
        return this._isTransitioning;
    }
}

// 导出单例
export const transitionManager = new TransitionManager();
export default transitionManager;
