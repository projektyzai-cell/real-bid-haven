import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/najem/generator-umow")({
  head: () => ({ meta: [{ title: "Generator umów najmu — Stay Safe" }] }),
  component: GeneratorUmowPage,
});

function GeneratorUmowPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <iframe
          src="/generator-umow.html"
          title="Generator umów najmu"
          className="h-[calc(100vh-140px)] min-h-[800px] w-full border-0"
        />
      </div>
    </div>
  );
}
