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
    $ORCL_SSO_PASS = Read-Host "Please enter your Oracle SSO account password: " -AsSecureString
    if (-not $ORCL_SSO_PASS) {
        Write-Error "No Oracle SSO account password provided...exiting"
        exit 1
    }
    $env:ORCL_SSO_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ORCL_SSO_PASS))
}

$argList = "login container-registry.oracle.com -u `"$env:ORCL_SSO_USER`" -p `"$env:ORCL_SSO_PASS`""

$proc = Start-Process -NoNewWindow -FilePath "$env:IMAGE_BUILDER_EXE" -ArgumentList "$argList" -PassThru
Wait-Process -InputObject $proc
if ($proc.ExitCode -ne 0) {
    Write-Error "Failed to log in to the image registry container-registry.oracle.com"
    exit 1
}

$argList = "run --name=mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=manager1 -e MYSQL_USER=weblogic -e MYSQL_PASSWORD=welcome1 -e MYSQL_DATABASE=tododb --mount type=bind,src=`"${env:WKTUI_QS_HOME}\sql\\`",dst=/docker-entrypoint-initdb.d/ -d container-registry.oracle.com/mysql/community-server:8.0.32"
Write-Output "argList = $argList"

$proc = Start-Process -NoNewWindow -FilePath "$env:IMAGE_BUILDER_EXE" -ArgumentList "$argList" -PassThru
Wait-Process -InputObject $proc
if ($proc.ExitCode -ne 0) {
  Write-Error "Failed to start MySQL database container...exiting"
  exit 1
}

