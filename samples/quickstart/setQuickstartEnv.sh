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
JAVA_HOME=""
export JAVA_HOME

#
# Set to the Apache Maven directory or delete
# if M2_HOME is already set in your environment or
# if you do not plan to recompile the sample application
#
M2_HOME=""
export M2_HOME

#
# Set to the location of the WebLogic Server installation or delete
# if the ORACLE_HOME is already set in to point to the correct
# location in your environment.
#
ORACLE_HOME=""
export ORACLE_HOME

#
# Set to directory where WKTUI is installed.
#
# On macOS, this will typically be:
#
#     WKTUI_HOME="/Applications/WebLogic Kubernetes Toolkit UI.app"
#
# On Linux, it depends on installer used.
#
#     For the RPM or DEB installer, this will typically be:
#
#         WKTUI_HOME='/opt/WebLogic Kubernetes Toolkit UI"
#
#     For the AppImage executable, this will be the path
#     to the executable file.  For example:
#
#         WKTUI_HOME='/home/robert/WebLogic Kubernetes Toolkit UI-1.5.3.AppImage'
#
WKTUI_HOME=""
export WKTUI_HOME

#
# Set to the username of your Oracle SSO account.  This is
# used to pull images from https://container-registry.oracle.com.
#
# Feel free to leave this variable empty.  The scripts that use
# this value will prompt you for the username.
#
ORCL_SSO_USER=''
export ORCL_SSO_USER

#
# Set to the password of your Oracle SSO account.  This is
# used to pull images from https://container-registry.oracle.com.
#
# Feel free to leave this variable empty.  The scripts that use
# this value will prompt you for the password.
#
ORCL_SSO_PASS=''
export ORCL_SSO_PASS

#
# Set to the value you want to use for the WebLogic Server
# administrative username.
#
# Feel free to leave this variable empty.  The scripts that use
# this value will prompt you for the username.
#
WEBLOGIC_USER=''
export WEBLOGIC_USER

#
# Set to the value you want to use for the WebLogic Server
# administrative password.
#
# Feel free to leave this variable empty.  The scripts that use
# this value will prompt you for the password.
#
WEBLOGIC_PASS=''
export WEBLOGIC_PASS

#
# Set to the value you want to use for the MySQL admin password.
#
# Feel free to leave this variable empty.  The scripts that use
# this value will prompt you for the password.
#
MYSQL_ROOT_PASS=''
export MYSQL_ROOT_PASS

#
# Set to the value you want to use for the MySQL username.
#
# Feel free to leave this variable empty.  The scripts that use
# this value will prompt you for the username.
#
MYSQL_USER=''
export MYSQL_USER

#
# Set to the value you want to use for the MySQL user's password.
#
# Feel free to leave this variable empty.  The scripts that use
# this value will prompt you for the password.
#
MYSQL_USER_PASS=''
export MYSQL_USER_PASS

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
