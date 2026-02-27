# SBOM Generation Report

## Herramienta

**CycloneDX npm plugin** (`@cyclonedx/cyclonedx-npm`) — ya incluido como devDependency del proyecto.

## Formato

- **Estandar:** CycloneDX v1.6
- **Formatos generados:** JSON (`bom.json`) y XML (`bom.xml`)
- **Scope:** Solo dependencias de produccion (`--omit=dev`)

## Comando

```bash
npm run sbom
# Equivalente a:
# cyclonedx-npm --omit=dev --output-format=JSON --output-file=bom.json
# cyclonedx-npm --omit=dev --output-format=XML  --output-file=bom.xml
```

## Resumen del SBOM

| Metrica | Valor |
|---------|-------|
| Total de componentes | 750 |
| Licencias unicas | 15 |
| Formato | CycloneDX 1.6 |

### Distribucion de Licencias (Top 10)

| Licencia | Componentes |
|----------|-------------|
| MIT | 616 |
| ISC | 62 |
| LGPL-3.0 | 19 |
| BSD-3-Clause | 10 |
| Apache-2.0 | 10 |
| BSD-2-Clause | 9 |
| BlueOak-1.0.0 | 7 |
| Unknown | 6 |
| Unlicense | 2 |
| MIT/X11 | 2 |

## Archivos Generados

- [`sbom/bom.json`](sbom/bom.json) — CycloneDX JSON (54,410 lineas)
- [`sbom/bom.xml`](sbom/bom.xml) — CycloneDX XML (38,802 lineas)

## Notas

- Los archivos `bom.json` y `bom.xml` de la raiz del proyecto estan en `.gitignore` ya que son artefactos de build regenerables.
- Las copias en este directorio (`deliverables/Entrega 3/sbom/`) se versionan como evidencia del entregable.
- El frontend tambien genera SBOMs via `@cyclonedx/webpack-plugin` en `frontend/webpack.angular.js` durante el build de Angular.
