#!/usr/bin/env node
/*
 * Cyclomatic Complexity Report Generator
 * Runs ESLint with complexity rule and generates a markdown report.
 *
 * Usage: node scripts/complexity-report.js
 * Output: build/reports/complexity-report.md (also printed to stdout)
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const SOFT_LIMIT = 10
const HARD_LIMIT = 15
const FAIL_LIMIT = 20

const targets = [
  'lib/**/*.ts',
  'routes/**/*.ts',
  'models/**/*.ts',
  'data/**/*.ts',
  'server.ts',
  'app.ts'
]

function runEslint () {
  try {
    const result = execSync(
      `npx eslint --format json --no-error-on-unmatched-pattern ${targets.map(t => `"${t}"`).join(' ')}`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    )
    return JSON.parse(result)
  } catch (err) {
    if (err.stdout) {
      return JSON.parse(err.stdout)
    }
    throw err
  }
}

function extractComplexity (eslintResults) {
  const entries = []
  const complexityRegex = /complexity of (\d+)/

  for (const file of eslintResults) {
    if (!file.messages || file.messages.length === 0) continue

    for (const msg of file.messages) {
      if (msg.ruleId !== 'complexity') continue

      const match = msg.message.match(complexityRegex)
      if (!match) continue

      const complexity = parseInt(match[1], 10)
      const relativePath = path.relative(process.cwd(), file.filePath)

      let functionName = 'anonymous'
      const funcMatch = msg.message.match(/(?:Function|Method|Arrow function|Async arrow function|Async function) '?([^']*)'? has/)
      if (funcMatch && funcMatch[1]) {
        functionName = funcMatch[1]
      } else if (msg.message.includes('Arrow function')) {
        functionName = `arrow@L${msg.line}`
      } else if (msg.message.includes('Async arrow function')) {
        functionName = `async-arrow@L${msg.line}`
      }

      entries.push({
        file: relativePath,
        function: functionName,
        line: msg.line,
        complexity,
        status: complexity >= FAIL_LIMIT ? 'FAIL' : complexity >= HARD_LIMIT ? 'WARN' : complexity >= SOFT_LIMIT ? 'REVIEW' : 'OK'
      })
    }
  }

  return entries.sort((a, b) => b.complexity - a.complexity)
}

function countAllFunctions (eslintResults) {
  let totalFiles = 0
  for (const file of eslintResults) {
    if (file.filePath && !file.filePath.includes('node_modules')) {
      totalFiles++
    }
  }
  return totalFiles
}

function generateReport (entries, totalFiles) {
  const now = new Date().toISOString().split('T')[0]
  let commitHash = 'unknown'
  try {
    commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch (_) {}

  const maxComplexity = entries.length > 0 ? entries[0].complexity : 0
  const avgComplexity = entries.length > 0
    ? (entries.reduce((sum, e) => sum + e.complexity, 0) / entries.length).toFixed(1)
    : '0'
  const aboveSoft = entries.filter(e => e.complexity >= SOFT_LIMIT).length
  const aboveHard = entries.filter(e => e.complexity >= HARD_LIMIT).length
  const aboveFail = entries.filter(e => e.complexity >= FAIL_LIMIT).length

  const gateResult = aboveFail > 0 ? 'FAIL' : 'PASS'

  const lines = []
  lines.push('## Cyclomatic Complexity Report')
  lines.push('')
  lines.push(`**Date:** ${now} | **Commit:** ${commitHash}`)
  lines.push('')
  lines.push('### Summary')
  lines.push('')
  lines.push(`| Metric | Value |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Files analyzed | ${totalFiles} |`)
  lines.push(`| Functions above soft limit (${SOFT_LIMIT}) | ${aboveSoft} |`)
  lines.push(`| Functions above hard limit (${HARD_LIMIT}) | ${aboveHard} |`)
  lines.push(`| Functions above fail limit (${FAIL_LIMIT}) | ${aboveFail} |`)
  lines.push(`| Maximum complexity | ${maxComplexity} |`)
  lines.push(`| Average complexity (flagged functions) | ${avgComplexity} |`)
  lines.push(`| **Gate Result** | **${gateResult}** |`)
  lines.push('')
  lines.push(`### Thresholds`)
  lines.push('')
  lines.push(`- **OK:** complexity < ${SOFT_LIMIT}`)
  lines.push(`- **REVIEW:** complexity ${SOFT_LIMIT}-${HARD_LIMIT - 1}`)
  lines.push(`- **WARN:** complexity ${HARD_LIMIT}-${FAIL_LIMIT - 1}`)
  lines.push(`- **FAIL:** complexity >= ${FAIL_LIMIT} (blocks PR)`)
  lines.push('')

  if (entries.length > 0) {
    const top = entries.slice(0, 10)
    lines.push('### Top Complex Functions')
    lines.push('')
    lines.push('| # | File | Function | Line | Complexity | Status |')
    lines.push('|---|------|----------|------|------------|--------|')
    top.forEach((e, i) => {
      lines.push(`| ${i + 1} | \`${e.file}\` | ${e.function} | ${e.line} | ${e.complexity} | ${e.status} |`)
    })
    lines.push('')
  }

  if (entries.length === 0) {
    lines.push('*No functions with complexity above default threshold detected.*')
    lines.push('')
  }

  return { markdown: lines.join('\n'), gateResult }
}

// Main
const eslintResults = runEslint()
const entries = extractComplexity(eslintResults)
const totalFiles = countAllFunctions(eslintResults)
const { markdown, gateResult } = generateReport(entries, totalFiles)

// Print to stdout
console.log(markdown)

// Write to file
const outDir = path.join(process.cwd(), 'build', 'reports')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'complexity-report.md'), markdown)
console.log(`\nReport written to build/reports/complexity-report.md`)

// Exit with error if any function exceeds fail limit
if (gateResult === 'FAIL') {
  console.error(`\nGATE FAILED: ${entries.filter(e => e.complexity >= FAIL_LIMIT).length} function(s) exceed complexity ${FAIL_LIMIT}`)
  process.exit(1)
}
