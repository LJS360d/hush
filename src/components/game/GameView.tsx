import { useTranslate } from "@/i18n/useTranslate";
import {
  $chatMessages,
  $gameState,
  $peer,
  $players,
  handleGuess,
  skipCard,
  type ChatMessage,
} from "@/stores/peer.store";
import { useStore } from "@nanostores/solid";
import { useNavigate } from "@tanstack/solid-router";
import { TbClock, TbSkull, TbDice } from "solid-icons/tb";
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

export default function GameView() {
  const t = useTranslate();
  const navigate = useNavigate();
  const state = useStore($gameState);
  const players = useStore($players);
  const me = useStore($peer);
  const messages = useStore($chatMessages);

  const [chatInput, setChatInput] = createSignal("");
  const [skipCooldown, setSkipCooldown] = createSignal(false);

  const isDescriber = createMemo(() => state().describerId === me()?.id);
  const isChecker = createMemo(() => state().checkerId === me()?.id);
  const hasGuessedCorrectly = createMemo(() =>
    state().winners.includes(me()?.id || ""),
  );
  const canGuess = createMemo(
    () => !isDescriber() && !isChecker() && !hasGuessedCorrectly(),
  );

  const activePlayers = createMemo(() =>
    players().filter((p) => p.status === "connected"),
  );

  const sortedPlayers = createMemo(() => {
    const active = activePlayers();
    return [...active].sort((a, b) => {
      const scoreA = state().scores[a.id] || 0;
      const scoreB = state().scores[b.id] || 0;
      return scoreB - scoreA;
    });
  });

  const describerPlayer = createMemo(() =>
    players().find((p) => p.id === state().describerId),
  );

  const checkerPlayer = createMemo(() =>
    players().find((p) => p.id === state().checkerId),
  );

  // reverse messages to use flex-col-reverse for automatic pinning to bottom
  const displayMessages = createMemo(() => [...messages()].reverse());

  onMount(() => {
    const unsubscribe = $gameState.subscribe((s) => {
      if (s.status === "lobby") {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        navigate(`/room/?code=${code}`);
      }
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  const handleSkip = (isForce: boolean) => {
    if (skipCooldown()) return;

    const conn = me();
    if (!conn) return;

    const hostPlayer = players().find((p) => p.isHost);
    if (!hostPlayer) return;

    if (hostPlayer.id === me()?.id) {
      skipCard(isForce);
    } else {
      const connection = conn.connect(hostPlayer.id);
      connection.on("open", () => {
        connection.send({ msg: "skip", force: isForce });
      });
    }

    setSkipCooldown(true);
    setTimeout(() => setSkipCooldown(false), isForce ? 3000 : 1000);
  };

  const onChatSubmit = (e: Event) => {
    e.preventDefault();
    if (!chatInput() || !canGuess()) return;

    const guess = chatInput().trim();
    if (!guess) return;

    const conn = me();
    if (!conn) return;

    const hostPlayer = players().find((p) => p.isHost);
    if (!hostPlayer) return;

    if (hostPlayer.id === me()?.id) {
      const myPlayer = players().find((p) => p.id === me()?.id);
      if (myPlayer) {
        handleGuess(myPlayer.id, myPlayer.name, guess);
      }
    } else {
      const connection = conn.connect(hostPlayer.id);
      connection.on("open", () => {
        const myPlayer = players().find((p) => p.id === me()?.id);
        if (myPlayer) {
          connection.send({
            msg: "guess",
            playerId: myPlayer.id,
            playerName: myPlayer.name,
            guess,
          });
        }
      });
    }

    setChatInput("");
  };

  const getMessageColor = (msg: ChatMessage) => {
    if (msg.type === "system") return "alert-info";
    if (msg.type === "banned") return "alert-error";
    return "";
  };

  return (
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 h-full max-w-7xl mx-auto">
      <div class="bg-base-200 p-4 rounded-xl shadow-inner overflow-y-auto">
        <h3 class="font-black mb-4 uppercase text-sm opacity-50 flex items-center justify-between">
          {t("game.leaderboard")}
          <span class="badge badge-primary badge-sm font-mono">
            {t("game.round")} {state().currentRound}
          </span>
        </h3>

        <Show when={state().status === "paused"}>
          <div class="alert alert-warning mb-4 text-xs py-2">
            {t("game.paused.title")}
          </div>
        </Show>

        <div class="space-y-2">
          <For each={sortedPlayers()}>
            {(p) => {
              const isMyId = p.id === me()?.id;
              const isWinner = state().winners.includes(p.id);
              const isCurrentDescriber = p.id === state().describerId;
              const isCurrentChecker = p.id === state().checkerId;

              return (
                <div
                  class={`flex flex-col p-2 rounded-lg transition-all ${
                    isWinner
                      ? "bg-success/20 border-2 border-success"
                      : isMyId
                        ? "bg-primary/10 border-2 border-primary/30"
                        : "bg-base-100"
                  }`}
                >
                  <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                      <div class="avatar">
                        <div class="w-8 h-8 rounded-full">
                          <img src={p.avatar} alt={p.name} />
                        </div>
                      </div>
                      <span class="font-bold text-sm">{p.name}</span>
                    </div>
                    <span class="badge badge-ghost font-mono font-bold">
                      {state().scores[p.id] || 0}
                    </span>
                  </div>
                  <Show when={isCurrentDescriber || isCurrentChecker}>
                    <div class="mt-1 flex gap-1">
                      <Show when={isCurrentDescriber}>
                        <span class="badge badge-warning badge-xs">
                          {t("game.role.describing")}
                        </span>
                      </Show>
                      <Show when={isCurrentChecker}>
                        <span class="badge badge-error badge-xs">
                          {t("game.role.checking")}
                        </span>
                      </Show>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        <Show when={describerPlayer() && checkerPlayer()}>
          <div class="divider divider-sm opacity-30"></div>
          <div class="space-y-1 text-xs opacity-60">
            <div class="flex justify-between">
              <span>{t("game.role.describer")}:</span>
              <span class="font-bold">{describerPlayer()?.name}</span>
            </div>
            <div class="flex justify-between">
              <span>{t("game.role.checker")}:</span>
              <span class="font-bold">{checkerPlayer()?.name}</span>
            </div>
          </div>
        </Show>
      </div>

      <div class="lg:col-span-2 flex flex-col gap-6">
        <div class="card bg-primary text-primary-content shadow-2xl min-h-96 flex items-center justify-center p-12 text-center relative overflow-hidden">
          <Show when={state().status === "paused"}>
            <div class="absolute inset-0 bg-base-300/90 backdrop-blur-sm z-20 flex items-center justify-center">
              <div class="text-center space-y-4">
                <TbSkull size={64} class="mx-auto opacity-50" />
                <h2 class="text-4xl font-black text-base-content">
                  {t("game.paused.title")}
                </h2>
                <p class="text-base-content/70">{t("game.paused.message")}</p>
              </div>
            </div>
          </Show>

          <Show
            when={isDescriber() || isChecker()}
            fallback={
              <div class="space-y-4">
                <h2 class="text-4xl font-black italic">
                  {t("game.guess.title")}
                </h2>
                <p class="opacity-70">{t("game.guess.subtitle")}</p>
                <Show when={hasGuessedCorrectly()}>
                  <div class="badge badge-success badge-lg font-bold mt-4">
                    {t("game.guess.success")}
                  </div>
                </Show>
              </div>
            }
          >
            <div class="z-10 w-full">
              <span class="badge badge-secondary mb-4 font-bold italic">
                {t("game.word.label")}
              </span>
              <h2 class="text-6xl font-black uppercase tracking-tighter mb-8">
                {state().currentCard?.word}
              </h2>

              <div class="grid grid-cols-1 gap-2 w-full max-w-xs mx-auto">
                <For each={state().currentCard?.bans}>
                  {(ban) => (
                    <div
                      class={`p-3 rounded-lg border-2 font-bold uppercase transition-all ${
                        state().revealedBans.includes(ban)
                          ? "border-success bg-success/20 line-through opacity-50"
                          : "border-primary-content/20 bg-black/10"
                      }`}
                    >
                      {ban}
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <div class="absolute top-4 right-4 badge badge-lg badge-ghost font-mono font-black gap-2">
            <TbClock size={20} />
            {state().timeRemaining}s
          </div>

          <Show when={state().currentModifier}>
            <div class="absolute top-4 left-4 badge badge-lg badge-accent font-bold gap-2 animate-pulse">
              <TbDice size={20} />
              <span class="text-2xl">{state().currentModifier?.icon}</span>
              <span>{state().currentModifier?.text}</span>
            </div>
          </Show>
        </div>

        <div class="flex gap-4">
          <Show when={isDescriber()}>
            <button
              onClick={() => handleSkip(false)}
              disabled={skipCooldown() || state().status === "paused"}
              class="btn btn-warning flex-1 font-black"
            >
              {t("game.action.skip")}
            </button>
          </Show>
          <Show when={isChecker()}>
            <button
              onClick={() => handleSkip(true)}
              disabled={skipCooldown() || state().status === "paused"}
              class="btn btn-error flex-1 font-black"
            >
              {t("game.action.force-skip")}
            </button>
          </Show>
        </div>
      </div>

      <div class="flex flex-col bg-base-100 border-2 border-base-200 rounded-xl overflow-hidden h-150">
        <div class="flex-1 p-4 overflow-y-auto space-y-2 flex flex-col-reverse">
          <For each={displayMessages()}>
            {(msg) => (
              <Show
                when={msg.type === "system" || msg.type === "banned"}
                fallback={
                  <div class="chat chat-start">
                    <div class="chat-header text-xs opacity-60">
                      {msg.playerName}
                    </div>
                    <div class="chat-bubble chat-bubble-primary">
                      {msg.content}
                    </div>
                  </div>
                }
              >
                <div class={`alert ${getMessageColor(msg)} text-xs py-2 mb-2`}>
                  <Show
                    when={msg.type === "banned"}
                    fallback={<span>{msg.content}</span>}
                  >
                    <Show when={isDescriber() || isChecker()}>
                      <span>{msg.content}</span>
                    </Show>
                  </Show>
                </div>
              </Show>
            )}
          </For>
        </div>

        <form
          onSubmit={onChatSubmit}
          class="p-4 bg-base-200 border-t border-base-300"
        >
          <input
            type="text"
            placeholder={
              hasGuessedCorrectly()
                ? t("game.chat.guessed")
                : isDescriber()
                  ? t("game.chat.describing")
                  : isChecker()
                    ? t("game.chat.checking")
                    : t("game.chat.placeholder")
            }
            class="input input-bordered w-full font-bold"
            value={chatInput()}
            onInput={(e) => setChatInput(e.currentTarget.value)}
            disabled={!canGuess() || state().status === "paused"}
          />
        </form>
      </div>
    </div>
  );
}
