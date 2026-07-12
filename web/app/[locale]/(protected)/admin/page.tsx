// app/[locale]/(protected)/admin/page.tsx
import { getTranslations } from "next-intl/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventsAdmin } from "./events-admin";
import { WhitelistAdmin } from "./whitelist-admin";

export default async function Admin() {
  const t = await getTranslations("AdminPage");

  return (
    <main className="mx-auto max-w-3xl min-w-sm px-6 py-12">
      <h1 className="mb-6 text-xl font-semibold">{t("Title")}</h1>
      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">{t("Tabs.Events")}</TabsTrigger>
          <TabsTrigger value="whitelist">{t("Tabs.Whitelist")}</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-6">
          <EventsAdmin />
        </TabsContent>
        <TabsContent value="whitelist" className="mt-6">
          <WhitelistAdmin />
        </TabsContent>
      </Tabs>
    </main>
  );
}
