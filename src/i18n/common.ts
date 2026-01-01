export function getLangName(code: string) {
  const names: Record<string, string> = {
    it: "Italiano",
    en: "English",
    es: "Español",
  };
  return names[code] || code;
}
