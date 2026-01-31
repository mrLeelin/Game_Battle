# BallGame 卡死问题 - THREE 未定义

## 问题描述
Ball Game 游戏启动后卡死，无法操作

## 错误原因
`client/games/ballgame/BallGameInput.js` 文件中使用了 `THREE.Vector3` 但没有导入 `THREE` 模块

## 问题代码位置
- 第 82 行: `const direction = new THREE.Vector3();`
- 第 134 行: `const forward = new THREE.Vector3();`
- 第 140 行: `const right = new THREE.Vector3();`
- 第 144 行: `const moveVec = new THREE.Vector3();`

## 错误信息
```
ReferenceError: THREE is not defined
```

## 修复方案
在文件顶部添加 THREE 导入：
```javascript
import * as THREE from 'three';
```

## 修复日期
2024年

## 防止再次发生
- 使用 THREE.js 的文件必须在顶部导入
- 代码审查时检查所有外部依赖是否已导入
