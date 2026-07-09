// app/login/page.tsx

"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const supabase = useMemo(() => createClient(), []);

  const handleLogin = async () => {
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/confirm`,
      },
    });
    setStatus(error ? "error" : "sent");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && status !== "loading") handleLogin();
  };

  const t = useTranslations("LoginPage");

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{status === "sent" ? t("LinkSent.Title") : t("Title")}</CardTitle>
          <CardDescription>
            {status === "sent" ? (
              <div>
                {t("LinkSent.Description1")} <strong>{email}</strong>.
                <br />
                {t("LinkSent.Description2")}
              </div>
            ) : (
              t("Description")
            )}
          </CardDescription>
        </CardHeader>

        {status !== "sent" && (
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t("Email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("EmailPlaceholder")}
                />
              </div>

              <Button type="submit" disabled={status === "loading"} className="w-full">
                {status === "loading" ? t("Button.InProcess") + "..." : t("Button.Default")}
              </Button>

              {status === "error" && (
                <p className="text-destructive text-sm">{t("Button.Error")}</p>
              )}
            </form>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
