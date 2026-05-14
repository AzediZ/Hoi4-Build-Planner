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

- Supported-mod country focus selection:
  - Select a supported mod from the Mod dropdown.
  - Select a country/tree from the Country dropdown.
  - Focus rows autocomplete from parsed mod focus-tree data.
  - Focus order checks track selected/completed focuses, prerequisites, duplicates and mutually exclusive choices.
- Supported-mod research selection:
  - Research rows autocomplete from parsed mod technology files.
  - Research selections store internal tech IDs behind the scenes for future validation.
  - Selecting a country loads that country's starting researched technologies.
  - Research autocomplete hides techs already researched at game start or locked behind unmet prerequisite techs.
