import { useStore } from "@nanostores/solid";
import { $isHost, $settings, syncSettings } from "@/stores/peer.store";
import { For, Show } from "solid-js";
import { TbSettings } from "solid-icons/tb";
import { useTranslate } from "@/i18n/useTranslate";
import type { HushCard } from "@/content/collections";

export default function RoomSettings(props: { cardPacks: HushCard[] }) {
  const t = useTranslate();
  const settings = useStore($settings);
  const isHost = useStore($isHost);

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
                {t("room.settings.card-pack")}
              </label>
              <div class="text-2xl font-black text-primary">
                {settings().cardPack}
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
          <div class="form-control">
            <label class="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wide">
              {t("room.settings.card-pack")}
            </label>
            <select
              class="select select-primary w-full bg-white font-bold shadow-sm"
              value={settings().cardPack}
              onChange={(e) =>
                syncSettings({
                  ...settings(),
                  cardPack: e.currentTarget.value,
                })
              }
            >
              <For each={props.cardPacks}>
                {(pack) => <option value={pack.id}>{pack.id}</option>}
              </For>
            </select>
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
