# GIS demo data sources

Last reviewed: 2026-10-07

Only `selangor-daerah.geojson` loads with the page. Every other file is fetched the first time it is needed.

## Administrative boundaries

| File | Description | Source | License | Retrieved |
|------|-------------|--------|---------|-----------|
| `malaysia-daerah.geojson` | All 160 districts and Federal Territories | [geoBoundaries](https://www.geoboundaries.org/) Malaysia ADM2 (`MYS`, `ADM2`, year 2020), states from ADM1 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 2026-10-07 |
| `selangor-daerah.geojson` | Selangor's 9 daerah plus the Kuala Lumpur and Putrajaya enclaves | Same as above | CC BY 4.0 | 2026-10-07 |
| `malaysia-mukim.geojson` | 1,858 mukim, bandar, pekan and Sarawak land/town districts (no Sabah: the source has no ADM3 for Sabah) | [geoBoundaries](https://www.geoboundaries.org/) Malaysia ADM3 (`MYS`, `ADM3`, year 2021) | CC BY 4.0 | 2026-10-07 |
| `selangor-mukim.geojson` | Selangor's 217 mukim, bandar and pekan plus Kuala Lumpur's 7 | Same as above | CC BY 4.0 | 2026-10-07 |

The `malaysia-*` files load only when "All Malaysia" is selected. Selangor files are cut from the same processed data, so names and areas match in both views.

Processing (mapshaper):

- Daerah: state assigned by joining each district's interior point to ADM1 (Sepang and Daro fixed by hand). `Ulu Langat` and `Ulu Selangor` shown as **Hulu Langat** and **Hulu Selangor**; Malacca and Penang shown as **Melaka** and **Pulau Pinang**. The source still draws Putrajaya inside Sepang (it was excised in 2001), so the ADM3 `Bandar Putrajaya` shape is erased from Sepang and added as a separate `Putrajaya` feature. Kuala Lumpur, Putrajaya and Labuan carry `level: "wilayah"` (Federal Territory).
- Mukim: names title-cased and `type` taken from the name (Mukim, Bandar, Pekan, Land district, Town district, else Subdistrict). Daerah and state assigned by interior point; 5 coastal and island units outside every district outline assigned to the nearest district. `Bandar Putrajaya` removed (it is the Putrajaya feature above).
- Areas computed from the unsimplified source (spherical) and approximate, not official land-office figures. Geometry then simplified (Selangor daerah lightly, the national files and mukim to 25 to 40% of vertices) and coordinates rounded.

## OpenStreetMap layers

All from [OpenStreetMap](https://www.openstreetmap.org/) via the [Overpass API](https://overpass-api.de/), limited to the Selangor admin area (`ISO3166-2=MY-10`). License: [ODbL](https://www.openstreetmap.org/copyright), "© OpenStreetMap contributors". Retrieved 2026-10-07. Community data: coverage and names are incomplete in places.

| File | Contents | OSM tags |
|------|----------|----------|
| `selangor-school.geojson` | 1,236 named schools (points) | `amenity=school` |
| `selangor-health.geojson` | 783 named hospitals and clinics (points) | `amenity=hospital`, `amenity=clinic` |
| `selangor-mosque.geojson` | 1,118 named masjid and surau (points) | `amenity=place_of_worship` + `religion=muslim` |
| `selangor-police.geojson` | 138 named police stations (points) | `amenity=police` |
| `selangor-roads.geojson` | Expressways, trunk and primary roads | `highway=motorway, trunk, primary` |
| `selangor-rail.geojson` | KTM, LRT, MRT, monorail lines and 118 stations | `railway=rail, light_rail, subway, monorail` (no `service`); stations from `railway=station/halt` and `public_transport=station` |
| `selangor-water.geojson` | Rivers, named lakes and reservoirs | `waterway=river`; `natural=water` + `water=lake/reservoir` |
| `selangor-green.geojson` | Named parks, forest reserves, protected areas | `leisure=park`, `boundary=protected_area`, `leisure=nature_reserve`, `landuse=forest` named "Hutan Simpan" |

Processing: unnamed features dropped (points); ways and buildings reduced to centre points for places; converted with osmtogeojson; road and river segments merged by name with mapshaper `-dissolve`; lines simplified with mapshaper (`interval` 15 to 60 m); coordinates rounded to 4 or 5 decimals.

## Base maps (tiles, not stored in this folder)

| Style | Provider | License / terms |
|-------|----------|-----------------|
| Streets | OpenStreetMap contributors via `tile.openstreetmap.org` | [ODbL](https://www.openstreetmap.org/copyright) |
| Satellite | Esri World Imagery | [Esri attribution](https://www.esri.com/en-us/legal/terms/data-attribution) |
| Terrain | OpenTopoMap | [CC BY-SA](https://opentopomap.org) |
| Light / dark | Esri World Light / Dark Gray Canvas | [Esri attribution](https://www.esri.com/en-us/legal/terms/data-attribution) |

## Place search

| Service | Use | Policy |
|---------|-----|--------|
| [Photon](https://photon.komoot.io/) | Primary geocoding (places, businesses in OSM) | Komoot public API; requests proxied via this site's `/api/demos/gis-map/geocode` |
| [Nominatim](https://nominatim.openstreetmap.org/) | Fallback geocoding | [Usage policy](https://operations.osmfoundation.org/policies/nominatim/); server-side proxy with contact email |
