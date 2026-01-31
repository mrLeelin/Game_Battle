# 枪豆人 - 难度翻倍调整

## 修改日期
2025-01-31

## 修改内容
将所有难度相关的数值翻倍，使后续难度更加挑战性。

---

## 难度调整对照表

| 参数 | 修改前 | 修改后 | 说明 |
|------|--------|--------|------|
| **最大敌人数量** | `5 + difficultyLevel` | `5 + difficultyLevel × 2` | 每级增加2个敌人 |
| **敌人血量** | `difficultyLevel × 0.5` | `difficultyLevel × 1` | 每级增加1 HP |
| **敌人移动速度** | `difficultyLevel × 0.05` | `difficultyLevel × 0.1` | 每级增加10%速度 |
| **经验奖励** | `difficultyLevel × 2` | `difficultyLevel × 4` | 每级增加4经验 |

---

## 具体难度对比

### 难度等级 1（初始）
| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| 最大敌人 | 6 | 7 |
| 敌人HP | 3.5 → 4 | 4 → 5 |
| 速度加成 | +5% | +10% |
| 经验加成 | +2 | +4 |

### 难度等级 5（30秒后）
| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| 最大敌人 | 10 | 15 |
| 敌人HP | 5.5 → 6 | 6 → 7 |
| 速度加成 | +25% | +50% |
| 经验加成 | +10 | +20 |

### 难度等级 10（1分钟后）
| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| 最大敌人 | 15 | 25 |
| 敌人HP | 8 → 8 | 10 → 11 |
| 速度加成 | +50% | +100% |
| 经验加成 | +20 | +40 |

### 难度等级 20（2分钟后）
| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| 最大敌人 | 15 | 15 (满) |
| 敌人HP | 13 → 13 | 15 → 16 |
| 速度加成 | +100% | +200% |
| 经验加成 | +40 | +80 |

---

## 修改文件

**文件**: `server/games/gunbean/GunBeanHandler.js`

### 修改 1：最大敌人数量（翻倍）
```javascript
// 修改前
const maxEnemies = Math.min(CONFIG.MAX_ENEMIES, 5 + game.difficultyLevel);

// 修改后
const maxEnemies = Math.min(CONFIG.MAX_ENEMIES, 5 + game.difficultyLevel * 2);
```

### 修改 2：敌人血量（翻倍）
```javascript
// 修改前
const baseHp = CONFIG.ENEMY_HP + Math.floor(game.difficultyLevel * 0.5);

// 修改后
const baseHp = CONFIG.ENEMY_HP + Math.floor(game.difficultyLevel * 1);
```

### 修改 3：敌人移动速度（翻倍）
```javascript
// 修改前
const speed = CONFIG.ENEMY_SPEED * speedMult * enemySpeedMult * (1 + game.difficultyLevel * 0.05);

// 修改后
const speed = CONFIG.ENEMY_SPEED * speedMult * enemySpeedMult * (1 + game.difficultyLevel * 0.1);
```

### 修改 4：经验奖励（翻倍）
```javascript
// 修改前
const expAmount = Math.ceil((CONFIG.ENEMY_EXP + Math.floor(game.difficultyLevel * 2)) * expMult);

// 修改后
const expAmount = Math.ceil((CONFIG.ENEMY_EXP + Math.floor(game.difficultyLevel * 4)) * expMult);
```

---

## 效果预期

1. **前期（难度1-5）**: 敌人数量略增，血量和速度适中，经验更多
2. **中期（难度6-15）**: 敌人数量显著增加，血量和速度明显提升
3. **后期（难度16+）**: 敌人数量达到上限，高血高速度，需要强力技能

---

## 回退方案

如需回退，将所有公式改回原值：
- `difficultyLevel * 2` → `difficultyLevel`
- `difficultyLevel * 1` → `difficultyLevel * 0.5`
- `difficultyLevel * 0.1` → `difficultyLevel * 0.05`
- `difficultyLevel * 4` → `difficultyLevel * 2`
