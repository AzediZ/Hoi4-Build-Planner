# Changelog

## Unreleased

### Added
- FUWG smart focus selection:
  - Select FUWG from the Mod dropdown.
  - Select a FUWG country/tree from the Country dropdown.
  - Focus rows autocomplete from parsed FUWG focus-tree data.
  - Focus order checks track selected/completed focuses, prerequisites, duplicates and mutually exclusive choices.
- FUWG research autocomplete:
  - Research rows autocomplete from parsed FUWG technology files.
  - Research selections store internal tech IDs behind the scenes for future validation.

### Added
- FUWG starting technology data:
  - Selecting a FUWG country loads that country's starting researched technologies.
  - Research autocomplete hides techs already researched at game start.
  - Manually entered already-known techs are highlighted.

### Changed
- Research tabs now start empty instead of pre-filling Slot 1 and Slot 2.
- FUWG research autocomplete now hides techs that are already researched at game start or locked behind unmet prerequisite techs.
- Manually typed research choices with missing prerequisites are highlighted.
