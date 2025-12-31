import RoomView from "@/components/room/RoomView";
import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/room/")({
  validateSearch: (search) => ({
    code: String(search.code) || null,
  }),
  loader: ({ context }) => {
    const allPacks = context.content.cardPacks.all();
    const modifiers = context.content.gameModifiers.all();
    return { allPacks, modifiers };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();

  return (
    <RoomView allPacks={data().allPacks} allModifiers={data().modifiers} />
  );
}
