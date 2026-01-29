@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title 游戏客户端

echo ==========================================
echo            游戏客户端启动器
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

echo [2/2] 启动客户端 (端口 8080)...
echo.
echo 服务器需先启动（端口 3000）。
echo.

:: 获取本机 IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%
if "%IP%"=="" set IP=localhost

echo 本机地址: http://localhost:8080
echo 局域网地址: http://%IP%:8080
echo.
echo 分享局域网地址给朋友即可联机！
echo.

:: 打开浏览器
start http://localhost:8080

:: 启动 Vite
call npx vite
echo.
echo 客户端已退出。
pause