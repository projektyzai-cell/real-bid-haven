import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Ustaw nowe hasło — Stay Safe" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Hasło musi mieć min. 6 znaków"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Hasło zmienione"); navigate({ to: "/" }); }
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border bg-card p-8 shadow-card">
        <h1 className="text-2xl font-semibold">Ustaw nowe hasło</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="np">Nowe hasło (min. 6 znaków)</Label>
            <Input id="np" type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl">
            {loading ? "Zapisuję..." : "Zapisz"}
          </Button>
        </form>
      </div>
    </div>
  );
}
