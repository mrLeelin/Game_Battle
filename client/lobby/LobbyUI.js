/**
 * 大厅界面 - 登录和房间列表 UI
 */
import { eventBus } from '../core/EventBus.js';
import { lobbyManager } from './LobbyManager.js';
import { ROOM } from '../../shared/Constants.js';
import { ScrollableList } from '../ui/ScrollableList.js';
import { modal } from '../ui/Modal.js';
import { transitionManager } from '../ui/TransitionManager.js';

class LobbyUI {
    constructor() {
        this.elements = {};
        this.isVisible = false;
        this.roomListScroller = null;
    }

    /**
     * 初始化 UI
     */
    init() {
        this.cacheElements();
        this.initScroller();
        this.bindEvents();
        this.bindLobbyEvents();
        console.log('[LobbyUI] 初始化完成');
    }

    /**
     * 初始化滚动列表
     */
    initScroller() {
        if (this.elements.roomList) {
            this.roomListScroller = new ScrollableList(this.elements.roomList, {
                onRefresh: async () => {
                    // 模拟网络延迟体验
                    await new Promise(resolve => setTimeout(resolve, 500));
                    lobbyManager.requestRoomList();
                    // 等待一会儿以确保数据返回
                    await new Promise(resolve => setTimeout(resolve, 500));
                },
                onLoadMore: async () => {
                    console.log('Load more rooms...');
                    await new Promise(resolve => setTimeout(resolve, 800));
                    return false;
                }
            });
        }
    }

    /**
     * 缓存 DOM 元素
     */
    cacheElements() {
        this.elements = {
            // 登录界面
            loginScreen: document.getElementById('login-screen'),
            usernameInput: document.getElementById('username-input'),
            loginBtn: document.getElementById('login-btn'),

            // 大厅界面
            lobbyScreen: document.getElementById('lobby-screen'),
            roomList: document.getElementById('room-list'),
            newRoomInput: document.getElementById('new-room-name'),
            createBtn: document.getElementById('create-btn'),

            // 用户信息显示
            userName: document.getElementById('user-name'),
            roomUserName: document.getElementById('room-user-name')
        };
    }

