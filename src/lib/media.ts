import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

const JOURNAL_DIR = `${FileSystem.documentDirectory ?? ""}journal`;

const ensureJournalDir = async () => {
  if (!FileSystem.documentDirectory) {
    throw new Error("FileSystem document directory is unavailable");
  }
  const dirInfo = await FileSystem.getInfoAsync(JOURNAL_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(JOURNAL_DIR, { intermediates: true });
  }
  return JOURNAL_DIR;
};

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

const deriveExtension = (uri: string) => {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (match?.[1]) {
    return match[1];
  }
  return "jpg";
};

const persistFile = async (sourceUri: string, prefix: string) => {
  const dir = await ensureJournalDir();
  const extension = deriveExtension(sourceUri);
  const destination = `${dir}/${prefix}-${Date.now().toString(36)}-${randomSuffix()}.${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
};

export const deleteJournalMedia = async (uri?: string) => {
  if (!uri || !FileSystem.documentDirectory) {
    return;
  }
  if (!uri.startsWith(FileSystem.documentDirectory)) {
    return;
  }
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Ignored — file might have been cleaned up already.
  }
};

const createThumbnailFile = async (sourceUri: string) => {
  const manipulated = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: 512 } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: false
    }
  );
  const dir = await ensureJournalDir();
  const destination = `${dir}/thumb-${Date.now().toString(36)}-${randomSuffix()}.jpg`;
  await FileSystem.moveAsync({ from: manipulated.uri, to: destination });
  return destination;
};

export const processJournalPhoto = async (sourceUri: string) => {
  const [photoUri, thumbnailUri] = await Promise.all([
    persistFile(sourceUri, "entry"),
    createThumbnailFile(sourceUri)
  ]);
  return { photoUri, thumbnailUri };
};

