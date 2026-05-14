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
