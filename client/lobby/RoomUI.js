/**
 * 房间界面 - 房间内 UI（玩家列表、准备、游戏选择）
 */
import { eventBus } from '../core/EventBus.js';
import { network } from '../core/Network.js';
import { lobbyManager } from './LobbyManager.js';
import { getGameList, getGameConfig } from '../../shared/GameTypes.js';
import { ScrollableList } from '../ui/ScrollableList.js';
import { transitionManager } from '../ui/TransitionManager.js';
import { avatarManager } from './AvatarManager.js';

class RoomUI {
    constructor() {
        this.elements = {};
        this.isVisible = false;
        // 弹幕 Y 轴位置追踪，避免重叠
        this.danmakuTrackCount = 10;
        this.nextTrack = 0;
        this.playerListScroller = null;
    }

    /**
     * 初始化 UI
     */
    init() {
        this.cacheElements();
        this.initScroller();
        this.bindEvents();
        this.bindRoomEvents();
        this.renderGameTypeSelector();
        console.log('[RoomUI] 初始化完成');
    }

    /**
     * 初始化滚动列表
     */
    initScroller() {
        if (this.elements.playerList) {
            this.playerListScroller = new ScrollableList(this.elements.playerList, {
                onRefresh: async () => {
                    // 模拟刷新玩家列表
                    await new Promise(resolve => setTimeout(resolve, 800));
                    // 实际项目中可以调用 lobbyManager.requestRoomInfo()
                },
                onLoadMore: async () => {
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
            roomScreen: document.getElementById('room-screen'),
            roomTitle: document.getElementById('room-title'),
            playerList: document.getElementById('player-list'),
            gameTypeSelector: document.getElementById('game-type-selector'),
            readyBtn: document.getElementById('ready-btn'),
            startBtn: document.getElementById('start-btn'),
            leaveBtn: document.getElementById('leave-btn'),
            roomStatus: document.getElementById('room-status'),
            // 用户头像
            roomAvatar: document.getElementById('room-avatar'),
            // 弹幕相关元素
            danmakuContainer: document.getElementById('danmaku-container'),
            danmakuInput: document.getElementById('danmaku-input'),
            danmakuSendBtn: document.getElementById('danmaku-send-btn')
        };
    }

    /**
     * 绑定 DOM 事件
     */
    bindEvents() {
        const { readyBtn, startBtn, leaveBtn, gameTypeSelector, danmakuSendBtn, danmakuInput } = this.elements;

        // 准备按钮
        readyBtn?.addEventListener('click', () => {
            lobbyManager.toggleReady();
        });

        // 开始按钮
        startBtn?.addEventListener('click', () => {
            lobbyManager.startGame();
        });

        // 离开按钮
        leaveBtn?.addEventListener('click', () => {
            lobbyManager.leaveRoom();
        });

        // 游戏类型选择
        gameTypeSelector?.addEventListener('change', (e) => {
            lobbyManager.setGameType(e.target.value);
        });

        // 弹幕发送按钮
        danmakuSendBtn?.addEventListener('click', () => {
            this.handleSendDanmaku();
        });

        // 弹幕输入框回车发送
        danmakuInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSendDanmaku();
            }
        });
    }

    /**
     * 绑定房间事件
     */
    bindRoomEvents() {
        // 显示房间界面
        eventBus.on('ui:showRoom', () => {
            this.show();
        });

        // 房间状态更新
        eventBus.on('room:stateUpdated', (state) => {
            this.updateRoomState(state);
        });

        // 游戏开始
        eventBus.on('room:gameStarting', (data) => {
            this.hide();
            eventBus.emit('game:start', data);
        });

        // 离开房间
        eventBus.on('room:left', () => {
            this.hide();
            this.clearDanmaku();
        });

        // 接收弹幕
        eventBus.on('room:danmakuReceived', (data) => {
            this.showDanmaku(data.text, data.playerName);
        });
    }

