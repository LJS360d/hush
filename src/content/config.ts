import { z } from "zod";

export interface CollectionConfig<S extends z.ZodTypeAny, T = z.infer<S>> {
  loader: Record<string, any>;
  schema: S;
  transform?: (data: z.infer<S>, id: string) => T;
}

export function defineCollection<S extends z.ZodTypeAny, T = z.infer<S>>(
  config: CollectionConfig<S, T>,
) {
  const { loader, schema, transform } = config;

  // Process entries once at startup (Vite build/Runtime)
  const entries: T[] = Object.entries(loader).flatMap(
    ([path, module]: [string, any]) => {
      const id = path.split("/").pop()?.replace(".json", "") ?? "unknown";
      const rawData = schema.parse(module.default);
      return transform ? transform(rawData, id) : (rawData as T);
    },
  );

  // Create a Map for instant lookups by ID
  const entryMap = new Map<string, T>(
    entries.map((entry: any) => [entry.id || "default", entry]),
  );

  return {
    all: () => entries,

    get: (id: string) => entryMap.get(id),

    random: (count = 1) => {
      const shuffled = [...entries].sort(() => 0.5 - Math.random());
      return count === 1 ? shuffled[0] : shuffled.slice(0, count);
    },

    find: (predicate: (entry: T) => boolean) => entries.find(predicate),
  };
}
