// app/[locale]/(protected)/admin/form-styles.ts

export const FIELD_LABEL = "text-muted-foreground text-[10px] tracking-[.14em] uppercase";

export const FIELD_INPUT =
  "h-auto rounded-none border-0 border-b border-input bg-transparent px-0 pb-[9px] text-[15px] focus-visible:border-accent focus-visible:ring-0 dark:bg-transparent";

export const BUTTON_TEXT = "text-[12px] tracking-[.08em] uppercase";

// Matches the page's own surface instead of the shadcn popover token (which
// uses a cool gray, clashing with the warm cream/near-black palette) and
// swaps the ring/shadow for a plain hairline border per the "no shadows, no
// surface fills" design rule.
export const DIALOG_SURFACE =
  "border-border bg-background text-foreground border shadow-none ring-0";

export const DIALOG_DESCRIPTION = "text-[13px] leading-[1.6]";
