import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { mmkvStorage } from "@lib/index";

export type JournalEntry = {
  id: string;
  weekId: string;
  lessonId?: string;
  text: string;
  photoUri?: string;
  thumbnailUri?: string;
  createdAt: number;
};

type JournalState = {
  entries: JournalEntry[];
  addEntry: (payload: Omit<JournalEntry, "id" | "createdAt">) => void;
  removeEntry: (entryId: string) => void;
  stripMediaByUri: (uri: string) => void;
  clearAll: () => void;
};

const createEntryId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: ({ weekId, lessonId, text, photoUri, thumbnailUri }) =>
        set((state) => ({
          entries: [
            {
              id: createEntryId(),
              weekId,
              lessonId,
              text: text.trim(),
              photoUri,
              thumbnailUri,
              createdAt: Date.now()
            },
            ...state.entries
          ]
        })),
      removeEntry: (entryId) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== entryId)
        })),
      stripMediaByUri: (uri) =>
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.photoUri !== uri) {
              return entry;
            }
            const next = { ...entry };
            delete next.photoUri;
            delete next.thumbnailUri;
            return next;
          })
        })),
      clearAll: () =>
        set({
          entries: []
        })
    }),
    {
      name: "grp-journal-store",
      storage: createJSONStorage(() => mmkvStorage)
    }
  )
);