    /**
     * 绑定 DOM 事件
     */
    bindEvents() {
        const { usernameInput, loginBtn, newRoomInput, createBtn } = this.elements;

        // 登录按钮
        loginBtn?.addEventListener('click', () => this.handleLogin());
        usernameInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // 创建房间按钮
        createBtn?.addEventListener('click', () => this.handleCreateRoom());
        newRoomInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleCreateRoom();
        });
    }

    /**
     * 绑定大厅事件
     */
    bindLobbyEvents() {
        // 房间列表更新
        eventBus.on('lobby:roomListUpdated', (rooms) => {
            this.renderRoomList(rooms);
        });

        // 加入房间成功
        eventBus.on('lobby:joinedRoom', () => {
            this.hide();
            eventBus.emit('ui:showRoom');
        });

        // 加入失败
        eventBus.on('lobby:joinFailed', (data) => {
            modal.alert(data.reason || '加入房间失败', 'ERROR');
            this.setCreateButtonEnabled(true);
        });

        // 离开房间
        eventBus.on('room:left', () => {
            this.showLobby(true);
        });
    }

    /**
     * 处理登录
     */
    handleLogin() {
        const name = this.elements.usernameInput?.value?.trim();
        if (!name) {
            modal.alert('请输入用户名', '提示');
            return;
        }

        try {
            lobbyManager.setUsername(name);
            // 更新用户名显示
            this.updateUserNameDisplay(name);
            this.showLobby();
        } catch (error) {
            modal.alert(error.message, 'ERROR');
        }
    }

    /**
     * 更新用户名显示
     * @param {string} name - 用户名
     */
    updateUserNameDisplay(name) {
        if (this.elements.userName) {
            this.elements.userName.textContent = name;
        }
        if (this.elements.roomUserName) {
            this.elements.roomUserName.textContent = name;
        }
    }

    /**
     * 处理创建房间
     */
    handleCreateRoom() {
        const name = this.elements.newRoomInput?.value?.trim();
        if (!name) {
            modal.alert('请输入房间名称', '提示');
            return;
        }

        this.setCreateButtonEnabled(false);

        try {
            lobbyManager.createRoom(name);
            lobbyManager.joinRoom(name);
        } catch (error) {
            modal.alert(error.message, 'ERROR');
            this.setCreateButtonEnabled(true);
        }
    }

    /**
     * 渲染房间列表
     * @param {Array} rooms - 房间列表
     */
    renderRoomList(rooms) {
        const listEl = this.elements.roomList;
        if (!listEl) return;

        listEl.innerHTML = '';

        if (!rooms || rooms.length === 0) {
            listEl.innerHTML = '<li class="empty">暂无房间，创建一个吧！</li>';
            return;
        }

        rooms.forEach(room => {
            const li = document.createElement('li');
            li.className = 'room-item';

            const canJoin = lobbyManager.canJoinRoom(room);
            const statusClass = room.status === ROOM.STATUS.RUNNING ? 'running' : 'waiting';
            const statusText = room.status === ROOM.STATUS.RUNNING ? '游戏中' : '等待中';

            li.innerHTML = `
                <div class="room-info">
                    <span class="room-name">${room.name}</span>
                    <span class="room-players">${room.playerCount}/${ROOM.MAX_PLAYERS}</span>
                    <span class="room-status ${statusClass}">${statusText}</span>
                </div>
                <button class="join-btn" data-room-id="${room.id}" ${canJoin ? '' : 'disabled'}>
                    ${canJoin ? '加入' : '已满'}
                </button>
            `;

            // 加入按钮事件
            const joinBtn = li.querySelector('.join-btn');
            if (joinBtn && canJoin) {
                joinBtn.addEventListener('click', () => {
                    lobbyManager.joinRoom(room.id);
                });
            }

            listEl.appendChild(li);
        });
    }

    /**
     * 显示登录界面
     */
    showLogin() {
        // 如果当前在大厅，则退出大厅
        if (this.isVisible && this.elements.lobbyScreen.style.display !== 'none') {
            // 大厅淡出
            this.elements.lobbyScreen.classList.add('anim-zoom-out');
            const onEnd = () => {
                this.elements.lobbyScreen.style.display = 'none';
                this.elements.lobbyScreen.classList.remove('anim-zoom-out');
                this.elements.lobbyScreen.removeEventListener('animationend', onEnd);
            };
            this.elements.lobbyScreen.addEventListener('animationend', onEnd);

            // 准备登录界面子元素
            this.prepareLoginElements();

            // 显示登录界面
            this.elements.loginScreen.style.display = 'flex';

            // 触发动画
            requestAnimationFrame(() => {
                this.animateLoginElements();
            });
        } else {
            // 直接显示（初始化时）- 不做动画
            this.elements.loginScreen.style.display = 'flex';
        }

        this.isVisible = true;
    }

    /**
     * 准备登录子元素的初始隐藏状态
     */
    prepareLoginElements() {
        const screen = this.elements.loginScreen;
        if (!screen) return;

        const selectors = ['h1', '.panel'];
        selectors.forEach(selector => {
            const el = screen.querySelector(selector);
            if (el) {
                el.style.opacity = '0';
            }
        });
    }

    /**
     * 为登录界面的子元素添加入场动画
     */
    animateLoginElements() {
        const screen = this.elements.loginScreen;
        if (!screen) return;

        transitionManager.animateChildren([
            { selector: 'h1', animation: 'slideDown', delay: 100 },
            { selector: '.panel', animation: 'scaleIn', delay: 250 }
        ], screen);
    }

    /**
     * 显示大厅界面
     * @param {boolean} fromRoom - 是否是从房间返回
     */
    showLobby(fromRoom = false) {
        // 隐藏登录界面（如果可见）
        if (this.elements.loginScreen && this.elements.loginScreen.style.display !== 'none') {
            this.elements.loginScreen.classList.add('anim-zoom-out');
            const onEnd = () => {
                this.elements.loginScreen.style.display = 'none';
                this.elements.loginScreen.classList.remove('anim-zoom-out');
                this.elements.loginScreen.removeEventListener('animationend', onEnd);
            };
            this.elements.loginScreen.addEventListener('animationend', onEnd);
        }

        // 先准备子元素的初始状态
        this.prepareLobbyElements();

        // 显示大厅界面
        this.elements.lobbyScreen.style.display = 'flex';

        // 触发子元素动画
        requestAnimationFrame(() => {
            this.animateLobbyElements();
        });

        this.isVisible = true;
        this.setCreateButtonEnabled(true);
        if (this.elements.newRoomInput) {
            this.elements.newRoomInput.value = '';
        }
        lobbyManager.requestRoomList();
    }

    /**
     * 准备大厅子元素的初始隐藏状态
     */
    prepareLobbyElements() {
        const screen = this.elements.lobbyScreen;
        if (!screen) return;

        const selectors = ['#user-info', 'h1', '#room-controls', 'h3', '#room-list'];
        selectors.forEach(selector => {
            const el = screen.querySelector(selector);
            if (el) {
                el.style.opacity = '0';
            }
        });
    }

    /**
     * 为大厅界面的子元素添加入场动画
     */
    animateLobbyElements() {
        const screen = this.elements.lobbyScreen;
        if (!screen) return;

        transitionManager.animateChildren([
            { selector: '#user-info', animation: 'slideFromLeft', delay: 0 },
            { selector: 'h1', animation: 'slideDown', delay: 50 },
            { selector: '#room-controls', animation: 'slideFromRight', delay: 150 },
            { selector: 'h3', animation: 'fadeUp', delay: 250 },
            { selector: '#room-list', animation: 'slideUp', delay: 350 }
        ], screen);
    }

    /**
     * 隐藏所有界面 (用于进入房间时)
     */
    hideAll() {
        // 大厅淡出（不使用整体滑动）
        if (this.elements.lobbyScreen && this.elements.lobbyScreen.style.display !== 'none') {
            this.elements.lobbyScreen.classList.add('anim-zoom-out');

            const onEnd = () => {
                this.elements.lobbyScreen.style.display = 'none';
                this.elements.lobbyScreen.classList.remove('anim-zoom-out');
                this.elements.lobbyScreen.removeEventListener('animationend', onEnd);
            };
            this.elements.lobbyScreen.addEventListener('animationend', onEnd);
        }

        // 登录界面淡出
        if (this.elements.loginScreen && this.elements.loginScreen.style.display !== 'none') {
            this.elements.loginScreen.classList.add('anim-zoom-out');

            const onEnd = () => {
                this.elements.loginScreen.style.display = 'none';
                this.elements.loginScreen.classList.remove('anim-zoom-out');
                this.elements.loginScreen.removeEventListener('animationend', onEnd);
            };
            this.elements.loginScreen.addEventListener('animationend', onEnd);
        }
    }

    /**
     * 隐藏大厅 UI
     */
    hide() {
        this.hideAll();
        this.isVisible = false;
    }

    /**
     * 设置创建按钮可用状态
     * @param {boolean} enabled
     */
    setCreateButtonEnabled(enabled) {
        if (this.elements.createBtn) {
            this.elements.createBtn.disabled = !enabled;
            this.elements.createBtn.textContent = enabled ? '创建/加入' : '加入中...';
        }
    }
}

export const lobbyUI = new LobbyUI();
export default LobbyUI;
