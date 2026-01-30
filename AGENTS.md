# Repository Guidelines

## 项目结构与模块组织
- `client/`：浏览器端代码（Three.js 渲染、UI、游戏逻辑）。核心文件：`client/index.html`、`client/game.js`、`client/style.css`。
- `server/`：多人联机后端（Express + Socket.io），入口为 `server/index.js`。
- `shared/`：客户端/服务端共用的常量、事件与游戏类型定义。
- `dist/`：Vite 构建输出目录（`vite.config.js` 将 `outDir` 指向 `../dist`）。
- `vite.config.js`：开发服务器与构建配置（端口 8080，允许局域网访问）。

## 构建、测试与本地开发命令
- `开始服务器.bat`：启动服务端（端口 3000）。
- `开始客户端.bat`：启动客户端开发服务器（端口 8080）并打开浏览器。
- `开始游戏.bat`：同时打开上述两个脚本窗口。
- `npm run server`：等同于 `node server/index.js`。
- `npx vite`：仅启动客户端开发服务器。
- `npm run build`：构建前端产物到 `dist/`。

## 编码风格与命名规范
- 缩进 2 空格，使用分号。
- 客户端与服务端均使用 ES Modules（`import/export`）。
- 变量/函数用 `camelCase`，类名用 `PascalCase`，事件名保持清晰（如 `playerMoved`、`roomState`）。
- UI 文本与 DOM ID 必须与 `client/index.html` 保持一致，避免运行期找不到元素。

## 测试规范
当前仓库未发现测试框架或覆盖率要求。若新增测试，请在此补充框架（如 Vitest/Jest）与命令（如 `npm test`）。

## 提交与拉取请求规范
此工作区未检测到 Git 历史，无法推断既有提交规则。建议使用简短、祈使式提交信息，单次提交聚焦单一改动。PR 建议包含：变更说明、运行方式、UI/玩法变更截图或短视频；如涉及端口、CORS、局域网访问，请明确标注。

## 配置与网络注意事项
- 客户端默认连接 `http://<当前主机名>:3000`，局域网测试需确保服务端与客户端在同一网络。
- 服务端允许跨域请求；若收紧安全策略，请同步检查客户端连接与部署方式。

## 错误记录与复盘
- 每次出现错误就把错误放到 `doc/error/` 文件夹下。
- 写代码之前读下 `doc/error/`，确保不会再犯。

## 写作留档
- 每次写完之后要把记录放在 `doc/change/` 下面 之后可以根据记录确认