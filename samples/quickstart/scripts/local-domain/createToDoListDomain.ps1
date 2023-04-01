<#
   Copyright (c) 2023, Oracle and/or its affiliates.
   Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.

   This script is used to create a local WebLogic Server domain to use for
   discovering the model section of the WKTUI Quickstart.
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

if (-not (Test-Path -Path "${env:WKTUI_QS_HOME}\todolist_domain")) {
  Get-ChildItem -Path "${env:WKTUI_QS_HOME}\todolist_domain" -Recurse | Remove-Item -Force -Recurse
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to delete existing files in domain directory ${WKTUI_QS_HOME}\todolist_domain...exiting"
    exit 1
  }

  Remove-Item "${env:WKTUI_QS_HOME}\todolist_domain" -Force   
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to delete existing domain directory ${WKTUI_QS_HOME}\todolist_domain...exiting"
    exit 1
  }
}

&"${env:WLSDEPLOY_HOME}\bin\createDomain.cmd" -oracle_home "${env:ORACLE_HOME}" -domain_parent "${env:WKTUI_QS_HOME}" -model_file "${BASEDIR}\model.yaml" -variable_file "${BASEDIR}\variables.properties" -archive_file "${BASEDIR}\archive.zip"
if ($LASTEXITCODE -eq 0) {
    Write-Output ""
    Write-Output "Successfully created the domain at ${env:WKTUI_QS_HOME}\todolist_domain"
    Write-Output ""
} else {
    Write-Error ""
    Write-Error "Failed to create the domain at ${env:WKTUI_QS_HOME}\todolist_domain...exiting"
    Write-Error ""
    exit 1
}
