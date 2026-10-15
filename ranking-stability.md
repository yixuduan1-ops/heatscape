# Ranking stability in Priorities

Open Priorities to see weights, a building stability list and a test matrix together. The desktop panel is wider; smaller screens stack the sections. The building list has no pagination. Search by building name, alias, address or ID. List and map council filters do not recalculate ranks.

## Tests

The standard suite combines each of 50, 100 and 150 m with these H / I / B weights:

| Weight choice | H | I | B |
|---|---:|---:|---:|
| Balanced | 40% | 40% | 20% |
| Heat first | 60% | 20% | 20% |
| Income first | 20% | 60% | 20% |
| More building scale | 30% | 30% | 40% |
| No building scale | 50% | 50% | 0% |
| Equal shares | 1/3 | 1/3 | 1/3 |

There are 18 tests using the active heat model. “Also test the original heat model” includes both original and sunlit models, producing 36 tests. If current weights are not a preset, three additional tests (or six with both heat models) are included. Equal shares use exact thirds; the displayed percentages are rounded.

Click a matrix cell to apply its model, radius and weights to the live score, rank and scatter. The matrix shows shortlist counts until a building is selected, then that building's rank and In/Out status for every test. The highlighted cell matches the active settings. All tests reuse the existing 7 January 2026 observation; they are not multi-date validation.

## Comparable ranks and missing evidence

Each scenario uses the existing H/I/B calculation and fixed reference distributions. Tests do not modify raw measurements. The shared comparison cohort is the intersection of candidates with valid scores in every test. The same buildings and shortlist size are used throughout a suite:

- Count mode: requested positions = min(requested count, shared cohort size).
- Percentage mode: requested positions = ceil(shared cohort size × requested percentage / 100).
- Each test sorts scores descending; exact score ties share the minimum rank and all ties at the cutoff enter the shortlist. Thus the final count can exceed requested positions.
- Selection count is the number of tests where a comparable building enters the shortlist. Best/worst rank are its minimum/maximum rank across those tests.
- A building missing a required observation in any test is marked “Insufficient evidence”. Its valid-test count is shown, but comparative selection count and rank range are blank. It is excluded from every comparative ranking, rather than changing the peers from test to test. Missing evidence is never coded as a failed selection.
- “All tested settings” requires complete evidence and selection in every test. It is not a probability, proof of need, or a guarantee across untested settings.

The reference distributions are unchanged. The active system score/rank still uses its normal eligible cohort; the list labels this “Now”. If the complete-case comparison cohort is smaller, its test ranks may differ from the normal active rank even with identical settings.

## Filters, map and exports

The “Only buildings in all tested settings” checkbox is shared with Shortlist and filters the map. It combines with any existing council and current-top filters. Stability map colours distinguish all, some, none and insufficient evidence. “View map” closes the workspace to expose the map; the colours and filters persist.

“Export list” exports the matching stability rows, counts, range, current score/rank, test IDs, cohort, shortlist settings and height quality. “Export test table” exports exact weights, model, radius, cutoff, cohort, shortlist count and selected-building results. The existing Shortlist export also includes stability fields.

Pixel support is available beneath the test matrix for a selected building: sunlit sample counts, valid area and sunlit area at each radius. Counts are resampled 30 m raster cells, not independent observations at the sensor's approximately 100 m thermal resolution. This diagnostic does not establish that a 50 m extent resolves local temperature adequately.
