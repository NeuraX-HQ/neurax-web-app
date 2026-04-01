# Design System Specification: The Precision Lens

## 1. Overview & Creative North Star
**Creative North Star: "The Clinical Visionary"**

This design system transcends the standard "utility app" aesthetic, positioning itself as a high-end diagnostic tool. We are moving away from the "template" look of health trackers by embracing **Clinical Minimalism**—a philosophy that pairs the stark, high-contrast authority of professional photography gear with the soft, organic warmth of wellness. 

The interface should feel like a high-end Leica camera UI: precise, understated, and incredibly fast. We break the grid through **Intentional Asymmetry**, where camera overlays use hair-line precision and oversized typography scales to create an editorial feel. We do not just "track" food; we "analyze" it through a sophisticated digital lens.

---

## 2. Color & Surface Architecture
The palette is rooted in the tension between the organic Emerald (`primary`) and the clinical cleanliness of our Surface tiers.

### The "No-Line" Rule
**Strict Mandate:** Traditional 1px solid borders for sectioning are prohibited. 
Structure must be defined through:
*   **Background Shifts:** Transitioning from `surface` (#f7f9fb) to `surface-container-low` (#f2f4f6).
*   **Negative Space:** Using the Spacing Scale (specifically `8` and `10`) to create breathing room that implies boundaries.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials.
*   **Base Layer:** `surface` (#f7f9fb) for global backgrounds.
*   **Content Blocks:** Use `surface-container-lowest` (#ffffff) for primary content cards to create a "lifted" feel against the slightly greyish base.
*   **Nested Elements:** Inside a card, use `surface-container-high` (#e6e8ea) for secondary inputs or search bars.

### The "Glass & Gradient" Rule
For camera overlays and floating HUDs (Heads-Up Displays):
*   Use `surface-variant` (#e0e3e5) at 60% opacity with a `20px` backdrop-blur. This creates a "frosted glass" effect that allows food colors to bleed through, maintaining context.
*   **Signature Texture:** Main Action Buttons use a subtle linear gradient from `primary` (#006c49) to `primary-container` (#10b981) at a 135-degree angle to provide a tactile, jewel-like depth.

---

## 3. Typography: The Editorial Scale
We pair the technical precision of **Space Grotesk** with the approachable modernism of **Manrope** and **Inter**.

*   **The Power Pair:** Use `display-lg` (Manrope) for hero metrics (e.g., Calorie counts) to command authority. Use `label-md` (Space Grotesk) for technical metadata (e.g., "ISO," "MACROS," "SCANNING") to evoke a professional camera interface.
*   **Visual Rhythm:** Headline scales are intentionally large to create an editorial hierarchy. A `headline-lg` title should sit comfortably next to a `body-sm` description, emphasizing the high-contrast "Big/Small" layout pattern.

---

## 4. Elevation & Depth: Tonal Layering
We reject heavy, artificial shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card sitting on a `surface-container` background creates a natural, soft lift without a single pixel of shadow.
*   **Ambient Shadows:** When a component must "float" (like a camera shutter button), use an extra-diffused shadow: `0px 20px 40px rgba(25, 28, 30, 0.06)`. The tint is derived from `on-surface`, ensuring it feels like a natural lighting effect.
*   **The "Ghost Border" Fallback:** If a boundary is required for accessibility, use `outline-variant` (#bbcabf) at 15% opacity. It should be felt, not seen.

---

## 5. Components & Interface Elements

### Buttons: The Tactical Triggers
*   **Primary (The Shutter):** High-contrast `on-surface` (#191c1e) background with `surface` (#f7f9fb) text. Square-ish `md` (0.375rem) corners. It should look like a physical button on a pro camera.
*   **Secondary (The Action):** `primary` (#006c49) background. Use for "Confirm" or "Add" actions.
*   **Tertiary:** Ghost style. No background, `label-md` typography in `primary`.

### Cards & Lists: The Negative Space Rule
*   **Cards:** Use `surface-container-lowest` with `xl` (0.75rem) corner radius. **Never use dividers.** Use a `spacing-6` (1.5rem) gap between list items.
*   **Selection Chips:** Use `secondary-container` (#e2e2e2) with `full` radius. When active, transition to `primary` with `on-primary` text.

### Camera Viewfinder Overlays
*   **The Scanning Bracket:** Use `primary` (#006c49) for the four corner brackets. Thickness: `2px`. 
*   **Real-time HUD:** Floating labels using `surface-variant` glassmorphism. Use `label-sm` (Space Grotesk) in ALL CAPS for a technical, "data-stream" aesthetic.

### Input Fields: The Minimalist Frame
*   **Default State:** No border. Only a `surface-container-high` bottom bar (2px).
*   **Focus State:** The bottom bar expands to `primary` (#006c49) with a subtle `primary-fixed-dim` glow.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts (e.g., a large metric on the left balanced by small metadata on the far right).
*   **Do** use `primary` (#10B981) sparingly as a "precision tool"—for progress bars, scan success states, and key callouts.
*   **Do** maximize white space. If a screen feels "full," increase the `surface` padding.

### Don't:
*   **Don't** use 100% black (#000000). Always use `on-surface` (#191c1e) for high-contrast elements to maintain a premium, ink-like depth.
*   **Don't** use standard "Material Design" shadows. They feel too generic for this system.
*   **Don't** use dividers or lines to separate content. Let the Tonal Layering and Spacing Scale do the work.