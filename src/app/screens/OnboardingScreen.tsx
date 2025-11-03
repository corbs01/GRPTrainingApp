import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { ScreenContainer } from "@components/ScreenContainer";
import { RootStackParamList } from "@app/navigation/types";
import { useTheme } from "@theme/index";
import { PuppySex, calculateWeekNumber, usePuppyStore } from "@state/puppyStore";

type OnboardingStep = 0 | 1 | 2;

type FormState = {
  name: string;
  dobInput: string;
  sex: PuppySex | "";
  photoUri?: string;
};

type FormErrors = Partial<Record<keyof FormState, string>> & {
  general?: string;
};

const stepLabels: string[] = ["Welcome", "Puppy Profile", "All Set"];

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const setPuppy = usePuppyStore((state) => state.setPuppy);
  const [step, setStep] = useState<OnboardingStep>(0);
  const [form, setForm] = useState<FormState>({
    name: "",
    dobInput: "",
    sex: ""
  });
  const [normalizedDob, setNormalizedDob] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const currentWeek = useMemo(() => {
    if (!normalizedDob) {
      return null;
    }
    return calculateWeekNumber(normalizedDob);
  }, [normalizedDob]);

  const handleChange = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
    setErrors((prev) => ({
      ...prev,
      [key]: undefined,
      general: undefined
    }));
  }, []);

  const handleSelectSex = (value: PuppySex) => {
    handleChange("sex", value);
  };

  const requestMediaPermission = async () => {
    const { granted, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted && !canAskAgain) {
      setErrors((prev) => ({
        ...prev,
        general: "Please enable photo permissions in your settings to add a picture."
      }));
    }
    return granted;
  };

  const handlePickImage = useCallback(async () => {
    try {
      const hasPermission = await requestMediaPermission();
      if (!hasPermission) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        handleChange("photoUri", asset.uri);
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: "We couldn't open your photos. Try again in a moment."
      }));
    }
  }, [handleChange]);

  const validateProfile = () => {
    const nextErrors: FormErrors = {};
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      nextErrors.name = "Tell us your puppy's name.";
    } else if (trimmedName.length < 2) {
      nextErrors.name = "Use at least two characters.";
    }

    if (!form.dobInput) {
      nextErrors.dobInput = "Enter a birthdate using YYYY-MM-DD.";
    }

    let isoDob: string | null = null;
    if (form.dobInput) {
      const parsed = new Date(form.dobInput);
      const now = new Date();
      if (Number.isNaN(parsed.getTime())) {
        nextErrors.dobInput = "That doesn't look like a real date. Try YYYY-MM-DD.";
      } else if (parsed > now) {
        nextErrors.dobInput = "Birthdate can't be in the future.";
      } else if (parsed < new Date(now.getFullYear() - 20, now.getMonth(), now.getDate())) {
        nextErrors.dobInput = "Double-check the year — that seems too far in the past.";
      } else {
        isoDob = parsed.toISOString();
      }
    }

    if (!form.sex) {
      nextErrors.sex = "Pick the option that fits best.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !isoDob) {
      return null;
    }

    return {
      name: trimmedName,
      dob: isoDob,
      sex: form.sex as PuppySex,
      photoUri: form.photoUri
    };
  };

  const handleContinue = () => {
    if (step === 0) {
      setStep(1);
      return;
    }

    if (step === 1) {
      const profile = validateProfile();
      if (!profile) {
        return;
      }
      setNormalizedDob(profile.dob);
      setStep(2);
    }
  };

  const handleEdit = () => {
    setStep(1);
  };

  const handleComplete = async () => {
    const profile = validateProfile();
    if (!profile) {
      setErrors((prev) => ({
        ...prev,
        general: "Please make sure the details look right before finishing."
      }));
      setStep(1);
      return;
    }

    try {
      setIsSaving(true);
      setNormalizedDob(profile.dob);
      setPuppy(profile);
      navigation.replace("RootTabs");
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDob = useMemo(() => {
    if (!normalizedDob) {
      return "--";
    }
    return new Date(normalizedDob).toLocaleDateString();
  }, [normalizedDob]);

  const sexOptions: { label: string; value: PuppySex }[] = useMemo(
    () => [
      { label: "Female", value: "female" },
      { label: "Male", value: "male" },
      { label: "Unsure", value: "unsure" }
    ],
    []
  );

  return (
    <ScreenContainer scrollable style={{ paddingHorizontal: 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flexGrow}
      >
        <View style={styles.header}>
          <Text
            style={[
              theme.typography.textVariants.label,
              styles.progressLabel,
              { color: theme.colors.textSecondary }
            ]}
          >
            {`Step ${step + 1} of 3`}
          </Text>
          <View style={styles.progressBar}>
            {stepLabels.map((label, index) => {
              const isActive = index === step;
              const isComplete = index < step;
              return (
                <View key={label} style={styles.progressItem}>
                  <View
                    style={[
                      styles.progressCircle,
                      {
                        backgroundColor: isComplete
                          ? theme.colors.primary
                          : isActive
                          ? theme.colors.primarySoft
                          : theme.colors.surface,
                        borderColor: isActive ? theme.colors.primary : theme.colors.border
                      }
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.textVariants.label,
                        styles.progressNumber,
                        {
                          color: isComplete || isActive ? theme.colors.onPrimary : theme.colors.textSecondary
                        }
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      theme.typography.textVariants.caption,
                      styles.progressText,
                      { color: theme.colors.textSecondary }
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {step === 0 && (
          <Card padding="lg" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text
              style={[
                theme.typography.textVariants.display,
                styles.title,
                { color: theme.colors.textPrimary }
              ]}
            >
              Welcome to GRP Training!
            </Text>
            <Text
              style={[
                theme.typography.textVariants.body,
                styles.subtitle,
                { color: theme.colors.textSecondary }
              ]}
            >
              The next few steps help us tailor milestones and weekly goals to your new companion. It
              takes less than a minute.
            </Text>
            <Button label="Let's get started" onPress={handleContinue} fullWidth />
          </Card>
        )}

        {step === 1 && (
          <Card padding="lg" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text
              style={[
                theme.typography.textVariants.heading,
                styles.sectionTitle,
                { color: theme.colors.textPrimary }
              ]}
            >
              Create puppy profile
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[theme.typography.textVariants.label, { color: theme.colors.textSecondary }]}>
                Name
              </Text>
              <TextInput
                value={form.name}
                onChangeText={(text) => handleChange("name", text)}
                placeholder="e.g. Milo"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    color: theme.colors.textPrimary,
                    borderColor: errors.name ? theme.colors.warning : "transparent"
                  }
                ]}
                accessibilityLabel="Puppy name"
              />
              {errors.name && (
                <Text style={[theme.typography.textVariants.caption, styles.error]}>
                  {errors.name}
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[theme.typography.textVariants.label, { color: theme.colors.textSecondary }]}>
                Date of birth
              </Text>
              <TextInput
                value={form.dobInput}
                onChangeText={(text) => handleChange("dobInput", text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numbers-and-punctuation"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.palette.softMist,
                    color: theme.colors.textPrimary,
                    borderColor: errors.dobInput ? theme.colors.warning : "transparent"
                  }
                ]}
                accessibilityLabel="Puppy birthdate"
              />
              {errors.dobInput && (
                <Text style={[theme.typography.textVariants.caption, styles.error]}>
                  {errors.dobInput}
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[theme.typography.textVariants.label, { color: theme.colors.textSecondary }]}>
                Sex
              </Text>
              <View style={styles.sexRow}>
                {sexOptions.map((option) => {
                  const isSelected = form.sex === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleSelectSex(option.value)}
                      style={[
                        styles.sexChip,
                        {
                          backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface,
                          borderColor: isSelected ? theme.colors.accent : theme.colors.border
                        }
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        style={[
                          theme.typography.textVariants.label,
                          {
                            color: isSelected ? theme.colors.onAccent : theme.colors.textSecondary
                          }
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.sex && (
                <Text style={[theme.typography.textVariants.caption, styles.error]}>
                  {errors.sex}
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[theme.typography.textVariants.label, { color: theme.colors.textSecondary }]}>
                Photo (optional)
              </Text>
              <TouchableOpacity
                onPress={handlePickImage}
                style={[
                  styles.photoPicker,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface
                  }
                ]}
              >
                {form.photoUri ? (
                  <Image source={{ uri: form.photoUri }} style={styles.photoPreview} />
                ) : (
                  <Text
                    style={[
                      theme.typography.textVariants.caption,
                      { color: theme.colors.textMuted }
                    ]}
                  >
                    Tap to upload a smiling face
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {errors.general && (
              <Text style={[theme.typography.textVariants.caption, styles.error]}>
                {errors.general}
              </Text>
            )}

            <Button label="Review profile" onPress={handleContinue} fullWidth />
          </Card>
        )}

        {step === 2 && (
          <Card padding="lg" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text
              style={[
                theme.typography.textVariants.heading,
                styles.sectionTitle,
                { color: theme.colors.textPrimary }
              ]}
            >
              All set!
            </Text>
            <Text
              style={[
                theme.typography.textVariants.body,
                styles.subtitle,
                { color: theme.colors.textSecondary }
              ]}
            >
              Here&apos;s what we&apos;ll use to customize training milestones.
            </Text>

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={[theme.typography.textVariants.label, styles.summaryLabel]}>Name</Text>
                <Text style={[theme.typography.textVariants.body, styles.summaryValue]}>
                  {form.name.trim()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[theme.typography.textVariants.label, styles.summaryLabel]}>
                  Birthdate
                </Text>
                <Text style={[theme.typography.textVariants.body, styles.summaryValue]}>
                  {formattedDob}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[theme.typography.textVariants.label, styles.summaryLabel]}>Week</Text>
                <Text style={[theme.typography.textVariants.body, styles.summaryValue]}>
                  {currentWeek ?? "--"}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[theme.typography.textVariants.label, styles.summaryLabel]}>
                  Sex
                </Text>
                <Text style={[theme.typography.textVariants.body, styles.summaryValue]}>
                  {form.sex ? form.sex.charAt(0).toUpperCase() + form.sex.slice(1) : "--"}
                </Text>
              </View>
              {form.photoUri && (
                <View style={[styles.summaryRow, styles.summaryPhotoRow]}>
                  <Text style={[theme.typography.textVariants.label, styles.summaryLabel]}>
                    Photo
                  </Text>
                  <Image source={{ uri: form.photoUri }} style={styles.summaryPhoto} />
                </View>
              )}
            </View>

            <View style={styles.actionsRow}>
              <Button
                label="Edit info"
                variant="outline"
                onPress={handleEdit}
                style={styles.actionButton}
              />
              <Button
                label={isSaving ? "Saving..." : "Go to home"}
                onPress={handleComplete}
                disabled={isSaving}
                style={styles.actionButton}
              />
            </View>
          </Card>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flexGrow: {
    flex: 1
  },
  header: {
    marginBottom: 24
  },
  progressLabel: {
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12
  },
  progressBar: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressItem: {
    flex: 1,
    alignItems: "center"
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  progressNumber: {
    fontWeight: "600"
  },
  progressText: {
    marginTop: 8,
    textAlign: "center"
  },
  card: {
    borderRadius: 24,
    marginBottom: 32,
    gap: 20
  },
  title: {
    marginBottom: 12
  },
  subtitle: {
    marginBottom: 16
  },
  sectionTitle: {
    marginBottom: 8
  },
  fieldGroup: {
    gap: 8
  },
  input: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1
  },
  sexRow: {
    flexDirection: "row",
    gap: 12
  },
  sexChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center"
  },
  photoPicker: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 140
  },
  photoPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 12
  },
  error: {
    color: "#B85C42"
  },
  summary: {
    gap: 12
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  summaryPhotoRow: {
    alignItems: "flex-start"
  },
  summaryLabel: {
    flex: 1,
    opacity: 0.8
  },
  summaryValue: {
    flex: 1,
    textAlign: "right"
  },
  summaryPhoto: {
    width: 72,
    height: 72,
    borderRadius: 16
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12
  },
  actionButton: {
    flex: 1
  }
});
