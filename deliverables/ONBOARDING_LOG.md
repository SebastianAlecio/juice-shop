# Onboarding Log - OWASP Juice Shop
## DevEx Audit Report

**Fecha:** 2 de Febrero, 2026
**Proyecto:** OWASP Juice Shop v19.1.1
**Evaluador:** AI-Assisted Analysis

---

## 1. Resumen Ejecutivo

OWASP Juice Shop es una aplicación web deliberadamente insegura para entrenamiento en seguridad. El proceso de onboarding presenta varios puntos de fricción que pueden dificultar la incorporación de nuevos desarrolladores.

---

## 2. Proceso de Setup

### 2.1 Requisitos Previos
| Requisito | Especificación | Fricción |
|-----------|----------------|----------|
| Node.js | v20-24 (LTS) | Media - Rango limitado de versiones |
| npm | Incluido con Node | Baja |
| Git | Para clonar | Baja |
| Docker | Opcional | Baja |

### 2.2 Pasos de Instalación (Desde Fuentes)
```bash
git clone https://github.com/juice-shop/juice-shop.git --depth 1
cd juice-shop
npm install   # Ejecuta postinstall automáticamente
npm start
```

---

## 3. Puntos de Fricción Identificados

### 3.1 ALTO IMPACTO

#### F1: Proceso de `npm install` Extenso
- **Descripción:** El `postinstall` ejecuta múltiples comandos:
  1. `cd frontend && npm install`
  2. `npm run build:frontend`
  3. `npm run build:server`
- **Impacto:** Tiempo de instalación prolongado, posibles fallos en cualquier paso
- **Dependencias:** 88+ dependencias de producción, 76+ de desarrollo
- **Recomendación:** Documentar tiempos esperados y requisitos de sistema

#### F2: Compilación Nativa Requerida (sqlite3, libxmljs2)
- **Descripción:** Requiere compilar binarios nativos durante install
- **Impacto:** Falla en sistemas sin build tools (python, make, gcc)
- **Error común:** `node-gyp rebuild failed`
- **Recomendación:** Documentar prerequisitos de compilación por SO

#### F3: Arquitectura Dual (Backend + Frontend)
- **Descripción:** Dos `package.json` separados (raíz y `/frontend`)
- **Impacto:**
  - Doble instalación de dependencias
  - Posible desincronización de versiones
  - Mayor complejidad de debugging
- **Recomendación:** Considerar monorepo tools (nx, turborepo)

### 3.2 MEDIO IMPACTO

#### F4: Versión de Node.js Estricta
- **Descripción:** Solo soporta Node 20-24, falla en versiones anteriores
- **Impacto:** Requiere nvm/fnm para proyectos con diferentes versiones
- **Mitigación existente:** Docker como alternativa

#### F5: Base de Datos SQLite con Binarios
- **Descripción:** SQLite requiere binarios precompilados específicos por plataforma
- **Impacto:** Problemas de compatibilidad cross-platform
- **Archivo afectado:** `data/juiceshop.sqlite`

#### F6: Falta de Variables de Entorno Documentadas
- **Descripción:** Configuración dispersa en `/config/*.yml`
- **Impacto:** Difícil saber qué configurar para diferentes entornos
- **Archivos:** 15 archivos de configuración diferentes

#### F7: Scripts de npm Extensos
- **Descripción:** 18 scripts en package.json con nomenclatura inconsistente
- **Scripts críticos poco documentados:**
  - `npm run serve:dev` vs `npm run serve`
  - `npm test` vs `npm run test:server` vs `npm run test:api`
- **Recomendación:** Agregar comentarios o documentación de scripts

### 3.3 BAJO IMPACTO

#### F8: Documentación Fragmentada
- **Descripción:** Documentación dispersa entre:
  - README.md (básico)
  - CONTRIBUTING.md
  - Libro externo (pwning.owasp-juice.shop)
  - Swagger parcial (solo B2B API)
- **Impacto:** Curva de aprendizaje inicial

#### F9: Frontend Angular 20 sin Documentación Interna
- **Descripción:** 70+ componentes, 76 servicios sin JSDoc consistente
- **Ubicación:** `/frontend/src/app/`
- **Impacto:** Dificultad para contribuir al frontend

#### F10: Tests Distribuidos
- **Descripción:** Múltiples frameworks de testing:
  - Jest (API tests)
  - Mocha (Server tests)
  - Jasmine/Karma (Frontend tests)
  - Cypress (E2E)
  - Frisby (API específico)
- **Impacto:** Configuración compleja, diferentes comandos

---

## 4. Estructura del Proyecto

```
juice-shop/
├── app.ts                  # Entry point
├── server.ts               # Express server (1000+ líneas)
├── lib/                    # 12 módulos de utilidades
├── routes/                 # 62 manejadores de rutas
├── models/                 # 22 modelos Sequelize
├── data/                   # SQLite + datos estáticos
├── frontend/               # Angular 20 app (separado)
│   ├── src/app/            # 70+ componentes
│   └── package.json        # Dependencias frontend
├── config/                 # 15 archivos de config
├── test/                   # Tests distribuidos
├── ftp/                    # Archivos descargables
└── i18n/                   # 44 idiomas
```

---

## 5. Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Líneas de código (estimado) | ~50,000+ |
| Dependencias producción | 88 |
| Dependencias desarrollo | 76 |
| Modelos de datos | 22 |
| Rutas API | 62 archivos |
| Componentes frontend | 70+ |
| Servicios frontend | 76 |
| Idiomas soportados | 44 |
| Desafíos de seguridad | 126 |

---

## 6. Tiempo de Setup Estimado

| Método | Tiempo Estimado | Complejidad |
|--------|-----------------|-------------|
| Docker | 5-10 min | Baja |
| Desde fuentes (SSD, buena red) | 10-20 min | Media |
| Desde fuentes (HDD, red lenta) | 30-60 min | Media |
| Vagrant | 15-30 min | Media |

---

## 7. Recomendaciones de Mejora

### Prioridad Alta
1. **Crear `.nvmrc`** para especificar versión de Node recomendada
2. **Documentar prerequisitos de compilación** por sistema operativo
3. **Agregar script `npm run setup`** que verifique dependencias

### Prioridad Media
4. **Crear `DEVELOPMENT.md`** con guía detallada para contribuidores
5. **Unificar estrategia de testing** o documentar cuándo usar cada framework
6. **Agregar `.env.example`** con variables de entorno documentadas

### Prioridad Baja
7. **Considerar monorepo tools** para unificar frontend/backend
8. **Generar documentación de API** completa (actualmente solo B2B)
9. **Agregar health checks** en scripts de setup

---

## 8. Comandos Útiles para Desarrolladores

```bash
# Desarrollo
npm run serve:dev          # Backend + Frontend con hot reload

# Testing
npm test                   # Todos los tests
npm run test:server        # Solo backend
npm run frisby             # API tests
npm run cypress:run        # E2E tests

# Linting
npm run lint               # Verificar código
npm run lint:fix           # Auto-fix

# Build
npm run build:server       # Compilar TypeScript
npm run build:frontend     # Build Angular
```

---

## 9. Conclusión

OWASP Juice Shop es un proyecto maduro con buena documentación externa, pero el proceso de onboarding local presenta fricciones significativas principalmente en:

1. **Tiempo de instalación** debido a compilación nativa y doble npm install
2. **Complejidad arquitectural** con frontend/backend separados
3. **Fragmentación de documentación** entre múltiples fuentes

Para nuevos desarrolladores, se recomienda usar **Docker** como método de setup inicial, y solo configurar desde fuentes cuando sea necesario contribuir código.
