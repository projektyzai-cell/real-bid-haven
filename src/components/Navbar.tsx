import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus, LogOut, User as UserIcon, List, MessageCircle, Building2,
  KeyRound, Settings, ShieldCheck, Sparkles, BadgeCheck, HandHeart,
  FileSignature, Home, FileText, Wrench, Facebook,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function Navbar() {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const unread = useUnreadMessages();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isContractor, setIsContractor] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const tabs = [
    { to: "/jak-dzialamy", label: t("nav.howItWorks"), icon: Sparkles },
    { to: "/paszport-najemcy", label: t("nav.passport"), icon: BadgeCheck },
    { to: "/korzysci", label: t("nav.benefits"), icon: HandHeart },
  ] as const;
  useEffect(() => {
    if (!user) { setIsAdmin(false); setIsContractor(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
    supabase.from("contractors" as any).select("id").eq("user_id", user.id).eq("active", true).maybeSingle()
      .then(({ data }) => setIsContractor(!!data));
  }, [user]);

  async function handleSignOut() {
    await signOut();
    setSheetOpen(false);
    navigate({ to: "/" });
  }

  const tenantItems = [
    { to: "/najem/paszport", label: t("nav.createPassport"), icon: ShieldCheck, gold: true },
    { to: "/najem/moj-paszport", label: t("nav.myPassport"), icon: BadgeCheck, gold: true },
    { to: "/najem/moje-zapytania", label: t("nav.myInquiries"), icon: List, gold: false },
    { to: "/najem/moje-umowy", label: "Moje umowy", icon: FileSignature, gold: false },
  ] as const;

  const landlordItems = [
    { to: "/najem/nowa-oferta", label: t("nav.addProperty"), icon: Plus },
    { to: "/najem/moje-oferty", label: t("nav.myListings"), icon: Home },
    { to: "/najem/umowy", label: t("nav.manageLeases"), icon: FileSignature },
  ] as const;

  const generalItems = [
    { to: "/najem/generator-umow", label: t("nav.contractGen"), icon: FileText, badge: false },
    { to: "/najem/concierge", label: t("nav.concierge"), icon: Sparkles, badge: false },
    { to: "/messages", label: t("nav.messages"), icon: MessageCircle, badge: true },
    { to: "/ustawienia", label: t("nav.settings"), icon: Settings, badge: false },
  ] as const;

  function go(to: string) {
    setSheetOpen(false);
    navigate({ to });
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Link to="/najem" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <img src={logo} alt="StaySafe" className="h-10 w-10 rounded-full object-cover ring-1 ring-[var(--gold)]/40" />
          <span className="text-lg hidden sm:inline tracking-wide">
            Stay<span className="text-gold">Safe</span>
          </span>
        </Link>

        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm whitespace-nowrap hover:bg-muted"
              activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="https://www.facebook.com/share/1QTa1ihRg8/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Stay Safe na Facebooku"
            title="Stay Safe na Facebooku"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-[var(--gold)]/50 hover:bg-muted hover:text-gold"
          >
            <Facebook className="h-4 w-4" />
          </a>
          <LanguageSwitcher />
          {!user ? (
            <Button onClick={() => navigate({ to: "/auth" })} className="rounded-2xl">
              {t("nav.signIn")}
            </Button>
          ) : isMobile ? (
            /* ---------- MOBILE: pełnoekranowy panel z rozwiniętymi sekcjami ---------- */
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-full">
                  <UserIcon className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-yellow-950 ring-2 ring-background">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto custom-scrollbar p-0">
                <SheetHeader className="border-b border-border/60 p-4 text-left">
                  <SheetTitle className="text-sm font-normal text-muted-foreground">
                    {t("nav.loggedInAs")}
                    <div className="truncate text-base font-medium text-foreground">{displayName ?? user.email}</div>
                  </SheetTitle>
                </SheetHeader>

                <div className="space-y-5 p-4 pb-10">
                  <section>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                      <KeyRound className="h-4 w-4" /> {t("nav.tenantZone")}
                    </div>
                    <div className="space-y-1.5">
                      {tenantItems.map(({ to, label, icon: Icon, gold }) => (
                        <button key={to} onClick={() => go(to)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${gold ? "bg-gold/10 font-semibold text-gold" : "bg-muted/40"}`}>
                          <Icon className="h-4 w-4 shrink-0" /> <span className="min-w-0 truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                      <Building2 className="h-4 w-4" /> {t("nav.landlordZone")}
                    </div>
                    <div className="space-y-1.5">
                      {landlordItems.map(({ to, label, icon: Icon }) => (
                        <button key={to} onClick={() => go(to)}
                          className="flex w-full items-center gap-3 rounded-xl bg-muted/40 px-3 py-3 text-left text-sm">
                          <Icon className="h-4 w-4 shrink-0" /> <span className="min-w-0 truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-1.5 border-t border-border/60 pt-4">
                    {generalItems.map(({ to, label, icon: Icon, badge }) => (
                      <button key={to} onClick={() => go(to)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${badge && unread > 0 ? "bg-yellow-400/15 font-semibold text-yellow-200" : ""}`}>
                        <Icon className="h-4 w-4 shrink-0" /> <span className="min-w-0 flex-1 truncate">{label}</span>
                        {badge && unread > 0 && (
                          <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-yellow-950">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </button>
                    ))}
                    {isContractor && (
                      <button onClick={() => go("/wykonawca")}
                        className="flex w-full items-center gap-3 rounded-xl bg-amber-500/10 px-3 py-3 text-left text-sm font-semibold text-amber-500">
                        <Wrench className="h-4 w-4 shrink-0" /> Strefa Wykonawcy
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => go("/admin")}
                        className="flex w-full items-center gap-3 rounded-xl bg-gold/10 px-3 py-3 text-left text-sm font-semibold text-gold">
                        <ShieldCheck className="h-4 w-4 shrink-0" /> {t("nav.admin")}
                      </button>
                    )}
                    <button onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-muted-foreground">
                      <LogOut className="h-4 w-4 shrink-0" /> {t("nav.signOut")}
                    </button>
                  </section>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            /* ---------- DESKTOP ---------- */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-full">
                  <UserIcon className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-yellow-950 ring-2 ring-background">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 rounded-2xl">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-xs text-muted-foreground">{t("nav.loggedInAs")}</div>
                  <div className="truncate font-medium">{displayName ?? user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="my-1 rounded-xl bg-gold/5 py-3 font-semibold text-foreground data-[state=open]:bg-gold/15">
                    <KeyRound className="h-4 w-4 text-gold" /> {t("nav.tenantZone")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      sideOffset={6}
                      alignOffset={-4}
                      className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-gold/20 bg-popover/95 p-1 shadow-glow backdrop-blur"
                    >
                      {tenantItems.map(({ to, label, icon: Icon, gold }) => (
                        <DropdownMenuItem key={to} onClick={() => navigate({ to })}
                          className={`rounded-xl py-3 ${gold ? "bg-gold/10 font-semibold text-gold focus:bg-gold/20" : ""}`}>
                          <Icon className="h-4 w-4" /> {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="my-1 rounded-xl bg-gold/5 py-3 font-semibold text-foreground data-[state=open]:bg-gold/15">
                    <Building2 className="h-4 w-4 text-gold" /> {t("nav.landlordZone")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      sideOffset={6}
                      alignOffset={-4}
                      className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-gold/20 bg-popover/95 p-1 shadow-glow backdrop-blur"
                    >
                      {landlordItems.map(({ to, label, icon: Icon }) => (
                        <DropdownMenuItem key={to} className="rounded-xl py-3" onClick={() => navigate({ to })}>
                          <Icon className="h-4 w-4" /> {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                {generalItems.map(({ to, label, icon: Icon, badge }) => (
                  <DropdownMenuItem key={to} onClick={() => navigate({ to })}
                    className={badge && unread > 0 ? "bg-yellow-100 font-semibold text-yellow-900 focus:bg-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-100" : ""}>
                    <Icon className="h-4 w-4" /> {label}
                    {badge && unread > 0 && (
                      <span className="ml-auto rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-yellow-950">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
                {isContractor && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/wykonawca" })}
                    className="bg-amber-500/10 font-semibold text-amber-600 focus:bg-amber-500/20">
                    <Wrench className="h-4 w-4" /> Strefa Wykonawcy
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}
                    className="bg-gold/10 font-semibold text-gold focus:bg-gold/20">
                    <ShieldCheck className="h-4 w-4" /> {t("nav.admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
