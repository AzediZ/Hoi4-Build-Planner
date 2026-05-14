# HOI4 Build Planner - Static Web App

This is a static web version of the HOI4 Build Planner.

## Upload to hosting

Upload the contents of this folder to any static web host:

- Netlify
- Vercel static project
- Cloudflare Pages
- GitHub Pages
- cPanel / normal website hosting

The important file is `index.html`.

## Features

- No compiling required
- Runs fully in the browser
- Saves builds locally using browser storage
- Copy/load share codes
- Export TXT files
- Works on desktop and mobile browsers, though desktop is recommended

## Notes

This version stores saved builds in the user's browser local storage. Saved builds are not synced between devices unless the user copies a share code.

Share codes use a browser-friendly `h4web://...` format. The app can still load older long `hoi4build://plan/...` codes.


## Air doctrine dropdown update

The Air doctrine subdoctrine dropdowns have been expanded.

Air tracks now include:

Fighters:
- Air-Space Dominance
- Medium-Range Escorts
- Knights of the Air
- Naval Aviation
- Homeland Air Defense

Strike:
- Flying Artillery
- Pinpoint Strikes
- Precision Naval Bombing
- Torpedo Swarm Tactics
- Maritime Patrol

Medium:
- Long-Range Escort
- Operational Air Support
- Tactical Battlefield Support
- Theater Interdiction
- Battlefield Interdiction

Heavy:
- Deep Air Raids
- Night Strategic Bombing
- Carpet Bombing
- Strategic Bombing Focus
- Logistical Bombing


## Air doctrine dropdown correction

Air doctrine dropdowns updated from the supplied list:

Fighter:
- Homeland Air Defense
- Medium-Range Escort
- Fighter-Bombers
- Airspace Dominance
- Knights of the Air
- Naval Aviation

Strike Aircraft:
- Flying Artillery
- Pinpoint Strikes
- Ground-Naval Coordination
- Sea-To-Shore Air Power
- Precision Naval Bombing
- Torpedo Swarm Tactics

Medium Aircraft:
- Heavy Interceptors
- Long-Range Escort
- Operational Air Support
- Tactical Battlefield Support
- Theater Interdiction
- Aerial Recon

Heavy Aircraft:
- Night Strategic Bombing
- Carpet Bombing
- Deep Air Raids
- Flying Fortresses
- Coastal Air Patrol
- Deep Ocean Air Patrol
- Multi-Role Heavy Aircraft Focus


## FUWG smart focus data test

This version includes the first FUWG focus-data pass generated from the uploaded FUWG files.

Generated data:

```text
data/fuwg/countries.json
data/fuwg/focus_trees/*.json
```

Parser result summary:

```text
Countries/trees generated: 53
Shared focus definitions found: 299
Focus trees parsed: 67
Localisation keys loaded: 12015
```

How to test:

```text
1. Open the Focus Order tab
2. Set Focus Data to FUWG
3. Pick a country/tree
4. Click Load Focus Data
5. Add a focus row and start typing in the Focus field
```

Save-code compatibility:

```text
Old codes still load.
New focus rows may additionally store focusId after the old fields.
The existing old focus fields remain in the same order: order, focus, timing, notes.
```


## FUWG focus ID display cleanup

Focus IDs are now hidden from the visible user interface:

- The focus dropdown/search shows only the in-game focus name
- Text export shows only the focus name
- The internal focusId is still saved behind the scenes for compatibility, validation and future prerequisite warnings


## FUWG focus order validation

The Focus Order tab now tracks selected focuses in row order after FUWG focus data is loaded.

Checks added:

- Missing prerequisite focuses
- Mutually exclusive focuses already selected earlier
- Duplicate focus selections
- Focus names that do not exactly match the loaded FUWG tree

Focus IDs remain hidden from the user but are still saved behind the scenes for validation and future features.
Old share codes remain compatible.


## FUWG smart focus UX update

Changes:

- The top Mod field is now a dropdown: Manual Entry, FUWG, Vanilla
- FUWG focus loading is controlled from the top Mod dropdown
- Internal focus IDs are no longer shown in the datalist dropdown
- The focus dropdown now only shows focuses available at that row, based on:
  - focuses selected in previous rows
  - prerequisites
  - mutually exclusive choices
  - duplicate prevention

The internal focusId is still saved behind the scenes for validation and future features.


## Top Mod dropdown fix

The existing top Mod control was `patchInput`. It has now been changed into a real dropdown:

- Manual Entry
- FUWG
- Vanilla

The Smart Focus panel no longer has a separate mod selector; it follows the top Mod dropdown.


## FUWG focus auto-load

The Smart Focus section no longer has a Load Focus Data button.

Flow is now:

```text
Top Mod dropdown → FUWG
Country / Tree dropdown becomes active
Selecting a country/tree automatically loads that focus tree
```
