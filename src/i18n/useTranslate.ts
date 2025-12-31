import { useI18n } from "./i18n.context";

export function useTranslate() {
  const ctx = useI18n();
  if (!ctx) throw new Error("useTranslate must be used within I18nProvider");
  return ctx.t;
}
