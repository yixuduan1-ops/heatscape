# Dated building-shadow sampling

Every Landsat observation has its own solar elevation, azimuth and date-specific open-ground mask. The Show building shadows checkbox only displays geometry already used in that observation’s score. The multi-date median and historical mosaic have no single observation-time overlay.

For complete equations and assumptions, see [model.html](model.html). The heat-source register includes metadata, source hashes and numerical integration checks for every date.

All mapped context buildings participate. Their footprints are swept along the opposite solar bearing by height / tan(elevation). Building footprints and the union of neighbouring/self-shadows are excluded from 50/100/150 m surroundings. Modelled shadows do not resolve temperatures below the thermal sensor’s approximately 100 m native resolution or predict cooling. Flat terrain, vertical volumes and estimated heights limit the geometry.

## Building names and spacing
Building names are an incomplete, geometry-matched OpenStreetMap lookup, not an authoritative name register. Ten candidate footprints were unambiguously matched in the central-city lookup area. Victoria One (Vone), Light House and Swanston Central have developer/resident website address references. IDs remain the stable identifiers. Source links are in building-names.json; OpenStreetMap contributors, ODbL.

Building spacing uses EPSG:7855 minimum horizontal footprint-edge distance against all 122,414 context footprints. Counts cover 50/100/150 m; the nearest eight are retained, with the nearest five shown. Near-zero gaps may represent shared podiums, touching or overlapping source geometry. These are mapped footprint gaps, not verified tower/facade clearances. Shadow casting already uses the relative building positions and height/sun direction. No distance-to-temperature or heat-transfer coefficient has been introduced.
