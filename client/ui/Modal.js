/**
 * 通用弹窗组件
 * 支持 Alert, Confirm, Prompt, Loading
 */
export class Modal {
    constructor() {
        this.overlay = null;
        this.currentResolve = null;
        this.init();
    }

    init() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        
        // 点击遮罩层关闭 (仅针对非阻塞弹窗)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay && this.overlay.dataset.closeable === 'true') {
                this.close(null);
            }
        });

        document.body.appendChild(this.overlay);
        
        // 绑定 ESC 关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('show') && this.overlay.dataset.closeable === 'true') {
                this.close(null);
            }
        });
    }

    /**
     * 显示弹窗
     * @param {Object} options 配置项
     * @returns {Promise}
     */
    show(options = {}) {
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            
            const {
                title = '提示',
                message = '',
                type = 'alert', // alert, confirm, prompt, loading
                placeholder = '',
                confirmText = '确定',
                cancelText = '取消',
                closeable = true
            } = options;

            this.overlay.dataset.closeable = String(closeable);
            this.overlay.innerHTML = '';
            
            const content = document.createElement('div');
            content.className = `modal-content modal-${type}`;
            
            // 头部
            if (title) {
                const header = document.createElement('div');
                header.className = 'modal-header';
                header.innerHTML = `<h3 class="modal-title">${title}</h3>`;
                
                if (closeable && type !== 'loading') {
                    const closeBtn = document.createElement('button');
                    closeBtn.className = 'modal-close';
                    closeBtn.innerHTML = '×';
                    closeBtn.onclick = () => this.close(null);
                    header.appendChild(closeBtn);
                }
                
                content.appendChild(header);
            }

            // 主体
            const body = document.createElement('div');
            body.className = 'modal-body';
            body.innerHTML = `<p class="modal-message">${message}</p>`;

            // 输入框 (Prompt)
            let inputEl = null;
            if (type === 'prompt') {
                inputEl = document.createElement('input');
                inputEl.type = 'text';
                inputEl.className = 'modal-input';
                inputEl.placeholder = placeholder;
                // 自动聚焦
                setTimeout(() => inputEl.focus(), 100);
                
                // 回车提交
                inputEl.onkeydown = (e) => {
                    if (e.key === 'Enter') this.close(inputEl.value);
                };
                
                body.appendChild(inputEl);
            }

            // 加载动画 (Loading)
            if (type === 'loading') {
                const spinner = document.createElement('div');
                spinner.className = 'modal-spinner';
                body.appendChild(spinner);
            }

            content.appendChild(body);

            // 底部按钮
            if (type !== 'loading') {
                const footer = document.createElement('div');
                footer.className = 'modal-footer';

                // 取消按钮 (Confirm/Prompt)
                if (type === 'confirm' || type === 'prompt') {
                    const cancelBtn = document.createElement('button');
                    cancelBtn.className = 'modal-btn modal-btn-secondary';
                    cancelBtn.textContent = cancelText;
                    cancelBtn.onclick = () => this.close(false); // Confirm返回false, Prompt返回null
                    footer.appendChild(cancelBtn);
                }

                // 确定按钮
                const confirmBtn = document.createElement('button');
                confirmBtn.className = 'modal-btn modal-btn-primary';
                confirmBtn.textContent = confirmText;
                confirmBtn.onclick = () => {
                    if (type === 'prompt') {
                        this.close(inputEl ? inputEl.value : '');
                    } else {
                        this.close(true);
                    }
                };
                
                footer.appendChild(confirmBtn);
                content.appendChild(footer);
            }

            this.overlay.appendChild(content);
            
            // 动画显示
            requestAnimationFrame(() => {
                this.overlay.classList.add('show');
            });
        });
    }

    /**
     * 关闭弹窗
     * @param {any} result 返回结果
     */
    close(result) {
        const content = this.overlay.querySelector('.modal-content');
        if (content) {
            content.classList.add('closing');
            
            // 等待动画结束
            setTimeout(() => {
                this._finishClose(result);
            }, 300);
        } else {
            this._finishClose(result);
        }
    }

    _finishClose(result) {
        this.overlay.classList.remove('show');
        this.overlay.innerHTML = ''; // 清理内容
        
        if (this.currentResolve) {
            this.currentResolve(result);
            this.currentResolve = null;
        }
    }

    // 快捷方法
    
    alert(message, title = '系统提示') {
        return this.show({ type: 'alert', title, message });
    }

    confirm(message, title = '确认操作') {
        return this.show({ type: 'confirm', title, message });
    }

    prompt(message, placeholder = '', title = '请输入') {
        return this.show({ type: 'prompt', title, message, placeholder });
    }

    loading(message = '加载中...') {
        this.show({ type: 'loading', title: '', message, closeable: false });
        return {
            close: () => this.close()
        };
    }
}

// 导出单例
export const modal = new Modal();
export default modal;
