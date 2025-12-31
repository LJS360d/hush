import { persistentAtom, persistentMap } from "@nanostores/persistent";
import { atom, map } from "nanostores";
import Peer, { type DataConnection } from "peerjs";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  status: "connected" | "reconnecting";
  lastSeen: number;
}

export interface RoomSettings {
  rounds: number;
  timer: number;
  maxPlayers: number;
  teams: boolean;
  cardPack: string;
  modifiers: boolean;
  [x: string]: any;
}

export interface Card {
  word: string;
  bans: string[];
}

export interface GameModifier {
  text: string;
  icon: string;
}

export interface GameState {
  status: "lobby" | "playing" | "paused" | "ended";
  currentRound: number;
  describerId: string;
  checkerId: string;
  currentCard: Card | null;
  currentModifier: GameModifier | null;
  revealedBans: string[];
  scores: Record<string, number>;
  winners: string[];
  timeRemaining: number;
  roundStartTime: number;
  deck: Card[];
  usedCards: string[];
  modifiers: GameModifier[];
}

export interface ChatMessage {
  id: string;
  type: "guess" | "system" | "banned";
  playerId?: string;
  playerName?: string;
  content: string;
  timestamp: number;
}

export const PEER_ID_LENGTH = 6;
export const RECONNECTION_WINDOW = 120000;
export const MAX_CHAT_HISTORY = 100;

export const $name = persistentAtom<string>("player-name", "");
export const $avatar = persistentAtom<string>(
  "player-avatar",
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
);
export const $reconnectionPeerId = persistentAtom<string>(
  "reconnection-peer-id",
  "",
);
export const $reconnectionRoomId = persistentAtom<string>(
  "reconnection-room-id",
  "",
);

export const $peer = atom<Peer | null>(null);
export const $settings = persistentMap<RoomSettings>("room-settings", {
  rounds: 3,
  timer: 60,
  maxPlayers: 12,
  teams: false,
  cardPack: "default",
  modifiers: false,
});

export const $connections = atom<DataConnection[]>([]);
export const $players = atom<Player[]>([]);
export const $isHost = atom<boolean>(true);
export const $chatMessages = atom<ChatMessage[]>([]);
export const $cardsLoaded = atom<boolean>(false);

export const $gameState = map<GameState>({
  status: "lobby",
  currentRound: 1,
  describerId: "",
  checkerId: "",
  currentCard: null,
  currentModifier: null,
  revealedBans: [],
  scores: {},
  winners: [],
  timeRemaining: 0,
  roundStartTime: 0,
  deck: [],
  usedCards: [],
  modifiers: [],
});

let roundTimer: number | null = null;
let reconnectionCheckers: Map<string, number> = new Map();

