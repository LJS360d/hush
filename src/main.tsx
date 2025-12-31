import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from "@tanstack/solid-router";
import { render } from "solid-js/web";

import { collections } from "@/content/collections";
import { routeTree } from "@/routeTree.gen";
import "@/styles.css";

const hashHistory = createHashHistory();

const basepath = import.meta.env.BASE_URL;

const router = createRouter({
  routeTree,
  history: hashHistory,
  basepath: basepath,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  context: {
    content: collections,
  },

  stringifySearch: (search) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) {
        // If it's a string, just set it. If it's an object, stringify it.
        params.set(
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        );
      }
    }
    return `?${params.toString()}`;
  },
});

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

const rootElement = document.getElementById("app");
if (rootElement) {
  render(() => <App />, rootElement);
}
