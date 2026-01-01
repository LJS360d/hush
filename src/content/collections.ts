import { z } from "zod";
import { defineCollection } from "./config";

export const HushCardSchema = z.object({
  word: z.string(),
  bans: z.array(z.string()),
});

export type HushCard = ReturnType<typeof collections.cardPacks.all>[number];

export const GameModifierSchema = z.object({
  text: z.string(),
  icon: z.string(),
});

export type GameModifier = ReturnType<
  typeof collections.gameModifiers.all
>[number];

export const collections = {
  cardPacks: defineCollection({
    loader: import.meta.glob("/src/content/cardPacks/**/*.json", {
      eager: true,
    }),
    schema: z.array(HushCardSchema),
    transform: (data, id, lang) => ({ id, lang, data }),
  }),

  gameModifiers: defineCollection({
    loader: import.meta.glob("/src/content/gameModifiers/**/*.json", {
      eager: true,
    }),
    schema: z.array(GameModifierSchema),
    transform: (data, id) => ({ data, id }),
  }),
};
