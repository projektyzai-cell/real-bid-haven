import { createFileRoute } from "@tanstack/react-router";
import AktywneUmowyPage from "./najem.aktywne-umowy";

export const Route = createFileRoute("/_authenticated/najem/moje-umowy")({
  head: () => ({ meta: [{ title: "Moje umowy — Stay Safe" }] }),
  component: AktywneUmowyPage,
});
