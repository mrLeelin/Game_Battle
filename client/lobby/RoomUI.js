/**
 * 房间界面 - 房间内 UI（玩家列表、准备、游戏选择）
 */
import { eventBus } from '../core/EventBus.js';
import { network } from '../core/Network.js';
import { lobbyManager } from './LobbyManager.js';
import { getGameList, getGameConfig } from '../../shared/GameTypes.js';

class RoomUI {
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
        this.bindRoomEvents();
        this.renderGameTypeSelector();
        console.log('[RoomUI] 初始化完成');
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
            roomStatus: document.getElementById('room-status')
        };
    }

    /**
     * 绑定 DOM 事件
     */
    bindEvents() {
        const { readyBtn, startBtn, leaveBtn, gameTypeSelector } = this.elements;

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
            this.elements.roomTitle.textContent = `房间: ${state.name}`;
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
            this.elements.roomScreen.style.display = 'flex';
            this.isVisible = true;
        }
    }

    /**
     * 隐藏房间界面
     */
    hide() {
        if (this.elements.roomScreen) {
            this.elements.roomScreen.style.display = 'none';
            this.isVisible = false;
        }
    }
}

export const roomUI = new RoomUI();
export default RoomUI;
