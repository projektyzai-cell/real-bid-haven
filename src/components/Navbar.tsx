import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus, LogOut, User as UserIcon, List, MessageCircle, Building2,
  KeyRound, Settings, ShieldCheck, Sparkles, BadgeCheck, HandHeart,
  FileSignature, Home, FileText,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const tabs = [
    { to: "/jak-dzialamy", label: t("nav.howItWorks"), icon: Sparkles },
    { to: "/paszport-najemcy", label: t("nav.passport"), icon: BadgeCheck },
    { to: "/korzysci", label: t("nav.benefits"), icon: HandHeart },
  ] as const;
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
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

        <nav className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm whitespace-nowrap hover:bg-muted"
              activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          {user ? (
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

                {/* Strefa najmu — NAJEMCA */}
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
                      <DropdownMenuItem
                        onClick={() => navigate({ to: "/najem/paszport" })}
                        className="rounded-xl bg-gold/10 py-3 font-semibold text-gold focus:bg-gold/20"
                      >
                        <ShieldCheck className="h-4 w-4" /> {t("nav.createPassport")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate({ to: "/najem/moj-paszport" })}
                        className="rounded-xl bg-gold/10 py-3 font-semibold text-gold focus:bg-gold/20"
                      >
                        <BadgeCheck className="h-4 w-4" /> {t("nav.myPassport")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl py-3" onClick={() => navigate({ to: "/najem/moje-zapytania" })}>
                        <List className="h-4 w-4" /> {t("nav.myInquiries")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl py-3" onClick={() => navigate({ to: "/najem/concierge" })}>
                        <Sparkles className="h-4 w-4" /> {t("nav.concierge")}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Strefa najmu — WYNAJMUJĄCY */}
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
                      <DropdownMenuItem className="rounded-xl py-3" onClick={() => navigate({ to: "/najem/nowa-oferta" })}>
                        <Plus className="h-4 w-4" /> {t("nav.addProperty")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl py-3" onClick={() => navigate({ to: "/najem/moje-oferty" })}>
                        <Home className="h-4 w-4" /> {t("nav.myListings")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl py-3" onClick={() => navigate({ to: "/najem/umowy" })}>
                        <FileSignature className="h-4 w-4" /> {t("nav.manageLeases")}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/najem/generator-umow" })}>
                  <FileText className="h-4 w-4" /> {t("nav.contractGen")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/messages" })}
                  className={unread > 0 ? "bg-yellow-100 font-semibold text-yellow-900 focus:bg-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-100" : ""}>
                  <MessageCircle className="h-4 w-4" /> {t("nav.messages")}
                  {unread > 0 && (
                    <span className="ml-auto rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-yellow-950">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/ustawienia" })}>
                  <Settings className="h-4 w-4" /> {t("nav.settings")}
                </DropdownMenuItem>
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
          ) : (
            <Button onClick={() => navigate({ to: "/auth" })} className="rounded-2xl">
              {t("nav.signIn")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
