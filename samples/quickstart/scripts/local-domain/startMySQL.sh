#!/usr/bin/env sh
#
# Copyright (c) 2023, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
#
# This script starts up a MySQL database in a container using the
# host's networking (to make it simpler).  There is no persistence
# directory so any changes made to the data can be reset by simply
# restarting the container.
#

BASEDIR="$( cd "$( dirname "$0" )" && pwd )"
if [ -z "${WKTUI_QS_HOME}" ]; then
  WKTUI_QS_HOME="$( cd "${BASEDIR}/../.." && pwd )"; export WKTUI_QS_HOME
fi

if [ -z "${IMAGE_BUILDER_NAME}" ]; then
  echo "IMAGE_BUILDER_NAME environment variable must be set.  Please edit and source the ${WKTUI_QS_HOME}/setQuickstartEnv.sh file" >&2
  exit 1
elif [ -z "${IMAGE_BUILDER_EXE}" ]; then
  echo "IMAGE_BUILDER_EXE environment variable must be set.  Please edit and source the ${WKTUI_QS_HOME}/setQuickstartEnv.sh file" >&2
  exit 1
fi

if [ -z "${ORCL_SSO_USER}" ]; then
  printf "Please enter your Oracle SSO account username: "
  read -r ORCL_SSO_USER
  if [ -z "${ORCL_SSO_USER}" ]; then
    echo "No Oracle SSO account username provided...exiting" >&2
    exit 1
  fi
fi

if [ -z "${ORCL_SSO_PASS}" ]; then
  stty -echo
  printf "Please enter your Oracle SSO account Auth Token for the Oracle Container Registry: "
  read -r ORCL_SSO_USER
  stty echo
  if [ -z "${ORCL_SSO_PASS}" ]; then
    echo "No Oracle SSO account Auth Token for the Oracle Container Registry provided...exiting" >&2
    exit 1
  fi
  echo ""
fi

if [ -z "${MYSQL_ROOT_PASS}" ]; then
  stty -echo
  printf "Please enter a password for the MySQL root user: "
  read -r MYSQL_ROOT_PASS
  stty echo
  if [ -z "${MYSQL_ROOT_PASS}" ]; then
    echo "No MySQL root user password provided...exiting" >&2
    exit 1
  fi
  echo ""
fi

if [ -z "${MYSQL_USER}" ]; then
  printf "Please enter a MySQL username: "
  read -r MYSQL_USER
  if [ -z "${MYSQL_USER}" ]; then
    echo "No MySQL username provided...exiting" >&2
    exit 1
  fi
fi

if [ -z "${MYSQL_USER_PASS}" ]; then
  stty -echo
  printf "Please enter a MySQL user password: "
  read -r MYSQL_USER_PASS
  stty echo
  if [ -z "${MYSQL_USER_PASS}" ]; then
    echo "No MySQL user password provided...exiting" >&2
    exit 1
  fi
  echo ""
fi

if ! echo "${ORCL_SSO_PASS}" | "${IMAGE_BUILDER_EXE}" login container-registry.oracle.com \
    -u "${ORCL_SSO_USER}" --password-stdin; then
  echo "Failed to ${IMAGE_BUILDER_NAME} login to container-registry.oracle.com...exiting" >&2
  exit 1
fi

if ! "${IMAGE_BUILDER_EXE}" run \
    --name=mysql \
    --network=host \
    -e "MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASS}" \
    -e "MYSQL_USER=${MYSQL_USER}" \
    -e "MYSQL_PASSWORD=${MYSQL_USER_PASS}" \
    -e MYSQL_DATABASE=tododb \
    --mount type=bind,src="${WKTUI_QS_HOME}/sql/",dst=/docker-entrypoint-initdb.d/ \
    -d container-registry.oracle.com/mysql/community-server:8.4.7${MYSQL_ARCH_TAG_SUFFIX}; then
  echo "Failed to start MySQL database container...exiting" >&2
  exit 1
fi
