// app/login/page.tsx

"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
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
    <main
      className={
        "font-ui bg-background text-foreground flex min-h-dvh flex-col px-6 py-8 md:px-10 md:py-10"
      }
    >
      <div className="flex items-start">
        <span className="text-muted-foreground text-[9px] tracking-[.4em] uppercase">
          CaLí · Dinner Club
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        {status === "sent" ? (
          <>
            <div className="border-accent text-accent flex size-14 items-center justify-center rounded-full border text-2xl">
              ✦
            </div>
            <div className="flex flex-col gap-3">
              <h1 className={"font-serif text-[34px] font-light"}>{t("LinkSent.Title")}</h1>
              <p className="text-foreground/80 max-w-[38ch] text-[13px] leading-[1.6]">
                {t("LinkSent.Description1")} <span className="text-foreground">{email}</span>.{" "}
                {t("LinkSent.Description2")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogin}
              className="text-muted-foreground text-[10px] tracking-[.16em] uppercase underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {t("LinkSent.Resend")}
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1">
              <span className={"font-serif text-[56px] tracking-[.02em]"}>CaLí</span>
              <span className="text-muted-foreground text-[11px] tracking-[.42em] uppercase">
                Dinner Club
              </span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <h1 className={"font-serif text-[34px] font-light"}>{t("Title")}</h1>
              <p className="text-foreground/80 max-w-[38ch] text-[13px] leading-[1.6]">
                {t("Description")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex w-full max-w-[340px] flex-col gap-6">
              <div className="flex flex-col gap-2 text-left">
                <Label
                  htmlFor="email"
                  className="text-muted-foreground text-[10px] tracking-[.14em] uppercase"
                >
                  {t("Email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("EmailPlaceholder")}
                  className="border-input focus-visible:border-accent h-auto rounded-none border-0 border-b bg-transparent px-0 pb-[9px] text-[15px] focus-visible:ring-0 dark:bg-transparent"
                />
              </div>

              <Button
                type="submit"
                disabled={status === "loading"}
                className="h-auto w-full rounded-none px-[30px] py-[12px] text-[12px] tracking-[.08em] uppercase"
              >
                {status === "loading" ? t("Button.InProcess") + "..." : t("Button.Default")}
              </Button>

              {status === "error" && (
                <p className="text-destructive text-[13px]">{t("Button.Error")}</p>
              )}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
