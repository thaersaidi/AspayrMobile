# Assets Directory

This directory contains all static assets for the Aspayr Mobile app.

## Directory Structure

```
assets/
├── icons/        # App icons, launcher icons, and small graphics
├── images/       # Larger images, photos, and mockups
└── README.md     # This file
```

## Where to Put Your Files

### Icons
- **App Icon (iOS/Android)**: Place in `icons/`
  - For React Native, you'll need multiple sizes:
    - iOS: icon@2x.png (120x120), icon@3x.png (180x180)
    - Android: icon.png (various sizes in android/app/src/main/res/mipmap-*)

- **In-app Icons**: Place SVG or PNG icons in `icons/`
  - Use Material Community Icons or React Native Vector Icons when possible
  - Custom icons should be SVG format for best results

### Images
- **Mockup/Screenshots**: Place in `images/`
- **Backgrounds**: Place in `images/`
- **Logos**: Place in `images/`

### Favicon (Web only)
- **Location**: `public/favicon.ico`
- The `public/` folder is specifically for web assets
- Supports .ico, .png, or .svg formats

## Usage in Code

```typescript
// Import images
import logo from '../assets/images/logo.png';

// Use in component
<Image source={logo} style={styles.logo} />

// For web favicon, update index.html:
<link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
```

## Best Practices

1. **Naming**: Use lowercase with hyphens (e.g., `app-icon.png`)
2. **Sizes**: Provide @2x and @3x versions for retina displays
3. **Format**:
   - Icons: SVG or PNG
   - Photos: JPG or WebP
   - Favicon: ICO or PNG
4. **Optimization**: Compress images before committing
