import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PassportSection } from "@/components/PassportSection";
import { ExtendedPassportSection } from "@/components/ExtendedPassportSection";

export const Route = createFileRoute("/_authenticated/najem/paszport")({
  head: () => ({ meta: [{ title: "Stwórz swój Paszport Najemcy — StaySafe" }] }),
  component: PassportPage,
});

function PassportPage() {
  const { user } = useAuth();
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/najem"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Powrót do Strefy najmu
      </Link>
      <div className="mt-3 flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 text-gold" />
        <h1 className="text-3xl font-semibold tracking-tight">Stwórz swój Paszport Najemcy</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Zbuduj transparentną deklarację tożsamości, dochodów i historii najmu. Twoje dane są przechowywane wyłącznie jako nieodwracalny hash (SHA-256).
      </p>
      {user && <PassportSection userId={user.id} />}
      {user && <ExtendedPassportSection userId={user.id} />}
    </div>
  );
}
