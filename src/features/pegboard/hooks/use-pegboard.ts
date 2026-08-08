"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyBoard,
  type BoardState,
  type CourtId,
} from "../model/board";
import { reduceBoard, type BoardAction } from "../model/board-reducer";
import {
  everyPlayerHasOneLocation,
  findPlayer,
  getCourtsSummary,
  getWaitingPlayers,
} from "../model/board-selectors";
import type { BoardRepository, LoadBoardResult } from "../storage/board-repository";
import { createLocalStorageBoardRepository } from "../storage/local-storage-board-repository";
import { createSaveQueue, type SaveQueue } from "../storage/save-queue";

export type PersistenceStatus =
  | "loading"
  | "ready"
  | "saving"
  | "saved"
  | "save-failed"
  | "corrupt"
  | "unsupported";

export type PegboardController = {
  board: BoardState;
  waitingPlayers: ReturnType<typeof getWaitingPlayers>;
  courts: ReturnType<typeof getCourtsSummary>;
  selectedPlayerId: string | null;
  selectedPlayerName: string | null;
  notice: string | null;
  persistenceStatus: PersistenceStatus;
  storageMessage: string | null;
  canInteract: boolean;
  selectWaitingPlayer: (playerId: string) => void;
  clearSelection: () => void;
  addPlayer: (name: string) => void;
  renamePlayer: (playerId: string, name: string) => void;
  deletePlayer: (playerId: string) => void;
  assignSelectedToCourt: (courtId: CourtId) => boolean;
  returnToWaiting: (playerId: string) => void;
  resetLocalBoard: () => Promise<void>;
  dismissNotice: () => void;
};

