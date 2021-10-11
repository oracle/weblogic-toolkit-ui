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

${SCRIPT_DIR}/linuxInstallers.sh
