import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileCheck, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export function AutoMatchStatsTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    onlyMatched: 0,
    onePartySigned: 0,
    bothCompleted: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    const { data, error } = await supabase
      .from("lease_transactions")
      .select(`
        id, 
        state, 
        tenant_finalized_at, 
        landlord_finalized_at, 
        contract_start_date, 
        contract_end_date, 
        created_at,
        rental_listings (
          city,
          street,
          property_type
        )
      `);

    if (error) {
      console.error("Błąd pobierania statystyk:", error);
      setLoading(false);
      return;
    }

    if (data) {
      setTransactions(data);
      
      let matched = 0;
      let oneSigned = 0;
      let completed = 0;

      data.forEach((txn: any) => {
        const tSigned = !!txn.tenant_finalized_at;
        const lSigned = !!txn.landlord_finalized_at;
        const isCompleted = txn.state === "completed" || (tSigned && lSigned);

        if (isCompleted) {
          completed++;
        } else if (tSigned || lSigned) {
          oneSigned++;
        } else {
          matched++;
        }
      });

      setStats({
        total: data.length,
        onlyMatched: matched,
        onePartySigned: oneSigned,
        bothCompleted: completed,
      });
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Ładowanie statystyk auto-matchingu…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Statusy Auto-Matchingu i Umów</h2>
        <p className="text-sm text-muted-foreground">Monitoruj postępy transakcji najmu na każdym etapie.</p>
      </div>

      {/* Kafelki podsumowujące */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Wszystkie procesy</span>
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">{stats.total}</div>
          <p className="mt-1 text-xs text-muted-foreground">Łączna liczba wygenerowanych matchów</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Tylko Match</span>
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-400">{stats.onlyMatched}</div>
          <p className="mt-1 text-xs text-muted-foreground">Oczekiwanie na pierwszy podpis</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Podpisane przez 1 stronę</span>
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-blue-400">{stats.onePartySigned}</div>
          <p className="mt-1 text-xs text-muted-foreground">Czeka na drugą stronę</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Umowa podpisana (2/2)</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-400">{stats.bothCompleted}</div>
          <p className="mt-1 text-xs text-muted-foreground">Proces w pełni zakończony</p>
        </div>
      </div>

      {/* Szczegółowa tabela transakcji */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-foreground flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-primary" /> Szczegółowa lista transakcji w systemie
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3.5">Przedmiot najmu</th>
                <th className="p-3.5">Najemca podpisal</th>
                <th className="p-3.5">Wynajmujący podpisał</th>
                <th className="p-3.5">Okres najmu</th>
                <th className="p-3.5">Status końcowy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Brak transakcji w bazie danych.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const tSigned = !!txn.tenant_finalized_at;
                  const lSigned = !!txn.landlord_finalized_at;
                  const isCompleted = txn.state === "completed" || (tSigned && lSigned);

                  return (
                    <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 text-xs font-medium">
                        {txn.rental_listings ? (
                          `${txn.rental_listings.city || ""}, ${txn.rental_listings.property_type || ""} — ${txn.rental_listings.street || ""}`
                        ) : (
                          <span className="text-muted-foreground font-mono">ID: {txn.id.slice(0, 8)}...</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {tSigned ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            Tak
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                            Oczekuje
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {lSigned ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            Tak
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                            Oczekuje
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs">
                        {txn.contract_start_date && txn.contract_end_date
                          ? `${txn.contract_start_date} — ${txn.contract_end_date}`
                          : "Brak dat"}
                      </td>
                      <td className="p-3.5">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Zakończona
                          </span>
                        ) : tSigned || lSigned ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400">
                            <Clock className="h-3.5 w-3.5" /> Podpisano częściowo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                            <Clock className="h-3.5 w-3.5" /> Sam Match
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