    /**
     * 渲染游戏类型选择器
     */
    renderGameTypeSelector() {
        const selector = this.elements.gameTypeSelector;
        if (!selector) return;

        selector.innerHTML = '<option value="">-- 选择游戏 --</option>';

        const games = getGameList();
        games.forEach(game => {
            const option = document.createElement('option');
            option.value = game.id;
            option.textContent = `${game.icon} ${game.name}`;
            option.title = game.description;
            selector.appendChild(option);
        });
    }

    /**
     * 更新房间状态
     * @param {Object} state - 房间状态
     */
    updateRoomState(state) {
        if (!state) return;

        const isHost = state.hostId === network.id;
        const myPlayer = state.players?.find(p => p.id === network.id);

        // 更新房间标题
        if (this.elements.roomTitle) {
            const title = `ROOM: ${state.name}`;
            this.elements.roomTitle.textContent = title;
            this.elements.roomTitle.setAttribute('data-text', title);
        }

        // 更新玩家列表
        this.renderPlayerList(state.players, state.hostId);

        // 更新游戏类型选择器（仅房主可用）
        if (this.elements.gameTypeSelector) {
            this.elements.gameTypeSelector.disabled = !isHost;
            if (state.gameType) {
                this.elements.gameTypeSelector.value = state.gameType;
            }
        }

        // 更新准备按钮
        if (this.elements.readyBtn) {
            this.elements.readyBtn.style.display = isHost ? 'none' : 'inline-block';
            this.elements.readyBtn.textContent = myPlayer?.ready ? '取消准备' : '准备';
            this.elements.readyBtn.className = myPlayer?.ready ? 'btn ready' : 'btn';
        }

        // 更新开始按钮
        if (this.elements.startBtn) {
            this.elements.startBtn.style.display = isHost ? 'inline-block' : 'none';
            this.elements.startBtn.disabled = !lobbyManager.canStartGame();
        }

        // 更新状态提示
        this.updateStatusText(state, isHost, myPlayer);
    }

    /**
     * 渲染玩家列表
     * @param {Array} players - 玩家列表
     * @param {string} hostId - 房主ID
     */
    renderPlayerList(players, hostId) {
        const listEl = this.elements.playerList;
        if (!listEl) return;

        listEl.innerHTML = '';

        players?.forEach(player => {
            const li = document.createElement('li');
            li.className = 'player-item';

            const isHost = player.id === hostId;
            const isMe = player.id === network.id;

            li.innerHTML = `
                <span class="player-name ${isMe ? 'me' : ''}">
                    ${player.name}
                    ${isHost ? '<span class="host-tag">房主</span>' : ''}
                </span>
                <span class="player-status ${player.ready ? 'ready' : ''}">
                    ${isHost ? '----' : (player.ready ? '已准备' : '未准备')}
                </span>
            `;

            listEl.appendChild(li);
        });
    }

    /**
     * 更新状态提示文本
     */
    updateStatusText(state, isHost, myPlayer) {
        const statusEl = this.elements.roomStatus;
        if (!statusEl) return;

        const playerCount = state.players?.length || 0;
        const othersReady = state.players
            ?.filter(p => p.id !== state.hostId)
            .every(p => p.ready);

        let statusText = '';

        if (!state.gameType) {
            statusText = isHost ? '请选择游戏类型' : '等待房主选择游戏...';
        } else if (playerCount < 2) {
            statusText = '等待更多玩家加入...';
        } else if (isHost) {
            statusText = othersReady ? '所有玩家已准备，可开始游戏！' : '等待玩家准备...';
        } else if (myPlayer?.ready) {
            statusText = '等待房主开始游戏...';
        } else {
            const gameConfig = getGameConfig(state.gameType);
            statusText = `即将游玩: ${gameConfig?.name || state.gameType}，请准备`;
        }

        statusEl.textContent = statusText;
    }

