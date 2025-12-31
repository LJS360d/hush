import RoomCreate from "../components/room/RoomCreate";
import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoomCreate />;
}
