#!/bin/sh

### USAGE

# Copied and merged from
# https://github.com/bacongravy/nativefier/tree/92a185ee59f1c54dea32b41da9d78d903afca49e/bin
# see also
# https://forum.xojo.com/13390-create-icns-file/53

# ./convertToIcns <input png> <outp icns>
# Example
# ./convertToIcns ~/sample.png ~/Desktop/converted.icns

# exit the shell script on error immediately
set -e

make_iconset_imagemagick() {
  local file iconset
  file="${1}"
  iconset="${2}"

  mkdir "$iconset"

  for size in {16,32,64,128,256,512}; do
    convert "${file}" -define png:big-depth=16 -define png:color-type=6 -sample "${size}x${size}" "${iconset}/icon_${size}x${size}.png"
    convert "${file}" -define png:big-depth=16 -define png:color-type=6 -sample "$((size * 2))x$((size * 2))" "${iconset}/icon_${size}x${size}@2x.png"
  done
}

make_iconset_sips() {
  local file iconset
  file="${1}"
  iconset="${2}"

  mkdir "$iconset"

  for size in {16,32,128,256,512}; do
    sips --setProperty format png --resampleHeightWidth "${size}" "${size}" "${file}" --out "${iconset}/icon_${size}x${size}.png" &> /dev/null
    sips --setProperty format png --resampleHeightWidth "$((size * 2))" "$((size * 2))" "${file}" --out "${iconset}/icon_${size}x${size}@2x.png" &> /dev/null
  done
}

# Exec Paths
HAVE_IMAGEMAGICK=
HAVE_ICONUTIL=
HAVE_SIPS=

type convert &>/dev/null && HAVE_IMAGEMAGICK=true
type iconutil &>/dev/null && HAVE_ICONUTIL=true
type sips &>/dev/null && HAVE_SIPS=true

[[ -z "$HAVE_ICONUTIL" ]] && { echo >&2 "Cannot find required iconutil executable"; exit 1; }
[[ -z "$HAVE_IMAGEMAGICK" && -z "$HAVE_SIPS" ]] && { echo >&2 "Cannot find required image converter, please install sips or imagemagick"; exit 1; }

# Parameters
SOURCE="$1"
DEST="$2"

# Check source and destination arguments
if [ -z "${SOURCE}" ]; then
	echo "No source image specified"
	exit 1
fi

if [ -z "${DEST}" ]; then
	echo "No destination specified"
	exit 1
fi

TEMP_DIR="$(mktemp -d -t iconset)"
ICONSET="${TEMP_DIR}/converted.iconset"

echo >&2 $ICONSET

function cleanUp() {
    rm -rf "${TEMP_DIR}"
}

# trap cleanUp EXIT

if [[ -e "$(which convert)" ]]; then
  PNG_PATH="$(mktemp -d)/icon.png"
  "${BASH_SOURCE%/*}/convertToPng" "${SOURCE}" "${PNG_PATH}"
  make_iconset_imagemagick "${PNG_PATH}" "${ICONSET}"
elif [[ -e "$(which sips)" ]]; then
  make_iconset_sips "${SOURCE}" "${ICONSET}"
else
  echo >&2 "Cannot find convert or sips executables"; exit 1;
fi

# Create an icns file lefrom the iconset
iconutil -c icns "${ICONSET}" -o "${DEST}"

# trap - EXIT
# cleanUp
