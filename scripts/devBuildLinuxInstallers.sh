#!/usr/bin/env sh
#
# Copyright (c) 2021, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
#
SCRIPT_DIR=$(dirname "$0")
export WORKSPACE=$(cd "${SCRIPT_DIR}/.."; pwd)
if [ "${WKTUI_DEV_PROXY}" != "" ]; then
  export WKTUI_PROXY=${WKTUI_DEV_PROXY}
fi

if [ "$1" = "-podman" ]; then
  USE_PODMAN="true"
fi

BUILDER_VERSION=14-05.21
WKTUI_ENV_FILE="${WORKSPACE}/docker.env"
echo "WKTUI_USER=$(id -un)" > "${WKTUI_ENV_FILE}"
# shellcheck disable=SC2129
echo "WKTUI_UID=$(id -u)" >> "${WKTUI_ENV_FILE}"
echo "WKTUI_GROUP=$(id -gn)" >> "${WKTUI_ENV_FILE}"
echo "WKTUI_GID=$(id -g)" >> "${WKTUI_ENV_FILE}"

if [ -n "${WKTUI_PROXY}" ]; then
  echo "HTTPS_PROXY=${WKTUI_PROXY}" >> "${WKTUI_ENV_FILE}"
fi

DOCKER=docker
if [ "${USE_PODMAN}" = "true" ]; then
  DOCKER=podman
fi

${DOCKER} run --rm -v "${WORKSPACE}:/project" --env-file "${WKTUI_ENV_FILE}" electronuserland/builder:${BUILDER_VERSION} /project/scripts/linuxInstallersInDocker.sh
