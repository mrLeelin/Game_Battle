@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title 游戏服务器

echo ==========================================
echo            游戏服务器启动器
echo ==========================================
echo.
echo [1/2] 检查依赖...
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败，请检查 npm 输出。
        pause
        exit /b 1
    )
)

echo [2/2] 启动游戏服务器 (端口 3000)...
echo 注意: 请保持此窗口开启。
echo.
node server\index.js
echo.
echo 服务器已退出。
pause
