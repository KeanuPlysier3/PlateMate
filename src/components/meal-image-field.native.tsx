import { useState } from "react";
import { Image, Pressable, StyleSheet, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";

type MealImageFieldProps = {
  onImagePathChange: (path: string | null) => void;
};

export default function MealImageField({
  onImagePathChange,
}: MealImageFieldProps) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const pickedUri = result.assets[0].uri;

    const mealsDir = new Directory(Paths.document, "meals");
    mealsDir.create({ idempotent: true });

    const fileName = `${Date.now()}.jpg`;
    const destination = new File(mealsDir, fileName);
    const sourceFile = new File(pickedUri);
    sourceFile.copy(destination);

    // best-effort cleanup of the previous image; ignore if it's already gone
    if (previewUri) {
      try {
        new File(previewUri).delete();
      } catch {}
    }

    setPreviewUri(destination.uri);
    onImagePathChange(destination.uri);
  };

  return (
    <>
      {previewUri && (
        <Image source={{ uri: previewUri }} style={styles.imagePreview} />
      )}
      <Pressable style={styles.imagePickerButton} onPress={handlePickImage}>
        <Text style={styles.imagePickerButtonText}>
          {previewUri ? "Choose a different photo" : "Select photo"}
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  imagePreview: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  imagePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
