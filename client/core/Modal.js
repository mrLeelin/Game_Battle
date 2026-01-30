/**
 * 自定义弹窗组件
 * 替代系统 alert/confirm，风格与游戏 UI 一致
 */
class Modal {
    constructor() {
        this._overlay = null;
        this._container = null;
        this._initialized = false;
        this._resolveCallback = null;
    }

    /**
     * 初始化弹窗容器
     */
    _init() {
        if (this._initialized) return;

        // 创建遮罩层
        this._overlay = document.createElement('div');
        this._overlay.id = 'modal-overlay';
        this._overlay.className = 'modal-overlay';

        // 创建弹窗容器
        this._container = document.createElement('div');
        this._container.id = 'modal-container';
        this._container.className = 'modal-container';

        this._overlay.appendChild(this._container);
        document.body.appendChild(this._overlay);

        // 点击遮罩关闭（可选）
        this._overlay.addEventListener('click', (e) => {
            if (e.target === this._overlay) {
                // 默认不关闭，需要点击按钮
            }
        });

        this._initialized = true;
    }

    /**
     * 显示弹窗
     * @param {Object} options - 配置选项
     * @param {string} options.title - 标题
     * @param {string} options.content - 内容（支持 HTML）
     * @param {Array} options.buttons - 按钮配置
     * @param {string} options.type - 弹窗类型：alert, confirm, prompt, loading
     * @param {boolean} options.showClose - 是否显示关闭按钮
     * @returns {Promise}
     */
    show(options = {}) {
        this._init();

        const {
            title = '',
            content = '',
            buttons = [],
            type = 'custom',
            showClose = false,
            inputValue = '',
            inputPlaceholder = ''
        } = options;

        return new Promise((resolve) => {
            this._resolveCallback = resolve;

            // 构建弹窗 HTML
            let html = `
                <div class="modal-content modal-${type}">
                    ${showClose ? '<button class="modal-close" data-action="close">×</button>' : ''}
                    ${title ? `<div class="modal-header"><h3 class="modal-title">${title}</h3></div>` : ''}
                    <div class="modal-body">
                        ${type === 'prompt' ? `
                            <p class="modal-message">${content}</p>
                            <input type="text" class="modal-input" id="modal-prompt-input"
                                   value="${inputValue}" placeholder="${inputPlaceholder}">
                        ` : `
                            <p class="modal-message">${content}</p>
                        `}
                        ${type === 'loading' ? '<div class="modal-spinner"></div>' : ''}
                    </div>
                    ${buttons.length > 0 ? `
                        <div class="modal-footer">
                            ${buttons.map((btn, index) => `
                                <button class="modal-btn modal-btn-${btn.type || 'default'}"
                                        data-action="${btn.action || 'close'}"
                                        data-index="${index}">
                                    ${btn.text}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;

            this._container.innerHTML = html;
            this._overlay.classList.add('show');

            // 聚焦输入框
            if (type === 'prompt') {
                setTimeout(() => {
                    const input = document.getElementById('modal-prompt-input');
                    if (input) {
                        input.focus();
                        input.select();
                    }
                }, 100);
            }

            // 绑定按钮事件
            this._container.querySelectorAll('.modal-btn, .modal-close').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    const index = parseInt(e.target.dataset.index);

                    if (type === 'prompt') {
                        const input = document.getElementById('modal-prompt-input');
                        const value = input ? input.value : '';
                        this._handleAction(action, index, buttons, value);
                    } else {
                        this._handleAction(action, index, buttons);
                    }
                });
            });

            // 回车键确认
            if (type === 'prompt') {
                const input = document.getElementById('modal-prompt-input');
                if (input) {
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const confirmBtn = buttons.find(b => b.action === 'confirm');
                            if (confirmBtn) {
                                this._handleAction('confirm', buttons.indexOf(confirmBtn), buttons, input.value);
                            }
                        }
                    });
                }
            }
        });
    }

    /**
     * 处理按钮动作
     */
    _handleAction(action, index, buttons, inputValue = null) {
        const button = buttons[index];

        // 执行回调
        if (button && button.onClick) {
            button.onClick(inputValue);
        }

        // 关闭弹窗
        this.hide();

        // 返回结果
        if (this._resolveCallback) {
            if (action === 'confirm') {
                this._resolveCallback(inputValue !== null ? inputValue : true);
            } else if (action === 'cancel' || action === 'close') {
                this._resolveCallback(inputValue !== null ? null : false);
            } else {
                this._resolveCallback({ action, index, value: inputValue });
            }
            this._resolveCallback = null;
        }
    }

    /**
     * 隐藏弹窗
     */
    hide() {
        if (this._overlay) {
            this._overlay.classList.remove('show');
        }
    }

    /**
     * 单按钮提示弹窗（替代 alert）
     * @param {string} message - 提示信息
     * @param {string} title - 标题（可选）
     * @param {string} buttonText - 按钮文字（默认"确定"）
     * @returns {Promise<void>}
     */
    alert(message, title = '提示', buttonText = '确定') {
        return this.show({
            type: 'alert',
            title,
            content: message,
            buttons: [
                { text: buttonText, type: 'primary', action: 'confirm' }
            ]
        });
    }

    /**
     * 双按钮确认弹窗（替代 confirm）
     * @param {string} message - 确认信息
     * @param {string} title - 标题（可选）
     * @param {Object} buttonTexts - 按钮文字配置
     * @returns {Promise<boolean>}
     */
    confirm(message, title = '确认', buttonTexts = {}) {
        const { confirm: confirmText = '确定', cancel: cancelText = '取消' } = buttonTexts;

        return this.show({
            type: 'confirm',
            title,
            content: message,
            buttons: [
                { text: cancelText, type: 'secondary', action: 'cancel' },
                { text: confirmText, type: 'primary', action: 'confirm' }
            ]
        });
    }

    /**
     * 输入弹窗（替代 prompt）
     * @param {string} message - 提示信息
     * @param {string} defaultValue - 默认值
     * @param {string} title - 标题
     * @param {string} placeholder - 占位符
     * @returns {Promise<string|null>}
     */
    prompt(message, defaultValue = '', title = '输入', placeholder = '') {
        return this.show({
            type: 'prompt',
            title,
            content: message,
            inputValue: defaultValue,
            inputPlaceholder: placeholder,
            buttons: [
                { text: '取消', type: 'secondary', action: 'cancel' },
                { text: '确定', type: 'primary', action: 'confirm' }
            ]
        });
    }

    /**
     * 显示加载中弹窗
     * @param {string} message - 加载提示
     */
    loading(message = '加载中...') {
        this.show({
            type: 'loading',
            content: message,
            buttons: []
        });
    }

    /**
     * 隐藏加载弹窗
     */
    hideLoading() {
        this.hide();
    }

    /**
     * 成功提示
     * @param {string} message - 提示信息
     * @param {string} title - 标题
     */
    success(message, title = '成功') {
        return this.alert(message, `✓ ${title}`);
    }

    /**
     * 错误提示
     * @param {string} message - 错误信息
     * @param {string} title - 标题
     */
    error(message, title = '错误') {
        return this.alert(message, `✗ ${title}`);
    }

    /**
     * 警告提示
     * @param {string} message - 警告信息
     * @param {string} title - 标题
     */
    warning(message, title = '警告') {
        return this.alert(message, `⚠ ${title}`);
    }
}

// 导出单例
export const modal = new Modal();
export default modal;
