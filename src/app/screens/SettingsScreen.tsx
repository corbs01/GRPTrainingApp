import React from "react";
import { Modal, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@components/ScreenContainer";
import { Button } from "@components/Button";
import { useTheme } from "@theme/index";
import { usePuppyStore } from "@state/puppyStore";
import { getWeekNumberFromDob } from "@lib/weekProgress";

const formatDobInput = (iso?: string) => (iso ? iso.split("T")[0] : "");

const normalizeDobInput = (value: string): { iso: string } | { error: string } => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { error: "Enter a date using YYYY-MM-DD." };
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { error: "That doesn't look like a valid date." };
  }

  const now = new Date();
  if (parsed > now) {
    return { error: "Birthdate can't be in the future." };
  }

  const tooOld = new Date(now.getFullYear() - 20, now.getMonth(), now.getDate());
  if (parsed < tooOld) {
    return { error: "Double-check the year — that seems too far back." };
  }

  return { iso: parsed.toISOString() };
};

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const puppy = usePuppyStore((state) => state.puppy);
  const updateDob = usePuppyStore((state) => state.updateDob);
  const [dobInput, setDobInput] = React.useState(() => formatDobInput(puppy?.dob));
  const [error, setError] = React.useState<string>();
  const [status, setStatus] = React.useState<string>();
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [pendingDobIso, setPendingDobIso] = React.useState<string>();

  const currentWeek = React.useMemo(() => {
    if (!puppy?.dob) {
      return null;
    }
    return getWeekNumberFromDob(puppy.dob);
  }, [puppy?.dob]);

  React.useEffect(() => {
    setDobInput(formatDobInput(puppy?.dob));
  }, [puppy?.dob]);

  const handleSave = () => {
    if (!puppy) {
      return;
    }
    setError(undefined);
    setStatus(undefined);

    const normalized = normalizeDobInput(dobInput);
    if ("error" in normalized) {
      setError(normalized.error);
      return;
    }

    if (normalized.iso === puppy.dob) {
      setStatus("No changes detected.");
      return;
    }

    setPendingDobIso(normalized.iso);
    setConfirmVisible(true);
  };

  const closeModal = () => {
    setConfirmVisible(false);
    setPendingDobIso(undefined);
  };

  const handleConfirmChange = () => {
    if (!pendingDobIso) {
      return;
    }
    updateDob(pendingDobIso);
    setStatus("Birthdate updated. Timeline and plan filters refreshed.");
    closeModal();
  };

  return (
    <ScreenContainer scrollable>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Settings</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        Adjust training profile details. Notifications and backups are coming soon.
      </Text>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            shadowColor: theme.shadow.soft.shadowColor,
            shadowOpacity: theme.shadow.soft.shadowOpacity,
            shadowRadius: theme.shadow.soft.shadowRadius,
            shadowOffset: theme.shadow.soft.shadowOffset
          }
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Birthdate & pacing
        </Text>
        <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
          We use your puppy&apos;s birthdate to pick the right week in the timeline, daily plan, and
          filters. Practice and journal logs keep their original tags even if you adjust this date.
        </Text>

        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
          Birthdate (YYYY-MM-DD)
        </Text>
        <TextInput
          value={dobInput}
          onChangeText={setDobInput}
          placeholder="2024-03-15"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: error ? theme.colors.warning : theme.colors.border,
              color: theme.colors.textPrimary
            }
          ]}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.warning }]}>{error}</Text>
        )}
        {status && !error && (
          <Text style={[styles.statusText, { color: theme.colors.success }]}>{status}</Text>
        )}

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
            Current filters
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
            {currentWeek ? `Week ${currentWeek}` : "Not set"}
          </Text>
        </View>

        <Button label="Save changes" fullWidth onPress={handleSave} style={{ marginTop: 16 }} />
      </View>

      <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Update birthdate?
            </Text>
            <Text style={[styles.modalBody, { color: theme.colors.textSecondary }]}>
              This recalculates the current week for your timeline, daily plan, and filters. Practice
              and journal logs keep their historical week tags.
            </Text>
            <View style={styles.modalButtons}>
              <Button label="Cancel" variant="outline" onPress={closeModal} style={styles.modalButton} />
              <Button
                label="Confirm change"
                onPress={handleConfirmChange}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24
  },
  section: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700"
  },
  helper: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16
  },
  errorText: {
    marginTop: 6
  },
  statusText: {
    marginTop: 6
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20
  },
  infoLabel: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  modalCard: {
    borderRadius: 20,
    padding: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12
  },
  modalButton: {
    flex: 1
  }
});
