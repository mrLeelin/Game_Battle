# 简化肉鸽技能 - 只保留5个核心技能

## 修改内容

### 1. 技能数据配置
**文件：** `server/games/gunbean/GunBeanSkillData.js`

**保留的5个技能（每个5级）：**
- `bounce` - 弹射（子弹碰墙反弹）
- `scatter` - 散射（发射扇形散射子弹）
- `splitBullet` - 分裂弹（子弹命中后分裂成小子弹）
- `damage` - 强化（提升子弹伤害）
- `reload` - 快装（减少换弹时间）

**删除的内容：**
- 删除了所有其他技能（穿透、修复、加速、护盾等30+个技能）
- 删除了传说技能配置 `LEGENDARY_SKILLS`
- 删除了融合配方表 `FUSION_RECIPES`

### 2. 服务端处理器
**文件：** `server/games/gunbean/GunBeanHandler.js`

**修改内容：**
- 删除了 `LEGENDARY_SKILLS` 和 `checkFusionOptions` 的导入
- 删除了 `handleSkillSelect` 方法中的融合技能处理逻辑
- 删除了 `playerLevelUp` 方法中的融合选项检查
- 删除了发送给客户端的 `fusionOptions` 数据

## 技能列表

| 技能ID | 名称 | 图标 | 描述 | 每级效果 | 最大等级 |
|--------|------|------|------|----------|----------|
| bounce | 弹射 | 🔄 | 子弹碰墙反弹 | +1次反弹 | 5 |
| scatter | 散射 | 🌟 | 发射扇形散射子弹 | +2颗分散子弹 | 5 |
| splitBullet | 分裂弹 | 💠 | 子弹命中后分裂成小子弹 | +2颗分裂弹 | 5 |
| damage | 强化 | 💪 | 提升子弹伤害 | +1伤害 | 5 |
| reload | 快装 | ⚡ | 减少换弹时间 | -12%换弹时间 | 5 |

## 日期
2025-01-31
