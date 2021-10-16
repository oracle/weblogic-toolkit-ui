#!/bin/bash
# Copyright (c) 2021, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
#
# This script uses Hugo to generate the site for the project documentation and for archived versions.
set -o errexit
set -o pipefail

baseUrl="https://oracle.github.io/weblogic-toolkit-ui"

scriptdir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
script="${scriptdir}/$(basename "${BASH_SOURCE[0]}")"

function usage {
  echo "usage: ${script} [-o <directory>] [-h]"
  echo "  -o Output directory (optional) "
  echo "      (default: \${WORKSPACE}/documentation, if \${WORKSPACE} defined, else /tmp/weblogic-toolkit-ui) "
  echo "  -h Help"
  exit $1
}

if [ -z "${WORKSPACE}" ]; then
  outdir="/tmp/weblogic-toolkit-ui"
else
  outdir="${WORKSPACE}/documentation"
fi

while getopts "o:h" opt; do
  case $opt in
    o) outdir="${OPTARG}"
    ;;
    h) usage 0
    ;;
    *) usage 1
    ;;
  esac
done

if [ -d "${outdir}" ]; then
  rm -Rf "${outdir:?}/*"
else
  mkdir -m777 -p "${outdir}"
fi

# This grep regular expression only works for version numbers of
# the x.y style where x and y are a single digit.  This really
# should be made more generic so that it could support:
#
#   - each version place can be one or more digits
#   - each version can be of the form x.y or x.y.z
#
releaseDirs=($(cd "${scriptPath}" && ls -d */ | cut -d/ -f 1 | grep '^[0-9][.][0-9]$'))
latestRelease="<unknown>"
for i in "${releaseDirs[@]}"; do
  latestRelease=${i}
done

echo "Building documentation for current version and for selected archived versions..."
for i in "${releaseDirs[@]}"; do
  if [ ${i} != ${latestRelease} ]; then
    target="${baseUrl}/${i}"
    outputdir="${outdir}/${i}"
  else
    target=${baseUrl}
    outputdir="${outdir}"
  fi
  hugo -s ${i} -d "${outputdir}" -b "${target}"
done

echo "Successfully generated documentation in ${outdir}..."
