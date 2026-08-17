@echo off
title Gestor de Tarefas
cd /d "%~dp0"

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo Servidor ja esta rodando.
) else (
    echo Iniciando servidor do Gestor...
    start "Gestor - Servidor (nao feche esta janela)" cmd /k "set PATH=%PATH%;C:\Program Files\nodejs && npm run dev"
    echo Aguardando o servidor iniciar...
    timeout /t 6 /nobreak >nul
)

start http://localhost:3000
