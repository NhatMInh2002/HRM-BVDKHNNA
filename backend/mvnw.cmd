@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF)
@REM Maven Wrapper Script for Windows
@REM ----------------------------------------------------------------------------
@echo off

set MAVEN_WRAPPER_JAR=%~dp0.mvn\wrapper\maven-wrapper.jar

if exist "%MAVEN_WRAPPER_JAR%" (
  "%JAVA_HOME%\bin\java.exe" -jar "%MAVEN_WRAPPER_JAR%" %*
) else (
  mvn %*
)
