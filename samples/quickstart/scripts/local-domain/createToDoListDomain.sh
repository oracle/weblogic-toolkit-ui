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

if [ -z "${WEBLOGIC_USER}" ]; then
  printf "Please enter a WebLogic username: "
  read -r WEBLOGIC_USER
  if [ -z "${WEBLOGIC_USER}" ]; then
    echo "No WebLogic username provided...exiting" >&2
    exit 1
  fi
fi

if [ -z "${WEBLOGIC_PASS}" ]; then
  stty -echo
  printf "Please enter a WebLogic user password: "
  read -r WEBLOGIC_PASS
  stty echo
  if [ -z "${WEBLOGIC_PASS}" ]; then
    echo "No WebLogic user password provided...exiting" >&2
    exit 1
  fi
  echo ""
fi

if [ -z "${MYSQL_USER}" ]; then
  printf "Please enter the MySQL username: "
  read -r MYSQL_USER
  if [ -z "${MYSQL_USER}" ]; then
    echo "No MySQL username provided...exiting" >&2
    exit 1
  fi
fi

if [ -z "${MYSQL_USER_PASS}" ]; then
  stty -echo
  printf "Please enter the MySQL user's password: "
  read -r MYSQL_USER_PASS
  stty echo
  if [ -z "${MYSQL_USER_PASS}" ]; then
    echo "No MySQL user password provided...exiting" >&2
    exit 1
  fi
  echo ""
fi

#
# Generate the variables.properties file
#

if [ -f "${BASEDIR}/variables.properties" ]; then
  if ! rm -f "${BASEDIR}/variables.properties"; then
    echo "Failed to delete generated ${BASEDIR}/variables.properties file...exiting" >&2
    exit 1
  fi
fi

if ! cp "${BASEDIR}/variables.properties.template" "${BASEDIR}/variables.properties"; then
  echo "Failed to copy ${BASEDIR}/variables.properties.template to ${BASEDIR}/variables.properties file...exiting" >&2
  exit 1
fi
if ! echo "WebLogicAdminUserName=${WEBLOGIC_USER}" >> "${BASEDIR}/variables.properties"; then
  echo "Failed to write WebLogicAdminUserName entry to ${BASEDIR}/variables.properties file...exiting" >&2
  exit 1
fi
if ! echo "WebLogicAdminPassword=${WEBLOGIC_PASS}" >> "${BASEDIR}/variables.properties"; then
  echo "Failed to write WebLogicAdminPassword entry to ${BASEDIR}/variables.properties file...exiting" >&2
  exit 1
fi
if ! echo "JDBC.myDataSource.user=${MYSQL_USER}" >> "${BASEDIR}/variables.properties"; then
  echo "Failed to write JDBC.myDataSource.user entry to ${BASEDIR}/variables.properties file...exiting" >&2
  exit 1
fi
if ! echo "JDBC.myDataSource.password=${MYSQL_USER_PASS}" >> "${BASEDIR}/variables.properties"; then
  echo "Failed to write JDBC.myDataSource.password entry to ${BASEDIR}/variables.properties file...exiting" >&2
  exit 1
fi

#
# Create the domain
#

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

#
# Remove generated variables.properties file with credentials
#

if ! rm -f "${BASEDIR}/variables.properties"; then
  echo "Failed to delete the generated ${BASEDIR}/variables.properties file with the WebLogic and MySQL credentials!" >&2
  exit 1
fi