export function initPeer(roomId?: string): Promise<Peer> {
  return new Promise((resolve, reject) => {
    if ($peer.get()) {
      return resolve($peer.get()!);
    }

    const storedReconnectionId = $reconnectionPeerId.get();
    const storedRoomId = $reconnectionRoomId.get();

    let peerId: string;

    if (
      storedReconnectionId &&
      storedRoomId &&
      roomId &&
      storedRoomId === roomId
    ) {
      peerId = storedReconnectionId;
      console.log("Attempting reconnection with ID:", peerId);
    } else {
      peerId = generatePeerIdNumber();
      console.log("Generated new peer ID:", peerId);
    }

    const newPeer = new Peer(peerId);

    newPeer.on("open", (id) => {
      console.log("Peer opened with ID:", id);
      $peer.set(newPeer);
      resolve(newPeer);
    });

    newPeer.on("connection", (conn) => {
      managePeerDataConnection(conn);
    });

    newPeer.on("error", (err) => {
      console.error(`PeerJS Error ${err.type}:`, err);
      if (
        err.type === "unavailable-id" &&
        storedReconnectionId &&
        peerId === storedReconnectionId
      ) {
        console.log("Reconnection failed, generating new ID");
        $reconnectionPeerId.set("");
        $reconnectionRoomId.set("");
        initPeer(roomId).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

export function syncPlayers(newList: Player[]) {
  $players.set(newList);

  if ($isHost.get()) {
    $connections.get().forEach((conn) => {
      if (conn.open) {
        conn.send({ msg: "players-update", players: newList });
      }
    });
  }
}

export function syncSettings(settings: RoomSettings) {
  $settings.set(settings);
  if ($isHost.get()) {
    $connections.get().forEach((conn) => {
      if (conn.open) {
        conn.send({ msg: "settings-update", settings });
      }
    });
  }
}

export function syncGameState(state: GameState) {
  $gameState.set(state);
  if ($isHost.get()) {
    $connections.get().forEach((conn) => {
      if (conn.open) {
        conn.send({ msg: "game-state-update", state });
      }
    });
  }
}

export function addChatMessage(message: ChatMessage) {
  const messages = $chatMessages.get();
  const updatedMessages = [...messages, message].slice(-MAX_CHAT_HISTORY);
  $chatMessages.set(updatedMessages);

  if ($isHost.get()) {
    $connections.get().forEach((conn) => {
      if (conn.open) {
        conn.send({ msg: "chat-message", message });
      }
    });
  }
}

export function loadCardPack(cards: Card[], modifiers: GameModifier[] = []) {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  const state = $gameState.get();
  syncGameState({
    ...state,
    deck: shuffled,
    usedCards: [],
    modifiers: modifiers,
  });
  $cardsLoaded.set(true);
  console.log("Card pack loaded:", shuffled.length, "cards");
}

export function startGame() {
  if (!$isHost.get()) return;

  const players = $players.get();
  if (players.length < 3) {
    addChatMessage({
      id: crypto.randomUUID(),
      type: "system",
      content: "Need at least 3 players to start!",
      timestamp: Date.now(),
    });
    return;
  }

  const state = $gameState.get();
  if (state.deck.length === 0) {
    addChatMessage({
      id: crypto.randomUUID(),
      type: "system",
      content: "No cards loaded!",
      timestamp: Date.now(),
    });
    return;
  }

  const activePlayers = players.filter((p) => p.status === "connected");
  if (activePlayers.length < 3) {
    pauseGame();
    return;
  }

  const describerId = activePlayers[0].id;
  const checkerId = activePlayers[activePlayers.length - 1].id;

  const newState: GameState = {
    ...state,
    status: "playing",
    currentRound: 1,
    describerId,
    checkerId,
    winners: [],
    revealedBans: [],
    timeRemaining: $settings.get().timer,
    roundStartTime: Date.now(),
  };

  drawNewCard(newState);
  rollModifier(newState);
  syncGameState(newState);
  startRoundTimer();

  addChatMessage({
    id: crypto.randomUUID(),
    type: "system",
    content: "Game started!",
    timestamp: Date.now(),
  });
}

export function pauseGame() {
  if (!$isHost.get()) return;

  const state = $gameState.get();
  syncGameState({ ...state, status: "paused" });
  stopRoundTimer();

  addChatMessage({
    id: crypto.randomUUID(),
    type: "system",
    content: "Game paused - waiting for more players...",
    timestamp: Date.now(),
  });
}

export function resumeGame() {
  if (!$isHost.get()) return;

  const players = $players.get();
  const activePlayers = players.filter((p) => p.status === "connected");

  if (activePlayers.length >= 3) {
    const state = $gameState.get();
    syncGameState({
      ...state,
      status: "playing",
      roundStartTime: Date.now(),
      timeRemaining: $settings.get().timer,
    });
    startRoundTimer();

    addChatMessage({
      id: crypto.randomUUID(),
      type: "system",
      content: "Game resumed!",
      timestamp: Date.now(),
    });
  }
}

function drawNewCard(state: GameState) {
  const availableCards = state.deck.filter(
    (card) => !state.usedCards.includes(card.word),
  );

  if (availableCards.length === 0) {
    state.usedCards = [];
  }

  const card =
    availableCards[Math.floor(Math.random() * availableCards.length)];
  state.currentCard = card;
  state.usedCards.push(card.word);
}

function rollModifier(state: GameState) {
  if (!$settings.get().modifiers || state.modifiers.length === 0) {
    state.currentModifier = null;
    return;
  }

  const modifier =
    state.modifiers[Math.floor(Math.random() * state.modifiers.length)];
  state.currentModifier = modifier;
}

function startRoundTimer() {
  stopRoundTimer();

  roundTimer = window.setInterval(() => {
    if (!$isHost.get()) return;

    const state = $gameState.get();
    if (state.status !== "playing") {
      stopRoundTimer();
      return;
    }

    const elapsed = Math.floor((Date.now() - state.roundStartTime) / 1000);
    const remaining = $settings.get().timer - elapsed;

    if (remaining <= 0) {
      endRound();
    } else {
      syncGameState({ ...state, timeRemaining: remaining });
    }
  }, 1000);
}

function stopRoundTimer() {
  if (roundTimer) {
    clearInterval(roundTimer);
    roundTimer = null;
  }
}

export function handleGuess(
  playerId: string,
  playerName: string,
  guess: string,
) {
  if (!$isHost.get()) return;

  const state = $gameState.get();
  if (!state.currentCard || state.winners.includes(playerId)) return;

  const normalizedGuess = guess.toLowerCase().trim();
  const word = state.currentCard.word.toLowerCase();
  const bans = state.currentCard.bans.map((b) => b.toLowerCase());

  if (normalizedGuess === word) {
    const newWinners = [...state.winners, playerId];
    const newScores = { ...state.scores };
    newScores[playerId] = (newScores[playerId] || 0) + 1;
    newScores[state.describerId] = (newScores[state.describerId] || 0) + 1;

    syncGameState({ ...state, winners: newWinners, scores: newScores });

    addChatMessage({
      id: crypto.randomUUID(),
      type: "system",
      content: `${playerName} has guessed the word!`,
      timestamp: Date.now(),
    });

    const activePlayers = $players
      .get()
      .filter(
        (p) =>
          p.status === "connected" &&
          p.id !== state.describerId &&
          p.id !== state.checkerId,
      );

    if (newWinners.length === activePlayers.length) {
      endRound();
    }
  } else if (bans.includes(normalizedGuess)) {
    const originalBan = state.currentCard.bans.find(
      (b) => b.toLowerCase() === normalizedGuess,
    );
    if (originalBan && !state.revealedBans.includes(originalBan)) {
      syncGameState({
        ...state,
        revealedBans: [...state.revealedBans, originalBan],
      });

      addChatMessage({
        id: crypto.randomUUID(),
        type: "banned",
        playerId,
        playerName,
        content: `revealed banned word: ${originalBan}`,
        timestamp: Date.now(),
      });
    }
  } else {
    addChatMessage({
      id: crypto.randomUUID(),
      type: "guess",
      playerId,
      playerName,
      content: guess,
      timestamp: Date.now(),
    });
  }
}

export function skipCard(force: boolean = false) {
  if (!$isHost.get()) return;

  const state = $gameState.get();
  const myId = $peer.get()?.id;

  if (force && myId !== state.checkerId) return;
  if (!force && myId !== state.describerId) return;

  const newState: GameState = {
    ...state,
    winners: [],
    revealedBans: [],
    timeRemaining: $settings.get().timer,
    roundStartTime: Date.now(),
  };

  drawNewCard(newState);
  syncGameState(newState);

  addChatMessage({
    id: crypto.randomUUID(),
    type: "system",
    content: force ? "Card skipped by checker!" : "Card skipped!",
    timestamp: Date.now(),
  });
}

function endRound() {
  if (!$isHost.get()) return;

  stopRoundTimer();

  const state = $gameState.get();
  const players = $players.get();
  const activePlayers = players.filter((p) => p.status === "connected");

  if (activePlayers.length < 3) {
    pauseGame();
    return;
  }

  const currentDescriberIndex = activePlayers.findIndex(
    (p) => p.id === state.describerId,
  );
  const nextDescriberIndex = (currentDescriberIndex + 1) % activePlayers.length;
  const newDescriberId = activePlayers[nextDescriberIndex].id;
  const newCheckerId = state.describerId;

  const newState: GameState = {
    ...state,
    currentRound: state.currentRound + 1,
    describerId: newDescriberId,
    checkerId: newCheckerId,
    winners: [],
    revealedBans: [],
    timeRemaining: $settings.get().timer,
    roundStartTime: Date.now(),
  };

  drawNewCard(newState);
  rollModifier(newState);
  syncGameState(newState);
  startRoundTimer();

  const describerName = activePlayers[nextDescriberIndex].name;
  addChatMessage({
    id: crypto.randomUUID(),
    type: "system",
    content: `Round ${newState.currentRound} - ${describerName} is describing!`,
    timestamp: Date.now(),
  });
}

function generatePeerIdNumber() {
  return Math.floor(Math.random() * 10 ** PEER_ID_LENGTH)
    .toString()
    .padStart(PEER_ID_LENGTH, "0");
}

function checkReconnections() {
  if (!$isHost.get()) return;

  const players = $players.get();
  const state = $gameState.get();
  const now = Date.now();
  const updatedPlayers = players.filter((player) => {
    if (player.status === "reconnecting") {
      if (now - player.lastSeen > RECONNECTION_WINDOW) {
        addChatMessage({
          id: crypto.randomUUID(),
          type: "system",
          content: `${player.name} left the game`,
          timestamp: Date.now(),
        });

        if (player.id === state.describerId || player.id === state.checkerId) {
          if (state.status === "playing") {
            endRound();
          }
        }

        return false;
      }
    }
    return true;
  });

  if (updatedPlayers.length !== players.length) {
    syncPlayers(updatedPlayers);

    const activePlayers = updatedPlayers.filter(
      (p) => p.status === "connected",
    );
    if (activePlayers.length < 3 && state.status === "playing") {
      pauseGame();
    }
  }
}

function migrateHost() {
  const players = $players.get();
  const activePlayers = players.filter((p) => p.status === "connected");

  if (activePlayers.length === 0) return;

  const newHost = activePlayers[0];
  const myId = $peer.get()?.id;

  if (newHost.id === myId) {
    $isHost.set(true);

    const updatedPlayers = players.map((p) => ({
      ...p,
      isHost: p.id === myId,
    }));
    syncPlayers(updatedPlayers);

    addChatMessage({
      id: crypto.randomUUID(),
      type: "system",
      content: "You are now the host!",
      timestamp: Date.now(),
    });

    if ($gameState.get().status === "playing") {
      startRoundTimer();
    }
  }
}

export function managePeerDataConnection(connection: DataConnection) {
  connection.on("data", (data: any) => {
    console.log("Received data:", data);

    switch (data.msg) {
      case "players-update":
        if (!$isHost.get()) $players.set(data.players);
        break;

      case "player-info":
        if ($isHost.get()) {
          const current = $players.get();
          const existingPlayer = current.find((p) => p.id === data.id);

          if (existingPlayer) {
            if (existingPlayer.status === "reconnecting") {
              const updated = current.map((p) =>
                p.id === data.id
                  ? { ...p, status: "connected" as const, lastSeen: Date.now() }
                  : p,
              );
              syncPlayers(updated);

              addChatMessage({
                id: crypto.randomUUID(),
                type: "system",
                content: `${data.name} reconnected!`,
                timestamp: Date.now(),
              });

              const conn = $connections.get().find((c) => c.peer === data.id);
              if (conn && conn.open) {
                conn.send({
                  msg: "game-state-update",
                  state: $gameState.get(),
                });
                conn.send({
                  msg: "settings-update",
                  settings: $settings.get(),
                });
                conn.send({
                  msg: "chat-history",
                  messages: $chatMessages.get(),
                });
              }

              if (
                $gameState.get().status === "paused" &&
                updated.filter((p) => p.status === "connected").length >= 3
              ) {
                resumeGame();
              }
            }
          } else {
            const newPlayer: Player = {
              id: data.id,
              name: data.name,
              avatar: data.avatar,
              isHost: false,
              status: "connected",
              lastSeen: Date.now(),
            };
            syncPlayers([...current, newPlayer]);

            addChatMessage({
              id: crypto.randomUUID(),
              type: "system",
              content: `${data.name} joined the game!`,
              timestamp: Date.now(),
            });

            const conn = $connections.get().find((c) => c.peer === data.id);
            if (conn && conn.open) {
              conn.send({ msg: "game-state-update", state: $gameState.get() });
              conn.send({
                msg: "settings-update",
                settings: $settings.get(),
              });
              conn.send({ msg: "chat-history", messages: $chatMessages.get() });
            }

            if (
              $gameState.get().status === "paused" &&
              current.length + 1 >= 3
            ) {
              resumeGame();
            }
          }
        }
        break;

      case "settings-update":
        if (!$isHost.get()) $settings.set(data.settings);
        break;

      case "game-state-update":
        if (!$isHost.get()) $gameState.set(data.state);
        break;

      case "chat-message":
        if (!$isHost.get()) {
          const messages = $chatMessages.get();
          $chatMessages.set(
            [...messages, data.message].slice(-MAX_CHAT_HISTORY),
          );
        }
        break;

      case "chat-history":
        if (!$isHost.get()) {
          $chatMessages.set(data.messages);
        }
        break;

      case "guess":
        if ($isHost.get()) {
          handleGuess(data.playerId, data.playerName, data.guess);
        }
        break;

      case "skip":
        if ($isHost.get()) {
          skipCard(data.force);
        }
        break;

      case "start-game":
        if ($isHost.get()) {
          startGame();
        }
        break;
    }
  });

  connection.on("open", () => {
    console.log("Connection opened with:", connection.peer);
    $connections.set([...$connections.get(), connection]);
  });

  connection.on("close", () => {
    console.log("Connection closed with:", connection.peer);

    const remaining = $connections
      .get()
      .filter((c) => c.connectionId !== connection.connectionId);
    $connections.set(remaining);

    if ($isHost.get()) {
      const players = $players.get();
      const state = $gameState.get();
      const disconnectedPlayer = players.find((p) => p.id === connection.peer);

      if (disconnectedPlayer) {
        const updated = players.map((p) =>
          p.id === connection.peer
            ? { ...p, status: "reconnecting" as const, lastSeen: Date.now() }
            : p,
        );
        syncPlayers(updated);

        addChatMessage({
          id: crypto.randomUUID(),
          type: "system",
          content: `${disconnectedPlayer.name} disconnected...`,
          timestamp: Date.now(),
        });

        if (
          disconnectedPlayer.id === state.describerId ||
          disconnectedPlayer.id === state.checkerId
        ) {
          if (state.status === "playing") {
            addChatMessage({
              id: crypto.randomUUID(),
              type: "system",
              content: "Key player disconnected - ending round early",
              timestamp: Date.now(),
            });
            endRound();
          }
        }

        const checkerId = setInterval(() => checkReconnections(), 5000);
        reconnectionCheckers.set(connection.peer, Number(checkerId));

        setTimeout(() => {
          const checker = reconnectionCheckers.get(connection.peer);
          if (checker) {
            clearInterval(checker);
            reconnectionCheckers.delete(connection.peer);
          }
        }, RECONNECTION_WINDOW + 1000);
      }

      const hostPlayer = players.find((p) => p.isHost);
      if (hostPlayer && hostPlayer.id === connection.peer) {
        migrateHost();
      }
    } else {
      const players = $players.get();
      const hostPlayer = players.find((p) => p.isHost);
      if (hostPlayer && hostPlayer.id === connection.peer) {
        migrateHost();
      }

      $reconnectionPeerId.set($peer.get()?.id || "");
      $reconnectionRoomId.set(hostPlayer?.id || "");
    }
  });
}