export function usePegboard(
  repositoryFactory: () => BoardRepository = createLocalStorageBoardRepository,
): PegboardController {
  const repositoryFactoryRef = useRef(repositoryFactory);
  const repositoryRef = useRef<BoardRepository | null>(null);
  const saveQueueRef = useRef<SaveQueue | null>(null);
  const savesAllowedRef = useRef(false);
  const [board, setBoard] = useState<BoardState>(createEmptyBoard);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>("loading");
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    repositoryRef.current = repositoryFactoryRef.current();
    saveQueueRef.current = createSaveQueue(() => repositoryRef.current!, {
      onStart: () => setPersistenceStatus("saving"),
      onSuccess: () => {
        setPersistenceStatus("saved");
        setDirty(false);
      },
      onError: () => {
        setPersistenceStatus("save-failed");
        setStorageMessage(
          "Could not save the board to this browser. Your latest changes are still on screen.",
        );
      },
    });
    saveQueueRef.current.blockAndClear();

    let cancelled = false;

    async function hydrate() {
      setPersistenceStatus("loading");
      savesAllowedRef.current = false;

      try {
        const result: LoadBoardResult = await repositoryRef.current!.load();
        if (cancelled) {
          return;
        }

        if (result.status === "empty") {
          setBoard(createEmptyBoard());
          setPersistenceStatus("ready");
          setStorageMessage(null);
          savesAllowedRef.current = true;
          saveQueueRef.current?.unblock();
          setHydrated(true);
          return;
        }

        if (result.status === "ok") {
          setBoard(result.board);
          setPersistenceStatus("ready");
          setStorageMessage(null);
          savesAllowedRef.current = true;
          saveQueueRef.current?.unblock();
          setHydrated(true);
          return;
        }

        if (result.status === "unsupported") {
          setBoard(createEmptyBoard());
          setPersistenceStatus("unsupported");
          setStorageMessage(
            `This browser has a newer board (version ${result.version}). Reset local board to continue with this app version.`,
          );
          savesAllowedRef.current = false;
          setHydrated(true);
          return;
        }

        setBoard(createEmptyBoard());
        setPersistenceStatus("corrupt");
        setStorageMessage(
          `${result.reason} Reset local board to continue.`,
        );
        savesAllowedRef.current = false;
        setHydrated(true);
      } catch {
        if (cancelled) {
          return;
        }
        setBoard(createEmptyBoard());
        setPersistenceStatus("corrupt");
        setStorageMessage(
          "Could not read local board storage. Reset local board to continue.",
        );
        savesAllowedRef.current = false;
        setHydrated(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
      saveQueueRef.current?.blockAndClear();
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !savesAllowedRef.current || !dirty) {
      return;
    }

    saveQueueRef.current?.enqueue(board);
  }, [board, dirty, hydrated]);

  const applyAction = useCallback((action: BoardAction) => {
    setBoard((current) => {
      const result = reduceBoard(current, action);
      if (result.notice) {
        setNotice(result.notice);
      }
      if (result.changed) {
        setDirty(true);
      }
      return result.state;
    });
  }, []);

  const selectWaitingPlayer = useCallback(
    (playerId: string) => {
      const player = findPlayer(board, playerId);
      if (!player || player.location.kind !== "waiting") {
        setSelectedPlayerId(null);
        setNotice("Select a waiting player first.");
        return;
      }

      setSelectedPlayerId((current) =>
        current === playerId ? null : playerId,
      );
      setNotice(
        playerId === selectedPlayerId
          ? null
          : `${player.name} selected. Tap a court to place them.`,
      );
    },
    [board, selectedPlayerId],
  );

  const clearSelection = useCallback(() => {
    setSelectedPlayerId(null);
  }, []);

  const addPlayer = useCallback(
    (name: string) => {
      applyAction({ type: "ADD_PLAYER", name });
    },
    [applyAction],
  );

  const renamePlayer = useCallback(
    (playerId: string, name: string) => {
      applyAction({ type: "RENAME_PLAYER", playerId, name });
    },
    [applyAction],
  );

  const deletePlayer = useCallback(
    (playerId: string) => {
      applyAction({ type: "DELETE_PLAYER", playerId });
      setSelectedPlayerId((current) => (current === playerId ? null : current));
    },
    [applyAction],
  );

  const assignSelectedToCourt = useCallback(
    (courtId: CourtId) => {
      if (!selectedPlayerId) {
        setNotice("Tap a waiting player first, then tap a court.");
        return false;
      }

      const playerId = selectedPlayerId;
      const result = reduceBoard(board, {
        type: "ASSIGN_TO_COURT",
        playerId,
        courtId,
      });

      setNotice(result.notice);
      if (!result.changed) {
        return false;
      }

      setBoard(result.state);
      setDirty(true);
      setSelectedPlayerId(null);
      return true;
    },
    [board, selectedPlayerId],
  );

  const returnToWaiting = useCallback(
    (playerId: string) => {
      applyAction({ type: "RETURN_TO_WAITING", playerId });
      setSelectedPlayerId((current) => (current === playerId ? null : current));
    },
    [applyAction],
  );

  const resetLocalBoard = useCallback(async () => {
    const queue = saveQueueRef.current;
    queue?.blockAndClear();
    savesAllowedRef.current = false;
    await queue?.idle();
    await repositoryRef.current!.reset();
    setBoard(createEmptyBoard());
    setSelectedPlayerId(null);
    setNotice("Local board cleared.");
    setStorageMessage(null);
    setPersistenceStatus("ready");
    setDirty(false);
    savesAllowedRef.current = true;
    queue?.unblock();
  }, []);

  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const waitingPlayers = useMemo(() => getWaitingPlayers(board), [board]);
  const courts = useMemo(() => getCourtsSummary(board), [board]);
  const selectedPlayerName =
    selectedPlayerId === null
      ? null
      : (findPlayer(board, selectedPlayerId)?.name ?? null);

  const canInteract =
    hydrated &&
    persistenceStatus !== "loading" &&
    persistenceStatus !== "corrupt" &&
    persistenceStatus !== "unsupported";

  if (process.env.NODE_ENV !== "production" && !everyPlayerHasOneLocation(board)) {
    console.warn("Board invariant violated: player locations are inconsistent.");
  }

  return {
    board,
    waitingPlayers,
    courts,
    selectedPlayerId,
    selectedPlayerName,
    notice,
    persistenceStatus,
    storageMessage,
    canInteract,
    selectWaitingPlayer,
    clearSelection,
    addPlayer,
    renamePlayer,
    deletePlayer,
    assignSelectedToCourt,
    returnToWaiting,
    resetLocalBoard,
    dismissNotice,
  };
}
