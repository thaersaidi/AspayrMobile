# Responsive Web-First Design Implementation

This document describes the responsive design system implemented in AspayrMobile to provide a proper web-first experience.

## Overview

The app now features:
- **Sidebar navigation on web/desktop** instead of bottom tabs
- **Horizontal card layouts** that display information side-by-side on larger screens
- **Responsive grid layouts** that adapt column counts based on screen size
- **Hover effects** on interactive elements for web
- **Constrained content width** on web to prevent over-stretching

## New Components

### 1. Responsive Utilities

#### `useResponsive` Hook
Location: [`src/hooks/useResponsive.ts`](src/hooks/useResponsive.ts)

Provides responsive information about the current screen:

```typescript
const { isDesktop, isTablet, isMobile, isWeb, width, breakpoint } = useResponsive();
```

**Breakpoints:**
- Mobile: 0-767px
- Tablet: 768-1023px
- Desktop: 1024-1439px
- Wide: 1440px+

#### `useResponsiveValue` Hook
Get different values based on breakpoint:

```typescript
const padding = useResponsiveValue({
  mobile: 8,
  tablet: 16,
  desktop: 24
});
```

#### Responsive Utilities
Location: [`src/utils/responsive.ts`](src/utils/responsive.ts)

Helper functions and constants:
- `isWeb` - Platform check
- `webStyle()` - Apply styles only on web
- `nativeStyle()` - Apply styles only on native
- `spacing` - Consistent spacing scale
- `maxWidths` - Content container max-widths
- `gridColumns` - Column counts per breakpoint

### 2. Layout Components

#### `ResponsiveContainer`
Location: [`src/components/common/ResponsiveContainer.tsx`](src/components/common/ResponsiveContainer.tsx)

Constrains content width on web while remaining full-width on mobile:

```tsx
<ResponsiveContainer maxWidth={1200}>
  {/* Your content */}
</ResponsiveContainer>
```

Props:
- `maxWidth` - Maximum width in pixels (default: 1200)
- `centerContent` - Center horizontally (default: true)
- `style` - Additional styles

#### `ResponsiveGrid`
Location: [`src/components/common/ResponsiveGrid.tsx`](src/components/common/ResponsiveGrid.tsx)

Automatic responsive grid layout:

```tsx
<ResponsiveGrid gap={16} maxColumns={3}>
  <Card1 />
  <Card2 />
  <Card3 />
</ResponsiveGrid>
```

**Automatic columns:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Wide: 4 columns (or maxColumns)

Props:
- `gap` - Space between items (default: 16)
- `minColumns` - Minimum columns (default: 1)
- `maxColumns` - Maximum columns (default: 4)

### 3. Card Components

#### `ResponsiveCard`
Location: [`src/components/common/ResponsiveCard.tsx`](src/components/common/ResponsiveCard.tsx)

Card that adapts layout based on screen size:

```tsx
<ResponsiveCard horizontal="auto" onPress={handlePress}>
  {/* Content */}
</ResponsiveCard>
```

Features:
- Horizontal layout on desktop, vertical on mobile
- Hover effects on web
- Elevated shadow on hover

Props:
- `horizontal` - `true` | `false` | `'auto'` (default: 'auto')
- `elevated` - Show elevation/shadow (default: true)
- `padding` - Internal padding (default: 16)
- `onPress` - Click/tap handler

#### `BankCard`
Location: [`src/components/common/BankCard.tsx`](src/components/common/BankCard.tsx)

Specialized bank overview card:

```tsx
<BankCard
  bankName="Chase Bank"
  bankLogo={logoUrl}
  accountCount={3}
  totalBalance={15000.50}
  currency="GBP"
  onPress={handlePress}
/>
```

**Mobile layout:** Vertical stack (logo → details → balance)
**Desktop layout:** Horizontal row (logo | details | balance)

#### `AccountCard`
Location: [`src/components/common/AccountCard.tsx`](src/components/common/AccountCard.tsx)

Specialized account card:

```tsx
<AccountCard
  accountName="Current Account"
  accountType="CURRENT"
  accountNumber="12345678"
  balance={5430.25}
  currency="GBP"
  icon="bank"
  onPress={handlePress}
/>
```

**Mobile layout:** Vertical stack
**Desktop layout:** Horizontal row with right-aligned balance

### 4. Navigation

#### `Sidebar`
Location: [`src/components/navigation/Sidebar.tsx`](src/components/navigation/Sidebar.tsx)

Vertical sidebar navigation for web/desktop:
- Fixed width (280px)
- Vertical navigation items
- Active state highlighting
- Logo/branding at top

#### `ResponsiveNavigator`
Location: [`src/navigation/ResponsiveNavigator.tsx`](src/navigation/ResponsiveNavigator.tsx)

Adaptive navigation:
- **Desktop/Web:** Sidebar layout with content area
- **Mobile/Tablet:** Bottom tabs (existing behavior)

## Updated Screens

### DashboardScreen
Location: [`src/screens/main/DashboardScreen.tsx`](src/screens/main/DashboardScreen.tsx)

**Changes:**
- Wrapped content in `ResponsiveContainer`
- Bank cards now use `ResponsiveGrid` + `BankCard` components
- Displays 2 columns on desktop, 1 on mobile
- FAB hidden on desktop (web)

**Web view:**
```
[Sidebar] | [Content Area with max-width 1200px]
           [Bank Card 1] [Bank Card 2]
           [Bank Card 3] [Bank Card 4]
```

