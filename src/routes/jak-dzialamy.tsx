import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/jak-dzialamy")({
  head: () => ({
    meta: [
      { title: "Jak działamy — Stay Safe" },
      { name: "description", content: "Dowiedz się, jak działa Stay Safe — bezpieczny najem z weryfikacją tożsamości i Paszportem Najemcy." },
    ],
  }),
  component: JakDzialamyPage,
});

function JakDzialamyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Jak działamy</h1>
      <p className="mt-4 text-muted-foreground">Wkrótce uzupełnimy treść tej sekcji.</p>
    </div>
  );
}
