@ECHO OFF
@SETLOCAL

@set "SCRIPT_DIR=%~dp0"
@IF %SCRIPT_DIR:~-1%==\ SET SCRIPT_DIR=%SCRIPT_DIR:~0,-1%
for %%f in ("%SCRIPT_DIR%") do set Name=%%~nxf

@set ARG_COUNT=0
@for %%x in (%*) do Set /A ARG_COUNT+=1

@echo Hello World from %Name% with %ARG_COUNT% arguments
