# HEATSCAPE

Independent student research for targeted energy-support investigation across five inner Melbourne councils. Not an official VEU service or an automatic funding decision.

The static application is deployed at https://yixuduan1-ops.github.io/heatscape/index.html from the main branch root. It includes 2,573 apartment candidates; the default observation remains 7 January 2026, at 100 m and H/I/B 40/40/20.

## Heat evidence

Nine Landsat 8/9 dates (29 Dec 2025–23 Feb 2026) are cloud/quality screened and processed with their own solar geometry. The selector also offers a median requiring at least three valid dates, and the CSIRO 2018–19 historical LST product. Historical CSIRO UHI, Victorian 2018 Mesh Block heat/vegetation and Climate Victoria 1981–2010 monthly air-temperature normals are additional building context, not extra scoring weights. All sources, checksums, periods, coverage and limitations are in About data and assets/heat-source-register.json.

## Calculation and stability

H/I/B relative percentiles use shared weights. Eighteen tests combine six weight choices and three extents for the selected source. The nine-date suite contains 162 tests; custom weights add another set. Test ranks use a shared complete-evidence cohort; missing evidence is never zero need. The stability list, map isolation, test matrix and CSV exports stay linked.

See [model equations](model.html), [user guide](instructions.html), [ranking stability](ranking-stability.md) and [building validation](building-validation.html). Original read-only input files and reproducible processing scripts are retained locally; only compact derived results and geometry are served to the browser.
