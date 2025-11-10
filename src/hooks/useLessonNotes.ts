import React from "react";

import { useTrainingStore } from "@state/trainingStore";
import { NoteSaveStatus } from "@components/LessonDetailModal";

const NOTE_DEBOUNCE_MS = 300;
const NOTE_STATUS_RESET_MS = 2000;

type PendingSave = {
  weekId: string;
  lessonId: string;
  text: string;
};

type UseLessonNotesArgs = {
  weekId?: string | null;
  lessonId?: string | null;
};

export const useLessonNotes = ({ weekId, lessonId }: UseLessonNotesArgs) => {
  const updateLessonNotes = useTrainingStore((state) => state.updateLessonNotes);
  const lessonNotes = useTrainingStore(
    React.useCallback(
      (state) => (weekId ? state.weeks[weekId]?.lessonNotes ?? {} : {}),
      [weekId]
    )
  );

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
      updateLessonNotes(payload.weekId, payload.lessonId, payload.text);
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
  }, [updateLessonNotes]);

  const queueNoteSave = React.useCallback(
    (text: string) => {
      if (!weekId || !lessonId) {
        return;
      }
      pendingSaveRef.current = {
        weekId,
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
    [flushPendingSave, lessonId, weekId]
  );

  const handleNoteChange = React.useCallback(
    (text: string) => {
      setNoteDraft(text);
      queueNoteSave(text);
    },
    [queueNoteSave]
  );

  const handleRetrySave = React.useCallback(() => {
    if (!pendingSaveRef.current && weekId && lessonId) {
      pendingSaveRef.current = {
        weekId,
        lessonId,
        text: noteDraft
      };
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    flushPendingSave();
  }, [flushPendingSave, lessonId, noteDraft, weekId]);

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    noteDraft,
    noteStatus,
    handleNoteChange,
    handleRetrySave
  };
};

