@echo off
echo ==============================================
echo HEALTHCARE MULTI-DISEASE PREDICTION HUB
echo ==============================================
echo.
echo [0] Purging active port nodes (5000, 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a 2>nul
echo.
echo [1] Launching Python Backend...
start "Backend" cmd /k ".\venv\Scripts\python app/main.py"
echo.
echo [2] Launching React Development Server...
start "Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo ----------------------------------------------
echo Backend running on: http://127.0.0.1:5000
echo Frontend running on: http://localhost:5173
echo ----------------------------------------------
echo.
echo Press any key to stop this script and keep services running (Windows).
pause > nul
