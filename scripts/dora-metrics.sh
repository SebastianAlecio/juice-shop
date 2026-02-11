#!/usr/bin/env bash
# DORA Metrics Calculator
# Calculates the four DORA metrics from git history and GitHub API.
#
# Usage: bash scripts/dora-metrics.sh
# Requires: git, gh (GitHub CLI), jq (optional, falls back to grep)
#
# Output: Markdown report to stdout

set -euo pipefail

PERIOD_DAYS=30
BRANCH="master"
DATE_NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
DATE_SINCE=$(date -u -v-${PERIOD_DAYS}d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "${PERIOD_DAYS} days ago" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "unknown")
COMMIT_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# ==================================================
# 1. Deployment Frequency
# ==================================================
# Count commits to master in the last N days (each push to master = deployment)
DEPLOY_COUNT=$(git log --oneline --since="${PERIOD_DAYS} days ago" "${BRANCH}" 2>/dev/null | wc -l | tr -d ' ')
MERGE_COUNT=$(git log --oneline --merges --since="${PERIOD_DAYS} days ago" "${BRANCH}" 2>/dev/null | wc -l | tr -d ' ')

if [ "$DEPLOY_COUNT" -eq 0 ]; then
  DF_PER_WEEK="0"
  DF_CLASS="Low"
elif [ "$DEPLOY_COUNT" -ge 30 ]; then
  DF_PER_WEEK=$(echo "scale=1; $DEPLOY_COUNT / ($PERIOD_DAYS / 7)" | bc 2>/dev/null || echo "N/A")
  DF_CLASS="Elite (daily)"
elif [ "$DEPLOY_COUNT" -ge 4 ]; then
  DF_PER_WEEK=$(echo "scale=1; $DEPLOY_COUNT / ($PERIOD_DAYS / 7)" | bc 2>/dev/null || echo "N/A")
  DF_CLASS="High (weekly)"
elif [ "$DEPLOY_COUNT" -ge 1 ]; then
  DF_PER_WEEK=$(echo "scale=1; $DEPLOY_COUNT / ($PERIOD_DAYS / 7)" | bc 2>/dev/null || echo "N/A")
  DF_CLASS="Medium (monthly)"
else
  DF_PER_WEEK="0"
  DF_CLASS="Low"
fi

# ==================================================
# 2. Lead Time for Changes
# ==================================================
# Average time from PR creation to merge (using GitHub API)
LT_HOURS="N/A"
LT_CLASS="N/A"

