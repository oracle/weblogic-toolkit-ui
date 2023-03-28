<#
   Copyright (c) 2020, 2023, Oracle and/or its affiliates.
   Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.

   This script sets up the required environment for working with the
   WebLogic Kubernetes Toolkit UI Quickstart scripts and application build.
#>

#############################################################
#       EDIT THIS SECTION TO MATCH YOUR ENVIRONMENT         #
#############################################################

#
# Set to the JDK 11 installation directory or delete
# if JAVA_HOME is already set in your environment
#
$env:JAVA_HOME = "c:\path\to\jdk\install\directory"

#
# Set to the Apache Maven directory or delete
# if M2_HOME is already set in your environment or
# if you do not plan to recompile the sample application
#
$env:M2_HOME = "c:\path\to\apache\maven\install\directory"

#
# Set to the location of the WebLogic Server installation or delete
# if the ORACLE_HOME is already set in to point to the correct
# location in your environment.
#
$env:ORACLE_HOME = "c:\path\to\wls_14.1.1\install\directory"

#
# Set to directory where WKTUI is installed.
#
# On Windows, this will typically be:
#
# $env:WKTUI_HOME="c:\Program Files\WebLogic Kubernetes Toolkit UI"
#
$env:WKTUI_HOME = "c:\Program Files\WebLogic Kubernetes Toolkit UI"

#
# Set to the username of your Oracle SSO account.  This is
# used to pull images from https://container-registry.oracle.com.
#
# Feel free to delete this variable and the other scripts
# will prompt you for the username.
#
$env:ORCL_SSO_USER = "jim.smith@mycompany.com"

#
# Set to the password of your Oracle SSO account.  This is
# used to pull images from https://container-registry.oracle.com.
#
# Feel free to delete this variable and the other scripts
# will prompt you for the password.
#
$env:ORCL_SSO_PASS = 'welcome1'

#
# Set to the name of the program you are using to create
# container images (i.e., docker or podman)
#
$env:IMAGE_BUILDER_EXE=docker

#############################################################
#                 DO NOT EDIT BELOW HERE                    #
#############################################################

if (-not $env:WKTUI_QS_HOME) {
    $env:WKTUI_QS_HOME = (get-item $PSScriptRoot).FullName
}
$env:WLSDEPLOY_HOME = Join-Path -Path "$env:WKTUI_HOME" -ChildPath "\tools\weblogic-deploy"
