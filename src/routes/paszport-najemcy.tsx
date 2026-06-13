import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/paszport-najemcy")({
  head: () => ({
    meta: [
      { title: "Co to jest Paszport Najemcy — Stay Safe" },
      { name: "description", content: "Paszport Najemcy Stay Safe — transparentna deklaracja tożsamości, dochodów i historii najmu." },
    ],
  }),
  component: PaszportInfoPage,
});

function PaszportInfoPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Co to jest Paszport Najemcy</h1>
      <p className="mt-4 text-muted-foreground">Wkrótce uzupełnimy treść tej sekcji.</p>
    </div>
  );
}
