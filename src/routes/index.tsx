import { createFileRoute, redirect } from "@tanstack/react-router";

// StaySafe — Strefa Najmu jest domyślnym landingiem.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/najem" });
  },
  component: () => null,
});
