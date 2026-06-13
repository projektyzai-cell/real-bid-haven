import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/korzysci")({
  head: () => ({
    meta: [
      { title: "Korzyści dla Wynajmującego i Najemcy — Stay Safe" },
      { name: "description", content: "Poznaj korzyści, jakie Stay Safe daje wynajmującym i najemcom." },
    ],
  }),
  component: KorzysciPage,
});

function KorzysciPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Korzyści dla Wynajmującego i Najemcy</h1>
      <p className="mt-4 text-muted-foreground">Wkrótce uzupełnimy treść tej sekcji.</p>
    </div>
  );
}
