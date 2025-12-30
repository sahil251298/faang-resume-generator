#!/bin/bash

# Start Backend
echo "Starting Backend..."
cd backend
# Check if venv exists, if not just run python (user environment)
# Assuming dependencies installed in user env as done in steps.
nohup python3 main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend running with PID $BACKEND_PID"

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend running with PID $FRONTEND_PID"

echo "Application is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press CTRL+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
