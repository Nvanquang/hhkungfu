# UI Component Map

Location: `src/components/ui/`

All primitives are built on **shadcn/ui** (Radix UI), styled with design tokens.

---

## Primitive Components (`src/components/ui/`)

| Component | Description | Key Props |
|---|---|---|
| `Button` | Action trigger | `variant`, `size`, `loading`, `disabled`, `asChild` |
| `Input` | Text input | `label`, `error`, `placeholder`, `type` |
| `Textarea` | Multi-line input | `label`, `error`, `rows` |
| `Select` | Dropdown select | `options`, `value`, `onChange`, `placeholder` |
| `Checkbox` | Boolean toggle | `checked`, `onCheckedChange`, `label` |
| `RadioGroup` | Mutually exclusive options | `value`, `onValueChange`, `options` |
| `Switch` | Toggle switch | `checked`, `onCheckedChange` |
| `Badge` | Status chip | `variant` (default/secondary/destructive/outline) |
| `Card` | Content container | `className` |
| `Avatar` | User image | `src`, `alt`, `fallback`, `size` |
| `Modal` (Dialog) | Overlay dialog | `open`, `onOpenChange`, `title`, `description` |
| `Drawer` | Side panel | `open`, `onOpenChange`, `side` |
| `Dropdown` | Menu dropdown | `trigger`, `items` |
| `Tabs` | Tabbed navigation | `defaultValue`, `items` |
| `Tooltip` | Hover tooltip | `content`, `side` |
| `Toast` | Notification | `title`, `description`, `variant` |
| `Skeleton` | Loading placeholder | `className` |
| `Separator` | Horizontal/vertical divider | `orientation` |
| `Spinner` | Loading indicator | `size`, `className` |
| `EmptyState` | No data state | `icon`, `title`, `description`, `action` |

---

## Layout Components (`src/components/layout/`)

| Component | Description |
|---|---|
| `RootLayout` | App shell with `<Outlet />` |
| `Header` | Top nav with logo, links, cart icon, user menu |
| `Footer` | Bottom links and info |
| `PageWrapper` | Page padding + max-width container |
| `Sidebar` | Left or right side panel |

---

## Common Components (`src/components/common/`)

| Component | Description |
|---|---|
| `ErrorBoundary` | Catches render errors, shows fallback |
| `ErrorState` | Inline error with retry button |
| `Loader` | Full-page loading overlay |
| `QuantityInput` | +/- number input for cart |
| `PriceDisplay` | Formatted price with currency |
| `StarRating` | Readonly or interactive star rating |
| `ImageWithFallback` | `<img>` with fallback on error |
| `ConfirmDialog` | Reusable confirmation modal |

---

## Feature Components (`src/components/features/`)

| Component | Domain | Description |
|---|---|---|
| `ProductCard` | Product | Card with image, price, add-to-cart |
| `ProductGrid` | Product | Responsive grid of `ProductCard` |
| `ProductFilters` | Product | Category, price range, sort filters |
| `CartItem` | Cart | Single item row with qty control |
| `CartSummary` | Cart | Subtotal, shipping, total |
| `OrderSummary` | Checkout | Read-only cart summary in checkout |
| `CheckoutForm` | Checkout | Shipping + payment form |

---

## Usage Pattern

```tsx
// Always use named imports from the ui barrel
import { Button, Input, Badge, Skeleton } from '@/components/ui'

// Use EmptyState for no-data scenarios
<EmptyState
  icon={ShoppingCart}
  title="Your cart is empty"
  description="Browse our products to add items"
  action={{ label: 'Shop Now', href: ROUTES.PRODUCTS }}
/>

// Use Skeleton for loading
{isLoading ? (
  <Skeleton className="h-48 w-full rounded-xl" />
) : (
  <ProductCard {...product} />
)}
```
