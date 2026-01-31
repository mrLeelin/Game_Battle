# 枪豆人新增怪物类型 4-8

## 修改内容

### 客户端修改
**文件：** `client/games/gunbean/GunBeanScene.js`

1. **添加新怪物图片导入：**
   - 添加 monster_4.png 到 monster_8.png 的导入

2. **更新 TEXTURE_CONFIG：**
   - 在 `monsters` 配置中添加类型 4-8

### 服务端修改
**文件：** `server/games/gunbean/GunBeanHandler.js`

1. **扩展 ENEMY_TYPES 配置：**
   - 类型1：普通小怪（平衡）
   - 类型2：快速小怪（血少、速度快、经验少）
   - 类型3：重型小怪（血多、速度慢、经验多）
   - 类型4：平衡小怪（各项属性略高于普通）
   - 类型5：超速小怪（血少、极快、经验少）
   - 类型6：坦克小怪（血多、慢速、经验多）
   - 类型7：巨型小怪（血极多、极慢、经验极多）
   - 类型8：微型小怪（血极少、极快、经验极少）

2. **修改敌人生成随机范围：**
   - 从 `Math.random() * 3 + 1` 改为 `Math.random() * 8 + 1`

## 新怪物属性表

| 类型 | 血量倍率 | 速度倍率 | 经验倍率 | 尺寸 |
|------|----------|----------|----------|------|
| 1 | 1.0 | 1.0 | 1.0 | 45 |
| 2 | 1.0 | 1.5 | 0.8 | 37.5 |
| 3 | 2.0 | 0.6 | 1.5 | 60 |
| 4 | 1.2 | 1.2 | 1.2 | 50 |
| 5 | 0.8 | 1.8 | 0.9 | 35 |
| 6 | 1.5 | 0.8 | 1.3 | 55 |
| 7 | 2.5 | 0.5 | 2.0 | 65 |
| 8 | 0.6 | 2.0 | 0.7 | 30 |

## 贴图资源
- `texture/qiangdouren/monster_4.png`
- `texture/qiangdouren/monster_5.png`
- `texture/qiangdouren/monster_6.png`
- `texture/qiangdouren/monster_7.png`
- `texture/qiangdouren/monster_8.png`

## 日期
2025-01-31
