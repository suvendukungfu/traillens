#!/usr/bin/env node
/**
 * TrailLens — Milestone 4: Mission Quality & Grounding Evaluation Runner
 * Deterministic benchmark script evaluating FieldMission quality fixtures (A through J).
 * Outputs results to: docs/benchmark-results/mission-quality.json
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Auto-re-execute with tsx if imported by raw node without TypeScript support
if (!process.env.__TSX_RUNNER__) {
  const currentFile = fileURLToPath(import.meta.url);
  const result = spawnSync('npx', ['tsx', currentFile, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, __TSX_RUNNER__: '1' },
  });
  process.exit(result.status ?? 0);
}

// Below runs under tsx runtime
async function runMissionQualityBenchmark() {
  const { evaluateMissionQuality, RUBRIC_CONFIG } = await import('../src/lib/mission/quality.ts');
  const { MISSION_QUALITY_FIXTURES } = await import('../src/lib/mission/fixtures.ts');

  console.log('='.repeat(70));
  console.log('TRAILLENS — MILESTONE 4: MISSION QUALITY BENCHMARK RUNNER');
  console.log('Evaluating 10 deterministic test fixtures across 5 rubric dimensions');
  console.log('='.repeat(70));

  const results = [];
  const dimensionStats = {
    grounding: { totalScore: 0, passed: 0, failed: 0 },
    specificity: { totalScore: 0, passed: 0, failed: 0 },
    safety: { totalScore: 0, passed: 0, failed: 0 },
    executability: { totalScore: 0, passed: 0, failed: 0 },
    outdoorWorthwhile: { totalScore: 0, passed: 0, failed: 0 },
  };

  const issuesFrequency = new Map();

  let totalScoreSum = 0;
  let overallPassed = 0;
  let overallFailed = 0;

  for (const fixture of MISSION_QUALITY_FIXTURES) {
    const report = evaluateMissionQuality(fixture.mission, fixture.context);
    totalScoreSum += report.totalScore;

    if (report.passed) {
      overallPassed += 1;
    } else {
      overallFailed += 1;
    }

    const failedDimensions = [];
    const dimKeys = ['grounding', 'specificity', 'safety', 'executability', 'outdoorWorthwhile'];

    const flagMap = {
      grounding: report.grounded,
      specificity: report.specific,
      safety: report.safe,
      executability: report.executable,
      outdoorWorthwhile: report.outdoorWorthwhile,
    };

    dimKeys.forEach((dim) => {
      const score = report.dimensionScores[dim];
      dimensionStats[dim].totalScore += score;
      if (flagMap[dim]) {
        dimensionStats[dim].passed += 1;
      } else {
        dimensionStats[dim].failed += 1;
        failedDimensions.push(dim);
      }
    });

    report.issues.forEach((issue) => {
      const existing = issuesFrequency.get(issue.code) || {
        code: issue.code,
        dimension: issue.dimension,
        severity: issue.severity,
        count: 0,
        sampleMessage: issue.message,
      };
      existing.count += 1;
      issuesFrequency.set(issue.code, existing);
    });

    const statusBadge = report.passed ? 'PASS' : 'FAIL';
    console.log(
      `[${statusBadge}] ${fixture.name.padEnd(46)} | Score: ${String(report.totalScore).padStart(3)}/100 | Failed: ${failedDimensions.length ? failedDimensions.join(', ') : 'None'}`
    );

    results.push({
      id: fixture.id,
      name: fixture.name,
      category: fixture.category,
      description: fixture.description,
      passed: report.passed,
      totalScore: report.totalScore,
      dimensionScores: report.dimensionScores,
      failedDimensions,
      issues: report.issues,
    });
  }

  const fixtureCount = MISSION_QUALITY_FIXTURES.length;
  const averageQualityScore = Number((totalScoreSum / fixtureCount).toFixed(2));

  // Compute dimension metrics
  const dimensionSummary = {};
  let weakestDim = null;
  let lowestPassRate = 101;
  let lowestAvgScore = 101;

  Object.entries(dimensionStats).forEach(([dim, stats]) => {
    const avgScore = Number((stats.totalScore / fixtureCount).toFixed(2));
    const passRate = Number(((stats.passed / fixtureCount) * 100).toFixed(1));

    dimensionSummary[dim] = {
      averageScore: avgScore,
      maxScore: RUBRIC_CONFIG.maxDimensionScore,
      passed: stats.passed,
      failed: stats.failed,
      passRatePercent: passRate,
    };

    if (passRate < lowestPassRate || (passRate === lowestPassRate && avgScore < lowestAvgScore)) {
      lowestPassRate = passRate;
      lowestAvgScore = avgScore;
      weakestDim = {
        dimension: dim,
        passRatePercent: passRate,
        averageScore: avgScore,
        failureCount: stats.failed,
        rationale: `Dimension had the lowest pass rate (${passRate}%) with ${stats.failed} fixture failure(s).`,
      };
    }
  });

  const exactFailedChecks = Array.from(issuesFrequency.values()).sort((a, b) => b.count - a.count);

  console.log('\n' + '-'.repeat(70));
  console.log('SUMMARY METRICS:');
  console.log(`- Fixture Count:       ${fixtureCount}`);
  console.log(`- Overall Passed:      ${overallPassed} / ${fixtureCount} (${((overallPassed / fixtureCount) * 100).toFixed(1)}%)`);
  console.log(`- Overall Failed:      ${overallFailed} / ${fixtureCount} (${((overallFailed / fixtureCount) * 100).toFixed(1)}%)`);
  console.log(`- Average Total Score: ${averageQualityScore} / 100`);
  console.log(`- Weakest Dimension:   ${weakestDim.dimension} (${weakestDim.passRatePercent}% pass rate, avg score ${weakestDim.averageScore}/${RUBRIC_CONFIG.maxDimensionScore})`);
  console.log('-'.repeat(70));
  console.log('DIMENSION BREAKDOWN:');
  Object.entries(dimensionSummary).forEach(([dim, data]) => {
    console.log(
      `  • ${dim.padEnd(20)}: ${data.passed}/${fixtureCount} passed (${data.passRatePercent}%) | Avg: ${data.averageScore}/${data.maxScore}`
    );
  });
  console.log('-'.repeat(70));
  console.log('FAILED CHECKS RECORDED:');
  exactFailedChecks.forEach((check) => {
    console.log(`  [${check.severity.toUpperCase()}] ${check.code.padEnd(30)} (${check.count}x) [${check.dimension}]`);
  });
  console.log('-'.repeat(70));

  const outputArtifact = {
    metadata: {
      generatedAt: new Date().toISOString(),
      milestone: 'Milestone 4: Mission Quality + Grounding Rubric',
      evaluator: 'deterministic',
      scope: 'Offline 10-fixture contract validation suite',
      disclaimer:
        'This artifact represents deterministic contract verification on standardized synthetic/edge-case fixtures (A through J). It is not an empirical user study or real-world field-testing measurement.',
      rubricConfiguration: RUBRIC_CONFIG,
    },
    summary: {
      fixtureCount,
      passedCount: overallPassed,
      failedCount: overallFailed,
      overallPassRatePercent: Number(((overallPassed / fixtureCount) * 100).toFixed(1)),
      averageQualityScore,
      weakestDimension: weakestDim,
      dimensionSummary,
    },
    exactFailedChecks,
    fixtures: results,
  };

  const outputDir = path.resolve('docs/benchmark-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'mission-quality.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputArtifact, null, 2) + '\n', 'utf-8');

  console.log(`\nPersisted benchmark results to: ${outputPath}\n`);
}

runMissionQualityBenchmark().catch((err) => {
  console.error('Fatal error during benchmark evaluation:', err);
  process.exit(1);
});
