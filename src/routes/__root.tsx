// import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";
import MainLayout from "@/components/layout/MainLayout";
import { I18nProvider, type Locale } from "@/i18n/i18n.context";
import { Outlet, createRootRouteWithContext } from "@tanstack/solid-router";
import { type collections } from "../content/collections";

export const Route = createRootRouteWithContext<{
  content: typeof collections;
}>()({
  validateSearch: (search) => {
    return {
      lang: (search.lang as Locale) || "it",
    } as { lang?: Locale };
  },
  // head: ({}) => {
  //   // TODO get translator in here
  //   const t = getTranslator("en");
  //   return {
  //     meta: [
  //       { title: t("meta.title") },
  //       { name: "description", content: t("meta.description") },
  //       { tag: "link", rel: "icon", href: "/favicon.ico" },
  //     ],
  //   };
  // },
  component: RootComponent,
});

function RootComponent() {
  const searchParams = Route.useSearch();
  return (
    <I18nProvider initialLang={searchParams().lang!}>
      <MainLayout>
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </MainLayout>
    </I18nProvider>
  );
}
