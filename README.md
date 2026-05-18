# Door County Real Estate Analysis

This repo stores the Door County, Wisconsin land analysis for evaluating development opportunities, especially the strategy of buying larger rural parcels, subdividing or rezoning them, and reselling smaller buildable lots.

## Open The Sold Land Map

If GitHub Pages is enabled for this repository, open:

https://juulad.github.io/RealEstate/

If that link does not load yet:

1. Open the GitHub repository.
2. Click the green **Code** button.
3. Choose **Download ZIP**.
4. Unzip the download.
5. Open `index.html` in a browser.

The map is fully static. It does not need a build step, server, login, or API key.

## Map Features

- 123 matched sold land parcels from the source data
- Map and satellite basemap views
- Heat overlay weighted by the selected metric
- Point markers and optional parcel outlines
- Search and filters for acres, sold price, MLS, PIN, town, zoning, and remarks
- Click-in parcel details

## Local Preview

From this folder, run:

```bash
python3 -m http.server 4173
```

Then open:

http://127.0.0.1:4173/

Opening `index.html` directly also works in most browsers, but the local server preview is closer to how GitHub Pages serves it.

## Contents

- `index.html`, `styles.css`, `app.js` - static sold land map app.
- `data/sold_parcels.js` - geocoded sold parcel data used by the map.
- `data/raw/active_clean.csv` - cleaned active land listing data.
- `data/raw/sold_clean.csv` - cleaned sold land listing data.
- `data/raw/Door-County-Zoning-Ordinance.txt` - extracted zoning ordinance text for search and analysis.
- `docs/INITIAL_FINDINGS.md` - first market read and strategy memo.

## Current Read

The strategy looks directionally valid. Sold and active data show a meaningful price-per-acre premium for smaller buildable parcels versus larger acreage. The real underwriting work is entitlement risk: zoning, wetlands, shoreland overlays, road access, septic feasibility, survey/legal costs, and actual lot yield.

## Next Work

1. Refine the heat map using price per acre, acre band, and sale density.
2. Screen active 20+ acre parcels for likely legal lot yield under current zoning.
3. Underwrite top candidates after checking wetlands, access, septic, and rezoning feasibility.
