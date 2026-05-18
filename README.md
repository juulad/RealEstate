# Door County Real Estate Analysis

This repo stores the Door County, Wisconsin land analysis for evaluating development opportunities, especially the strategy of buying larger rural parcels, subdividing or rezoning them, and reselling smaller buildable lots.

## Contents

- data/raw/active_clean.csv - cleaned active land listing data.
- data/raw/sold_clean.csv - cleaned sold land listing data.
- data/raw/Door-County-Zoning-Ordinance.pdf - county zoning ordinance source.
- data/raw/Door-County-Zoning-Ordinance.txt - extracted zoning ordinance text for search and analysis.
- docs/INITIAL_FINDINGS.md - first market read and strategy memo.

## Current Read

The strategy looks directionally valid. Sold and active data show a meaningful price-per-acre premium for smaller buildable parcels versus larger acreage. The real underwriting work is entitlement risk: zoning, wetlands, shoreland overlays, road access, septic feasibility, survey/legal costs, and actual lot yield.

## Next Work

1. Enrich sold parcels with GIS coordinates from Door County parcel data.
2. Build a heat map of demand using sold parcel locations, price, price per acre, and acre band.
3. Screen active 20+ acre parcels for likely legal lot yield under current zoning.
4. Underwrite top candidates after checking wetlands, access, septic, and rezoning feasibility.
