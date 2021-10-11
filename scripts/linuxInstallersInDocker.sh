#!/usr/bin/env /bin/bash
#
# Copyright (c) 2021, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
#
# Clean up any old installer-related artifacts that might exist.
#
# This should never happen if the Jenkins job is cleaning the workspace prior to checkout.
#
rm -rf /project/dist

#
# When building the installers inside the docker image and writing the files
# to the bind-mounted volume, the files are owned by root.  This prevents
# Jenkins from cleaning up the workspace.
#
# To get around this issue, we need to run the build job inside the container
# using a user whose name is the same as the user the Jenkins job is running as.
#
if [ -z "${WKTUI_USER}" ] || [ -z "${WKTUI_UID}" ]; then
  echo "WKTUI_USER and WKTUI_UID environment variables must be set" 1>&2
  exit 1
fi
if [ -z "${WKTUI_GROUP}" ] || [ -z "${WKTUI_GID}" ]; then
  echo "WKTUI_GROUP and WKTUI_GID environment variables must be set" 1>&2
  exit 1
fi

groupadd --gid "${WKTUI_GID}" "${WKTUI_GROUP}"
useradd --gid "${WKTUI_GID}" --uid "${WKTUI_UID}" --shell /bin/bash --no-create-home "${WKTUI_USER}"

# Electron Builder seems to rely on the user's home directory being present...
mkdir -p "/home/${WKTUI_USER}"
chmod 777 "/home/${WKTUI_USER}"

# Electron Builder tries to create /scratch when it needs to build a binary (rather than using prebuilt binaries)
# so create it prior to running it with the necessary permissions.
mkdir -p "/scratch"
chmod 777 "/scratch"

#
# Build the installers
#
cd /project/electron || exit
NPM_COMMAND="npm run build:installer"
if [ "${HTTPS_PROXY}" != "" ]; then
  NPM_COMMAND="HTTPS_PROXY=${HTTPS_PROXY} $NPM_COMMAND"
fi

su "${WKTUI_USER}" --command "${NPM_COMMAND}"

NPM_EXIT_CODE=$?
if [ ${NPM_EXIT_CODE} -ne 0 ]; then
  exit ${NPM_EXIT_CODE}
fi
