// app/login/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { checkInvitation } from "./actions";

type Status = "idle" | "loading" | "error" | "not-invited";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const supabase = useMemo(() => createClient(), []);

  const login = async () => {
    setStatus("loading");

    const invitation = await checkInvitation(email);
    if ("error" in invitation) {
      setStatus("error");
      return;
    }
    if (!invitation.invited) {
      setStatus("not-invited");
      return;
    }

    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (!signIn.error && signIn.data.session) {
      redirectAfterLogin();
      return;
    }

    const signUp = await supabase.auth.signUp({ email, password });
    if (signUp.error || !signUp.data.session) {
      setStatus("error");
      return;
    }

    redirectAfterLogin();
  };

  const redirectAfterLogin = () => {
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    window.location.assign(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    if (email && password) login();
  };

  const t = useTranslations("LoginPage");

  return (
    <main
      className={
        "font-ui bg-background text-foreground flex flex-1 flex-col px-6 py-8 md:px-10 md:py-10"
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-[81px] text-center sm:pb-[90px]">
        {status === "not-invited" ? (
          <>
            <div className="flex flex-col gap-3">
              <h1 className={"font-serif text-[34px] font-light"}>{t("NotMember.Title")}</h1>
              <p className="text-foreground/80 max-w-[38ch] text-[13px] leading-[1.6]">
                {t.rich("NotMember.Description", {
                  email: () => <span className="text-foreground">{email}</span>,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="text-muted-foreground hover:text-foreground text-[12px] tracking-[.08em] uppercase transition-colors"
            >
              {t("NotMember.TryAgain")}
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

              <div className="flex flex-col gap-2 text-left">
                <Label
                  htmlFor="password"
                  className="text-muted-foreground text-[10px] tracking-[.14em] uppercase"
                >
                  {t("Password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("PasswordPlaceholder")}
                  className="border-input focus-visible:border-accent h-auto rounded-none border-0 border-b bg-transparent px-0 pb-[9px] text-[15px] focus-visible:ring-0 dark:bg-transparent"
                />
              </div>

              <Button
                type="submit"
                disabled={status === "loading" || !email || password.length < 8}
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
