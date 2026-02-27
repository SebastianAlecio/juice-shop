# Secret Protection — Pre-commit Hook

## Herramientas

- **Husky v9** — Gestor de git hooks para proyectos Node.js
- **secretlint** — Linter de secretos nativo de Node.js con reglas preconfiguradas

## Configuracion

### Husky
Inicializado con `npx husky init`. Agrega automaticamente un script `prepare` en `package.json` que configura los git hooks al ejecutar `npm install`.

### Pre-commit Hook (`.husky/pre-commit`)
```sh
#!/usr/bin/env sh

echo "Running secret detection on staged files..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=d)

if [ -z "$STAGED_FILES" ]; then
  echo "No staged files to check."
  exit 0
fi

echo "$STAGED_FILES" | xargs npx secretlint

if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Secrets detected in staged files!"
  echo "Please remove the secrets before committing."
  exit 1
fi

echo "No secrets detected. Proceeding with commit."
```

### secretlint (`.secretlintrc.json`)
```json
{
  "rules": [
    {
      "id": "@secretlint/secretlint-rule-preset-recommend"
    }
  ]
}
```

### Exclusiones (`.secretlintignore`)
```
test/              # Test fixtures con valores dummy
data/static/       # Challenge data (intencional)
node_modules/      # Dependencias
build/             # Build output
dist/              # Frontend dist
.nyc_output/       # Coverage
```

## Patrones de Secretos Detectados

El preset `@secretlint/secretlint-rule-preset-recommend` detecta:

| Tipo de Secreto | Regla |
|-----------------|-------|
| AWS Access Keys | `@secretlint/secretlint-rule-aws` |
| GCP Service Account Keys | `@secretlint/secretlint-rule-gcp` |
| GitHub Tokens | `@secretlint/secretlint-rule-github` |
| Slack Tokens/Webhooks | `@secretlint/secretlint-rule-slack` |
| npm Tokens | `@secretlint/secretlint-rule-npm` |
| SendGrid API Keys | `@secretlint/secretlint-rule-sendgrid` |
| SSH/RSA Private Keys | `@secretlint/secretlint-rule-privatekey` |
| Basic Auth Credentials | `@secretlint/secretlint-rule-basicauth` |
| Patrones genericos | `@secretlint/secretlint-rule-pattern` |

## Demostracion

### Test: Commit con secreto dummy (BLOQUEADO)

Se creo un archivo `test-secret.txt` con un Slack token dummy y se intento hacer commit:

```
$ git add test-secret.txt
$ git commit -m "test: should be blocked"

Running secret detection on staged files...

/Users/aless/Documents/pj_pdds/juice-shop/test-secret.txt
  2:21  error  [SLACK_TOKEN] found slack token: *****  @secretlint/secretlint-rule-preset-recommend > @secretlint/secretlint-rule-slack

✖ 1 problem (1 error, 0 warnings, 0 infos)

husky - pre-commit script failed (code 1)
```

**Resultado:** Commit bloqueado exitosamente. El hook detecto el Slack token y aborto el commit con codigo de salida 1.

### Test: Commit limpio (PERMITIDO)

Commits sin secretos proceden normalmente a traves del hook sin interferencia.

## Archivos Creados

| Archivo | Proposito |
|---------|-----------|
| `.husky/pre-commit` | Script del hook que ejecuta secretlint en archivos staged |
| `.secretlintrc.json` | Configuracion de secretlint con preset recomendado |
| `.secretlintignore` | Exclusiones para evitar falsos positivos |

## Verificacion

```bash
# Test manual: intentar commit con secreto
echo '<slack-bot-token-here>' > test-secret.txt
git add test-secret.txt
git commit -m "test"   # Debe fallar
git reset HEAD test-secret.txt && rm test-secret.txt

# Verificar que commits limpios funcionan
echo "# test" > test-clean.txt
git add test-clean.txt
git commit -m "test clean"  # Debe pasar
git reset --soft HEAD~1 && git reset HEAD test-clean.txt && rm test-clean.txt
```
