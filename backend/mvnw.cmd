@REM Maven Wrapper for Windows — tự tải Maven 3.9.6 nếu chưa có
@echo off
setlocal

set MAVEN_VERSION=3.9.6
set MAVEN_DIR=%USERPROFILE%\.m2\wrapper\apache-maven-%MAVEN_VERSION%
set MAVEN_ZIP=%USERPROFILE%\.m2\wrapper\apache-maven-%MAVEN_VERSION%-bin.zip
set MAVEN_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip

if not exist "%MAVEN_DIR%\bin\mvn.cmd" (
    echo [mvnw] Maven %MAVEN_VERSION% chua co, dang tai xuong...
    if not exist "%USERPROFILE%\.m2\wrapper" mkdir "%USERPROFILE%\.m2\wrapper"
    powershell -Command "Invoke-WebRequest -Uri '%MAVEN_URL%' -OutFile '%MAVEN_ZIP%'"
    echo [mvnw] Giai nen Maven...
    powershell -Command "Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%USERPROFILE%\.m2\wrapper' -Force"
    del "%MAVEN_ZIP%"
    echo [mvnw] Maven san sang.
)

set PATH=%MAVEN_DIR%\bin;%PATH%
mvn %*
