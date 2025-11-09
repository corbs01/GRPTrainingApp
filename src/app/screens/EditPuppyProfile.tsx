import React from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

import { ScreenContainer } from "@components/ScreenContainer";
import { Button } from "@components/Button";
import { useTheme } from "@theme/index";
import { usePuppyStore, PuppySex } from "@state/puppyStore";
import { getWeekNumberFromDob } from "@lib/weekProgress";
import { RootStackParamList } from "@app/navigation/types";

const MAX_PUPPY_AGE_YEARS = 20;

const sexOptions: { label: string; value: PuppySex }[] = [
  { label: "Female", value: "female" },
  { label: "Male", value: "male" },
  { label: "Unsure", value: "unsure" }
];

const formatDobDisplay = (iso?: string) => {
  if (!iso) {
    return "Tap to pick a date";
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "Tap to pick a date";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
};

const validateDob = (value?: Date): { iso: string } | { error: string } => {
  if (!value || Number.isNaN(value.getTime())) {
    return { error: "Choose a real date to keep your milestones accurate." };
  }

  const now = new Date();
  const min = new Date(now.getFullYear() - MAX_PUPPY_AGE_YEARS, now.getMonth(), now.getDate());

  if (value > now) {
    return { error: "Birthdate can't be in the future." };
  }

  if (value < min) {
    return { error: "That feels a bit too far back. Try a newer date." };
  }

  return { iso: value.toISOString() };
};

type EditPuppyProfileNavigation = NativeStackNavigationProp<
  RootStackParamList,
  "EditPuppyProfile"
>;

export const EditPuppyProfile: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<EditPuppyProfileNavigation>();
  const puppy = usePuppyStore((state) => state.puppy);
  const setPuppy = usePuppyStore((state) => state.setPuppy);

  const [name, setName] = React.useState(puppy?.name ?? "");
  const [dobIso, setDobIso] = React.useState(puppy?.dob ?? new Date().toISOString());
  const [sex, setSex] = React.useState<PuppySex>(puppy?.sex ?? "unsure");
  const [photoUri, setPhotoUri] = React.useState<string | undefined>(puppy?.photoUri);
  const [error, setError] = React.useState<string>();
  const [status, setStatus] = React.useState<string>();
  const [dobPickerVisible, setDobPickerVisible] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [pendingDob, setPendingDob] = React.useState<Date>(() => new Date(dobIso));

  React.useEffect(() => {
    if (puppy?.dob) {
      setDobIso(puppy.dob);
    }
    if (puppy?.photoUri) {
      setPhotoUri(puppy.photoUri);
    }
    if (puppy?.name) {
      setName(puppy.name);
    }
    if (puppy?.sex) {
      setSex(puppy.sex);
    }
  }, [puppy?.dob, puppy?.photoUri, puppy?.name, puppy?.sex]);

  const currentDobDate = React.useMemo(() => {
    const parsed = new Date(dobIso);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [dobIso]);

  React.useEffect(() => {
    setPendingDob(currentDobDate);
  }, [currentDobDate]);

  const dobDisplay = React.useMemo(() => formatDobDisplay(dobIso), [dobIso]);
  const previewWeek = React.useMemo(() => getWeekNumberFromDob(dobIso), [dobIso]);

  const openDobPicker = React.useCallback(() => {
    setPendingDob(currentDobDate);
    setDobPickerVisible(true);
  }, [currentDobDate]);

  const closeDobPicker = React.useCallback(() => {
    setDobPickerVisible(false);
  }, []);

  const handleDobPickerChange = React.useCallback(
    (_event: DateTimePickerEvent, nextDate?: Date) => {
      if (nextDate) {
        setPendingDob(nextDate);
      }
    },
    []
  );

  const confirmDobPicker = React.useCallback(() => {
    const normalized = validateDob(pendingDob);
    if ("error" in normalized) {
      setError(normalized.error);
      return;
    }

    setDobIso(normalized.iso);
    setError(undefined);
    setDobPickerVisible(false);
  }, [pendingDob]);

  const requestPermission = async (
    type: "camera" | "media"
  ): Promise<ImagePicker.PermissionStatus> => {
    const response =
      type === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!response.granted) {
      Alert.alert(
        "Permission needed",
        type === "camera"
          ? "Enable camera access in your settings to take a new glam shot."
          : "Allow photo library access so we can grab a cute picture."
      );
    }

    return response.status;
  };

  const pickImageFromLibrary = React.useCallback(async () => {
    const status = await requestPermission("media");
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const takePhotoWithCamera = React.useCallback(async () => {
    const status = await requestPermission("camera");
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const handleChangePhoto = React.useCallback(() => {
    Alert.alert("Update photo", "Pick how you want to add a new puppy portrait.", [
      {
        text: "Take photo",
        onPress: takePhotoWithCamera
      },
      {
        text: "Choose from library",
        onPress: pickImageFromLibrary
      },
      { text: "Cancel", style: "cancel" }
    ]);
  }, [pickImageFromLibrary, takePhotoWithCamera]);

  const saveProfile = React.useCallback(() => {
    if (!puppy) {
      Alert.alert("No profile yet", "Create a profile on the onboarding flow first.");
      return;
    }

    const normalized = validateDob(new Date(dobIso));
    if ("error" in normalized) {
      setError(normalized.error);
      return;
    }

    setIsSaving(true);
    const trimmedName = name.trim();
    const nextProfile = {
      ...puppy,
      name: trimmedName || puppy.name,
      dob: normalized.iso,
      sex,
      photoUri
    };

    setPuppy(nextProfile);
    setStatus("Profile updated! We refreshed your training pace.");
    setIsSaving(false);
    navigation.goBack();
  }, [dobIso, name, navigation, photoUri, puppy, setPuppy, sex]);

  const handleSave = React.useCallback(() => {
    setStatus(undefined);
    if (!puppy) {
      Alert.alert("No profile yet", "Create a profile on the onboarding flow first.");
      return;
    }

    if (dobIso !== puppy.dob) {
      const week = getWeekNumberFromDob(dobIso);
      Alert.alert(
        "Recalculate training week?",
        week
          ? `We'll refresh everything to Week ${week} using the new birthday. Keep going?`
          : "We'll refresh your training timeline using the new birthday. Keep going?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Update week", onPress: saveProfile }
        ]
      );
      return;
    }

    saveProfile();
  }, [dobIso, puppy, saveProfile]);

  if (!puppy) {
    return (
      <ScreenContainer style={{ justifyContent: "center", alignItems: "center" }}>
        <Text
          style={[
            styles.emptyHeading,
            { color: theme.colors.textPrimary, marginBottom: theme.spacing(2) }
          ]}
        >
          Let&apos;s start with your pup!
        </Text>
        <Text
          style={[
            styles.emptyBody,
            { color: theme.colors.textSecondary, marginBottom: theme.spacing(3) }
          ]}
        >
          Head back to onboarding to create a profile before editing here.
        </Text>
        <Button label="Go to onboarding" onPress={() => navigation.navigate("Onboarding")} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
          How&apos;s your golden star shining today?
        </Text>
        <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
          Give us the latest scoop so we can keep milestones and practice cards sparkling.
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }
        ]}
      >
        <Pressable
          style={[
            styles.avatarFrame,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.primarySoft
            }
          ]}
          accessibilityRole="button"
          accessibilityLabel="Update puppy photo"
          onPress={handleChangePhoto}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <FontAwesome5 name="camera" size={32} color={theme.colors.textSecondary} />
          )}
        </Pressable>
        <Text style={[styles.photoHint, { color: theme.colors.textSecondary }]}>
          Tap the frame to snap a new hero shot or pick from your camera roll.
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setStatus(undefined);
          }}
          placeholder="e.g. Sunny"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.surface
            }
          ]}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Birthdate</Text>
        <Pressable
          onPress={openDobPicker}
          style={[
            styles.dateField,
            {
              borderColor: error ? theme.colors.warning : theme.colors.border,
              backgroundColor: theme.colors.surface
            }
          ]}
          accessibilityRole="button"
          accessibilityLabel="Select birthdate"
        >
          <Text
            style={[
              styles.dateValue,
              { color: error ? theme.colors.warning : theme.colors.textPrimary }
            ]}
          >
            {dobDisplay}
          </Text>
          <FontAwesome5
            name="calendar-alt"
            size={18}
            color={error ? theme.colors.warning : theme.colors.textSecondary}
          />
        </Pressable>
        {error && <Text style={[styles.errorText, { color: theme.colors.warning }]}>{error}</Text>}
        <Text style={[styles.weekPreview, { color: theme.colors.textSecondary }]}>
          {previewWeek ? `Currently tracking Week ${previewWeek}` : "We’ll recalculate your week"}
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Sex</Text>
        <View style={styles.sexRow}>
          {sexOptions.map((option) => {
            const isActive = option.value === sex;
            return (
              <Pressable
                key={option.value}
                onPress={() => setSex(option.value)}
                style={[
                  styles.sexChip,
                  {
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isActive ? theme.colors.primarySoft : theme.colors.surface
                  }
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.sexChipLabel,
                    { color: isActive ? theme.colors.onPrimary : theme.colors.textSecondary }
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {status && <Text style={[styles.statusText, { color: theme.colors.success }]}>{status}</Text>}

      <Button
        label={isSaving ? "Saving..." : "Save profile"}
        onPress={handleSave}
        style={{ marginTop: 24 }}
        disabled={isSaving}
        fullWidth
      />

      <Modal visible={dobPickerVisible} transparent animationType="fade" onRequestClose={closeDobPicker}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={closeDobPicker} />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Choose birthdate
            </Text>
            <DateTimePicker
              value={pendingDob}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              onChange={handleDobPickerChange}
              maximumDate={new Date()}
              minimumDate={new Date(
                new Date().getFullYear() - MAX_PUPPY_AGE_YEARS,
                new Date().getMonth(),
                new Date().getDate()
              )}
              style={styles.picker}
            />
            <View style={styles.modalActions}>
              <Button label="Cancel" variant="outline" onPress={closeDobPicker} style={styles.modalButton} />
              <Button label="Use this date" onPress={confirmDobPicker} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 16
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8
  },
  helper: {
    fontSize: 16,
    lineHeight: 22
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    alignItems: "center",
    marginBottom: 24
  },
  avatarFrame: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 12,
    overflow: "hidden"
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 70
  },
  photoHint: {
    textAlign: "center",
    fontSize: 14
  },
  formGroup: {
    marginBottom: 18
  },
  label: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16
  },
  dateField: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "600"
  },
  weekPreview: {
    marginTop: 6,
    fontSize: 13
  },
  errorText: {
    marginTop: 6,
    fontSize: 13
  },
  sexRow: {
    flexDirection: "row",
    gap: 12
  },
  sexChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center"
  },
  sexChipLabel: {
    fontWeight: "600",
    fontSize: 15
  },
  statusText: {
    marginTop: 8,
    fontWeight: "600"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center"
  },
  picker: {
    alignSelf: "stretch"
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16
  },
  modalButton: {
    flex: 1
  },
  emptyHeading: {
    fontSize: 22,
    fontWeight: "700"
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  }
});
