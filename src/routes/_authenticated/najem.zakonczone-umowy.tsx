import { createFileRoute } from "@tanstack/react-router";
import AktywneUmowyPage from "./najem.aktywne-umowy";

export const Route = createFileRoute("/_authenticated/najem/zakonczone-umowy")({
  head: () => ({
    meta: [
      { title: "Zakończone umowy Stay Safe — Stay Safe" },
      { name: "description", content: "Archiwum zakończonych umów najmu zawartych przez portal Stay Safe." },
    ],
  }),
  component: () => <AktywneUmowyPage roleFilter="landlord" mode="archive" />,
});
