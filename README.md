# Door County Real Estate Analysis

This repo stores the Door County, Wisconsin land analysis for evaluating development opportunities, especially the strategy of buying larger rural parcels, subdividing or rezoning them, and reselling smaller buildable lots.

## Open The Land Map

If GitHub Pages is enabled for this repository, open:

https://juulad.github.io/RealEstate/

If that link returns 404, enable GitHub Pages once:

1. Open the repository settings on GitHub.
2. Go to **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch **main** and folder **/docs**.
5. Save, then wait a minute or two and reopen the link above.

If you do not want to enable Pages:

1. Open the GitHub repository.
2. Click the green **Code** button.
3. Choose **Download ZIP**.
4. Unzip the download.
5. Open `index.html` in a browser.

The map is fully static. It does not need a build step, server, login, or API key.

## Map Features

- 123 matched sold land parcels from the source data
- 72 active land listings from `active_clean.csv`
- Dataset toggle for active only, sold only, or active + sold overlay
- Map and satellite basemap views
- Two-color heat overlay, with active listings in blue and sold listings in amber
- Active listings as blue diamonds and sold parcels as amber circles
- Optional sold parcel outlines
- Search and filters for acres, price, MLS, PIN, town, zoning, and remarks
- Click-in parcel details

Note: the active listing source does not include parcel numbers, and only one active row includes explicit coordinates in the remarks. The current active map points are therefore approximate by area except where the listing itself supplied coordinates. Sold parcels remain matched to exact parcel geometry where possible.

## Local Preview

From this folder, run:

```bash
python3 -m http.server 4173
```

Then open:

http://127.0.0.1:4173/

Opening `index.html` directly also works in most browsers, but the local server preview is closer to how GitHub Pages serves it.

## Contents

- `index.html`, `styles.css`, `app.js` - static land map app.
- `data/sold_parcels.js` - geocoded sold parcel data used by the map.
- `data/active_land.js` - active listing data used by the map.
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
