import RoomView from "@/components/room/RoomView";
import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/room/")({
  validateSearch: (search) => ({
    code: String(search.code) || null,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoomView />;
}
