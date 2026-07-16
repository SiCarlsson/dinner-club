// lib/form-styles.ts — shared editorial form/surface design tokens

export const FIELD_LABEL = "text-muted-foreground text-[10px] tracking-[.14em] uppercase";

export const FIELD_INPUT =
  "h-auto rounded-none border-0 border-b border-input bg-transparent px-0 pb-[9px] text-[15px] focus-visible:border-accent focus-visible:ring-0 dark:bg-transparent";

export const BUTTON_TEXT = "text-[12px] tracking-[.08em] uppercase";

// Matches the page's own surface instead of the shadcn popover token
export const FLOATING_SURFACE =
  "border-border bg-background text-foreground border shadow-none ring-0";

export const DIALOG_DESCRIPTION = "text-[13px] leading-[1.6]";

// Caps a select/menu list to roughly 10 rows (each ~32px) before it scrolls,
// instead of growing to fit every option.
export const SCROLL_10_ITEMS = "max-h-50";
