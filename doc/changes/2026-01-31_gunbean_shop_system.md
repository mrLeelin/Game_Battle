# 2026-01-31 枪豆人商店系统实现

## 概述
为枪豆人游戏添加了完整的商店系统，支持多轮制游戏、金币经济、枪械购买和技能升级。

## 修改文件清单

### 1. shared/Events.js
**修改类型**: 修改
**修改内容**: 添加商店相关Socket事件
```javascript
// 新增事件
SHOP_BUY: 'gunbean:shopBuy',            // 购买物品
SHOP_COMPLETE: 'gunbean:shopComplete',  // 玩家点击完成
COIN_UPDATE: 'gunbean:coinUpdate',      // 金币更新
ROUND_START: 'gunbean:roundStart',      // 新一轮开始
SHOP_OPEN: 'gunbean:shopOpen',          // 打开商店
SHOP_DATA: 'gunbean:shopData',          // 商店数据
SHOP_BUY_RESULT: 'gunbean:shopBuyResult', // 购买结果
SHOP_PLAYER_READY: 'gunbean:shopPlayerReady', // 玩家准备
SHOP_ALL_READY: 'gunbean:shopAllReady'  // 所有人准备好
```

### 2. server/games/gunbean/GunBeanShopData.js
**修改类型**: 新增
**修改内容**: 商店配置数据
- 10种枪械配置（手枪、霰弹枪、机枪、狙击枪等）
- 12种技能配置（弹跳、穿透、护盾、双发等）
- `generateShopData()` 随机生成商店
- `getWeaponById()` / `getSkillById()` 查询函数

### 3. server/games/gunbean/GunBeanHandler.js
**修改类型**: 大量修改
**修改内容**:
1. **CONFIG更新**:
   - `DURATION`: 120 → 90秒
   - 新增 `MAX_ROUNDS: 30`
   - 新增 `COIN_PER_KILL: 10`
   - 新增 `SHOP_TIMEOUT: 60`

2. **游戏状态扩展**:
   - `currentRound` 当前轮次
   - `maxRounds` 最大轮次
   - `isShopPhase` 商店阶段标志
   - `shopData` 商店数据
   - `shopReadyPlayers` 已准备玩家

3. **玩家状态扩展**:
   - `coins` 金币
   - `weapon` 当前武器
   - `skills` 技能层数Map

4. **新增方法**:
   - `onRoundEnd()` 轮次结束进入商店
   - `stopRoundTimers()` 停止定时器
   - `startNextRound()` 开始下一轮
   - `handleShopBuy()` 处理购买请求
   - `handleShopComplete()` 处理完成按钮

5. **修改方法**:
   - `startGame()` 支持多轮
   - `endGame()` 显示轮次信息
   - `handleShoot()` 应用武器和技能效果
   - `hitEnemy()` 添加金币奖励、暴击、吸血
   - `hitBoat()` 支持护盾技能
   - `updatePhysics()` 子弹弹跳和穿透

### 4. client/games/gunbean/GunBeanUI.js
**修改类型**: 修改
**修改内容**:
- UI模板添加金币显示 `🪙`
- UI模板添加轮次显示 `第X/30轮`
- 添加 `updateCoins(coins)` 方法
- 添加 `updateRound(current, max)` 方法
- 添加相应CSS样式

### 5. client/games/gunbean/GunBeanShop.js
**修改类型**: 新增
**修改内容**: 完整商店UI组件
- 全屏商店界面
- 武器卡片（5个）显示名称、价格、属性
- 技能卡片（6个）显示名称、价格、等级
- 完成按钮（显示准备人数）
- 购买交互和动画效果
- 金币不足灰显

### 6. client/games/gunbean/GunBeanGame.js
**修改类型**: 修改
**修改内容**:
- 导入GunBeanShop组件
- 添加状态: `coins`, `currentRound`, `maxRounds`, `weapon`, `skills`, `isShopOpen`
- 绑定商店相关网络事件
- 初始化商店组件
- `handleShopOpen()` 显示商店
- `handleGameResult()` 支持轮次信息
- `destroy()` 清理商店组件和事件

## 游戏流程变化

```
原流程:
游戏开始 → 倒计时120秒 → 时间到/全死 → 游戏结束

新流程:
游戏开始 → 第1轮(90秒) → 商店 → 所有人完成 →
         第2轮(90秒) → 商店 → ...
         → 第30轮或全死 → 游戏结束
```

## 配置参数

| 参数 | 值 |
|------|-----|
| 每轮时长 | 90秒 |
| 最大轮次 | 30轮 |
| 击杀奖励 | 10金币 |
| 商店超时 | 60秒 |
| 商店武器数 | 5个（含免费手枪） |
| 商店技能数 | 6个（随机） |

## 技能效果说明

| 技能 | 效果 | 可叠加 |
|------|------|--------|
| 弹跳 | 子弹碰墙反弹+1次 | ✓ |
| 穿透 | 子弹穿透敌人+1个 | ✓ |
| 修复 | 立即恢复3点船HP | ✓ |
| 加速 | 后坐力移动+15% | ✓ |
| 护盾 | 免疫伤害+1次 | ✓ |
| 双发 | 额外子弹+1颗 | ✓ |
| 强化 | 伤害+1 | ✓ |
| 快装 | 射速+10% | ✓ |
| 吸血 | 击杀恢复+1HP | ✓ |
| 暴击 | 暴击率+10% | ✓ |
| 射程 | 子弹射程+20% | ✓ |
| 稳定 | 后坐力-15% | ✓ |

## 测试要点

1. 倒计时结束后是否正确进入商店
2. 购买武器是否正确替换
3. 购买技能是否正确叠加
4. 金币是否正确扣除和显示
5. 所有人点击完成后是否进入下一轮
6. 技能效果是否正确生效（弹跳、穿透、护盾等）
7. 击杀敌人是否获得金币
8. 轮次显示是否正确
9. 商店超时是否自动开始下一轮
10. 达到30轮是否正确结束游戏
