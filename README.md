# HOI4 Build Planner - Static Web App

This is a static web version of the HOI4 Build Planner.

Use at https://azediz.github.io/Hoi4-Build-Planner/

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

## Changelog

### Unreleased

#### Added

- FUWG smart focus selection:
  - Select FUWG from the Mod dropdown.
  - Select a FUWG country/tree from the Country dropdown.
  - Focus rows autocomplete from parsed FUWG focus-tree data.
  - Focus order checks track selected/completed focuses, prerequisites, duplicates and mutually exclusive choices.
- FUWG research autocomplete:
  - Research rows autocomplete from parsed FUWG technology files.
  - Research selections store internal tech IDs behind the scenes for future validation.
- FUWG starting technology data:
  - Selecting a FUWG country loads that country's starting researched technologies.
  - Research autocomplete hides techs already researched at game start.
  - Manually entered already-known techs are highlighted.

#### Changed

- Research tabs now start empty instead of pre-filling Slot 1 and Slot 2.
- FUWG research autocomplete now hides techs that are already researched at game start or locked behind unmet prerequisite techs.
- Manually typed research choices with missing prerequisites are highlighted.

#### Fixed

- Removed remaining startup research defaults from Slot 1 and Slot 2.


#### Fixed

- Hard-fixed remaining research startup rows so Slot 1 and Slot 2 no longer load with default techs.
