/**
 * 头像管理器
 * 负责头像的存储、加载和更新
 */

const STORAGE_KEY = 'user_avatar';
const DEFAULT_AVATAR = '👤';

class AvatarManager {
    constructor() {
        this.currentAvatar = null;
        this._load();
    }

    /**
     * 从本地存储加载头像
     */
    _load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.currentAvatar = JSON.parse(stored);
            } else {
                this.currentAvatar = {
                    type: 'emoji',
                    data: DEFAULT_AVATAR
                };
            }
        } catch (error) {
            console.error('[AvatarManager] 加载头像失败:', error);
            this.currentAvatar = {
                type: 'emoji',
                data: DEFAULT_AVATAR
            };
        }
    }

    /**
     * 保存头像到本地存储
     * @param {Object} avatar - 头像对象 { type: 'emoji'|'image', data: string }
     */
    save(avatar) {
        try {
            this.currentAvatar = avatar;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(avatar));
            console.log('[AvatarManager] 头像已保存');
        } catch (error) {
            console.error('[AvatarManager] 保存头像失败:', error);
            // 如果存储失败（可能是配额超限），尝试只保存 emoji
            if (avatar.type === 'image') {
                console.warn('[AvatarManager] 图片头像存储失败，可能是存储空间不足');
            }
        }
    }

    /**
     * 获取当前头像
     * @returns {Object} 头像对象
     */
    get() {
        return this.currentAvatar || {
            type: 'emoji',
            data: DEFAULT_AVATAR
        };
    }

    /**
     * 重置为默认头像
     */
    reset() {
        this.currentAvatar = {
            type: 'emoji',
            data: DEFAULT_AVATAR
        };
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * 渲染头像到指定元素
     * @param {HTMLElement} element - 目标元素
     * @param {Object} avatar - 可选，指定头像对象，默认使用当前头像
     */
    render(element, avatar = null) {
        if (!element) return;

        const avatarData = avatar || this.currentAvatar;
        if (!avatarData) return;

        if (avatarData.type === 'emoji') {
            // emoji 头像
            element.innerHTML = avatarData.data;
            element.style.backgroundImage = '';
            element.classList.remove('has-image');
            element.classList.add('has-emoji');
        } else if (avatarData.type === 'image') {
            // 图片头像
            element.innerHTML = '';
            element.style.backgroundImage = `url(${avatarData.data})`;
            element.classList.remove('has-emoji');
            element.classList.add('has-image');
        }
    }

    /**
     * 创建头像 HTML 字符串
     * @param {Object} avatar - 可选，指定头像对象
     * @returns {string} HTML 字符串
     */
    createHTML(avatar = null) {
        const avatarData = avatar || this.currentAvatar;
        if (!avatarData) {
            return `<span class="avatar-emoji">${DEFAULT_AVATAR}</span>`;
        }

        if (avatarData.type === 'emoji') {
            return `<span class="avatar-emoji">${avatarData.data}</span>`;
        } else if (avatarData.type === 'image') {
            return `<img class="avatar-image" src="${avatarData.data}" alt="头像">`;
        }

        return `<span class="avatar-emoji">${DEFAULT_AVATAR}</span>`;
    }

    /**
     * 检查是否有自定义头像（非默认）
     * @returns {boolean}
     */
    hasCustomAvatar() {
        return this.currentAvatar &&
               (this.currentAvatar.type === 'image' ||
                this.currentAvatar.data !== DEFAULT_AVATAR);
    }
}

// 导出单例
export const avatarManager = new AvatarManager();
export default avatarManager;
