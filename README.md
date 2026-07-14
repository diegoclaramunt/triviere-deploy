# Réplica de despliegue Angular + Express + MongoDB

Aplicación ficticia `cat/acme` para ensayar una imagen por cliente y su
despliegue en Kubernetes sin solaparse con clientes reales. La referencia de
arquitectura procede de las implementaciones CAT existentes: `distriplac`,
`gedia`, `kerry`, `pere-tarres` y `port`.

## Arquitectura

```text
https://cat.trivierepartners.com/acme/
                 │
                 ▼
        Ingress: host común + /acme
                 │
                 ▼
          Service cat-acme:80
                 │
                 ▼
          Pod cat-acme:3000
            ├── Angular estático
            ├── Express /acme/api
            └── MongoDB → colección acme
```

La imagen es específica del cliente: `cat-acme:<versión>`. `APP_NAME`,
`CLIENT_NAME` y `MONGO_COLLECTION` son variables de configuración. `MONGO_URI`
contiene credenciales y se inyecta en ejecución mediante un Secret; nunca se
incluye en la imagen.

## Desarrollo local en el puerto 4200

```bash
npm run dev
```

Este comando levanta Mongo en Docker, Express en `3000` y Angular en `4200`.
La URL correcta es:

```text
http://localhost:4200/acme/
```

Al detener el comando se detienen Angular, Express y el contenedor Mongo. Si ya
existe un Mongo externo:

```bash
MONGO_URI='mongodb://host:27017/acme' npm run dev
```

`npm run dev:web` levanta sólo Angular y requiere que Express y Mongo ya estén
funcionando. Para la prueba completa debe usarse `npm run dev`.

## Probar la imagen de producción

```bash
docker compose up --build
```

La aplicación queda disponible en `http://localhost:3000/acme/`.

## Construir la imagen del cliente ficticio

```bash
chmod +x scripts/build-client-image.sh
./scripts/build-client-image.sh ghcr.io/mi-organizacion cat acme
docker push ghcr.io/mi-organizacion/cat-acme:0.1.0
```

## Kubernetes

[`k8s/cat-acme.yaml`](k8s/cat-acme.yaml) contiene `ConfigMap`, `Deployment`,
`Service` e `Ingress`. El proveedor debe crear los secretos fuera de Git:

```bash
kubectl create secret generic cat-acme-secrets \
  --from-literal=MONGO_URI='mongodb://usuario:password@host:27017/acme'

kubectl create secret docker-registry triviere-registry \
  --docker-server=ghcr.io \
  --docker-username=USUARIO \
  --docker-password=TOKEN

kubectl apply -f k8s/cat-acme.yaml
```

Los endpoints `/acme/api/health/live` y `/acme/api/health/ready` permiten a
Kubernetes comprobar por separado el proceso y la conexión con MongoDB.

## Publicar una imagen de prueba en GHCR

El workflow [`.github/workflows/publish-image.yml`](.github/workflows/publish-image.yml)
publica una imagen privada sin entregar acceso al repositorio. Antes de probarlo:

1. Inicializar este directorio como repositorio Git y subirlo a un repositorio
   privado de GitHub.
2. Abrir `Actions` → `Publish ACME image` → `Run workflow`.
3. Introducir un tag, por ejemplo `trial-1`.
4. Esperar a que aparezca en `Packages` la imagen:

```text
ghcr.io/<propietario-del-repo>/cat-acme:trial-1
```

El workflow usa `GITHUB_TOKEN`; no necesita un PAT ni secretos adicionales para
publicar en GHCR. Sus permisos están limitados a leer el repositorio y escribir
paquetes. La imagen final contiene Angular compilado y un único bundle minificado
de Express; no contiene `src/`, tests, configuración fuente ni los módulos
originales de `server/`.

Para una prueba de descarga privada desde otro equipo se necesita un token de
sólo lectura de paquetes. Ese token será más adelante el `imagePullSecret` que
use Kubernetes.

## Aclaración necesaria sobre MongoDB

Esta réplica tiene un solo tipo de documento y puede usar una colección `acme`.
Las aplicaciones CAT reales tienen entre 9 y 12 esquemas Mongoose y necesitan
varias colecciones. Antes de migrarlas debe confirmarse si el proveedor quería
decir **base de datos por cliente** dentro de una instancia Mongo compartida.
