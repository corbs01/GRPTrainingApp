import React from "react";

import { useJournalStore } from "@state/journalStore";
import { NoteSaveStatus } from "@components/LessonDetailModal";

const NOTE_DEBOUNCE_MS = 300;
const NOTE_STATUS_RESET_MS = 2000;

type PendingSave = {
  lessonId: string;
  text: string;
};

type UseLessonNotesArgs = {
  lessonId?: string | null;
};

export const useLessonNotes = ({ lessonId }: UseLessonNotesArgs) => {
  const setLessonNote = useJournalStore((state) => state.setLessonNote);
  const lessonNotes = useJournalStore((state) => state.lessonNotes);

  const [noteDraft, setNoteDraft] = React.useState<string>("");
  const [noteStatus, setNoteStatus] = React.useState<NoteSaveStatus>("idle");
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedAckTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = React.useRef<PendingSave | null>(null);

  const clearTimers = React.useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (savedAckTimeoutRef.current) {
      clearTimeout(savedAckTimeoutRef.current);
      savedAckTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!lessonId) {
      setNoteDraft("");
      setNoteStatus("idle");
      pendingSaveRef.current = null;
      clearTimers();
      return;
    }

    const existing = lessonNotes[lessonId] ?? "";
    setNoteDraft(existing);
    setNoteStatus("idle");
    pendingSaveRef.current = null;
    clearTimers();
  }, [lessonId, lessonNotes, clearTimers]);

  const flushPendingSave = React.useCallback(() => {
    const payload = pendingSaveRef.current;
    if (!payload) {
      return;
    }
    setNoteStatus("saving");
    try {
      setLessonNote(payload.lessonId, payload.text);
      pendingSaveRef.current = null;
      if (savedAckTimeoutRef.current) {
        clearTimeout(savedAckTimeoutRef.current);
      }
      setNoteStatus("saved");
      savedAckTimeoutRef.current = setTimeout(() => {
        setNoteStatus("idle");
      }, NOTE_STATUS_RESET_MS);
    } catch {
      setNoteStatus("error");
    }
  }, [setLessonNote]);

  const queueNoteSave = React.useCallback(
    (text: string) => {
      if (!lessonId) {
        return;
      }
      pendingSaveRef.current = {
        lessonId,
        text
      };

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setNoteStatus("debouncing");
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        flushPendingSave();
      }, NOTE_DEBOUNCE_MS);
    },
    [flushPendingSave, lessonId]
  );

  const handleNoteChange = React.useCallback(
    (text: string) => {
      setNoteDraft(text);
      queueNoteSave(text);
    },
    [queueNoteSave]
  );

  const handleRetrySave = React.useCallback(() => {
    if (!pendingSaveRef.current && lessonId) {
      pendingSaveRef.current = {
        lessonId,
        text: noteDraft
      };
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    flushPendingSave();
  }, [flushPendingSave, lessonId, noteDraft]);

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    noteDraft,
    noteStatus,
    handleNoteChange,
    handleRetrySave
  };
};
