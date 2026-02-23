@echo off
title KeTeaAI - Backend
cd /d "%~dp0"
echo.
echo Demarrage du serveur KeTeaAI...
echo.
python api.py
if errorlevel 1 (
  echo.
  echo Erreur : Python ou les dependances sont peut-etre manquants.
  echo Essayez : pip install -r requirements.txt
  echo.
  pause
)
