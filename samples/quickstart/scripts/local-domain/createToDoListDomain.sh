#!/usr/bin/env sh
#
# Copyright (c) 2023, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
#
# This script is used to create a local WebLogic Server domain to use for
# discovering the model section of the WKTUI Quickstart.
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

if [ -d "${WKTUI_QS_HOME}/todolist_domain" ]; then
  if ! rm -rf "${WKTUI_QS_HOME}/todolist_domain"; then
    echo "Failed to delete existing domain directory ${WKTUI_QS_HOME}/todolist_domain...exiting" >&2
    exit 1
  fi
fi

if ! "${WLSDEPLOY_HOME}/bin/createDomain.sh" -oracle_home "${ORACLE_HOME}" \
    -domain_parent "${WKTUI_QS_HOME}" \
    -model_file "${BASEDIR}/model.yaml" \
    -variable_file "${BASEDIR}/variables.properties" \
    -archive_file "${BASEDIR}/archive.zip"; then
  echo "" >&2
  echo "Failed to create the domain at ${WKTUI_QS_HOME}/todolist_domain...exiting" >&2
  echo "" >&2
  exit 1
else
  echo ""
  echo "Successfully created the domain at ${WKTUI_QS_HOME}/todolist_domain"
  echo ""
fi
