#!/usr/bin/env sh
#
# Copyright (c) 2020, 2023, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
#
# This script sets up the required environment for working with the
# WebLogic Kubernetes Toolkit UI Quickstart scripts and application build.
#

#############################################################
#       EDIT THIS SECTION TO MATCH YOUR ENVIRONMENT         #
#############################################################

#
# Set to the JDK 11 installation directory or delete
# if JAVA_HOME is already set in your environment
#
JAVA_HOME=/path/to/jdk/install/directory
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-11.0.17.jdk/Contents/Home
export JAVA_HOME

#
# Set to the Apache Maven directory or delete
# if M2_HOME is already set in your environment or
# if you do not plan to recompile the sample application
#
M2_HOME=/path/to/apache/maven/install/directory
M2_HOME=/Users/rpatrick/Software/apache-maven-3.8.7/bin/mvn
export M2_HOME

#
# Set to the location of the WebLogic Server installation or delete
# if the ORACLE_HOME is already set in to point to the correct
# location in your environment.
#
ORACLE_HOME=/path/to/wls_14.1.1/install/directory
ORACLE_HOME=/opt/weblogic/wls1411
export ORACLE_HOME

#
# Set to directory where WKTUI is installed.
#
# On macOS, this will typically be:
#
# WKTUI_HOME="/Applications/WebLogic Kubernetes Toolkit UI.app"
#
WKTUI_HOME=/path/to/wktui/install/directory
WKTUI_HOME="/Applications/WebLogic Kubernetes Toolkit UI.app"
export WKTUI_HOME

#
# Set to the username of your Oracle SSO account.  This is
# used to pull images from https://container-registry.oracle.com.
#
# Feel free to delete this variable and the other scripts
# will prompt you for the username.
#
ORCL_SSO_USER=jim.smith@mycompany.com
ORCL_SSO_USER=robert.patrick@oracle.com
export ORCL_SSO_USER

#
# Set to the password of your Oracle SSO account.  This is
# used to pull images from https://container-registry.oracle.com.
#
# Feel free to delete this variable and the other scripts
# will prompt you for the password.
#
ORCL_SSO_PASS='welcome1'
ORCL_SSO_PASS='D#NRcuWTw*oc!LkB7pEKVRPEqe4XMJBy'
export ORCL_SSO_PASS

#
# Set to the name of the program you are using to create
# container images (i.e., docker or podman)
#
IMAGE_BUILDER_NAME=docker
export IMAGE_BUILDER_NAME

#############################################################
#                 DO NOT EDIT BELOW HERE                    #
#############################################################

WKTUI_QS_HOME="$( cd "$( dirname "$0" )" && pwd )"; export WKTUI_QS_HOME

platform=$(uname)
if [ "${platform}" = "Darwin" ]; then
  WLSDEPLOY_HOME="${WKTUI_HOME}/Contents/tools/weblogic-deploy"
else
  WLSDEPLOY_HOME="${WKTUI_HOME}/tools/weblogic-deploy"
fi
export WLSDEPLOY_HOME

if [ -n "${IMAGE_BUILDER_NAME}" ]; then
  IMAGE_BUILDER_EXE=$(command -v "${IMAGE_BUILDER_NAME}")
  if [ -z "${IMAGE_BUILDER_EXE}" ]; then
    echo "Unable to find ${IMAGE_BUILDER_NAME} on the PATH...exiting" >&2
    exit 1
  elif [ ! -x "${IMAGE_BUILDER_EXE}" ]; then
    echo "${IMAGE_BUILDER_EXE} is not executable...exiting" >&2
    exit 1
  fi
  export IMAGE_BUILDER_EXE
fi
