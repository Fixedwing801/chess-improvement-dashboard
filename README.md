# Chess Improvement Lab Dashboard

Public, aggregate-only dashboard for the Chess Improvement Lab.

## Six separate dashboard pages

- [Overview](https://fixedwing801.github.io/chess-improvement-dashboard/)
- [Performance Analytics](https://fixedwing801.github.io/chess-improvement-dashboard/performance.html)
- [Opening Explorer](https://fixedwing801.github.io/chess-improvement-dashboard/openings.html)
- [Mistake Analysis](https://fixedwing801.github.io/chess-improvement-dashboard/mistakes.html)
- [Training Centre](https://fixedwing801.github.io/chess-improvement-dashboard/training.html)
- [Progress Tracking](https://fixedwing801.github.io/chess-improvement-dashboard/progress.html)

All pages use a shared responsive stylesheet and load the current sanitised `dashboard-data.json` snapshot. The private analysis workflow publishes aggregate data after successful game analysis; GitHub Pages deploys the updated site automatically.

## Privacy boundary

This public repository contains aggregate statistics only. Individual games, PGNs, opponent identities, game URLs, move histories, FENs, ratings, clock samples and personal training positions remain in the separate private repository. The public Training Centre therefore provides a general training structure rather than game-specific exercises.

## Methodology and limitations

Centipawn loss is a short-search Stockfish estimate, not Chess.com accuracy. Phase and opening comparisons are descriptive, not causal diagnoses. Small opening samples are flagged as preliminary. Progress currently shows the latest baseline and import coverage; a dated aggregate history series is not yet published, so no rolling trend chart is claimed.

## GitHub Pages

The site deploys from the repository root through `.github/workflows/pages.yml`. The dashboard uses no paid services or third-party JavaScript dependencies.
