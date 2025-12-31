import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/room/Route')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/room/Route"!</div>
}
