import { readFileSync, writeFileSync } from 'node:fs';
const result = JSON.parse(
  readFileSync('reports/lighthouse.report.json', 'utf8'),
);
const scores = Object.fromEntries(
  Object.entries(result.categories).map(([key, value]) => [
    key,
    Math.round(value.score * 100),
  ]),
);
writeFileSync(
  'reports/scores.json',
  JSON.stringify(
    {
      date: new Date().toISOString(),
      url: result.finalDisplayedUrl,
      formFactor: result.configSettings.formFactor,
      scores,
    },
    null,
    2,
  ),
);
const summary = Object.entries(scores)
  .map(([key, value]) => `${key}: **${value}**`)
  .join(' · ');
const readme = readFileSync('README.md', 'utf8');
writeFileSync(
  'README.md',
  readme.replace(
    /<!-- LIGHTHOUSE -->[\s\S]*?<!-- \/LIGHTHOUSE -->/,
    `<!-- LIGHTHOUSE -->\nPomiar mobilny Lighthouse (CI, build produkcyjny): ${summary}. Raport: [reports/lighthouse.report.html](reports/lighthouse.report.html).\n<!-- /LIGHTHOUSE -->`,
  ),
);
if (Object.values(scores).some((value) => value < 90)) {
  console.error('Lighthouse threshold below 90', scores);
  process.exitCode = 1;
}
