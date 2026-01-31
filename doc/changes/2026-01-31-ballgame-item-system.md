# BallGame 道具系统升级

**日期**: 2026-01-31
**版本**: v1.2.0
**开发者**: Claude Code

## 变更概述

在抢球大战 (BallGame) 基础上新增道具系统、攻击机制和眩晕效果。
v1.2.0 简化为单道具系统，增加手持棒球棒显示。

## 新增功能

### 1. 角色朝向鼠标
- 角色始终面向鼠标位置
- 鼠标位置通过射线与地面平面相交计算
- 朝向数据每100ms同步到服务端

### 2. 道具系统（简化版）
- 场上生成3个棒球棒道具
- 靠近道具自动捡取
- **单道具模式**：捡起新道具会丢弃旧道具
- 棒球棒使用1次后消失
- 道具被捡起后5秒重生
- **手持显示**：捡起棒球棒后会显示在玩家右手中

### 3. 攻击系统
- 鼠标左键发起攻击
- 攻击范围：前方2单位，90度扇形
- 攻击消耗当前持有的道具

### 4. 眩晕系统
- 被攻击击中后眩晕2秒
- 眩晕期间：无法移动、捡球、攻击
- 被眩晕时持有的球会掉落
- 眩晕特效：头顶旋转星星、屏幕红色闪烁

### 5. 手持武器显示（v1.2.0新增）
- 捡起棒球棒后，棒球棒会显示在玩家右手中
- 持棒时有专门的手臂姿势
- 使用道具后棒球棒消失

## 修改的文件

| 文件 | 修改内容 |
|------|----------|
| `shared/Events.js` | 新增10个事件（道具、攻击、眩晕相关） |
| `server/games/ballgame/BallGameHandler.js` | 添加道具生成、自动捡取、攻击判定、眩晕逻辑；简化为单道具 |
| `client/games/ballgame/BallGame.js` | 添加道具管理、攻击方法、眩晕状态处理；简化为单道具 |
| `client/games/ballgame/BallGameScene.js` | 添加道具渲染、鼠标位置计算、眩晕特效、挥棒动画；新增手持棒球棒显示 |
| `client/games/ballgame/BallGameInput.js` | 添加鼠标追踪、左键攻击；移除1-6道具栏切换 |
| `client/games/ballgame/BallGameUI.js` | 添加眩晕提示覆盖层；移除道具栏UI |

## 新增事件列表

```javascript
// shared/Events.js - BALLGAME_EVENTS 新增
PLAYER_ATTACK: 'ball:playerAttack',     // 玩家攻击
PLAYER_ROTATE: 'ball:playerRotate',     // 玩家朝向
ITEM_SPAWNED: 'ball:itemSpawned',       // 道具生成
ITEM_PICKED: 'ball:itemPicked',         // 道具被捡起
ITEM_USED: 'ball:itemUsed',             // 道具被使用
ATTACK_PERFORMED: 'ball:attackPerformed', // 攻击动作广播
PLAYER_HIT: 'ball:playerHit',           // 玩家被击中
PLAYER_STUNNED: 'ball:playerStunned',   // 玩家被眩晕
PLAYER_UNSTUN: 'ball:playerUnstun'      // 玩家眩晕结束
```

## 服务端配置

```javascript
// BallGameHandler.js - GAME_CONFIG 新增
ITEM_COUNT: 3,              // 初始道具数量
ITEM_PICKUP_DISTANCE: 1.5,  // 捡道具距离
ITEM_RESPAWN_DELAY: 5000,   // 道具重生延迟（毫秒）
STUN_DURATION: 2000,        // 眩晕时长（毫秒）
ATTACK_RANGE: 2.0,          // 攻击范围
ATTACK_ANGLE: 90            // 攻击角度（度）
```

## 操作说明

| 操作 | 键位 |
|------|------|
| 移动 | WASD |
| 朝向 | 鼠标位置 |
| 攻击 | 鼠标左键 |
| 捡球/投球 | 空格 |
| 跳跃 | Shift |

## 注意事项

1. 攻击只对敌方队伍有效，不会伤害队友
2. 已眩晕的玩家不会被重复眩晕
3. 捡起新道具会丢弃当前持有的道具
4. 手持棒球棒会显示在玩家右手中

## 回退方案

如需回退，可使用 git 恢复以下文件到修改前的版本：
```bash
git checkout HEAD~1 -- shared/Events.js
git checkout HEAD~1 -- server/games/ballgame/BallGameHandler.js
git checkout HEAD~1 -- client/games/ballgame/BallGame.js
git checkout HEAD~1 -- client/games/ballgame/BallGameScene.js
git checkout HEAD~1 -- client/games/ballgame/BallGameInput.js
git checkout HEAD~1 -- client/games/ballgame/BallGameUI.js
```
