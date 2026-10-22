# Toronto Incidents Nearby

Static, dependency-free Toronto Police and Fire public incident viewer. Design and interaction patterns follow [ryanfeeley/dinesafe](https://github.com/ryanfeeley/dinesafe): the 760px responsive shell, green/cream palette, automatic dark mode, rounded two-column cards, segmented current-location/address controls, and straight-line distance sorting. DineSafe is read-only reference material and has not been modified.

## Run and test

Requires Node 24 and Python 3.12; no packages or API keys.

```sh
python scripts/fetch_feeds.py
python -m http.server 8000
node --test tests/*.test.mjs
python -m unittest discover -s tests -p 'test_*.py'
```

Open http://localhost:8000. Geolocation needs HTTPS or localhost and user permission. The only synthetic data lives in tests and is excluded from the deployed artifact. The committed initial JSON contains no incidents. A fetch always replaces each source's incident set, including removing all records on failure.

## Data sources and limitations

- **Toronto Police:** [official Calls for Service app](https://experience.arcgis.com/experience/a22f5295933e48a5b0a4c90cd3c4cae1), linked by [TPS Maps](https://www.tps.ca/data-maps/maps/). Its configuration identifies [C4S_Public_NoGO layer 0](https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/C4S_Public_NoGO/FeatureServer/0). Collector uses the layer's source edit timestamp and UTC `OCCURRENCE_TIME_AGOL`, not retrieval time, to check freshness. It rejects truncated query responses. TPS publishes roughly every 20 minutes and keeps calls visible four hours irrespective of whether police remain on scene. Privacy-sensitive calls and operations can be omitted. A dispatch is not a confirmed crime. The viewer never labels a police call as confirmed active. Records older than four hours are filtered both on ingestion and in the browser.
- **Toronto Fire:** [official active incidents page](https://www.toronto.ca/community-people/public-safety-alerts/alerts-notifications/toronto-fire-active-incidents/) and its [City XML feed](https://www.toronto.ca/data/fire/livecad.xml). The feed carries `update_from_db_time` and active `event` records; updates are nominally every five minutes. Naive timestamps are interpreted in America/Toronto with daylight saving rules. Ambiguous fall-back timestamps fail closed. Older dispatch times may still be valid when the event remains in a fresh active feed. The source has **no coordinates**. Fire events appear citywide; they are excluded from distance filters and placed last for proximity sorting. Map links search published streets and do not assert an exact location. Postal areas and withheld streets are never converted into invented points.
- **Freshness:** snapshots expire 30 minutes after the official source update, independently for each source. Future source timestamps, failed requests, malformed responses, missing required fields and stale feeds hide that source's calls. Browser refresh and visibility changes recheck age, so a tab cannot indefinitely show an old snapshot. No historical feed or sample incident fallback exists. A fresh source timestamp establishes publication freshness, not independent verification of what happened. Empty results never establish that an area is safe or free of incidents.
- **Location:** geolocation coordinates remain in browser memory. User-submitted address text goes to [OpenStreetMap Nominatim](https://nominatim.org/release-docs/latest/api/Search/); one search request is issued per submission, without autocomplete. Results are constrained to a Toronto bounding box, not a municipal boundary polygon. Coordinate entry avoids the external geocoder. Opening a map sends the incident location to Google Maps. Distances are approximate straight lines from published coordinates, not routes.
- Independent project; not affiliated with TPS or the City. Follow source terms and disclaimers. No completeness or public-safety guarantee. Use 911 for emergencies.

## GitHub Pages deployment

Create a separate public repository `ryanfeeley/toronto-incidents`, push this directory to `main`, then select **Settings → Pages → Source → GitHub Actions**. The workflow builds static JSON from the official feeds and deploys the static app, with no browser CORS dependency on incident APIs. It runs on push, manual dispatch, and a five-minute schedule. Actions schedules can be delayed or disabled by GitHub (including after repository inactivity); the browser's expiry guard hides expired results. Deployment is not a real-time SLA.

The workflow needs `pages: write` and `id-token: write`; repository administration and Actions workflow-write permissions are required for initial setup. It stages only app assets and the newly fetched JSON, not tests or any history. Snapshots live in Pages artifacts, not a growing Git commit archive. A source failure still deploys a truthful unavailable state. A failed build leaves the prior deployment, whose data expires in the browser.

Expected Pages URL after successful deployment: https://ryanfeeley.github.io/toronto-incidents/ . Check the Actions deployment output before treating it as deployed.

## Display text translations

`text.mjs` exports `toTitleCase`, `formatEventName`, `formatAddress`, and `formatDetail`. These pure functions follow DineSafe’s title-case conventions: normalize whitespace and Unicode punctuation, lowercase minor words in event names, preserve address suffixes/directions, postal codes, agency acronyms, apparatus and division identifiers, and handle apostrophes and Mc names. The exported acronym set and address-word dictionary provide a central place for further exceptions.

Examples: `FIRE - HIGHRISE RESIDENTIAL` → `Fire - Highrise Residential`; `LAKE SHORE BLVD E` → `Lake Shore Blvd E`; `O’CONNOR DR` → `O’Connor Dr`. Formatting runs at display time for cards, accessible map labels, incident-type option labels and the selected-address label. The original JSON, incident IDs, option values and map queries retain their source text. This is casing normalization, not language translation or an assertion that dispatch descriptions are verified outcomes.
