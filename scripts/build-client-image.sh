#!/usr/bin/env sh
set -eu

if [ "$#" -ne 3 ]; then
  echo "Uso: $0 <registry/repository> <aplicacion> <cliente>" >&2
  exit 1
fi

repository="$1"
app_name="$2"
client_name="$3"
tag="${repository}/${app_name}-${client_name}:0.1.0"

docker build \
  --build-arg "APP_NAME=${app_name}" \
  --build-arg "CLIENT_NAME=${client_name}" \
  --build-arg "MONGO_COLLECTION=${client_name}" \
  --tag "$tag" \
  .

echo "Imagen creada: $tag"
