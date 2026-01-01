import { collections } from "@/content/collections";
import { getLangName } from "@/i18n/common";
import { useTranslate } from "@/i18n/useTranslate";
import { $isHost, $settings, syncSettings } from "@/stores/peer.store";
import { useStore } from "@nanostores/solid";
import {
  TbCheck,
  TbChevronDown,
  TbDice5,
  TbSettings,
  TbX,
} from "solid-icons/tb";
import { createMemo, createSignal, For, Show } from "solid-js";

export default function RoomSettings() {
  const t = useTranslate();
  const settings = useStore($settings);
  const isHost = useStore($isHost);
  const [isCardPacksMultiSelectOpen, setIsCardPacksMultiSelectOpen] =
    createSignal(false);

  const availablePacks = createMemo(() => {
    const lang = settings().language;
    const packs = collections.cardPacks.all().filter((p) => p.lang === lang);
    return packs;
  });

  const totalCards = createMemo(() => {
    const selectedIds = settings().cardPacks;
    const packs = availablePacks().filter((p) => selectedIds.includes(p.id));
    return packs.reduce((acc, p) => acc + p.data.length, 0);
  });

  const togglePack = (id: string) => {
    const next = settings().cardPacks.includes(id)
      ? settings().cardPacks.filter((p) => p !== id)
      : [...settings().cardPacks, id];
    syncSettings({ ...settings(), cardPacks: next });
  };

  const selectAll = () =>
    syncSettings({
      ...settings(),
      cardPacks: availablePacks().map((p) => p.id),
    });
  const selectNone = () => syncSettings({ ...settings(), cardPacks: [] });
  const randomize = () => {
    const packs = availablePacks();
    const randomCount = Math.floor(Math.random() * packs.length) + 1;
    const shuffled = [...packs]
      .sort(() => 0.5 - Math.random())
      .slice(0, randomCount);
    syncSettings({ ...settings(), cardPacks: shuffled.map((p) => p.id) });
  };

  return (
    <div class="bg-linear-to-br from-slate-50 to-slate-100 p-6 border-2 border-slate-200 rounded-xl shadow-lg min-h-full">
      <div class="flex items-center gap-2 mb-4">
        <TbSettings size={20} class="text-primary" />
        <h3 class="font-black uppercase text-sm text-slate-600">
          {t("room.settings.title")}
        </h3>
      </div>

      <Show
        when={isHost()}
        fallback={
          <div class="space-y-4 mt-6">
            <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <label class="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wide">
                {t("room.settings.card-packs")}
              </label>
              <div class="text-left">
                <span class="font-black text-primary uppercase text-xs block">
                  {getLangName(settings().language)}
                </span>
                <span class="text-slate-700 font-bold">
                  {totalCards()} {t("common.cards")} (
                  {settings().cardPacks.length} {t("common.packs")})
                </span>
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <label class="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wide">
                {t("room.settings.timer")}
              </label>
              <div class="text-2xl font-black text-primary">
                {settings().timer}s
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <label class="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wide">
                {t("room.settings.max-players")}
              </label>
              <div class="text-2xl font-black text-primary">
                {settings().maxPlayers}
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <label class="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wide">
                {t("room.settings.modifiers")}
              </label>
              <div class="text-2xl font-black text-primary">
                {settings().modifiers ? "ON" : "OFF"}
              </div>
            </div>

            <div class="alert alert-info text-xs py-3 mt-6">
              <span class="italic">{t("room.settings.host-only")}</span>
            </div>
          </div>
        }
      >
        <div class="space-y-4 mt-4">
          <div class="form-control relative">
            <label class="block text-xs font-bold mb-2 text-slate-500 uppercase">
              {t("room.settings.card-packs")}
            </label>

            {/* Custom Multiselect Input */}
            <button
              disabled={!isHost()}
              onClick={() =>
                setIsCardPacksMultiSelectOpen(!isCardPacksMultiSelectOpen())
              }
              class="w-full bg-white border-2 border-primary/20 rounded-lg p-3 flex justify-between items-center hover:border-primary transition-colors shadow-sm"
            >
              <div class="text-left">
                <span class="font-black text-primary uppercase text-xs block">
                  {getLangName(settings().language)}
                </span>
                <span class="text-slate-700 font-bold">
                  {totalCards()} {t("common.cards")} (
                  {settings().cardPacks.length} {t("common.packs")})
                </span>
              </div>
              <TbChevronDown
                class={`transition-transform ${isCardPacksMultiSelectOpen() ? "rotate-180" : ""}`}
              />
            </button>

            <Show when={isCardPacksMultiSelectOpen()}>
              <div class="absolute z-50 top-full left-0 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in duration-150">
                <div class="flex gap-2 mb-4">
                  <button
                    onClick={selectAll}
                    class="btn btn-xs  btn-primary flex-1"
                  >
                    <TbCheck /> {t("common.all")}
                  </button>
                  <button
                    onClick={selectNone}
                    class="btn btn-xs  btn-error flex-1"
                  >
                    <TbX /> {t("common.none")}
                  </button>
                  <button
                    onClick={randomize}
                    class="btn btn-xs btn-accent flex-1"
                  >
                    <TbDice5 /> {t("common.random")}
                  </button>
                </div>

                <div class="max-h-60 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  <For each={availablePacks()}>
                    {(pack) => (
                      <label class="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer group">
                        <div class="flex items-center gap-3">
                          <input
                            type="checkbox"
                            class="checkbox checkbox-primary checkbox-sm"
                            checked={settings().cardPacks.includes(pack.id)}
                            onChange={() => togglePack(pack.id)}
                          />
                          <span class="font-bold text-slate-700 capitalize">
                            {t(`room.settings.packs.${pack.id}` as any) ||
                              pack.id}
                          </span>
                        </div>
                        <span class="text-xs font-black text-slate-400 group-hover:text-primary">
                          {pack.data.length}
                        </span>
                      </label>
                    )}
                  </For>
                </div>
                <button
                  onClick={() => setIsCardPacksMultiSelectOpen(false)}
                  class="btn btn-primary btn-sm w-full mt-4"
                >
                  {t("room.settings.card-packs-select-done")}
                </button>
              </div>
            </Show>
          </div>

          <div class="form-control">
            <label class="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wide">
              {t("room.settings.timer")}
            </label>
            <select
              class="select select-primary w-full bg-white font-bold shadow-sm"
              value={settings().timer}
              onChange={(e) =>
                syncSettings({
                  ...settings(),
                  timer: parseInt(e.currentTarget.value),
                })
              }
            >
              <option value="30">
                {t("room.settings.timer-option", { seconds: 30 })}
              </option>
              <option value="45">
                {t("room.settings.timer-option", { seconds: 45 })}
              </option>
              <option value="60">
                {t("room.settings.timer-option", { seconds: 60 })}
              </option>
              <option value="90">
                {t("room.settings.timer-option", { seconds: 90 })}
              </option>
              <option value="120">
                {t("room.settings.timer-option", { seconds: 120 })}
              </option>
            </select>
          </div>

          <div class="form-control">
            <label class="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wide">
              {t("room.settings.max-players")}
            </label>
            <input
              class="input input-primary w-full bg-white font-bold shadow-sm"
              type="number"
              value={settings().maxPlayers}
              min={3}
              max={32}
              onChange={(e) =>
                syncSettings({
                  ...settings(),
                  maxPlayers: Math.max(
                    3,
                    Math.min(32, parseInt(e.currentTarget.value) || 3),
                  ),
                })
              }
            />
            <label class="label">
              <span class="label-text-alt text-slate-500">
                {t("room.settings.min-players")}
              </span>
            </label>
          </div>

          <div class="form-control">
            <label class="cursor-pointer label justify-start gap-3">
              <input
                type="checkbox"
                class="toggle toggle-primary border-primary checked:bg-primary/30"
                checked={settings().modifiers}
                onChange={(e) =>
                  syncSettings({
                    ...settings(),
                    modifiers: e.currentTarget.checked,
                  })
                }
              />
              <span class="label-text font-bold text-slate-700">
                {t("room.settings.modifiers")}
              </span>
            </label>
            <label class="label">
              <span class="label-text-alt text-slate-500">
                {t("room.settings.modifiers-desc")}
              </span>
            </label>
          </div>

          <div class="divider divider-sm"></div>

          <div class="alert alert-success text-xs py-3">
            <span class="font-bold">{t("room.settings.sync-info")}</span>
          </div>
        </div>
      </Show>
    </div>
  );
}
