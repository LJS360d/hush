import GameView from "@/components/game/GameView";
import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/game/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <GameView />;
}