    /**
     * 显示房间界面
     */
    show() {
        if (this.elements.roomScreen) {
            // 先准备子元素的初始状态（隐藏）
            this.prepareChildElements();

            // 更新房间头像显示
            this.updateRoomAvatar();

            // 显示屏幕
            this.elements.roomScreen.style.display = 'flex';

            // 触发子元素动画
            requestAnimationFrame(() => {
                this.animateChildElements();
            });

            this.isVisible = true;
        }
    }

    /**
     * 更新房间界面头像显示
     */
    updateRoomAvatar() {
        if (this.elements.roomAvatar) {
            avatarManager.render(this.elements.roomAvatar);
        }
    }

    /**
     * 准备子元素的初始隐藏状态
     */
    prepareChildElements() {
        const screen = this.elements.roomScreen;
        if (!screen) return;

        const selectors = [
            '#room-user-info',
            '#room-title',
            '.game-selector',
            '#player-list',
            '#room-actions',
            '#room-status',
            '#danmaku-input-area'
        ];

        selectors.forEach(selector => {
            const el = screen.querySelector(selector);
            if (el) {
                el.style.opacity = '0';
            }
        });
    }

    /**
     * 为房间界面的子元素添加入场动画
     */
    animateChildElements() {
        const screen = this.elements.roomScreen;
        if (!screen) return;

        transitionManager.animateChildren([
            { selector: '#room-user-info', animation: 'slideFromLeft', delay: 0 },
            { selector: '#room-title', animation: 'slideDown', delay: 50 },
            { selector: '.game-selector', animation: 'scaleIn', delay: 150 },
            { selector: '#player-list', animation: 'slideUp', delay: 250 },
            { selector: '#room-actions', animation: 'slideUp', delay: 350 },
            { selector: '#room-status', animation: 'fadeUp', delay: 450 },
            { selector: '#danmaku-input-area', animation: 'slideUp', delay: 550 }
        ], screen);
    }

    /**
     * 隐藏房间界面
     */
    hide() {
        if (this.elements.roomScreen && this.elements.roomScreen.style.display !== 'none') {
            // 使用淡出动画（不使用整体横移）
            this.elements.roomScreen.classList.add('anim-zoom-out');

            const onEnd = () => {
                this.elements.roomScreen.style.display = 'none';
                this.elements.roomScreen.classList.remove('anim-zoom-out');
                this.elements.roomScreen.removeEventListener('animationend', onEnd);
            };
            this.elements.roomScreen.addEventListener('animationend', onEnd);

            this.isVisible = false;
        }
    }

    /**
     * 处理发送弹幕
     */
    handleSendDanmaku() {
        const input = this.elements.danmakuInput;
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        lobbyManager.sendDanmaku(text);
        input.value = '';
    }

    /**
     * 显示弹幕
     * @param {string} text - 弹幕文本
     * @param {string} playerName - 发送者名称
     */
    showDanmaku(text, playerName) {
        const container = this.elements.danmakuContainer;
        if (!container) return;

        // 创建弹幕元素
        const danmaku = document.createElement('div');
        danmaku.className = 'danmaku-item';
        danmaku.textContent = playerName ? `${playerName}: ${text}` : text;

        // 计算 Y 轴位置（轮询分配轨道，避免重叠）
        const trackHeight = container.offsetHeight / this.danmakuTrackCount;
        const topPosition = this.nextTrack * trackHeight;
        danmaku.style.top = `${topPosition}px`;

        // 更新下一个轨道
        this.nextTrack = (this.nextTrack + 1) % this.danmakuTrackCount;

        // 随机动画时长（8-12秒）
        const duration = 8 + Math.random() * 4;
        danmaku.style.animationDuration = `${duration}s`;

        container.appendChild(danmaku);

        // 动画结束后移除
        danmaku.addEventListener('animationend', () => {
            danmaku.remove();
        });
    }

    /**
     * 清空所有弹幕
     */
    clearDanmaku() {
        const container = this.elements.danmakuContainer;
        if (container) {
            container.innerHTML = '';
        }
        this.nextTrack = 0;
    }
}

export const roomUI = new RoomUI();
export default RoomUI;
