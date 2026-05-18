# Design Tokens

## Color Palette

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg-slate-50` / `dark:bg-slate-950` | #f8fafc | #020617 | Page background |
| `bg-white` / `dark:bg-slate-800` | #ffffff | #1e293b | Card background |
| `primary` | #6366f1 | #818cf8 | Buttons, active nav, links |
| `income` | #10b981 | #34d399 | Income amounts, positive delta |
| `expense` | #f43f5e | #fb7185 | Expense amounts, negative delta |
| `savings` | #3b82f6 | #60a5fa | Net savings, savings rate |
| `warning` | #f59e0b | #fbbf24 | Budget alerts (60–89%) |
| Danger | #ef4444 | #f87171 | Budget at/over limit (90%+) |

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Page heading | Outfit | 700 | text-2xl / text-3xl |
| Section heading | Outfit | 600 | text-xl |
| Body text | Inter | 400 | text-sm / text-base |
| Numeric / data | Inter | 600 | tabular-nums |
| Label | Inter | 500 | text-xs uppercase tracking-wider |

## Spacing

- Card padding: `p-6`
- Card gap: `gap-4` (sm), `gap-6` (md+)
- Section margin: `mb-6` / `mb-8`
- Form field gap: `space-y-4`

## Border Radius

- Cards: `rounded-xl`
- Buttons: `rounded-lg`
- Badges / pills: `rounded-full`
- Inputs: `rounded-lg`

## Shadows

- Card: `shadow-sm`
- Modal: `shadow-2xl`
- Dropdown: `shadow-lg`

## Progress Bar Colors

| % Used | Color |
|---|---|
| 0–59% | `bg-emerald-500` |
| 60–89% | `bg-amber-500` |
| 90–100% | `bg-rose-500` |
| > 100% | `bg-rose-600` (overflow indicator) |
