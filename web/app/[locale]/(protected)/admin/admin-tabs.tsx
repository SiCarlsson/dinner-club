// app/[locale]/(protected)/admin/admin-tabs.tsx

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DinnersAdmin } from "./dinners-admin";
import { VenuesAdmin } from "./venues-admin";
import { WhitelistAdmin } from "./whitelist-admin";
import type { DinnerRecord, InvitationRecord, ProfileRecord, VenueRecord } from "./actions";

const TABS = ["dinners", "venues", "whitelist"] as const;
type Tab = (typeof TABS)[number];

export function AdminTabs({
  dinners,
  venues,
  profiles,
  invitations,
  tabLabels,
}: {
  dinners: DinnerRecord[];
  venues: VenueRecord[];
  profiles: ProfileRecord[];
  invitations: InvitationRecord[];
  tabLabels: Record<Tab, string>;
}) {
  const [tab, setTab] = useState<Tab>("dinners");

  return (
    <div>
      <div role="tablist" className="border-border flex gap-8 border-b">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px border-b-[1.5px] pb-3 text-[12px] tracking-[.08em] uppercase transition-colors",
              tab === value
                ? "border-foreground text-foreground dark:border-accent"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tabLabels[value]}
          </button>
        ))}
      </div>
      <div className="pt-10">
        {tab === "dinners" && (
          <DinnersAdmin dinners={dinners} venues={venues} profiles={profiles} />
        )}
        {tab === "venues" && <VenuesAdmin venues={venues} />}
        {tab === "whitelist" && <WhitelistAdmin invitations={invitations} />}
      </div>
    </div>
  );
}
