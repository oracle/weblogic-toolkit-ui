<#
   Copyright (c) 2023, Oracle and/or its affiliates.
   Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.

   This script starts up a MySQL database in a container using the
   host's networking (to make it simpler).  There is no persistence
   directory so any changes made to the data can be reset by simply
   restarting the container.
#>
$BASEDIR = $PSScriptRoot
if (-not $env:WKTUI_QS_HOME) {
    $env:WKTUI_QS_HOME = (get-item $BASEDIR).parent.parent.FullName
}

if (-not $env:IMAGE_BUILDER_EXE) {
  Write-Error "IMAGE_BUILDER_EXE environment variable must be set.  Please edit and run the ${env:WKTUI_QS_HOME}\setQuickstartEnv.sh file"
  exit 1
}

if (-not $env:ORCL_SSO_USER) {
    $env:ORCL_SSO_USER = Read-Host "Please enter your Oracle SSO account username: "
    if (-not $env:ORCL_SSO_USER) {
        Write-Error "No Oracle SSO account username provided...exiting"
        exit 1
    }
}

if (-not $env:ORCL_SSO_PASS) {
    $ORCL_SSO_PASS = Read-Host "Please enter your Oracle SSO account Auth Token for the Oracle Container Registry: " -AsSecureString
    if (-not $ORCL_SSO_PASS) {
        Write-Error "No Oracle SSO account Auth Token for the Oracle Container Registry provided...exiting"
        exit 1
    }
    $env:ORCL_SSO_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ORCL_SSO_PASS))
}

if (-not $env:MYSQL_ROOT_PASS) {
    $MYSQL_ROOT_PASS = Read-Host "Please enter a password for the MySQL root user: " -AsSecureString
    if (-not $MYSQL_ROOT_PASS) {
        Write-Error "No MySQL root user password provided...exiting"
        exit 1
    }
    $env:MYSQL_ROOT_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($MYSQL_ROOT_PASS))
}

if (-not $env:MYSQL_USER) {
    $env:MYSQL_USER = Read-Host "Please enter a MySQL username: "
    if (-not $env:MYSQL_USER) {
        Write-Error "No MySQL username provided...exiting"
        exit 1
    }
}

if (-not $env:MYSQL_USER_PASS) {
    $MYSQL_USER_PASS = Read-Host "Please enter a MySQL user password: " -AsSecureString
    if (-not $MYSQL_USER_PASS) {
        Write-Error "No MySQL user password provided...exiting"
        exit 1
    }
    $env:MYSQL_USER_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($MYSQL_USER_PASS))
}

$argList = "login container-registry.oracle.com -u `"$env:ORCL_SSO_USER`" -p `"$env:ORCL_SSO_PASS`""

$proc = Start-Process -NoNewWindow -FilePath "$env:IMAGE_BUILDER_EXE" -ArgumentList "$argList" -PassThru
Wait-Process -InputObject $proc
if ($proc.ExitCode -ne 0) {
    Write-Error "Failed to log in to the image registry container-registry.oracle.com"
    exit 1
}

$argList = "run --name=mysql -p 3306:3306 -e `"MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASS}`" " `
    + "-e `"MYSQL_USER=${MYSQL_USER}`" -e `"MYSQL_PASSWORD=${MYSQL_USER_PASS}`" " `
    + "-e MYSQL_DATABASE=tododb " `
    + "--mount type=bind,src=`"${env:WKTUI_QS_HOME}\sql\\`",dst=/docker-entrypoint-initdb.d/ " `
    + "-d container-registry.oracle.com/mysql/community-server:8.4.7"

$proc = Start-Process -NoNewWindow -FilePath "$env:IMAGE_BUILDER_EXE" -ArgumentList "$argList" -PassThru
Wait-Process -InputObject $proc
if ($proc.ExitCode -ne 0) {
  Write-Error "Failed to start MySQL database container...exiting"
  exit 1
}

