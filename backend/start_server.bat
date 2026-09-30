@echo off
cd C:\Users\Lenovo\Downloads\ONION\ONION\backend
venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload