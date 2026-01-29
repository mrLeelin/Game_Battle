@echo off
chcp 65001 >nul
title 多人游戏平台启动器

echo ==========================================
echo       多人游戏平台启动器
echo ==========================================
echo.

echo [1/3] 检查依赖...
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
)

echo [2/3] 启动游戏服务器 (端口 3000)...
start "游戏服务器" cmd /k "node server/index.js"

echo [3/3] 启动客户端 (端口 8080)...
echo.
echo 游戏将在浏览器中打开。
echo.

:: 获取本机 IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

echo 本机地址: http://localhost:8080
echo 局域网地址: http://%IP%:8080
echo.
echo 分享局域网地址给朋友即可联机！
echo.
echo 注意: 请勿关闭"游戏服务器"窗口。
echo.

:: 打开浏览器
start http://localhost:8080

:: 启动 Vite
call npx vite

pause
