# Repository Guidelines

## 项目结构与模块组织
- `client/`：浏览器端代码（Three.js 渲染、UI、游戏逻辑）。核心文件：`client/index.html`、`client/game.js`、`client/style.css`。
- `server/`：Node.js 多人联机后端（Express + Socket.io），入口为 `server/server.js`。
- `dist/`：Vite 构建输出目录（由 `vite.config.js` 的 `outDir` 指向 `../dist`）。
- `vite.config.js`：配置开发服务器与构建路径（client 作为 root，端口 8080，可通过局域网访问）。

## 构建、测试与本地开发命令
- `开始游戏.bat`：一键启动服务端与客户端，并在浏览器打开页面（适合局域网联机）。
- `npm run server`：启动 Socket.io 服务端，监听 3000 端口。
- `npx vite`：启动客户端开发服务器，监听 `0.0.0.0:8080`。
如命令失败，请确认已安装 Node.js 依赖且脚本存在。

## 编码风格与命名规范
- 缩进 2 空格，使用分号。
- 客户端使用 ES Modules（`import`），服务端使用 CommonJS（`require`）。
- 变量/函数用 `camelCase`，类名用 `PascalCase`，事件名保持清晰（如 `playerMoved`、`roomState`）。
- UI 文本与 DOM ID 必须与 `client/index.html` 保持一致，避免运行期找不到元素。

## 测试规范
当前仓库未发现测试框架或覆盖率要求。若新增测试，请在此补充框架（如 Vitest/Jest）与命令（如 `npm test`）。

## 提交与拉取请求规范
此工作区未检测到 Git 历史，无法推断既有提交规则。建议使用简短、祈使式提交信息，单次提交聚焦单一改动。
PR 建议包含：变更说明、运行方式、UI/玩法变更截图或短视频；如涉及端口、CORS、局域网访问，请明确标注。

## 配置与网络注意事项
- 客户端默认连接 `http://<当前主机名>:3000`，局域网测试需确保服务端与客户端在同一网络。
- 服务端允许跨域请求；若收紧安全策略，请同步检查客户端连接与部署方式。


## 每次出现错误就把错误放到 doc/error/  文件夹下

## 写代码之前读取 doc/error/ 确保不会再犯