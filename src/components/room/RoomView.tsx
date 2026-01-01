import { useTranslate } from "@/i18n/useTranslate";
import {
  $avatar,
  $cardsLoaded,
  $gameState,
  $isHost,
  $name,
  $peer,
  $players,
  $settings,
  addChatMessage,
  initPeer,
  loadSelectedPacks,
  managePeerDataConnection,
  startGame,
} from "@/stores/peer.store";
import { copyToClipboard } from "@/utils/native";
import { useStore } from "@nanostores/solid";
import { useNavigate } from "@tanstack/solid-router";
import { BiSolidRightArrowCircle } from "solid-icons/bi";
import { CgGhostCharacter } from "solid-icons/cg";
import { FiLink } from "solid-icons/fi";
import { TbAlertCircle } from "solid-icons/tb";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import RoomSettings from "./RoomSettings";

export default function RoomView() {
  const t = useTranslate();
  const navigate = useNavigate();
  const [showCopiedTooltip, setShowCopiedTooltip] = createSignal(false);

  const peer = useStore($peer);
  const players = useStore($players);
  const settings = useStore($settings);
  const isHost = useStore($isHost);
  const cardsLoaded = useStore($cardsLoaded);

  const roomId = createMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("code") || peer()?.id;
  });

  const activePlayers = createMemo(() =>
    players().filter((p) => p.status === "connected"),
  );

  const canStart = createMemo(
    () => isHost() && activePlayers().length >= 3 && cardsLoaded(),
  );

  const copyRoomLink = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}?code=${roomId()}`;
    await copyToClipboard(url);
    setShowCopiedTooltip(true);
    setTimeout(() => setShowCopiedTooltip(false), 2000);
  };

  const handleStartGame = () => {
    if (!canStart()) return;
    if (isHost()) {
      startGame();
    }
  };

  // Re-load cards whenever the host changes packs or language
  createEffect(() => {
    if (isHost()) {
      try {
        loadSelectedPacks();
        console.log("Card deck synchronized with selected packs");
      } catch (error) {
        console.error("Failed to load selected packs:", error);
      }
    }
  });

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetRoom = urlParams.get("code");

    const myPeer = await initPeer(targetRoom || undefined);

    if (targetRoom && targetRoom !== myPeer.id) {
      console.log("Joining room as guest:", targetRoom);
      $isHost.set(false);

      const conn = myPeer.connect(targetRoom);
      managePeerDataConnection(conn);

      conn.on("open", () => {
        conn.send({
          msg: "player-info",
          id: myPeer.id,
          name: $name.get(),
          avatar: $avatar.get(),
        });
      });

      conn.on("error", (err) => {
        console.error("Connection error:", err);
        addChatMessage({
          id: crypto.randomUUID(),
          type: "system",
          content: "Failed to connect to room. Room may not exist.",
          timestamp: Date.now(),
        });
      });
    } else {
      console.log("Creating room as host");
      $isHost.set(true);
      $players.set([
        {
          id: myPeer.id,
          name: $name.get(),
          avatar: $avatar.get(),
          isHost: true,
          status: "connected",
          lastSeen: Date.now(),
        },
      ]);

      // Initial load of cards based on default settings
      loadSelectedPacks();
    }

    myPeer.on("connection", (conn) => {
      managePeerDataConnection(conn);
    });

    const unsubscribe = $gameState.subscribe((s) => {
      if (s.status === "playing") {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        navigate({
          to: "/game",
          search: (prev) => ({ ...prev, code }),
        });
      }
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  return (
    <div class="flex flex-col items-center p-8 w-full max-w-7xl mx-auto text-slate-900">
      <div class="w-full flex justify-between items-center mb-8 bg-linear-to-r from-primary to-secondary p-6 shadow-2xl rounded-2xl">
        <div>
          <h2 class="text-2xl font-black italic uppercase tracking-tight text-white">
            {t("room.title")}
          </h2>
          <p class="text-sm text-white/90 mt-1">
            {t("room.code.label")}:{" "}
            <span class="font-mono font-black text-lg">
              {roomId() || "..."}
            </span>
          </p>
        </div>

        <div class="flex gap-3">
          <div
            class="tooltip tooltip-bottom"
            data-tip={showCopiedTooltip() ? t("room.action.copied") : undefined}
          >
            <button
              onClick={copyRoomLink}
              class="btn btn-md btn-accent gap-2 font-bold shadow-lg"
            >
              <FiLink size={20} />
              {t("room.action.copy-link")}
            </button>
          </div>

          <Show when={isHost()}>
            <button
              class={`btn btn-md btn-primary gap-2 font-black shadow-lg ${!canStart() ? "btn-disabled" : ""}`}
              onClick={handleStartGame}
              disabled={!canStart()}
            >
              {t("room.action.start")}
              <BiSolidRightArrowCircle size={24} />
            </button>
          </Show>
        </div>
      </div>

      <Show when={isHost() && activePlayers().length < 3}>
        <div class="alert alert-warning mb-6 shadow-lg">
          <TbAlertCircle size={24} />
          <span class="font-bold">{t("room.alert.need-players")}</span>
        </div>
      </Show>

      <Show when={isHost() && !cardsLoaded()}>
        <div class="alert alert-error mb-6 shadow-lg">
          <TbAlertCircle size={24} />
          <span class="font-bold">{t("room.alert.cards-failed")}</span>
        </div>
      </Show>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <RoomSettings />

        <div class="col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <For each={activePlayers()}>
            {(player) => {
              const isMe = player.id === peer()?.id;
              return (
                <div
                  class={`flex flex-col items-center p-4 bg-white shadow-lg rounded-xl border-2 transition-all hover:scale-105 ${
                    isMe
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-blue-300"
                  }`}
                >
                  <div class="relative">
                    <div class="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-inner">
                      <img src={player.avatar} alt={player.name} />
                    </div>
                    <Show when={player.isHost}>
                      <span class="absolute -top-2 -right-2 badge badge-warning badge-sm font-bold shadow-lg">
                        {t("room.badge.host")}
                      </span>
                    </Show>
                  </div>
                  <span class="mt-3 font-bold text-slate-700 text-center text-sm">
                    {player.name}
                    {isMe && (
                      <span class="text-primary ml-1">
                        ({t("room.badge.you")})
                      </span>
                    )}
                  </span>
                </div>
              );
            }}
          </For>

          <For
            each={Array.from({
              length: Math.max(
                0,
                settings().maxPlayers - activePlayers().length,
              ),
            })}
          >
            {() => (
              <div class="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-xl h-full min-h-35 transition-all hover:border-slate-400">
                <div class="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 text-slate-300 flex items-center justify-center">
                  <CgGhostCharacter size={48} />
                </div>
                <span class="mt-3 font-medium text-slate-400 italic text-xs">
                  {t("room.slot.waiting")}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
