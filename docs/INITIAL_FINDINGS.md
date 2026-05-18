# Door County Land Development Opportunity - Initial Findings

Date: 2026-05-18

## Data Reviewed

- Source folder: Google Drive shared folder, subfolder `OpenClawDocs`
- Primary files downloaded locally:
  - `Active land for sale.xlsx`: 121 active land listings
  - `Sold Land.xlsx`: 156 sold land records
- Cleaned working outputs:
  - `active_clean.csv`
  - `sold_clean.csv`

## Executive Take

The buy-large/split-smaller strategy is directionally valid in Door County, but only if the acquisition is already in a zoning district that supports a profitable lot yield or has a credible rezoning path. The market clearly pays a premium for smaller home-building parcels:

- Sold 1-5 acre parcels: median sold price about $152k, median price per acre about $67k, median DOM about 80.
- Sold 20+ acre parcels: median sold price about $548k, median price per acre about $13k, median DOM about 107.
- Active 1-5 acre parcels: median ask about $189k, median price per acre about $87k.
- Active 20+ acre parcels: median ask about $695k, median price per acre about $17k.

That spread is large enough to support a development thesis, but it can disappear quickly after survey, engineering, roads/access, septic/perk failures, wetlands, holding costs, broker fees, financing, and entitlement risk.

## What Is Selling Well

### By Parcel Size

The strongest sell-through profile is in small buildable parcels:

| Acreage band | Sold count | Median sold price | Median $/acre | Median DOM |
|---|---:|---:|---:|---:|
| <1 acre | 41 | $100,000 | $171,143 | 106 |
| 1-2 acres | 35 | $137,500 | $85,808 | 74 |
| 2-5 acres | 23 | $179,900 | $45,290 | 105 |
| 5-10 acres | 26 | $195,000 | $31,486 | 112 |
| 10-20 acres | 11 | $269,000 | $22,990 | 129 |
| 20-40 acres | 7 | $360,000 | $13,864 | 107 |
| 40+ acres | 3 | $899,900 | $11,841 | 96 |

Interpretation: buyers are paying for buildability, privacy, town proximity, and convenience, not raw acreage. Price per acre decays sharply as acreage rises.

### By Location

Sold count is concentrated in the established Door County demand centers:

| Location | Sold count | Median sold price | Median acres | Median $/acre | Median DOM |
|---|---:|---:|---:|---:|---:|
| Egg Harbor | 38 | $138,250 | 1.4 | $119,048 | 104 |
| Fish Creek | 27 | $200,000 | 3.6 | $58,070 | 109 |
| Sturgeon Bay | 21 | $79,500 | 0.3 | $159,600 | 74 |
| Sister Bay | 19 | $195,000 | 5.1 | $42,500 | 146 |
| Ellison Bay | 15 | $159,900 | 3.5 | $39,098 | 97 |
| Baileys Harbor | 11 | $114,900 | 1.8 | $49,669 | 65 |

Best practical target markets for a parcel-out strategy: Egg Harbor, Fish Creek, Baileys Harbor, Sister Bay, and selected Sturgeon Bay submarkets. Washington Island looks cheaper and slower; it may work only for a different, lower-basis strategy.

## Pricing Signal

Sold-to-list is unusually firm:

- Average sold-to-list: about 99.8%.
- Median sold-to-list: 100.0%.

That suggests sellers are generally getting their number when the parcel is priced reasonably. This is good for resale confidence, but bad for acquisition discounts on already-right-sized lots.

## Zoning and Entitlement Reality

Door County zoning is the main gatekeeper. The Door County Land Use Services page says staff process regular zoning permits, conditional use permits, variances, appeals, and zoning map/text amendment petitions; public hearings for map/text amendments go through the Resource Planning Committee, with the County Board making final decisions.

Relevant minimum new-lot sizes from the Door County Comprehensive Zoning Ordinance:

- General Agricultural (GA): at least 20 acres for new lots.
- Countryside (CS): at least 10 acres for new lots.
- Heartland-3.5 (HL3.5): at least 3.5 acres for new lots.
- Heartland-5 (HL5): at least 5 acres for new lots.
- Heartland-10 (HL10): at least 10 acres for new lots.
- Estate (ES): at least 5 acres for new lots.
- Small Estate Residential (SE): at least 1.5 acres for new lots.
- SF20: at least 20,000 sq. ft. for unsewered new lots.
- SF30: at least 30,000 sq. ft. for new lots.

