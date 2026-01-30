# 自定义头像功能

## 变更日期
2026-01-30

## 变更类型
feat: 新功能

## 变更描述
添加自定义头像功能，支持默认头像选择、从相册选择图片、相机拍照三种方式。

## 新增文件

### 1. client/ui/AvatarPicker.js
头像选择器组件，提供：
- 18 个默认 emoji 头像
- 从相册选择图片按钮
- 相机拍照按钮（移动端前置摄像头）
- 图片预览和确认
- 自动压缩图片（200x200，JPEG 80%质量）
- 圆形裁剪

### 2. client/lobby/AvatarManager.js
头像管理器，负责：
- 头像存储（localStorage）
- 头像加载
- 头像渲染到 DOM 元素
- 头像类型判断（emoji/image）

## 修改文件

### 1. client/index.html
- 登录界面添加头像选择区域
- 大厅界面用户信息改为可点击头像
- 房间界面用户信息改为可点击头像

### 2. client/style.css
新增样式：
- .login-panel, .login-avatar-section 登录界面头像区样式
- .login-avatar 登录头像（100x100，圆形）
- .user-avatar-img 用户信息区头像（36x36，圆形）
- .avatar-picker-overlay 头像选择器遮罩
- .avatar-picker-content 头像选择器内容区
- .avatar-grid 默认头像网格（6列）
- .avatar-option 头像选项
- .avatar-preview-section 预览区
- .avatar-btn 选择器按钮样式
- 移动端适配

### 3. client/lobby/LobbyUI.js
- 导入 avatarPicker 和 avatarManager
- cacheElements() 添加 loginAvatar, lobbyAvatar, roomAvatar
- bindEvents() 添加头像点击事件
- 新增 showAvatarPicker() 显示头像选择器
- 新增 updateAvatarDisplay() 更新所有头像显示
- 新增 initAvatarDisplay() 初始化头像显示
- init() 调用 initAvatarDisplay()

### 4. client/lobby/RoomUI.js
- 导入 avatarManager
- cacheElements() 添加 roomAvatar
- show() 调用 updateRoomAvatar()
- 新增 updateRoomAvatar() 更新房间头像显示

## 功能说明

### 使用流程
1. 登录界面：点击头像区域 → 打开选择器 → 选择/拍照 → 保存
2. 大厅/房间界面：点击左上角头像 → 打开选择器 → 选择/拍照 → 保存

### 头像类型
- emoji: 存储 emoji 字符
- image: 存储 base64 压缩图片

### 存储
- Key: user_avatar
- Value: JSON { type: 'emoji'|'image', data: string }

## 移动端支持
- 相机拍照使用 capture="user" 调用前置摄像头
- 响应式布局适配小屏幕

## 注意事项
- 图片自动压缩至 200x200 以节省存储空间
- localStorage 有容量限制，大图片可能存储失败
- 图片会自动裁剪为圆形
