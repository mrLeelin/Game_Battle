/**
 * 抢球大战 - UI管理
 * 显示分数、倒计时、结算界面
 */
import { TEAMS } from './BallGame.js';

export class BallGameUI {
    constructor() {
        this.container = null;
        this.localTeamId = 0;
    }

    /**
     * 初始化UI
     */
    init() {
        // 创建UI容器
        this.container = document.createElement('div');
        this.container.id = 'ballgame-ui';
        this.container.innerHTML = this.getTemplate();
        document.body.appendChild(this.container);

        // 添加样式
        this.addStyles();
    }

    /**
     * 获取UI模板
     */
    getTemplate() {
        return `
            <!-- 倒计时 -->
            <div class="bg-countdown">
                <span class="bg-countdown-value">60</span>
            </div>

            <!-- 分数板 -->
            <div class="bg-scoreboard">
                <div class="bg-team-score" data-team="0">
                    <span class="bg-team-color" style="background:#ff4444"></span>
                    <span class="bg-team-name">红队</span>
                    <span class="bg-score">0</span>
                </div>
                <div class="bg-team-score" data-team="1">
                    <span class="bg-team-color" style="background:#4444ff"></span>
                    <span class="bg-team-name">蓝队</span>
                    <span class="bg-score">0</span>
                </div>
                <div class="bg-team-score" data-team="2">
                    <span class="bg-team-color" style="background:#44ff44"></span>
                    <span class="bg-team-name">绿队</span>
                    <span class="bg-score">0</span>
                </div>
                <div class="bg-team-score" data-team="3">
                    <span class="bg-team-color" style="background:#ffff44"></span>
                    <span class="bg-team-name">黄队</span>
                    <span class="bg-score">0</span>
                </div>
            </div>

            <!-- 消息提示 -->
            <div class="bg-message" style="display:none"></div>

            <!-- 操作提示 -->
            <div class="bg-controls">
                <div class="bg-control-hint">WASD/摇杆 移动 | 空格/按钮 捡球/放球</div>
            </div>

            <!-- 结算界面 -->
            <div class="bg-result" style="display:none">
                <div class="bg-result-content">
                    <h2 class="bg-result-title">游戏结束</h2>
                    <div class="bg-result-winner"></div>
                    <div class="bg-result-scores"></div>
                    <button class="bg-result-btn" onclick="location.reload()">返回大厅</button>
                </div>
            </div>
        `;
    }

    /**
     * 添加样式
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #ballgame-ui {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                font-family: 'Orbitron', 'Rajdhani', sans-serif;
                z-index: 100;
            }

            /* 倒计时 */
            .bg-countdown {
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                padding: 10px 30px;
                border: 2px solid #00f2ff;
                border-radius: 5px;
            }

            .bg-countdown-value {
                font-size: 48px;
                font-weight: bold;
                color: #00f2ff;
                text-shadow: 0 0 10px #00f2ff;
            }

            /* 分数板 */
            .bg-scoreboard {
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .bg-team-score {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(0, 0, 0, 0.6);
                padding: 8px 15px;
                border-radius: 5px;
                border-left: 4px solid transparent;
            }

            .bg-team-score.local {
                border-left-color: #00f2ff;
                box-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
            }

            .bg-team-color {
                width: 16px;
                height: 16px;
                border-radius: 50%;
            }

            .bg-team-name {
                color: #fff;
                font-size: 14px;
                min-width: 50px;
            }

            .bg-score {
                color: #fff;
                font-size: 24px;
                font-weight: bold;
                min-width: 30px;
                text-align: right;
            }

            /* 消息提示 */
            .bg-message {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
                padding: 15px 40px;
                font-size: 24px;
                border-radius: 10px;
                animation: messagePopup 0.3s ease-out;
            }

            .bg-message.success {
                color: #44ff44;
                border: 2px solid #44ff44;
            }

            @keyframes messagePopup {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }

            /* 操作提示 */
            .bg-controls {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.5);
                padding: 10px 20px;
                border-radius: 5px;
            }

