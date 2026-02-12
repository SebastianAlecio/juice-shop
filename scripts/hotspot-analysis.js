#!/usr/bin/env node
/*
 * Tech Debt Hotspot Analysis
 * Calculates churn x complexity scores for backend source files.
 * Identifies top candidates for refactoring.
 *
 * Usage: node scripts/hotspot-analysis.js
 * Output: build/reports/hotspot-analysis.md (also printed to stdout)
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const TARGET_DIRS = ['lib', 'routes', 'models', 'data']
const TARGET_FILES = ['server.ts', 'app.ts']

const RISK_LEVELS = [
  { min: 75, label: 'CRITICO' },
  { min: 50, label: 'ALTO' },
  { min: 25, label: 'MEDIO' },
  { min: 0, label: 'BAJO' }
]

function getTargetFiles () {
  const files = []
  for (const dir of TARGET_DIRS) {
    try {
      const result = execSync(`git ls-files -- "${dir}/"`, { encoding: 'utf-8' }).trim()
      if (result) {
        files.push(...result.split('\n').filter(f => f.endsWith('.ts')))
      }
    } catch (_) {}
  }
  for (const file of TARGET_FILES) {
    if (fs.existsSync(file)) {
      files.push(file)
    }
  }
  return [...new Set(files)]
}

function getChurn (filePath) {
  try {
    const result = execSync(`git log --follow --oneline -- "${filePath}"`, { encoding: 'utf-8' })
    return result.trim().split('\n').filter(l => l.length > 0).length
  } catch (_) {
    return 0
  }
}

function getLOC (filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return content.split('\n').filter(l => l.trim().length > 0).length
  } catch (_) {
    return 0
  }
}

function getComplexityMap () {
  const complexityMap = {}
  try {
    const eslintTargets = TARGET_DIRS.map(d => `"${d}"`).concat(TARGET_FILES.map(f => `"${f}"`)).join(' ')
    const result = execSync(
      `npx eslint --rule 'complexity: [warn, {max: 1}]' --format json --no-error-on-unmatched-pattern ${eslintTargets}`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    )
    parseComplexity(JSON.parse(result), complexityMap)
  } catch (err) {
    if (err.stdout) {
      try {
        parseComplexity(JSON.parse(err.stdout), complexityMap)
      } catch (_) {}
    }
  }
  return complexityMap
}

function parseComplexity (eslintResults, complexityMap) {
  const regex = /complexity of (\d+)/
  for (const file of eslintResults) {
    if (!file.messages || file.messages.length === 0) continue
    const relativePath = path.relative(process.cwd(), file.filePath)
    let maxCC = 0
    for (const msg of file.messages) {
      if (msg.ruleId !== 'complexity') continue
      const match = msg.message.match(regex)
      if (match) {
        const cc = parseInt(match[1], 10)
        if (cc > maxCC) maxCC = cc
      }
    }
    if (maxCC > 0) {
      complexityMap[relativePath] = maxCC
    }
  }
}

function classifyRisk (normalizedScore) {
  for (const level of RISK_LEVELS) {
    if (normalizedScore >= level.min) return level.label
  }
  return 'BAJO'
}

function calculateHotspots (files, complexityMap) {
  const hotspots = files.map(file => {
    const churn = getChurn(file)
    const loc = getLOC(file)
    const complexity = complexityMap[file] || 1
    const score = churn * complexity
    return { file, churn, loc, complexity, score }
  })

  hotspots.sort((a, b) => b.score - a.score)

  const maxScore = hotspots.length > 0 ? hotspots[0].score : 1
  for (const h of hotspots) {
    h.normalizedScore = Math.round((h.score / maxScore) * 100)
    h.risk = classifyRisk(h.normalizedScore)
  }

  return hotspots
}

function generateReport (hotspots) {
  const now = new Date().toISOString().split('T')[0]
  let commitHash = 'unknown'
  try {
    commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch (_) {}

  const top10 = hotspots.slice(0, 10)
  const totalFiles = hotspots.length
  const criticalCount = hotspots.filter(h => h.risk === 'CRITICO').length
  const highCount = hotspots.filter(h => h.risk === 'ALTO').length

  const lines = []
  lines.push('## Tech Debt Hotspot Analysis')
  lines.push('')
  lines.push(`**Date:** ${now} | **Commit:** ${commitHash}`)
  lines.push('')
  lines.push('### Summary')
  lines.push('')
  lines.push('| Metric | Value |')
  lines.push('|--------|-------|')
  lines.push(`| Files analyzed | ${totalFiles} |`)
  lines.push(`| CRITICO hotspots | ${criticalCount} |`)
  lines.push(`| ALTO hotspots | ${highCount} |`)
  lines.push(`| Highest churn | ${hotspots.length > 0 ? hotspots.reduce((max, h) => h.churn > max.churn ? h : max).file + ' (' + hotspots.reduce((max, h) => h.churn > max.churn ? h : max).churn + ' commits)' : 'N/A'} |`)
  lines.push(`| Highest complexity | ${hotspots.length > 0 ? hotspots.reduce((max, h) => h.complexity > max.complexity ? h : max).file + ' (CC=' + hotspots.reduce((max, h) => h.complexity > max.complexity ? h : max).complexity + ')' : 'N/A'} |`)
  lines.push('')
  lines.push('### Formula')
  lines.push('')
  lines.push('`Hotspot Score = Git Churn (commits) x Max Cyclomatic Complexity`')
  lines.push('')
  lines.push('Normalized to 0-100 scale. Risk: CRITICO >= 75, ALTO >= 50, MEDIO >= 25, BAJO < 25.')
  lines.push('')
  lines.push('### Top 10 Hotspots')
  lines.push('')
  lines.push('| # | File | Commits | LOC | Max CC | Raw Score | Normalized | Risk |')
  lines.push('|---|------|---------|-----|--------|-----------|------------|------|')
  top10.forEach((h, i) => {
    lines.push(`| ${i + 1} | \`${h.file}\` | ${h.churn} | ${h.loc} | ${h.complexity} | ${h.score} | ${h.normalizedScore} | ${h.risk} |`)
  })
  lines.push('')

  if (hotspots.length > 10) {
    lines.push(`*${hotspots.length - 10} additional files analyzed (all MEDIO or BAJO risk).*`)
    lines.push('')
  }

  lines.push('### Risk Distribution')
  lines.push('')
  lines.push('| Risk Level | Count | Files |')
  lines.push('|------------|-------|-------|')
  for (const level of RISK_LEVELS) {
    const filesAtLevel = hotspots.filter(h => h.risk === level.label)
    if (filesAtLevel.length > 0) {
      lines.push(`| ${level.label} | ${filesAtLevel.length} | ${filesAtLevel.slice(0, 3).map(f => '`' + f.file + '`').join(', ')}${filesAtLevel.length > 3 ? ', ...' : ''} |`)
    }
  }
  lines.push('')

  return lines.join('\n')
}

// Main
console.log('Analyzing hotspots...')
console.log('  Resolving target files...')
const files = getTargetFiles()
console.log(`  Found ${files.length} files`)

console.log('  Running ESLint for complexity (this may take a moment)...')
const complexityMap = getComplexityMap()
console.log(`  Got complexity data for ${Object.keys(complexityMap).length} files`)

console.log('  Calculating churn for each file...')
const hotspots = calculateHotspots(files, complexityMap)

const markdown = generateReport(hotspots)

console.log('')
console.log(markdown)

const outDir = path.join(process.cwd(), 'build', 'reports')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'hotspot-analysis.md'), markdown)
console.log(`\nReport written to build/reports/hotspot-analysis.md`)
