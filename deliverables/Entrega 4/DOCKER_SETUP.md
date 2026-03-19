# Docker Compose Setup — One-Command Environment

**Fecha:** 5 de Marzo, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto:** OWASP Juice Shop v19.1.1

---

## 1. Overview

Se creo un `docker-compose.yml` que levanta el entorno completo de OWASP Juice Shop con un unico comando, eliminando la necesidad de instalar Node.js, npm, Python, o herramientas de compilacion localmente.

Este setup resuelve directamente los friction points identificados en el [Onboarding Log de Entrega 1](../Entrega%201/ONBOARDING_LOG.md):
- **F1** (npm cache permissions) — eliminado, todo corre dentro del contenedor
- **F2** (dual package.json, 7min install) — eliminado, imagen pre-built
- **F5** (native module compilation requiere Python/gcc) — eliminado, compilado en la imagen
- **F7** (no .nvmrc, riesgo de version incorrecta) — eliminado, Node.js 22 exacto en la imagen
- **F8** (750+ dependencias, 200MB download) — contenido en la imagen Docker

---

## 2. Prerequisites

| Requisito | Version Minima | Verificacion |
|-----------|---------------|--------------|
| Docker Engine | >= 24.0 | `docker --version` |
| Docker Compose V2 | Incluido con Docker Desktop | `docker compose version` |
| Espacio en disco | ~500MB (imagen pre-built) | `docker images` |
| Puerto 3000 | Disponible | `lsof -i :3000` |

**No se requiere:** Node.js, npm, Python, gcc, build-essential, ni ninguna otra herramienta de desarrollo.

---

## 3. Usage

### 3.1 Levantar el entorno

```bash
docker compose up
```

Para modo detached (background):

```bash
docker compose up -d
```

### 3.2 Verificar estado

```bash
docker compose ps
```

### 3.3 Ver logs

```bash
docker compose logs -f juice-shop
```

### 3.4 Detener el entorno

```bash
docker compose down
```

### 3.5 Limpieza completa (remove volumes)

```bash
docker compose down -v
```

### 3.6 Modo CTF

```bash
NODE_APP_INSTANCE=ctf docker compose up
```

---

## 4. Arquitectura

```
┌──────────────────────────────────────┐
│          Host Machine                 │
│                                       │
│  ┌────────────────────────────────┐  │
│  │    Docker Container            │  │
│  │    juice-shop                  │  │
│  │    ─────────────────────────   │  │
│  │    Image: bkimminich/          │  │
│  │      juice-shop:v19.1.1       │  │
│  │    Base: distroless/           │  │
│  │      nodejs22-debian12        │  │
│  │    User: 65532 (non-root)     │  │
│  │    ─────────────────────────   │  │
│  │    Node.js 22 + Express       │  │
│  │    Angular Frontend (built)   │  │
│  │    SQLite (embedded, ephemeral)│  │
│  │    MarsDB (in-memory)         │  │
│  │    Port: 3000                 │  │
│  └───────────┬────────────────────┘  │
│              │ :3000                  │
│              ▼                        │
│         localhost:3000                │
└──────────────────────────────────────┘
```

**Base de datos:** SQLite embebido con `force: true` — se recrea en cada reinicio del contenedor. No requiere servicio externo de base de datos.

**Almacenamiento:** Reviews y orders usan MarsDB (in-memory, ephemeral). Los datos se pierden al reiniciar el contenedor — esto es por diseno (aplicacion de entrenamiento).

---

## 5. Opciones de Configuracion

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `PORT` | 3000 | Puerto del servidor dentro del contenedor |
| `NODE_APP_INSTANCE` | (ninguno) | Perfil de configuracion: `ctf`, `tutorial`, `bodgeit`, etc. |
| `NODE_ENV` | production | Ambiente Node.js |

**Ejemplo con variables:**

```bash
NODE_APP_INSTANCE=ctf docker compose up
```

---

## 6. Onboarding Log — Terminal Output

### 6.1 Primera ejecucion (imagen no cacheada)

```
$ docker compose up -d

 Image bkimminich/juice-shop:v19.1.1 Pulling
 90831a7953db Pulling fs layer
 44d654bc6e99 Pulling fs layer
 bfb59b82a9b6 Pulling fs layer
 ddf74a63f7d8 Pulling fs layer
 ...
 376a4640cff9 Pull complete
 90831a7953db Pull complete
 Image bkimminich/juice-shop:v19.1.1 Pulled

 Network juice-shop_default Creating
 Network juice-shop_default Created
 Container juice-shop Creating
 Container juice-shop Created
 Container juice-shop Starting
 Container juice-shop Started
```

**Tiempo de pull de imagen:** ~45 segundos

### 6.2 Logs del contenedor

