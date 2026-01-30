/**
 * 头像选择器组件
 * 支持默认头像、相册选择、相机拍照
 */

// 默认头像列表
const DEFAULT_AVATARS = [
    '👤', '👨', '👩', '🧑', '👦', '👧',
    '🦊', '🐱', '🐶', '🐼', '🦁', '🐸',
    '🐯', '🐨', '🐰', '🦄', '🐲', '👾'
];

class AvatarPicker {
    constructor() {
        this.overlay = null;
        this.currentAvatar = null;
        this.onSelect = null;
        this.fileInput = null;
        this.cameraInput = null;
        this._init();
    }

    /**
     * 初始化 DOM
     */
    _init() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'avatar-picker-overlay';
        this.overlay.innerHTML = this._createHTML();
        document.body.appendChild(this.overlay);

        // 缓存元素
        this.container = this.overlay.querySelector('.avatar-picker-content');
        this.previewSection = this.overlay.querySelector('.avatar-preview-section');
        this.previewImage = this.overlay.querySelector('.avatar-preview-image');
        this.gridSection = this.overlay.querySelector('.avatar-grid-section');

        // 创建隐藏的文件输入
        this._createFileInputs();

        // 绑定事件
        this._bindEvents();
    }

    /**
     * 创建 HTML 结构
     */
    _createHTML() {
        const avatarGrid = DEFAULT_AVATARS.map(emoji =>
            `<div class="avatar-option" data-avatar="${emoji}">${emoji}</div>`
        ).join('');

        return `
            <div class="avatar-picker-container">
                <div class="avatar-picker-content">
                    <button class="avatar-picker-close">&times;</button>
                    <div class="avatar-picker-header">
                        <h3 class="avatar-picker-title">选择头像</h3>
                    </div>

                    <!-- 预览区域（选择图片后显示） -->
                    <div class="avatar-preview-section" style="display: none;">
                        <div class="avatar-preview-wrapper">
                            <img class="avatar-preview-image" src="" alt="预览">
                        </div>
                        <div class="avatar-preview-actions">
                            <button class="avatar-btn avatar-btn-secondary" id="avatar-reselect">重新选择</button>
                            <button class="avatar-btn avatar-btn-primary" id="avatar-confirm">确认使用</button>
                        </div>
                    </div>

                    <!-- 选择区域 -->
                    <div class="avatar-grid-section">
                        <div class="avatar-section-label">默认头像</div>
                        <div class="avatar-grid">
                            ${avatarGrid}
                        </div>

                        <div class="avatar-section-label">自定义头像</div>
                        <div class="avatar-custom-actions">
                            <button class="avatar-btn avatar-btn-default" id="avatar-album">
                                <span class="avatar-btn-icon">🖼️</span>
                                <span>从相册选择</span>
                            </button>
                            <button class="avatar-btn avatar-btn-default" id="avatar-camera">
                                <span class="avatar-btn-icon">📷</span>
                                <span>拍照</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建文件输入元素
     */
    _createFileInputs() {
        // 相册选择
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/*';
        this.fileInput.style.display = 'none';
        document.body.appendChild(this.fileInput);

        // 相机拍照
        this.cameraInput = document.createElement('input');
        this.cameraInput.type = 'file';
        this.cameraInput.accept = 'image/*';
        this.cameraInput.capture = 'user'; // 前置摄像头
        this.cameraInput.style.display = 'none';
        document.body.appendChild(this.cameraInput);
    }

    /**
     * 绑定事件
     */
    _bindEvents() {
        // 关闭按钮
        this.overlay.querySelector('.avatar-picker-close').addEventListener('click', () => {
            this.hide();
        });

        // 点击遮罩关闭
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // 默认头像选择
        this.overlay.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                const emoji = option.dataset.avatar;
                this._selectEmoji(emoji);
            });
        });

        // 从相册选择
        this.overlay.querySelector('#avatar-album').addEventListener('click', () => {
            this.fileInput.click();
        });

        // 拍照
        this.overlay.querySelector('#avatar-camera').addEventListener('click', () => {
            this.cameraInput.click();
        });

        // 文件选择处理
        this.fileInput.addEventListener('change', (e) => {
            this._handleFileSelect(e.target.files[0]);
            this.fileInput.value = ''; // 重置以便重复选择同一文件
        });

        this.cameraInput.addEventListener('change', (e) => {
            this._handleFileSelect(e.target.files[0]);
            this.cameraInput.value = '';
        });

        // 重新选择
        this.overlay.querySelector('#avatar-reselect').addEventListener('click', () => {
            this._showGridSection();
        });

        // 确认使用
        this.overlay.querySelector('#avatar-confirm').addEventListener('click', () => {
            this._confirmSelection();
        });
    }

    /**
     * 选择 emoji 头像
     */
    _selectEmoji(emoji) {
        this.currentAvatar = {
            type: 'emoji',
            data: emoji
        };

        if (this.onSelect) {
            this.onSelect(this.currentAvatar);
        }
        this.hide();
    }

    /**
     * 处理文件选择
     */
    async _handleFileSelect(file) {
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        try {
            // 压缩并转换为 base64
            const base64 = await this._compressImage(file);
            this.currentAvatar = {
                type: 'image',
                data: base64
            };

            // 显示预览
            this._showPreview(base64);
        } catch (error) {
            console.error('[AvatarPicker] 图片处理失败:', error);
            alert('图片处理失败，请重试');
        }
    }

    /**
     * 压缩图片
     * @param {File} file - 图片文件
     * @param {number} maxSize - 最大尺寸（像素）
     * @param {number} quality - 压缩质量 0-1
     * @returns {Promise<string>} base64 字符串
     */
    _compressImage(file, maxSize = 200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // 计算缩放尺寸
                    let { width, height } = img;
                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }

                    // 创建 canvas 进行压缩
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');

                    // 绘制圆形裁剪
                    ctx.beginPath();
                    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    // 绘制图片
                    ctx.drawImage(img, 0, 0, width, height);

                    // 转换为 base64
                    const base64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(base64);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * 显示预览
     */
    _showPreview(imageUrl) {
        this.previewImage.src = imageUrl;
        this.previewSection.style.display = 'block';
        this.gridSection.style.display = 'none';
    }

    /**
     * 显示选择网格
     */
    _showGridSection() {
        this.previewSection.style.display = 'none';
        this.gridSection.style.display = 'block';
        this.currentAvatar = null;
    }

    /**
     * 确认选择
     */
    _confirmSelection() {
        if (this.currentAvatar && this.onSelect) {
            this.onSelect(this.currentAvatar);
        }
        this.hide();
    }

    /**
     * 显示选择器
     * @param {Function} onSelect - 选择回调 (avatar) => void
     */
    show(onSelect) {
        this.onSelect = onSelect;
        this.currentAvatar = null;
        this._showGridSection();

        this.overlay.classList.add('show');

        // 入场动画
        requestAnimationFrame(() => {
            this.container.classList.add('show');
        });
    }

    /**
     * 隐藏选择器
     */
    hide() {
        this.container.classList.remove('show');

        setTimeout(() => {
            this.overlay.classList.remove('show');
        }, 300);
    }
}

// 导出单例
export const avatarPicker = new AvatarPicker();
export default avatarPicker;
