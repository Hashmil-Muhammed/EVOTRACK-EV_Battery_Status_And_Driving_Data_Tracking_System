@echo off
echo =========================================
echo Starting  LogCar Battery Application...
echo =========================================
echo.
echo The application will open at: http://127.0.0.1:8000
echo Press Ctrl+C in this window to stop the server.
echo.

:: Activate the virtual environment
call .\venv\Scripts\activate.bat

:: Start the FastAPI server
uvicorn main:app --reload

:: Wait for user input if the server stops unexpectedly
pause
