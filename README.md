# HEATSCAPE

A static research prototype for energy-support investigation across five Melbourne councils.

Current model: adjustable internal H and I shares (starting at 70/30), plus shared outer H/I/B weights. The 162-test default suite varies all four dimensions. Inputs: fixed multi-day Landsat heat plus a historical temperature index; SA1 economic pressure combines low-income share and a same-year area rent/income proxy. CLUE building type/age and Homes Victoria 2025 rent benchmarks are separate evidence. No building income is inferred from age/use.

See [model](model.html), [guide](instructions.html), [heat register](assets/heat-source-register.json), [matched housing evidence](assets/integrated-evidence.json) and [building validation](building-validation.html).

Default result: 2,561 scored; Swanston Central 81.5 / rank 54. Stability: 162 settings, common cohort 2,560, Top 20% 512 positions, 138 consistently shortlisted. These are prototype screening results, not verified energy need or outcomes.

Heat quality: exact dated polygon audit of resampled-cell weight concentration, area and coverage. 100 m default, 150 m broader context, 50 m exploratory. Full diagnostics in About data and assets/heat-quality-observations.csv.gz.

Selected-building map: multi-day sunlit geometry, gold for all accepted dates and pale gold for some. This display overlay is separate from score processing.
