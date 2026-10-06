# Current sun-exposed H model

The active H calculation now uses the unshaded open-ground mean described below. Use sun-exposed H (on by default) removes all building footprints and modelled shadows; off restores the original exterior-buffer mean. Both modes compute their own temperature percentiles on the fixed study cohort and rank all eligible candidates, with I, B and policy weights held fixed. Before/after temperature, H, heat rank, score and overall rank are exported. This is a spatial-statistic comparison, not a causal cooling model. Complete equations and curves: [model.html](model.html).

## Geometry and sampling provenance

# Ground-shadow context

The optional Show building shadows overlay does not control scores. The separate Use sun-exposed H calculation switch does: it uses the unshaded-ground temperature statistic below. Neither is a physical cooling or building-energy model.

## Solar geometry

Source: LC09_L2SP_092086_20260107_20260108_02_T1_MTL.txt. DATE_ACQUIRED 2026-01-07; SCENE_CENTER_TIME 00:03:46.5320309Z, equivalent to 11:03:46.5320309 AEDT. SUN_ELEVATION 56.65410279 degrees; SUN_AZIMUTH 73.04185990 degrees clockwise from true north. These are scene-centre approximations, not per-building sun angles or exact individual pixel acquisition times.

A vertical building of height h casts a flat-ground shadow with displacement h / tan(elevation), bearing (azimuth + 180) mod 360. A geodesic direction at the study centre is projected to EPSG:7855 to account for grid orientation. Building polygons are swept along this displacement by unioning their original and translated footprints with the swept edge quadrilaterals. Courtyards and multipart footprints are retained. Ground inside any building footprint is excluded.

## Neighbours and self-shadow

All available context buildings participate, not just apartment candidates or currently visible buildings. A spatial search includes buildings outside the selected buffer whose shadows can reach it, using the maximum height-derived reach. Neighbour shadows exclude the selected building; total shade includes its self-shadow. Overlapping shadows are unioned, not added. Comparisons use the existing 50, 100 and 150 m exterior footprint buffers. Percentages refer to the open-ground portion, not the original whole buffer. Teal is neighbour shade; violet is additional self-shadow. The overlay is clipped to the chosen extent.

## Temperature association

The cloud-screened existing LST raster is reused, without any temperature adjustment. Exact polygon areas give the geometric shade percentages. Temperature association uses 2.5 m midpoint quadrature aligned to the 30 m source grid, retaining subcell centres inside the shaded or unshaded open-ground polygons. Subcells retain their original source-cell temperature. Subcell area times exp(-2(d/R)^2), using distance to the selected footprint, supplies each weight. Boundary areas in this temperature integration are approximate; the subcells do not add thermal resolution. This follows the existing spatial-emphasis convention, not a physical heat-transfer law. Means require at least 80% sampled valid area and weight, plus three valid source grid cells; otherwise they are unavailable.

The two groups can share the same source pixels. Approximately 100 m native thermal observations resampled to 30 m do not resolve individual shadows. The difference between these descriptive means is not a causal cooling effect. A shaded group can have a higher average because it occupies a different part of the existing heat field. Exact geometric splits cannot unmix the temperature of roofs and ground inside a pixel.

## Limits and validation

Assumes flat terrain, vertical extruded footprints and one scene-centre solar direction. Context geometry is the existing packaged map geometry; candidate geometry uses the original projected footprints. Building heights can be estimated. No trees, sloping roofs, facades, terrain, reflected radiation, wind or heat transfer are modelled. Buildings outside the dataset are missing potential occluders, especially at study boundaries. Building and imagery dates differ. This is not a roof/facade shading analysis or indoor temperature estimate.

Checks include an analytic rectangular-building shadow area and direction test; partition conservation and neighbour/total-shade bounds for every candidate and radius; and sampled 2.5 m versus 1.25 m temperature integration comparisons. Dataset metadata records checks and the unchanged candidate-data SHA256. The baseline input data are preserved; H can now be evaluated in either sampling mode.

References: [USGS Landsat surface temperature](https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-temperature); [University of Idaho Integrated Design Lab shadow simulator](https://idlboise.com/sites/default/files/design-tools/CODEX/sundial-simulator.html).


## Building names and spacing
Building names are an incomplete, geometry-matched OpenStreetMap lookup, not an authoritative name register. Ten candidate footprints were unambiguously matched in the central-city lookup area. Victoria One (Vone), Light House and Swanston Central have developer/resident website address references. IDs remain the stable identifiers. Source links are in building-names.json; OpenStreetMap contributors, ODbL.

Building spacing uses EPSG:7855 minimum horizontal footprint-edge distance against all 122,414 context footprints. Counts cover 50/100/150 m; the nearest eight are retained, with the nearest five shown. Near-zero gaps may represent shared podiums, touching or overlapping source geometry. These are mapped footprint gaps, not verified tower/facade clearances. Shadow casting already uses the relative building positions and height/sun direction. No distance-to-temperature or heat-transfer coefficient has been introduced. Original H inputs are preserved for the baseline; active H and rankings depend on the calculation switch.
