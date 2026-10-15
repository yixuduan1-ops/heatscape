# HEATSCAPE

Building-level evidence for targeted energy support in five inner Melbourne councils. Independent student research; not an official VEU service or an automatic funding decision.

Open the published GitHub Pages site. The application and instructions use relative paths and run as a static site. Set Pages to deploy from the main branch, root directory.

## Data and interpretation

2,573 apartment candidates; 2,571 scored in the default study sample. Temperature: Landsat 9, 7 January 2026. Income: ABS Census 2021 SA1. Buildings: Overture and City of Melbourne project records. Context: OpenStreetMap contributors, ODbL; snapshot 12 September 2026. Methods and limitations are available in the application under Set priorities > Method & interpretation.

Scores combine H/I/B percentile indicators using a common policy balance. They are not health-risk, occupant-income, savings or funding eligibility predictions.

## Building shade context

Priorities includes an optional ground-shadow overlay at the Landsat scene-centre time: 7 January 2026 00:03:46.5320309 UTC (11:03:46 AEDT). MTL sun elevation 56.65410279 degrees; azimuth 73.04185990 degrees. The default sun-exposed H model removes building footprints and modelled ground shadows from the heat sampling area and recomputes H and ranks. A calculation switch restores original sampling; a separate checkbox controls the shadow overlay. Original candidate inputs are preserved. I/B references and weights are unchanged. See [shadow method](shadow-method.md).

Full implemented equations and data-derived curves: [model.html](model.html). Temperature differences are changes of spatial LST statistic, not predicted cooling.

## Ranking stability

Priorities shows weights beside a searchable stability list in a compact desktop panel, leaving the map visible. The test matrix sits below the weights. Eighteen radius/weight tests expand to 36 when both heat models are enabled; custom weights are added automatically. A shared scoring cohort and shortlist size keep comparisons consistent. Buildings with incomplete evidence are flagged separately. “Show consistent Top on map” isolates the stable buildings, closes the panel and fits the map; a banner lets users clear this filter. Stable-only filtering, map colours, pixel diagnostics and CSV exports are included. See [ranking stability method and controls](ranking-stability.md).
