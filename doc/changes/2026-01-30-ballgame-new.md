# 新增游戏：抢球大战 (BallGame)

## 变更日期
2026-01-30

## 变更类型
feat: 新游戏

## 游戏规则
1. 4个队伍，每队最多2人（红、蓝、绿、黄）
2. 70度俯视角固定摄像机（2.5D风格）
3. 足球场风格场地，四角有球门
4. 玩家捡起场地中的球，放入己方球门得分
5. 可以从敌方球门偷球（对方减分）
6. 60秒倒计时，分数最高者获胜
7. 相同分数都算获胜

## 新增文件

### shared/
- `GameTypes.js` - 添加 BALLGAME 游戏类型配置
- `Events.js` - 添加 BALLGAME_EVENTS 事件定义

### client/games/ballgame/
- `BallGame.js` - 游戏主类，管理生命周期
- `BallGameScene.js` - Three.js 场景（场地、球门、玩家、球）
- `BallGameUI.js` - 游戏UI（分数板、倒计时、结算）
- `BallGameInput.js` - 输入控制（键盘WASD + 移动端摇杆）

### server/games/ballgame/
- `BallGameHandler.js` - 服务端游戏逻辑（捡球、得分、偷球、同步）

## 修改文件

### client/main.js
- `loadGameModule()`: 添加 ballgame 动态加载

### server/games/GameRouter.js
- 导入并注册 BallGameHandler
- `bindEvents()`: 绑定 ballgame 事件

### server/lobby/LobbyHandler.js
- 添加 `gameRouter` 属性
- 新增 `setGameRouter()` 方法
- `handleStartGame()`: 调用游戏处理器的 initGame

### server/index.js
- 调用 `lobbyHandler.setGameRouter(gameRouter)`

## 事件定义 (BALLGAME_EVENTS)
```javascript
// 客户端 -> 服务端
PICKUP_BALL    // 捡起球
DROP_BALL      // 放下球
SCORE_BALL     // 进球得分

// 服务端 -> 客户端
BALL_SPAWNED   // 球生成
BALL_PICKED    // 球被捡起
BALL_DROPPED   // 球被放下
BALL_SCORED    // 进球通知
BALL_STOLEN    // 球被偷走
TEAM_SCORES    // 队伍分数更新
GAME_COUNTDOWN // 倒计时更新
GAME_RESULT    // 游戏结果
```

## 场地配置
- 场地尺寸: 30x30
- 球门大小: 4
- 初始球数: 5
- 捡球距离: 1.5
- 进球距离: 2.5
- 球重生延迟: 2秒

## 队伍配置
| 队伍 | 颜色 | 球门位置 |
|------|------|----------|
| 红队 | #ff4444 | 上方 |
| 蓝队 | #4444ff | 右方 |
| 绿队 | #44ff44 | 下方 |
| 黄队 | #ffff44 | 左方 |

## 测试步骤
1. 启动服务端和客户端
2. 2人以上进入房间
3. 房主选择"抢球大战"游戏
4. 所有人准备后开始游戏
5. 使用 WASD 移动，空格捡球/放球
6. 移动端使用摇杆和按钮操作