            .bg-control-hint {
                color: #888;
                font-size: 14px;
            }

            /* 结算界面 */
            .bg-result {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: auto;
            }

            .bg-result-content {
                text-align: center;
                color: #fff;
            }

            .bg-result-title {
                font-size: 48px;
                margin-bottom: 30px;
                color: #00f2ff;
                text-shadow: 0 0 20px #00f2ff;
            }

            .bg-result-winner {
                font-size: 36px;
                margin-bottom: 30px;
            }

            .bg-result-winner.win {
                color: #44ff44;
            }

            .bg-result-winner.lose {
                color: #ff4444;
            }

            .bg-result-scores {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-bottom: 40px;
            }

            .bg-result-team {
                background: rgba(255, 255, 255, 0.1);
                padding: 15px 25px;
                border-radius: 10px;
            }

            .bg-result-team.winner {
                border: 2px solid #44ff44;
                box-shadow: 0 0 15px rgba(68, 255, 68, 0.5);
            }

            .bg-result-btn {
                padding: 15px 40px;
                font-size: 18px;
                background: #00f2ff;
                color: #000;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-family: inherit;
                font-weight: bold;
                transition: all 0.2s;
            }

            .bg-result-btn:hover {
                background: #fff;
                box-shadow: 0 0 20px #00f2ff;
            }

            /* 移动端适配 */
            @media (max-width: 768px) {
                .bg-countdown-value { font-size: 32px; }
                .bg-scoreboard { top: 80px; right: 10px; }
                .bg-team-score { padding: 5px 10px; }
                .bg-score { font-size: 18px; }
                .bg-controls { display: none; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 设置本地队伍
     */
    setLocalTeam(teamId) {
        this.localTeamId = teamId;
        const teamEl = this.container.querySelector(`[data-team="${teamId}"]`);
        if (teamEl) {
            teamEl.classList.add('local');
        }
    }

    /**
     * 更新分数
     */
    updateScores(scores) {
        scores.forEach((score, teamId) => {
            const scoreEl = this.container.querySelector(`[data-team="${teamId}"] .bg-score`);
            if (scoreEl) {
                scoreEl.textContent = score;
            }
        });
    }

    /**
     * 更新倒计时
     */
    updateCountdown(time) {
        const el = this.container.querySelector('.bg-countdown-value');
        if (el) {
            el.textContent = time;

            // 最后10秒变红
            if (time <= 10) {
                el.style.color = '#ff4444';
                el.style.textShadow = '0 0 10px #ff4444';
            }
        }
    }

    /**
     * 显示消息
     */
    showMessage(text, type = 'info') {
        const el = this.container.querySelector('.bg-message');
        if (el) {
            el.textContent = text;
            el.className = 'bg-message' + (type === 'success' ? ' success' : '');
            el.style.display = 'block';

            setTimeout(() => {
                el.style.display = 'none';
            }, 1500);
        }
    }

    /**
     * 显示结算界面
     */
    showResult(winners, scores, localTeamId) {
        const resultEl = this.container.querySelector('.bg-result');
        const winnerEl = this.container.querySelector('.bg-result-winner');
        const scoresEl = this.container.querySelector('.bg-result-scores');

        const isWinner = winners.includes(localTeamId);
        winnerEl.textContent = isWinner ? '🎉 胜利！' : '😢 失败';
        winnerEl.className = 'bg-result-winner ' + (isWinner ? 'win' : 'lose');

        const teamNames = ['红队', '蓝队', '绿队', '黄队'];
        const teamColors = ['#ff4444', '#4444ff', '#44ff44', '#ffff44'];

        scoresEl.innerHTML = scores.map((score, i) => `
            <div class="bg-result-team ${winners.includes(i) ? 'winner' : ''}">
                <div style="color:${teamColors[i]};font-weight:bold">${teamNames[i]}</div>
                <div style="font-size:32px;margin-top:10px">${score}</div>
            </div>
        `).join('');

        resultEl.style.display = 'flex';
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.container) {
            document.body.removeChild(this.container);
            this.container = null;
        }
    }
}
