# 枪豆人（GunBean）游戏实现

## 改动日期
2026-01-31

## 改动概述
实现了枪豆人（GunBean）多人在线游戏，核心玩法是玩家无法自由移动，靠射击后坐力位移。

## 修改的文件

### 1. shared/Events.js
**操作**: 修改
**内容**: 添加 GUNBEAN_EVENTS 事件定义
```javascript
export const GUNBEAN_EVENTS = {
    SHOOT: 'gunbean:shoot',
    REVIVE: 'gunbean:revive',
    PLAYER_UPDATE: 'gunbean:playerUpdate',
    BULLET_FIRED: 'gunbean:bulletFired',
    BULLET_HIT: 'gunbean:bulletHit',
    PLAYER_DIED: 'gunbean:playerDied',
    PLAYER_REVIVED: 'gunbean:playerRevived',
    ENEMY_SPAWNED: 'gunbean:enemySpawned',
    ENEMY_DIED: 'gunbean:enemyDied',
    ENEMY_UPDATE: 'gunbean:enemyUpdate',
    GAME_COUNTDOWN: 'gunbean:countdown',
    GAME_RESULT: 'gunbean:result',
    SCORE_UPDATE: 'gunbean:scoreUpdate'
};
```

### 2. shared/GameTypes.js
**操作**: 修改
**内容**: 注册 GUNBEAN 游戏类型
```javascript
GUNBEAN: {
    id: 'gunbean',
    name: '枪豆人',
    description: '靠射击后坐力移动，多人欢乐互坑',
    icon: '🔫',
    minPlayers: 1,
    maxPlayers: 4,
    gameDuration: 120,
    clientModule: './games/gunbean/GunBeanGame.js',
    serverHandler: './games/gunbean/GunBeanHandler.js'
}
```

### 3. client/games/gunbean/GunBeanScene.js
**操作**: 新建
**内容**: 场景渲染模块
- 俯视角摄像机（70度）
- 海洋平台地图
- 豆人角色（圆形身体+眼睛+枪）
- 子弹渲染和拖尾效果
- 敌人渲染（红色方块怪）
- 爆炸粒子效果
- 血量条显示

### 4. client/games/gunbean/GunBeanUI.js
**操作**: 新建
**内容**: UI界面模块
- 血量条显示
- 弹药显示
- 击杀数/存活人数
- 倒计时
- 准星
- 死亡遮罩
- 结算界面

### 5. client/games/gunbean/GunBeanInput.js
**操作**: 新建
**内容**: 输入控制模块
- 鼠标移动 -> 瞄准方向
- 鼠标点击/空格 -> 射击
- E键 -> 复活队友
- 移动端摇杆支持

### 6. client/games/gunbean/GunBeanGame.js
**操作**: 新建
**内容**: 游戏主类
- 继承游戏基础模式
- 管理玩家、子弹、敌人状态
- 绑定网络事件
- 实现 init()、start()、gameLoop()、destroy()

### 7. server/games/gunbean/GunBeanHandler.js
**操作**: 新建
**内容**: 服务端游戏逻辑
- initGame() - 初始化玩家位置、生命值
- bindEvents() - 绑定射击、复活事件
- handleShoot() - 处理射击：创建子弹、计算后坐力
- handleRevive() - 处理复活
- updatePhysics() - 物理更新（60fps）
- spawnEnemy() - 定时生成敌人
- syncState() - 状态同步（10fps）

### 8. client/main.js
**操作**: 修改
**内容**: 添加 gunbean 动态加载
```javascript
case 'gunbean':
    const { GunBeanGame } = await import('./games/gunbean/GunBeanGame.js');
    return GunBeanGame;
```

### 9. server/games/GameRouter.js
**操作**: 修改
**内容**:
- 导入 GunBeanHandler
- 在 handlers 中添加 gunbean 处理器
- 在 bindEvents 中添加 gunbean 事件绑定

## 核心游戏机制

### 后坐力移动系统
```javascript
// 射击时应用后坐力
gamePlayer.vx -= dirX * CONFIG.RECOIL_FORCE;
gamePlayer.vz -= dirZ * CONFIG.RECOIL_FORCE;
```

### 玩家物理
```javascript
// 每帧更新
player.x += player.vx * deltaTime;
player.z += player.vz * deltaTime;
player.vx *= CONFIG.FRICTION;
player.vz *= CONFIG.FRICTION;
```

### 复活机制
- 靠近死亡队友（距离 < 1.5）
- 按 E 键复活

### 死亡条件
1. 被敌人攻击（3次）
2. 掉落海洋（超出平台范围）

## 验证方式
1. 运行 `npm run dev`
2. 创建房间选择"枪豆人"游戏
3. 验证射击后坐力位移
4. 测试多人同步

## 回退方案
如需回退，删除以下文件/内容：
1. 删除 `client/games/gunbean/` 目录
2. 删除 `server/games/gunbean/` 目录
3. 从 `shared/Events.js` 移除 GUNBEAN_EVENTS
4. 从 `shared/GameTypes.js` 移除 GUNBEAN 配置
5. 从 `client/main.js` 移除 gunbean case
6. 从 `server/games/GameRouter.js` 移除 gunbean 相关代码
