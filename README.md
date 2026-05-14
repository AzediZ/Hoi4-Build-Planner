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
