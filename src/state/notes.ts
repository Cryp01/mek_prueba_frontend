import { atom } from "jotai";
import axios from "axios";
import { atomWithStorage } from "jotai/utils";

export interface Note {
  id: number;
  title: string;
  content: string;
  format: string;
  color?: string;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  localId?: string;
  synced: boolean;
}

export interface NoteInput {
  title: string;
  content: string;
  format: string;
  color?: string;
  priority?: number;
}

export interface OfflineNote extends NoteInput {
  localId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface OfflineUpdate {
  localId?: string;
  id?: number;
  type: "create" | "update" | "delete";
  data: NoteInput | Partial<NoteInput> | null;
  timestamp: string;
}

export const notesAtom = atom<Note[]>([]);
export const offlineNotesAtom = atomWithStorage<OfflineNote[]>(
  "offline_notes",
  []
);
export const pendingUpdatesAtom = atomWithStorage<OfflineUpdate[]>(
  "pending_updates",
  []
);
export const loadingAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);

export const pendingNotesAtom = atomWithStorage<NoteInput[]>(
  "pending_notes",
  []
);

export const allNotesAtom = atom((get) => {
  const serverNotes = get(notesAtom);
  const offlineNotes = get(offlineNotesAtom);

  const formattedOfflineNotes = offlineNotes.map((note) => ({
    id: parseInt(note.localId.replace("local-", "")),
    title: note.title,
    content: note.content,
    format: note.format,
    color: note.color,
    status: note.status,
    priority: note.priority || 0,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    synced: false,
    localId: note.localId,
  }));

  const serverNotesWithSync = serverNotes.map((note) => ({
    ...note,
    synced: true,
  }));

  const uniqueOfflineNotes = formattedOfflineNotes.filter(
    (offlineNote) =>
      !serverNotesWithSync.some(
        (serverNote) => offlineNote.localId === `local-${serverNote.id}`
      )
  );

  return [...serverNotesWithSync, ...uniqueOfflineNotes];
});

export const fetchNotesAtom = atom(null, async (_, set) => {
  set(loadingAtom, true);
  set(errorAtom, null);

  try {
    if (!navigator.onLine) {
      set(loadingAtom, false);
      return { success: true, offline: true };
    }

    const response = await axios.get(
      "https://n8wks000s84gsw8go4cggckk.softver.cc/api/notes"
    );

    if (response.data.success) {
      set(notesAtom, response.data.data);
    } else {
      set(errorAtom, response.data.message || "Failed to fetch notes");
    }
  } catch (error) {
    let errorMessage = "Failed to fetch notes";

    if (typeof error === "object" && error !== null && "response" in error) {
      const err = error as { response?: { data?: { message?: string } } };
      errorMessage = err.response?.data?.message || errorMessage;
    }

    set(errorAtom, errorMessage);
    if (navigator.onLine) {
      throw error;
    }
  } finally {
    set(loadingAtom, false);
  }
});

