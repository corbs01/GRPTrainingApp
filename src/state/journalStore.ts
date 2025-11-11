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
  lessonNotes: Record<string, string>;
  addEntry: (payload: Omit<JournalEntry, "id" | "createdAt">) => void;
  removeEntry: (entryId: string) => void;
  stripMediaByUri: (uri: string) => void;
  setLessonNote: (lessonId: string, text: string) => void;
  removeLessonNote: (lessonId: string) => void;
  clearAll: () => void;
};

const createEntryId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      entries: [],
      lessonNotes: {},
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
      setLessonNote: (lessonId, text) =>
        set((state) => ({
          lessonNotes: {
            ...state.lessonNotes,
            [lessonId]: text
          }
        })),
      removeLessonNote: (lessonId) =>
        set((state) => {
          if (!state.lessonNotes[lessonId]) {
            return state;
          }
          const nextNotes = { ...state.lessonNotes };
          delete nextNotes[lessonId];
          return {
            ...state,
            lessonNotes: nextNotes
          };
        }),
      clearAll: () =>
        set({
          entries: [],
          lessonNotes: {}
        })
    }),
    {
      name: "grp-journal-store",
      storage: createJSONStorage(() => mmkvStorage)
    }
  )
);
