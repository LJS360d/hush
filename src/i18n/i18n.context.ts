import { createContextProvider } from "@solid-primitives/context";
import * as i18n from "@solid-primitives/i18n";
import { createMemo, createSignal } from "solid-js";

import en from "./locales/en.json";
import it from "./locales/it.json";

const dictionaries = { en, it };
export type Locale = keyof typeof dictionaries;

export const [I18nProvider, useI18n] = createContextProvider(
  (props: { initialLang: Locale }) => {
    const [locale, setLocale] = createSignal<Locale>(props.initialLang);
    const dict = createMemo(() => i18n.flatten(dictionaries[locale()]));
    const t = i18n.translator(dict, i18n.resolveTemplate);
    return {
      t,
      locale,
      setLocale: (l: Locale) => setLocale(l),
    };
  },
);
