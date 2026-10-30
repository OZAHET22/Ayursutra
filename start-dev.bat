@echo off
title Ayursutra Launcher
echo ========================================================
echo        Starting Ayursutra Full-Stack Application
echo ========================================================
echo.
echo [1/3] Checking MongoDB...
echo.

echo [2/3] Starting Backend (Port 5000) and Frontend (Port 5173)...
start "Ayursutra Backend (Port 5000)" cmd /k "cd ayursutra-backend && npm run dev"
start "Ayursutra Frontend (Port 5173)" cmd /k "cd ayursutra-react && npm run dev"

echo [3/3] Opening browser at http://localhost:5173 ...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================================
echo  Ayursutra is running!
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:5173
echo ========================================================
echo.
pause

