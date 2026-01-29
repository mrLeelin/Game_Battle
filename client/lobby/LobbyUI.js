/**
 * 大厅界面 - 登录和房间列表 UI
 */
import { eventBus } from '../core/EventBus.js';
import { lobbyManager } from './LobbyManager.js';
import { ROOM } from '../../shared/Constants.js';

class LobbyUI {
    constructor() {
        this.elements = {};
        this.isVisible = false;
    }

    /**
     * 初始化 UI
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindLobbyEvents();
        console.log('[LobbyUI] 初始化完成');
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
            createBtn: document.getElementById('create-btn')
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
            alert(data.reason || '加入房间失败');
            this.setCreateButtonEnabled(true);
        });

        // 离开房间
        eventBus.on('room:left', () => {
            this.showLobby();
        });
    }

    /**
     * 处理登录
     */
    handleLogin() {
        const name = this.elements.usernameInput?.value?.trim();
        if (!name) {
            alert('请输入用户名');
            return;
        }

        try {
            lobbyManager.setUsername(name);
            this.showLobby();
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * 处理创建房间
     */
    handleCreateRoom() {
        const name = this.elements.newRoomInput?.value?.trim();
        if (!name) {
            alert('请输入房间名称');
            return;
        }

        this.setCreateButtonEnabled(false);

        try {
            lobbyManager.createRoom(name);
            lobbyManager.joinRoom(name);
        } catch (error) {
            alert(error.message);
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
        this.hideAll();
        this.elements.loginScreen.style.display = 'flex';
        this.isVisible = true;
    }

    /**
     * 显示大厅界面
     */
    showLobby() {
        this.hideAll();
        this.elements.lobbyScreen.style.display = 'flex';
        this.isVisible = true;
        lobbyManager.requestRoomList();
    }

    /**
     * 隐藏所有界面
     */
    hideAll() {
        this.elements.loginScreen.style.display = 'none';
        this.elements.lobbyScreen.style.display = 'none';
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
