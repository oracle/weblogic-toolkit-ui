#!/usr/bin/env sh
#
# Copyright (c) 2025, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
#
# This script is used to create the WDT archive file that will be used to create the local
# WebLogic Server domain to use for discovering the model section of the WKTUI Quickstart.
#

BASEDIR="$( cd "$( dirname "$0" )" && pwd )"
if [ -z "${WKTUI_QS_HOME}" ]; then
  WKTUI_QS_HOME="$( cd "${BASEDIR}/../.." && pwd )"; export WKTUI_QS_HOME
fi

if [ -z "${JAVA_HOME}" ]; then
  echo "JAVA_HOME environment variable must be set.  Please edit and source the ${WKTUI_QS_HOME}/setQuickstartEnv.sh file" >&2
  exit 1
elif [ ! -d "${JAVA_HOME}" ]; then
  echo "JAVA_HOME directory ${JAVA_HOME} does not exist...exiting" >&2
  exit 1
fi

if [ -z "${ORACLE_HOME}" ]; then
  echo "ORACLE_HOME environment variable must be set.  Please edit and source the ${WKTUI_QS_HOME}/setQuickstartEnv.sh file" >&2
  exit 1
elif [ ! -d "${ORACLE_HOME}" ]; then
  echo "ORACLE_HOME directory ${ORACLE_HOME} does not exist...exiting" >&2
  exit 1
fi

if [ -z "${WLSDEPLOY_HOME}" ]; then
  echo "WLSDEPLOY_HOME environment variable must be set.  Please edit and source the ${WKTUI_QS_HOME}/setQuickstartEnv.sh file" >&2
  exit 1
elif [ ! -d "${WLSDEPLOY_HOME}" ]; then
  echo "WLSDEPLOY_HOME directory ${WLSDEPLOY_HOME} does not exist...exiting" >&2
  exit 1
fi

if [ -z "${WKTUI_QS_HOME}/${WKTUI_QS_APP}" ]; then
  echo "WKTUI_QS_APP environment variable must be set.  Please edit and source the ${WKTUI_QS_HOME}/setQuickstartEnv.sh file" >&2
  exit 1
elif [ ! -f "${WKTUI_QS_HOME}/${WKTUI_QS_APP}" ]; then
  echo "WKTUI_QS_APP file ${WKTUI_QS_HOME}/${WKTUI_QS_APP} does not exist...exiting" >&2
  exit 1
fi

if ! rm -rf "${BASEDIR}/archive.zip"; then
  echo "Failed to delete existing archive file ${BASEDIR}/archive.zip...exiting" >&2
  exit 1
fi

if ! "${WLSDEPLOY_HOME}/bin/archiveHelper.sh" add application -archive_file "${BASEDIR}/archive.zip" -source "${WKTUI_QS_HOME}/${WKTUI_QS_APP}"; then
  echo "" >&2
  echo "Failed to add the application at ${WKTUI_QS_HOME}/${WKTUI_QS_APP} to the archive file ${BASEDIR}/archive.zip...exiting" >&2
  echo "" >&2
  exit 1
else
  echo ""
  echo "Successfully created the archive file at ${BASEDIR}/archive.zip"
  echo ""
fi
