/**
 * Toast 轻提示组件
 * 用于显示短暂的提示信息，自动消失
 */
class Toast {
    constructor() {
        this._container = null;
        this._queue = [];
        this._isShowing = false;
    }

    /**
     * 初始化容器
     */
    _init() {
        if (this._container) return;

        this._container = document.createElement('div');
        this._container.id = 'toast-container';
        this._container.className = 'toast-container';
        document.body.appendChild(this._container);
    }

    /**
     * 显示 Toast
     * @param {string} message - 提示信息
     * @param {Object} options - 配置选项
     * @param {number} options.duration - 显示时长（毫秒）
     * @param {string} options.type - 类型：info, success, error, warning
     * @param {string} options.position - 位置：top, center, bottom
     */
    show(message, options = {}) {
        this._init();

        const {
            duration = 2500,
            type = 'info',
            position = 'top'
        } = options;

        // 创建 Toast 元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} toast-${position}`;

        // 图标映射
        const icons = {
            info: 'ℹ',
            success: '✓',
            error: '✗',
            warning: '⚠'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || ''}</span>
            <span class="toast-message">${message}</span>
        `;

        this._container.appendChild(toast);

        // 触发动画
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 自动移除
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');

            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }

    /**
     * 信息提示
     */
    info(message, duration = 2500) {
        this.show(message, { type: 'info', duration });
    }

    /**
     * 成功提示
     */
    success(message, duration = 2500) {
        this.show(message, { type: 'success', duration });
    }

    /**
     * 错误提示
     */
    error(message, duration = 3000) {
        this.show(message, { type: 'error', duration });
    }

    /**
     * 警告提示
     */
    warning(message, duration = 3000) {
        this.show(message, { type: 'warning', duration });
    }
}

// 导出单例
export const toast = new Toast();
export default toast;
