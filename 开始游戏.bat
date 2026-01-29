@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title 多人游戏平台启动器

echo ==========================================
echo       多人游戏平台启动器
echo ==========================================
echo.
echo 已拆分为独立启动脚本：
echo   - 服务器：开始服务器.bat
echo   - 客户端：开始客户端.bat
echo.
echo 正在分别打开两个窗口...
start "游戏服务器" cmd /k "call \"%~dp0开始服务器.bat\""
start "游戏客户端" cmd /k "call \"%~dp0开始客户端.bat\""
echo.
echo 注意: 请保持服务器窗口开启。
pause