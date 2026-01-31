# 修复吃经验升级失败的 Bug

## 日期
2025-01-31

## 问题描述
玩家吃经验升级时，如果一次收集了大量经验（足够升级多次），会导致升级失败。

## 问题原因
在 `GunBeanHandler.js` 的 `collectExpOrb` 函数中，使用 `while` 循环来处理连续升级：

```javascript
// 原代码
while (gamePlayer.exp >= gamePlayer.expToNext) {
    this.playerLevelUp(game, gamePlayer);
}
```

这会导致：
1. 连续调用 `playerLevelUp` 多次
2. 每次都发送技能选择界面
3. 但玩家只能选择一次技能
4. 后续的升级被"吞掉"

## 修改内容

### 文件：`server/games/gunbean/GunBeanHandler.js`

#### 修改 1：`collectExpOrb` 函数（第 544-547 行）
将 `while` 循环改为 `if` 判断，每次只处理一次升级：

```javascript
// 修改后
// 检查升级（每次只处理一次升级，避免连续升级时技能选择界面被覆盖）
if (gamePlayer.exp >= gamePlayer.expToNext) {
    this.playerLevelUp(game, gamePlayer);
}
```

#### 修改 2：`handleSkillSelect` 函数（第 438-445 行）
在玩家选择技能后，再次检查是否需要升级：

```javascript
// 修改后
// 检查是否还需要继续升级（处理一次收集大量经验的情况）
if (gamePlayer.exp >= gamePlayer.expToNext) {
    // 还有足够经验继续升级，触发下一次升级
    this.playerLevelUp(game, gamePlayer);
} else {
    // 恢复游戏
    this.resumeGame(player.roomId, socket.id);
}
```

## 修改逻辑
1. 收集经验球时，只触发一次升级
2. 玩家选择技能后，检查是否还有足够经验继续升级
3. 如果有，继续触发升级流程（再次显示技能选择界面）
4. 如果没有，恢复游戏

## 代码对比

### collectExpOrb 函数
| 修改前 | 修改后 |
|--------|--------|
| `while (gamePlayer.exp >= gamePlayer.expToNext)` | `if (gamePlayer.exp >= gamePlayer.expToNext)` |
| 连续升级，可能覆盖技能选择界面 | 每次只升级一次，确保玩家能选择技能 |

### handleSkillSelect 函数
| 修改前 | 修改后 |
|--------|--------|
| 直接调用 `resumeGame` | 先检查是否需要继续升级，再决定是否恢复游戏 |

## 功能对比
| 场景 | 修改前 | 修改后 |
|------|--------|--------|
| 一次升级 | 正常 | 正常 |
| 一次收集大量经验（多次升级） | 只能选择一次技能，后续升级丢失 | 每次升级都能选择技能 |

## 回退方案
如果需要回退，将以下代码还原：

1. `collectExpOrb` 函数中的 `if` 改回 `while`
2. `handleSkillSelect` 函数中删除升级检查，直接调用 `resumeGame`