The ordinance also has a conservation subdivision option intended to preserve natural resources, agricultural land, and open space in exchange for greater density than a traditional subdivision. It can relax individual lot requirements, but it requires site-specific review and preserved open space. Wetlands do not count toward maximum allowable density, though they may count toward minimum site area and open-space requirements.

Sources:

- Door County Land Use Services: https://www.co.door.wi.gov/164/Land-Use-Services
- Door County Zoning & Other Ordinances: https://www.co.door.wi.gov/493/Zoning-Other-Ordinances
- Door County Comprehensive Zoning Ordinance, downloaded locally as `Door-County-Zoning-Ordinance.pdf`

## Active Large-Acreage Candidates To Underwrite First

These are not recommendations yet. They are low price-per-acre candidates that deserve zoning/map/perk/access review:

| MLS | Location | Ask | Acres | Ask $/acre | DOM | Zoning |
|---|---:|---:|---:|---:|---:|---|
| A141638A | Sturgeon Bay | $300,000 | 40.0 | $7,500 | 730 | Natural Area + Wetland |
| A144869A | Egg Harbor | $699,000 | 72.0 | $9,708 | 124 | General Agricultural |
| A144867A | Egg Harbor | $299,000 | 20.0 | $14,950 | 124 | General Agricultural |
| A147079A | Fish Creek | $339,000 | 20.2 | $16,749 | 30 | Heartland 5 |
| A143852A | Sister Bay | $695,000 | 31.4 | $22,148 | 384 | Heartland 10 |
| A144845A | Baileys Harbor | $925,000 | 40.3 | $22,930 | 143 | Heartland 3.5 |

Initial read:

- Natural Area/Wetland is likely a trap unless the buildable upland is excellent and clearly mapped.
- GA acreage is cheap, but subdivision yield is poor without rezoning because new lots need at least 20 acres.
- HL5 and HL3.5 are more compatible with residential parceling, though the acquisition basis must still support infrastructure and sales costs.

## Rough Strategy Test

A 20-acre parcel at $15k/acre costs $300k. If zoning allows four 5-acre lots and each sells around $195k, gross resale is about $780k. That looks compelling before costs.

But the strategy only works after subtracting:

- road/access improvements or shared driveway costs
- survey, engineering, CSM/subdivision plat costs
- soil tests and septic feasibility
- wetland delineation and environmental constraints
- utility extension or buyer discount for lack of utilities
- legal, entitlement, county/town fees
- broker commissions and closing costs
- financing and holding time
- discount for selling multiple lots into a thin local market

The better model is not “price per acre arbitrage.” It is “create scarce, build-ready, appropriately sized home sites near high-demand Door County villages.”

## Recommended Next Underwriting Steps

1. Geocode every active and sold parcel by MLS/parcel number and map them against zoning, wetlands, roads, and shoreland overlays.
2. Build a lot-yield model by zoning district:
   - GA/PA/EA: assume low yield unless rezoning is viable.
   - CS/HL10/HL5/ES: model 5-10 acre rural lots.
   - HL3.5/SE/SF districts: model smaller premium homesites where location supports pricing.
3. Underwrite the six large-acreage candidates above with three scenarios:
   - as-is legal split
   - conservation subdivision
   - rezoning/downzoning-to-residential path
4. Verify each candidate’s:
   - public road frontage
   - access/easements
   - soil/septic status
   - wetlands/floodplain/shoreland overlay
   - utility availability
   - municipal/town political appetite
5. Use sold 1-5 acre lots as resale comps, not broad land averages.

## Bottom Line

Yes, the strategy appears valid enough to pursue. The cleanest path is buying 20-40+ acres in or near proven demand nodes where zoning already supports 3.5-5 acre lots, then selling a small number of well-positioned buildable parcels. The riskier path is buying cheap agricultural/wetland-constrained land and depending on rezoning. That may work occasionally, but it should be treated as entitlement speculation, not a repeatable base strategy.
