<#
   Copyright (c) 2025, Oracle and/or its affiliates.
   Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.

   This script is used to create the WDT archive file that will be used to create the local
   WebLogic Server domain to use for discovering the model section of the WKTUI Quickstart.
#>
$BASEDIR = $PSScriptRoot
if (-not $env:WKTUI_QS_HOME) {
    $env:WKTUI_QS_HOME = (get-item $BASEDIR).parent.parent.FullName
}

if (-not $env:JAVA_HOME) {
  Write-Error "JAVA_HOME environment variable must be set.  Please edit and run the ${env:WKTUI_QS_HOME}\setQuickstartEnv.sh file"
  exit 1
} elseif (-not (Test-Path -Path "$env:JAVA_HOME")) {
  Write-Error "JAVA_HOME directory ${env:JAVA_HOME} does not exist...exiting"
  exit 1
}

if (-not $env:ORACLE_HOME) {
  Write-Error "ORACLE_HOME environment variable must be set.  Please edit and run the ${env:WKTUI_QS_HOME}\setQuickstartEnv.sh file"
  exit 1
} elseif (-not (Test-Path -Path "$env:ORACLE_HOME")) {
  Write-Error "ORACLE_HOME directory ${env:ORACLE_HOME} does not exist...exiting"
  exit 1
}

if (-not $env:WLSDEPLOY_HOME) {
  Write-Error "WLSDEPLOY_HOME environment variable must be set.  Please edit and run the ${env:WKTUI_QS_HOME}\setQuickstartEnv.sh file"
  exit 1
} elseif (-not (Test-Path -Path "$env:WLSDEPLOY_HOME")) {
  Write-Error "WLSDEPLOY_HOME directory ${env:WLSDEPLOY_HOME} does not exist...exiting"
  exit 1
}

if (-not "${env:WKTUI_QS_HOME}\${env:WKTUI_QS_APP}") {
  Write-Error "WKTUI_QS_APP environment variable must be set.  Please edit and run the ${env:WKTUI_QS_HOME}\setQuickstartEnv.sh file"
  exit 1
} elseif (-not (Test-Path -Path "${env:WKTUI_QS_HOME}\${env:WKTUI_QS_APP}")) {
  Write-Error "WKTUI_QS_APP file ${env:WKTUI_QS_HOME}\${env:WKTUI_QS_APP} does not exist...exiting"
  exit 1
}

if (Test-Path -Path "${BASEDIR}\archive.zip") {
  Remove-Item "${BASEDIR}\archive.zip" -Force
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to delete existing archive file ${BASEDIR}\archive.zip...exiting"
    exit 1
  }
}

&"${env:WLSDEPLOY_HOME}\bin\archiveHelper.cmd" add application -archive_file "${BASEDIR}\archive.zip" -source "${env:WKTUI_QS_HOME}\${env:WKTUI_QS_APP}"
if ($LASTEXITCODE -eq 0) {
    Write-Output ""
    Write-Output "Successfully created the archive file at ${BASEDIR}\archive.zip"
    Write-Output ""
} else {
    Write-Error ""
    Write-Error "Failed to add the application at ${env:WKTUI_QS_HOME}\${env:WKTUI_QS_APP} to the archive file ${BASEDIR}\archive.zip...exiting"
    Write-Error ""
    exit 1
}