```
$ docker compose logs

juice-shop  | info: Detected Node.js version v22.21.1 (OK)
juice-shop  | info: Detected OS linux (OK)
juice-shop  | info: Detected CPU arm64 (OK)
juice-shop  | info: Configuration production validated (OK)
juice-shop  | info: Entity models 20 of 20 are initialized (OK)
juice-shop  | info: Required file server.js is present (OK)
juice-shop  | info: Required file index.html is present (OK)
juice-shop  | info: Required file main.js is present (OK)
juice-shop  | info: Required file styles.css is present (OK)
juice-shop  | info: Required file tutorial.js is present (OK)
juice-shop  | info: Required file vendor.js is present (OK)
juice-shop  | info: Required file runtime.js is present (OK)
juice-shop  | info: Port 3000 is available (OK)
juice-shop  | info: Chatbot training data botDefaultTrainingData.json validated (OK)
juice-shop  | info: Domain https://www.alchemy.com/ is reachable (OK)
juice-shop  | info: Server listening on port 3000
```

### 6.3 Health check passing

```
$ docker compose ps

NAME         IMAGE                           COMMAND                  SERVICE      CREATED         STATUS                   PORTS
juice-shop   bkimminich/juice-shop:v19.1.1   "/nodejs/bin/node /j…"   juice-shop   6 seconds ago   Up 5 seconds (healthy)   0.0.0.0:3000->3000/tcp
```

**Status: healthy** — el health check valida que `/api/Challenges` responde HTTP 200.

### 6.4 Verificacion HTTP

```
$ curl -s -o /dev/null -w "HTTP %{http_code} (%{size_download} bytes, %{time_total}s)\n" http://localhost:3000
HTTP 200 (75055 bytes, 0.003559s)

$ curl -s http://localhost:3000/api/Challenges | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Status: {d[\"status\"]}'); print(f'Challenges loaded: {len(d[\"data\"])}')"
Status: success
Challenges loaded: 110
```

### 6.5 Timing Summary

| Fase | Duracion |
|------|----------|
| Docker image pull (primera vez, ~500MB) | ~45 segundos |
| Container start + DB seed | ~5 segundos |
| Health check passing | ~5 segundos |
| **Total (primera vez)** | **~50 segundos** |
| **Total (imagen cacheada)** | **~5 segundos** |

**Resultado: Muy por debajo del limite de 5 minutos.**

---

## 7. Health Check

El `docker-compose.yml` incluye un health check automatico que usa el binario Node.js del contenedor distroless para verificar que la API responde:

```yaml
healthcheck:
  test: ["CMD", "/nodejs/bin/node", "-e", "const http=require('http');const r=http.get('http://localhost:3000/api/Challenges',(s)=>{process.exit(s.statusCode===200?0:1)});r.on('error',()=>process.exit(1));r.setTimeout(3000,()=>process.exit(1))"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**¿Por que `/nodejs/bin/node` en lugar de `node`?** La imagen base es `gcr.io/distroless/nodejs22-debian12`, una imagen minimalista sin shell, sin curl, sin wget. El binario de Node.js esta en `/nodejs/bin/node`, no en `$PATH`.

**¿Por que `/api/Challenges` como endpoint?** Es el mismo endpoint usado por el smoke test existente (`test/smoke/smoke-test.sh`). Retorna `{"status":"success"}` solo cuando la base de datos esta completamente seed-eada y el servidor esta listo.

---

## 8. Decisiones Tecnicas

### D1: Imagen pre-built vs build local

**Decision:** Usar `bkimminich/juice-shop:v19.1.1` (imagen oficial de DockerHub) en lugar de `build: .` (build local).

**Razon:** El Dockerfile del proyecto usa `--omit=dev` para excluir devDependencies, pero el script `prepare` de `package.json` ejecuta `husky` (agregado como devDependency en Entrega 3). Esto causa `exit code 127` durante el build. La imagen oficial ya esta construida y probada. Ademas, pull de ~500MB toma ~45 segundos vs ~3-7 minutos de build local.

### D2: Health check via Node.js inline

**Decision:** Usar un one-liner de Node.js como health check en lugar de curl/wget.

**Razon:** La imagen distroless no incluye shell, curl, ni wget. El unico binario disponible es Node.js en `/nodejs/bin/node`. El one-liner hace un HTTP GET y retorna exit code 0 (healthy) o 1 (unhealthy).

### D3: Volume solo para logs

**Decision:** Solo montar un named volume para `/juice-shop/logs`, no para la base de datos.

**Razon:** SQLite se recrea con `force: true` en cada inicio — persistir el archivo no tiene valor. Los logs si tienen valor para debugging post-mortem.

### D4: No usar NODE_ENV=production por default

El warning `NODE_ENV value of 'production' did not match any deployment config file names` es cosmético — `node-config` simplemente no encuentra un archivo `config/production.yml`, por lo que usa `config/default.yml`. La aplicación funciona correctamente.

---

## 9. Detener el entorno

```bash
# Parar y remover contenedor
docker compose down

# Parar, remover contenedor Y volumes
docker compose down -v
```
