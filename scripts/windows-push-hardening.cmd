@echo off
setlocal EnableExtensions
REM Pure CMD helper - no PowerShell. Double-click or run from Command Prompt.
REM Resets this repo to the fixed branch, then runs the portfolio push script
REM via Git Bash if available, otherwise prints the GitHub Actions one-click path.

cd /d "%USERPROFILE%\Documents\Policestationrepuk" 2>nul
if errorlevel 1 (
  echo Clone Policestationrepuk into Documents first:
  echo   git clone https://github.com/robertcashman-bit/Policestationrepuk.git "%USERPROFILE%\Documents\Policestationrepuk"
  pause
  exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
  echo Git not found. Install from https://git-scm.com/download/win
  pause
  exit /b 1
)

echo.
echo === Resetting to fixed branch ===
git fetch origin cursor/security-hardening-uplift-34ef
if errorlevel 1 (
  echo git fetch failed
  pause
  exit /b 1
)
git checkout -B cursor/security-hardening-uplift-34ef origin/cursor/security-hardening-uplift-34ef
git reset --hard origin/cursor/security-hardening-uplift-34ef

echo.
echo EASIEST PATH: use GitHub Actions in the browser instead of this PC.
echo   1. Open https://github.com/robertcashman-bit/Policestationrepuk/settings/secrets/actions
echo   2. New repository secret  Name=PORTFOLIO_PUSH_PAT  Value=your ghp_ token
echo   3. Open https://github.com/robertcashman-bit/Policestationrepuk/actions/workflows/portfolio-security-push.yml
echo   4. Click Run workflow
echo.
echo Or continue here to push from this PC.
echo.

set /p GH_TOKEN=Paste GitHub PAT ^(ghp_...^) then Enter: 
if "%GH_TOKEN%"=="" (
  echo No token entered.
  pause
  exit /b 1
)
set GITHUB_TOKEN=%GH_TOKEN%
set SKIP_PR=1

REM Prefer Git Bash for the .sh script
set "BASH="
if exist "%ProgramFiles%\Git\bin\bash.exe" set "BASH=%ProgramFiles%\Git\bin\bash.exe"
if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "BASH=%ProgramFiles(x86)%\Git\bin\bash.exe"
if exist "%LocalAppData%\Programs\Git\bin\bash.exe" set "BASH=%LocalAppData%\Programs\Git\bin\bash.exe"

if defined BASH (
  echo Running push via Git Bash...
  "%BASH%" -lc "cd '%CD%' && ./scripts/push-portfolio-security-hardening.sh"
  set ERR=%ERRORLEVEL%
) else (
  echo Git Bash not found - cannot run .sh on this PC.
  echo Use the GitHub Actions steps printed above instead.
  set ERR=1
)

set GH_TOKEN=
set GITHUB_TOKEN=
echo.
if "%ERR%"=="0" (
  echo DONE
) else (
  echo Finished with errors. Prefer the GitHub Actions one-click path above.
)
pause
exit /b %ERR%
