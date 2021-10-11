#!/usr/bin/env bash
#
# Copyright (c) 2021, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
#
# This script is used by the Jenkinsfile to build the linux installers
# using the electronuserland/builder docker image.
#
# When building the installers inside the docker image and writing the files
# to the bind-mounted volume, the files are owned by root.  This prevents
# Jenkins from cleaning up the workspace.
#
# To get around this issue, we need to run the build job inside the container
# using a user whose name is the same as the user the Jenkins job is running as.
#
#BUILDER_VERSION=12-11.19
#BUILDER_VERSION=14-03.21
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

docker run --rm -v "${WORKSPACE}:/project" --env-file "${WKTUI_ENV_FILE}" electronuserland/builder:${BUILDER_VERSION} /project/scripts/linuxInstallersInDocker.sh
