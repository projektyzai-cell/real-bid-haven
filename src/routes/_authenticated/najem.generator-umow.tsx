import { createFileRoute } from "@tanstack/react-router";
import { FileSignature } from "lucide-react";

export const Route = createFileRoute("/_authenticated/najem/generator-umow")({
  head: () => ({ meta: [{ title: "Generator umów najmu — Stay Safe" }] }),
  component: GeneratorUmowPage,
});

function GeneratorUmowPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
          <FileSignature className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Generator umów najmu</h1>
          <p className="text-sm text-muted-foreground">
            Wypełnij formularz i wygeneruj gotową umowę najmu w PDF.
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <iframe
          src="/generator-umow.html"
          title="Generator umów najmu"
          className="h-[calc(100vh-200px)] min-h-[800px] w-full border-0"
        />
      </div>
    </div>
  );
}
