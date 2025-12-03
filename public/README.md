# Public Directory (Web Assets)

This directory contains static assets that are served directly for the web version of Aspayr Mobile.

## Contents

- **favicon.ico** - Web browser favicon (place your favicon file here)
- **manifest.json** - PWA manifest file (optional)
- **index.html** - Main HTML template (usually auto-generated)

## Adding a Favicon

1. Create or download a favicon file:
   - Format: .ico, .png, or .svg
   - Recommended size: 32x32 or 64x64 pixels
   - Name it `favicon.ico` or `favicon.png`

2. Place the file in this `public/` directory

3. Reference it in your web HTML (usually done automatically by the build system)

## Note

Files in this directory are only used for the web build. Mobile apps use the icons in `src/assets/icons/` instead.