if command -v gh &> /dev/null && [ -n "${GH_TOKEN:-}" ]; then
  PR_DATA=$(gh pr list --state merged --limit 20 --json createdAt,mergedAt 2>/dev/null || echo "[]")

  if [ "$PR_DATA" != "[]" ] && [ -n "$PR_DATA" ]; then
    # Calculate average lead time using node (available in CI)
    LT_HOURS=$(node -e "
      const prs = JSON.parse(process.argv[1] || '[]');
      if (prs.length === 0) { console.log('N/A'); process.exit(0); }
      const diffs = prs.map(pr => {
        const created = new Date(pr.createdAt);
        const merged = new Date(pr.mergedAt);
        return (merged - created) / (1000 * 60 * 60);
      });
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      console.log(avg.toFixed(1));
    " "$PR_DATA" 2>/dev/null || echo "N/A")

    if [ "$LT_HOURS" != "N/A" ]; then
      LT_NUMERIC=$(echo "$LT_HOURS" | sed 's/[^0-9.]//g')
      if [ -n "$LT_NUMERIC" ]; then
        if (( $(echo "$LT_NUMERIC < 24" | bc -l 2>/dev/null || echo 0) )); then
          LT_CLASS="Elite (< 1 day)"
        elif (( $(echo "$LT_NUMERIC < 168" | bc -l 2>/dev/null || echo 0) )); then
          LT_CLASS="High (1-7 days)"
        elif (( $(echo "$LT_NUMERIC < 720" | bc -l 2>/dev/null || echo 0) )); then
          LT_CLASS="Medium (1-4 weeks)"
        else
          LT_CLASS="Low (> 1 month)"
        fi
      fi
    fi
  fi

  if [ "$LT_HOURS" = "N/A" ]; then
    LT_CLASS="N/A (no merged PRs found)"
  fi
else
  LT_CLASS="N/A (gh CLI not available)"
fi

# ==================================================
# 3. Mean Time to Restore (MTTR)
# ==================================================
MTTR_HOURS="N/A"
MTTR_CLASS="N/A"

if command -v gh &> /dev/null && [ -n "${GH_TOKEN:-}" ]; then
  BUG_DATA=$(gh issue list --state closed --label "bug" --limit 20 --json createdAt,closedAt 2>/dev/null || echo "[]")

  if [ "$BUG_DATA" != "[]" ] && [ -n "$BUG_DATA" ] && [ "$BUG_DATA" != "null" ]; then
    MTTR_HOURS=$(node -e "
      const issues = JSON.parse(process.argv[1] || '[]');
      if (issues.length === 0) { console.log('N/A'); process.exit(0); }
      const diffs = issues.map(i => {
        const created = new Date(i.createdAt);
        const closed = new Date(i.closedAt);
        return (closed - created) / (1000 * 60 * 60);
      });
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      console.log(avg.toFixed(1));
    " "$BUG_DATA" 2>/dev/null || echo "N/A")

    if [ "$MTTR_HOURS" != "N/A" ]; then
      MTTR_NUMERIC=$(echo "$MTTR_HOURS" | sed 's/[^0-9.]//g')
      if [ -n "$MTTR_NUMERIC" ]; then
        if (( $(echo "$MTTR_NUMERIC < 1" | bc -l 2>/dev/null || echo 0) )); then
          MTTR_CLASS="Elite (< 1 hour)"
        elif (( $(echo "$MTTR_NUMERIC < 24" | bc -l 2>/dev/null || echo 0) )); then
          MTTR_CLASS="High (< 1 day)"
        elif (( $(echo "$MTTR_NUMERIC < 168" | bc -l 2>/dev/null || echo 0) )); then
          MTTR_CLASS="Medium (< 1 week)"
        else
          MTTR_CLASS="Low (> 1 week)"
        fi
      fi
    fi
  fi

  if [ "$MTTR_HOURS" = "N/A" ]; then
    MTTR_CLASS="N/A (no closed bug issues found)"
  fi
else
  MTTR_CLASS="N/A (gh CLI not available)"
fi

# ==================================================
# 4. Change Failure Rate
# ==================================================
TOTAL_DEPLOYS=$DEPLOY_COUNT
REVERT_COUNT=$(git log --oneline --grep="revert" -i --since="${PERIOD_DAYS} days ago" "${BRANCH}" 2>/dev/null | wc -l | tr -d ' ')

if [ "$TOTAL_DEPLOYS" -gt 0 ]; then
  CFR_PCT=$(echo "scale=1; ($REVERT_COUNT * 100) / $TOTAL_DEPLOYS" | bc 2>/dev/null || echo "0")
  if (( $(echo "$CFR_PCT <= 15" | bc -l 2>/dev/null || echo 1) )); then
    CFR_CLASS="Elite (0-15%)"
  elif (( $(echo "$CFR_PCT <= 30" | bc -l 2>/dev/null || echo 0) )); then
    CFR_CLASS="High (16-30%)"
  elif (( $(echo "$CFR_PCT <= 45" | bc -l 2>/dev/null || echo 0) )); then
    CFR_CLASS="Medium (31-45%)"
  else
    CFR_CLASS="Low (> 45%)"
  fi
else
  CFR_PCT="0"
  CFR_CLASS="N/A (no deployments)"
fi

# ==================================================
# Output Report
# ==================================================
cat <<EOF
# DORA Metrics Dashboard

**Generated:** ${DATE_NOW}
**Period:** Last ${PERIOD_DAYS} days (since ${DATE_SINCE})
**Branch:** ${BRANCH}
**Commit:** ${COMMIT_SHORT}

---

## Current Metrics

| Metric | Value | Classification | DORA Benchmark |
|--------|-------|---------------|----------------|
| **Deployment Frequency** | ${DEPLOY_COUNT} deploys (${DF_PER_WEEK}/week) | ${DF_CLASS} | Elite: daily, High: weekly |
| **Lead Time for Changes** | ${LT_HOURS} hours avg | ${LT_CLASS} | Elite: <1 day, High: 1-7 days |
| **Time to Restore (MTTR)** | ${MTTR_HOURS} hours avg | ${MTTR_CLASS} | Elite: <1 hour, High: <1 day |
| **Change Failure Rate** | ${CFR_PCT}% (${REVERT_COUNT} reverts / ${TOTAL_DEPLOYS} deploys) | ${CFR_CLASS} | Elite: 0-15%, High: 16-30% |

---

## Raw Data

### Deployment Activity (last ${PERIOD_DAYS} days)

| Metric | Count |
|--------|-------|
| Total commits to ${BRANCH} | ${DEPLOY_COUNT} |
| Merge commits | ${MERGE_COUNT} |
| Reverts | ${REVERT_COUNT} |

### Methodology

| Metric | Data Source | Calculation |
|--------|-----------|-------------|
| **Deployment Frequency** | \`git log --since="${PERIOD_DAYS} days ago" ${BRANCH}\` | Commits to master = deployments |
| **Lead Time for Changes** | \`gh pr list --state merged\` | Avg time from PR creation to merge |
| **MTTR** | \`gh issue list --state closed --label bug\` | Avg time from bug report to close |
| **Change Failure Rate** | \`git log --grep="revert"\` | Reverts / total deploys x 100 |

---

## DORA Classification Reference

| Level | Deploy Frequency | Lead Time | MTTR | Change Failure Rate |
|-------|-----------------|-----------|------|-------------------|
| **Elite** | On-demand (daily) | < 1 day | < 1 hour | 0-15% |
| **High** | Weekly | 1-7 days | < 1 day | 16-30% |
| **Medium** | Monthly | 1-4 weeks | < 1 week | 31-45% |
| **Low** | > Monthly | > 1 month | > 1 week | > 45% |

---

*Report generated by \`scripts/dora-metrics.sh\`*
*Run manually: \`bash scripts/dora-metrics.sh\`*
EOF
