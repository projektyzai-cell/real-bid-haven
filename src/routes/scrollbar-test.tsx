import { createFileRoute } from "@tanstack/react-router";

function ScrollbarTest() {
  return (
    <div className="mx-auto max-w-md p-10">
      <h1 className="mb-6 text-xl font-bold text-gold">Scrollbar test</h1>
      <div className="custom-scrollbar h-64 overflow-y-auto rounded-xl border border-border/60 bg-card/40 p-4">
        {Array.from({ length: 40 }).map((_, i) => (
          <p key={i} className="py-2 text-sm text-foreground/80">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Wiersz {i + 1}.
          </p>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/scrollbar-test")({
  component: ScrollbarTest,
});