export const createNoteAtom = atom(
  null,
  async (get, set, noteData: NoteInput) => {
    set(loadingAtom, true);
    set(errorAtom, null);

    if (!navigator.onLine) {
      const localId = `local-${Date.now()}`;
      const now = new Date().toISOString();

      const offlineNote: OfflineNote = {
        ...noteData,
        localId,
        status: "active",
        createdAt: now,
        updatedAt: now,
        synced: false,
      };

      const offlineNotes = get(offlineNotesAtom);
      set(offlineNotesAtom, [...offlineNotes, offlineNote]);

      // Registrar la operación pendiente
      const pendingUpdates = get(pendingUpdatesAtom);
      const update: OfflineUpdate = {
        localId,
        type: "create",
        data: noteData,
        timestamp: now,
      };
      set(pendingUpdatesAtom, [...pendingUpdates, update]);

      set(loadingAtom, false);
      return { success: true, offline: true, note: offlineNote };
    }

    try {
      const response = await axios.post(
        "https://n8wks000s84gsw8go4cggckk.softver.cc/api/notes",
        noteData
      );

      if (response.data.success) {
        const currentNotes = get(notesAtom);
        set(notesAtom, [response.data.data, ...currentNotes]);
        return { success: true, note: response.data.data };
      } else {
        set(errorAtom, response.data.message || "Failed to create note");
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      let errorMessage = "Failed to create note";

      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }

      set(errorAtom, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      set(loadingAtom, false);
    }
  }
);

export const updateNoteAtom = atom(
  null,
  async (
    get,
    set,
    {
      id,
      noteData,
      localId,
    }: { id?: number; noteData: Partial<NoteInput>; localId?: string }
  ) => {
    set(loadingAtom, true);
    set(errorAtom, null);

    if (!navigator.onLine || localId) {
      const now = new Date().toISOString();
      const offlineNotes = get(offlineNotesAtom);

      if (localId) {
        const updatedOfflineNotes = offlineNotes.map((note) =>
          note.localId === localId
            ? { ...note, ...noteData, updatedAt: now }
            : note
        );

        set(offlineNotesAtom, updatedOfflineNotes);

        const pendingUpdates = get(pendingUpdatesAtom);
        const update: OfflineUpdate = {
          localId,
          type: "update",
          data: noteData,
          timestamp: now,
        };
        set(pendingUpdatesAtom, [...pendingUpdates, update]);

        return {
          success: true,
          offline: true,
          note: updatedOfflineNotes.find((n) => n.localId === localId),
        };
      } else if (id) {
        const serverNotes = get(notesAtom);
        const originalNote = serverNotes.find((note) => note.id === id);

        if (!originalNote) {
          set(errorAtom, "Note not found");
          set(loadingAtom, false);
          return { success: false, error: "Note not found" };
        }

        const localId = `local-${id}`;
        const offlineNote: OfflineNote = {
          localId,
          title: originalNote.title,
          content: originalNote.content,
          format: originalNote.format,
          color: originalNote.color,
          priority: originalNote.priority,
          status: originalNote.status,
          ...noteData,
          createdAt: originalNote.createdAt,
          updatedAt: now,
          synced: false,
        };

        const existingOfflineIndex = offlineNotes.findIndex(
          (n) => n.localId === localId
        );
        let newOfflineNotes;

        if (existingOfflineIndex >= 0) {
          newOfflineNotes = [...offlineNotes];
          newOfflineNotes[existingOfflineIndex] = {
            ...newOfflineNotes[existingOfflineIndex],
            ...noteData,
            updatedAt: now,
          };
        } else {
          newOfflineNotes = [...offlineNotes, offlineNote];
        }

        set(offlineNotesAtom, newOfflineNotes);

        const pendingUpdates = get(pendingUpdatesAtom);
        const update: OfflineUpdate = {
          id,
          type: "update",
          data: noteData,
          timestamp: now,
        };
        set(pendingUpdatesAtom, [...pendingUpdates, update]);

        return { success: true, offline: true, note: offlineNote };
      }

      set(loadingAtom, false);
      set(errorAtom, "Invalid update request");
      return { success: false, error: "Invalid update request" };
    }

    try {
      if (!id) {
        throw new Error("Note ID is required for update");
      }

      const response = await axios.put(
        `https://n8wks000s84gsw8go4cggckk.softver.cc/api/notes/${id}`,
        noteData
      );

      if (response.data.success) {
        const currentNotes = get(notesAtom);
        const updatedNotes = currentNotes.map((note) =>
          note.id === id ? response.data.data : note
        );

        set(notesAtom, updatedNotes);
        return { success: true, note: response.data.data };
      } else {
        set(errorAtom, response.data.message || "Failed to update note");
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      let errorMessage = "Failed to update note";

      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }

      set(errorAtom, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      set(loadingAtom, false);
    }
  }
);

export const deleteNoteAtom = atom(
  null,
  async (
    get,
    set,
    {
      id,
      localId,
      permanent = false,
    }: { id?: number; localId?: string; permanent?: boolean }
  ) => {
    set(loadingAtom, true);
    set(errorAtom, null);

    if (!navigator.onLine || localId) {
      if (localId) {
        const offlineNotes = get(offlineNotesAtom);
        const filteredNotes = offlineNotes.filter(
          (note) => note.localId !== localId
        );
        set(offlineNotesAtom, filteredNotes);

        const pendingUpdates = get(pendingUpdatesAtom);
        const filteredUpdates = pendingUpdates.filter(
          (update) => update.localId !== localId
        );

        if (filteredUpdates.length !== pendingUpdates.length) {
          set(pendingUpdatesAtom, filteredUpdates);
        } else {
          const now = new Date().toISOString();
          const serverIdMatch = localId.match(/^local-(\d+)$/);

          if (serverIdMatch) {
            const serverId = parseInt(serverIdMatch[1]);
            const deleteUpdate: OfflineUpdate = {
              id: serverId,
              type: "delete",
              data: null,
              timestamp: now,
            };
            set(pendingUpdatesAtom, [...pendingUpdates, deleteUpdate]);
          }
        }

        set(loadingAtom, false);
        return { success: true, offline: true };
      } else if (id) {
        const now = new Date().toISOString();

        const pendingUpdates = get(pendingUpdatesAtom);
        const update: OfflineUpdate = {
          id,
          type: "delete",
          data: null,
          timestamp: now,
        };
        set(pendingUpdatesAtom, [...pendingUpdates, update]);

        const currentNotes = get(notesAtom);
        const updatedNotes = currentNotes.map((note) =>
          note.id === id ? { ...note, status: "deleted", synced: false } : note
        );
        set(notesAtom, updatedNotes);

        set(loadingAtom, false);
        return { success: true, offline: true };
      }

      set(loadingAtom, false);
      set(errorAtom, "Invalid delete request");
      return { success: false, error: "Invalid delete request" };
    }

    try {
      if (!id) {
        throw new Error("Note ID is required for deletion");
      }

      const url = `https://n8wks000s84gsw8go4cggckk.softver.cc/api/notes/${id}${
        permanent ? "?permanent=true" : ""
      }`;
      const response = await axios.delete(url);

      if (response.data.success) {
        const currentNotes = get(notesAtom);
        const updatedNotes = permanent
          ? currentNotes.filter((note) => note.id !== id)
          : currentNotes.map((note) =>
              note.id === id ? { ...note, status: "deleted" } : note
            );
        set(notesAtom, updatedNotes);

        return { success: true };
      } else {
        set(errorAtom, response.data.message || "Failed to delete note");
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      let errorMessage = "Failed to delete note";
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }
      set(errorAtom, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      set(loadingAtom, false);
    }
  }
);

export const syncOfflineChangesAtom = atom(null, async (get, set) => {
  if (!navigator.onLine) {
    return { success: false, reason: "offline" };
  }

  set(loadingAtom, true);
  set(errorAtom, null);

  try {
    const pendingUpdates = get(pendingUpdatesAtom);
    const offlineNotes = get(offlineNotesAtom);
    const successfulSyncs: string[] = [];

    const sortedUpdates = [...pendingUpdates].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const update of sortedUpdates) {
      try {
        if (update.type === "create") {
          if (!update.localId || !update.data) continue;

          const response = await axios.post(
            "https://n8wks000s84gsw8go4cggckk.softver.cc/api/notes",
            update.data
          );

          if (response.data.success) {
            const currentNotes = get(notesAtom);
            set(notesAtom, [response.data.data, ...currentNotes]);
            successfulSyncs.push(update.localId);
          }
        } else if (update.type === "update") {
          if ((!update.id && !update.localId) || !update.data) continue;

          let id = update.id;

          if (update.localId && !id) {
            const matchedServerNote = get(notesAtom).find(
              (note) => `local-${note.id}` === update.localId
            );
            if (matchedServerNote) {
              id = matchedServerNote.id;
            } else {
              continue;
            }
          }

          const response = await axios.put(
            `https://n8wks000s84gsw8go4cggckk.softver.cc/api/notes/${id}`,
            update.data
          );

          if (response.data.success) {
            const currentNotes = get(notesAtom);
            const updatedNotes = currentNotes.map((note) =>
              note.id === id ? response.data.data : note
            );
            set(notesAtom, updatedNotes);
            if (update.localId) successfulSyncs.push(update.localId);
          }
        } else if (update.type === "delete") {
          if (!update.id) continue;

          const url = `https://n8wks000s84gsw8go4cggckk.softver.cc/api/notes/${update.id}`;
          const response = await axios.delete(url);

          if (response.data.success) {
            const currentNotes = get(notesAtom);
            const updatedNotes = currentNotes.filter(
              (note) => note.id !== update.id
            );
            set(notesAtom, updatedNotes);
            if (update.localId) successfulSyncs.push(update.localId);
          }
        }
      } catch (error) {
        console.error("Error syncing update:", update, error);
      }
    }

    const remainingUpdates = pendingUpdates.filter((update) =>
      update.localId ? !successfulSyncs.includes(update.localId) : true
    );
    set(pendingUpdatesAtom, remainingUpdates);

    const remainingOfflineNotes = offlineNotes.filter(
      (note) => !successfulSyncs.includes(note.localId)
    );
    set(offlineNotesAtom, remainingOfflineNotes);

    await set(fetchNotesAtom);

    return { success: true, syncedCount: successfulSyncs.length };
  } catch (error) {
    let errorMessage = "Failed to sync changes";
    if (typeof error === "object" && error !== null && "response" in error) {
      const err = error as { response?: { data?: { message?: string } } };
      errorMessage = err.response?.data?.message || errorMessage;
    }
    set(errorAtom, errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    set(loadingAtom, false);
  }
});

export const migrateLegacyPendingNotesAtom = atom(null, async (get, set) => {
  const pendingNotes = get(pendingNotesAtom);
  if (pendingNotes.length === 0) return;

  const now = new Date().toISOString();
  const offlineNotes = get(offlineNotesAtom);
  const pendingUpdates = get(pendingUpdatesAtom);

  const newOfflineNotes: OfflineNote[] = [];
  const newPendingUpdates: OfflineUpdate[] = [];

  pendingNotes.forEach((note, index) => {
    const localId = `legacy-${Date.now()}-${index}`;

    const offlineNote: OfflineNote = {
      ...note,
      localId,
      status: "active",
      createdAt: now,
      updatedAt: now,
      synced: false,
    };
    newOfflineNotes.push(offlineNote);

    const update: OfflineUpdate = {
      localId,
      type: "create",
      data: note,
      timestamp: now,
    };
    newPendingUpdates.push(update);
  });

  set(offlineNotesAtom, [...offlineNotes, ...newOfflineNotes]);
  set(pendingUpdatesAtom, [...pendingUpdates, ...newPendingUpdates]);
  set(pendingNotesAtom, []);
});

export const syncPendingNotesAtom = atom(null, async (_, set) => {
  await set(migrateLegacyPendingNotesAtom);

  return set(syncOfflineChangesAtom);
});

export const useNotesService = () => {
  return {
    fetchNotes: fetchNotesAtom,
    createNote: createNoteAtom,
    updateNote: updateNoteAtom,
    deleteNote: deleteNoteAtom,
    syncPendingNotes: syncPendingNotesAtom,
    syncOfflineChanges: syncOfflineChangesAtom,
    notesAtom,
    allNotesAtom,
    pendingNotesAtom,
    offlineNotesAtom,
    pendingUpdatesAtom,
    loadingAtom,
    errorAtom,
  };
};
