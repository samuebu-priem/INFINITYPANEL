# AdminDashboard Visual System Implementation Map

## Shared component contract

### `PageShell`
**Purpose:** top-level page wrapper matching the AdminDashboard canvas.

**Expected API**
- `children`
- `title?: string`
- `subtitle?: string`
- `actions?: ReactNode`
- `className?: string`
- `contentClassName?: string`
- `wide?: boolean` (for admin/detail pages)
- `centered?: boolean` (for auth pages)

**Behavior**
- Applies dark page background and subtle glow
- Centers page content within a max-width container
- Provides spacing between header/content regions

---

### `SectionCard`
**Purpose:** reusable panel for grouped content, forms, stats, tables, and empty states.

**Expected API**
- `children`
- `title?: string`
- `subtitle?: string`
- `actions?: ReactNode`
- `className?: string`
- `bodyClassName?: string`
- `headerClassName?: string`

**Behavior**
- Uses the dashboard card surface
- Supports optional header row
- Preserves responsive padding and rounded corners

---

### `ActionButton`
**Purpose:** standard button used across primary/secondary/destructive actions.

**Expected API**
- `children`
- `variant?: 'primary' | 'secondary' | 'ghost' | 'danger'`
- `size?: 'sm' | 'md' | 'lg'`
- `type?: 'button' | 'submit'`
- `disabled?: boolean`
- `className?: string`
- `onClick?: () => void`

**Behavior**
- Primary: indigo accent
- Secondary: dark neutral surface
- Ghost: transparent/low-emphasis
- Danger: red destructive state
- Should accept existing `className` hooks for page-level overrides

---

### `StatusBadge`
**Purpose:** compact status indicator for subscription/user/admin states.

**Expected API**
- `children`
- `tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'`
- `className?: string`

**Behavior**
- Small rounded pill
- Used inline in tables, cards, and headers
- Tone colors should align to dashboard palette

---

### `EmptyState`
**Purpose:** standardized empty/zero-data presentation.

**Expected API**
- `title`
- `description?: string`
- `icon?: ReactNode`
- `action?: ReactNode`
- `className?: string`

**Behavior**
- Centered content inside card or page section
- Works for no subscribers, no plans, no activity, etc.

---

## Page/component consumption map

### `frontend/src/pages/AdminDashboard.jsx`
**Consumes**
- `PageShell`
- `SectionCard`
- `ActionButton`
- `StatusBadge`
- `EmptyState`

**Notes**
- Visual source of truth for the shared system
- Preserve existing card hierarchy, metric blocks, tables, and dashboard spacing patterns

---

### `frontend/src/layouts/AppShell.jsx`
**Consumes**
- `PageShell`

**Notes**
- Should preserve existing route chrome/navigation structure
- Main content area should inherit dashboard background and spacing

---

### `frontend/src/pages/Login.jsx`
**Consumes**
- `PageShell`
- `SectionCard`
- `ActionButton`

**Notes**
- Auth layout should remain centered and compact
- Preserve form field behavior and validation messaging

---

### `frontend/src/pages/Register.jsx`
**Consumes**
- `PageShell`
- `SectionCard`
- `ActionButton`

**Notes**
- Match Login styling
- Keep sign-up form structure and helper text intact

---

### `frontend/src/pages/Plans.jsx`
**Consumes**
- `PageShell`
- `SectionCard`
- `ActionButton`
- `StatusBadge`

**Notes**
- Plan cards and pricing actions should share dashboard surfaces
- Preserve current subscription/checkout flow

---

### `frontend/src/pages/UserHome.jsx`
**Consumes**
- `PageShell`
- `SectionCard`
- `StatusBadge`
- `EmptyState`
- `ActionButton`

**Notes**
- Dashboard-like user overview should mirror admin visuals
- Preserve account/subscription data sections and existing content hierarchy

---

### `frontend/src/pages/AdminSubscribers.jsx`
**Consumes**
- `PageShell`
- `SectionCard`
- `StatusBadge`
- `EmptyState`
- `ActionButton`

**Notes**
- Table/list rows should follow admin data display conventions
- Preserve filters, pagination, and existing admin actions if present

---

### `frontend/src/components/subscriptions/CheckoutModal.jsx`
**Consumes**
- `SectionCard`
- `ActionButton`
- `StatusBadge`

**Notes**
- Modal should use same card surface as dashboard
- Preserve checkout pricing/summary text and actions

---

### `frontend/src/components/subscriptions/PlanCard.jsx`
**Consumes**
- `SectionCard`
- `ActionButton`
- `StatusBadge`

**Notes**
- Plan cards should visually match dashboard panels
- Preserve selection/highlight states and pricing hierarchy

---

### `frontend/src/components/subscriptions/SubscriptionStatus.jsx`
**Consumes**
- `StatusBadge`

**Notes**
- Pure presentational status mapping component
- Should keep existing status labels and state semantics

---

### `frontend/src/components/admin/RevenueChart.jsx`
**Consumes**
- `SectionCard`

**Notes**
- Chart container should use dashboard card styling
- Preserve chart rendering and data display behavior

---

### `frontend/src/components/admin/StatCard.jsx`
**Consumes**
- `SectionCard`
- `StatusBadge` if status markers are present

**Notes**
- Metric tiles should follow admin dashboard token system
- Preserve icon/value/label layout

---

### `frontend/src/components/ui/TermsModal.jsx`
**Consumes**
- `SectionCard`
- `ActionButton`

**Notes**
- Modal content should align with dark premium card styling
- Preserve scroll/content behavior and CTA placement

---

### `frontend/src/components/layout/UserHomeFooter.jsx`
**Consumes**
- None required, but should inherit global tokens from `index.css`

**Notes**
- Preserve footer layout and link grouping
- Only align colors/spacing with the new system

---

### `frontend/src/components/profile/DiscordLink.jsx`
**Consumes**
- `ActionButton` or shared button styles if rendered as CTA

**Notes**
- Preserve connection/disconnection flow and link state handling
- Should visually match admin action controls

---

## Existing patterns/classes to preserve

### From `AdminDashboard.jsx`
- Card-based grouping and section headings
- Metric/stat block pattern
- Table/list row spacing and dividers
- Subtle shadow + border hierarchy
- Indigo accent usage for primary emphasis

### From `index.css`
- Existing global tokens, utility classes, and auth/page layout classes
- Any current dark-mode background helpers
- Responsive spacing utilities already used across pages

### From page/components
- Current API data fetching and endpoint usage
- Route names and navigation flows
- Validation/error handling patterns in auth and checkout
- Existing labels/status text semantics for subscriptions and admin states

## Styling contract summary
- Background: `#0b0f14`
- Card surface: `#121821`
- Border: `#1f2937`
- Text primary: `#f3f4f6`
- Text muted: `#9ca3af`
- Accent: `#6366f1`
- Corners: 24px+
- Shadow: subtle glow/lift, not heavy