### AccountsScreen
Location: [`src/screens/main/AccountsScreen.tsx`](src/screens/main/AccountsScreen.tsx)

**Changes:**
- Wrapped content in `ResponsiveContainer`
- **Desktop:** Individual account cards in 2-column grid
- **Mobile:** Grouped by bank (original layout)

**Web view:**
```
[Sidebar] | [Content Area]
           [Account 1] [Account 2]
           [Account 3] [Account 4]
```

**Mobile view:**
```
[Bank Header: Chase Bank]
  ├─ Account 1
  ├─ Account 2
  └─ Account 3
[Bank Header: Barclays]
  └─ Account 1
```

## Usage Examples

### Creating a Responsive Layout

```tsx
import { ResponsiveContainer, ResponsiveGrid } from '../components/common';
import { useResponsive } from '../hooks/useResponsive';

function MyScreen() {
  const { isDesktop } = useResponsive();

  return (
    <ResponsiveContainer>
      <ResponsiveGrid gap={16} maxColumns={isDesktop ? 3 : 2}>
        {items.map(item => (
          <MyCard key={item.id} {...item} />
        ))}
      </ResponsiveGrid>
    </ResponsiveContainer>
  );
}
```

### Platform-Specific Rendering

```tsx
import { useResponsive } from '../hooks/useResponsive';

function MyComponent() {
  const { isDesktop, isWeb } = useResponsive();

  return (
    <View>
      {isDesktop ? (
        <HorizontalLayout />
      ) : (
        <VerticalLayout />
      )}

      {!isDesktop && <FAB icon="plus" />}
    </View>
  );
}
```

### Responsive Values

```tsx
import { useResponsiveValue } from '../hooks/useResponsive';

function MyComponent() {
  const columns = useResponsiveValue({
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 4
  });

  const padding = useResponsiveValue({
    mobile: 12,
    desktop: 24
  });

  return <View style={{ padding }}>...</View>;
}
```

## Best Practices

### 1. Always Use ResponsiveContainer for Main Content
Wrap your screen content to constrain width on web:

```tsx
<ScrollView>
  <ResponsiveContainer>
    {/* Your content */}
  </ResponsiveContainer>
</ScrollView>
```

### 2. Use ResponsiveGrid for Card Layouts
Instead of mapping cards directly, use ResponsiveGrid:

```tsx
// ❌ Don't do this
{items.map(item => <Card key={item.id} {...item} />)}

// ✅ Do this
<ResponsiveGrid gap={16}>
  {items.map(item => <Card key={item.id} {...item} />)}
</ResponsiveGrid>
```

### 3. Adapt Interactions for Web
Hide mobile-specific UI on web:

```tsx
{!isDesktop && <FAB />}
{isWeb && <HoverableElement />}
```

### 4. Use Responsive Cards
Prefer `ResponsiveCard`, `BankCard`, and `AccountCard` over custom implementations:

```tsx
// ✅ Automatically responsive
<BankCard {...bankData} />

// ❌ Manual layout management needed
<Surface>
  <View style={styles.custom}>...</View>
</Surface>
```

### 5. Test Both Layouts
Always test your changes on:
- Mobile viewport (< 768px)
- Desktop viewport (> 1024px)
- Tablet viewport (768-1024px)

## Running the App

### Web (Development)
```bash
npm run web
```
Opens at http://localhost:8081 or similar

### Mobile (Development)
```bash
npm run android
npm run ios
```

## Breakpoint Reference

| Breakpoint | Width Range | Device Type | Columns (default) |
|------------|-------------|-------------|-------------------|
| Mobile     | 0-767px     | Phone       | 1                 |
| Tablet     | 768-1023px  | Tablet      | 2                 |
| Desktop    | 1024-1439px | Desktop     | 3                 |
| Wide       | 1440px+     | Large Desktop | 4               |

## File Structure

```
src/
├── hooks/
│   └── useResponsive.ts           # Responsive hooks
├── utils/
│   └── responsive.ts              # Responsive utilities
├── components/
│   ├── common/
│   │   ├── ResponsiveContainer.tsx
│   │   ├── ResponsiveGrid.tsx
│   │   ├── ResponsiveCard.tsx
│   │   ├── BankCard.tsx
│   │   ├── AccountCard.tsx
│   │   └── index.ts
│   └── navigation/
│       └── Sidebar.tsx
└── navigation/
    └── ResponsiveNavigator.tsx
```

## Next Steps

Consider implementing:
1. Responsive tables for transaction lists on desktop
2. Multi-column layouts for insights/analytics screens
3. Responsive modals (dialog-style on web, full-screen on mobile)
4. Touch vs. mouse interaction patterns
5. Keyboard navigation support
6. Print stylesheets for web

## Troubleshooting

### Cards not displaying horizontally on web
- Verify `useResponsive` is called in the component
- Check that `isDesktop` is being used correctly
- Ensure `ResponsiveCard` has `horizontal="auto"`

### Content too wide on web
- Wrap content in `ResponsiveContainer`
- Check that `maxWidth` prop is set appropriately

### Navigation not showing sidebar
- Verify you're using `ResponsiveNavigator` instead of `BottomTabNavigator`
- Check that `MainStack.tsx` imports the correct navigator

### Hover effects not working
- Ensure you're using `ResponsiveCard` or similar components
- Hover only works on web platform
- Check that `onMouseEnter`/`onMouseLeave` handlers are present
