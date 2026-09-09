# DIRECTIVE I

Official promotional website for **DIRECTIVE I**, a Minecraft Bedrock zombie-apocalypse modpack.

The site uses the current 10-second teaser as a full-screen cinematic hero and as the playable trailer in the media section.

## Website features

- Responsive desktop, tablet, and mobile layout
- Cinematic autoplay hero video with `playsinline` support for mobile
- Full-screen trailer modal with native video controls
- Minimal AAA military-survival visual direction
- Dark charcoal UI with hazard-green `I` branding
- Mobile navigation and accessibility states
- Reduced-motion fallback
- Static build with no runtime framework or external JavaScript dependency
- GitHub Pages deployment workflow
- GitLab Pages CI file retained for mirroring later

## Media source

The trailer binary is stored in this repository as Base64 source chunks because the connected repository writer only accepts UTF-8 text files. The GitHub Pages workflow reconstructs the original MP4 and poster before deployment.

For a local preview, run:

```bash
bash scripts/materialize-assets.sh
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

The generated local media files are intentionally ignored by Git:

- `assets/directive-i-teaser-01.mp4`
- `assets/trailer-poster.jpg`

## Trailer updates

When the next trailer segment is ready, the media source can be replaced or the final merged trailer can be encoded into `assets/trailer-b64/` and deployed without changing the page structure.

## Brand direction

- Near-black / charcoal interface
- White typography
- Hazard-green accent for the Roman numeral `I`
- Minimal AAA military-survival presentation

DIRECTIVE I is an unofficial fan-made Minecraft project and is not affiliated with Mojang or Microsoft.
