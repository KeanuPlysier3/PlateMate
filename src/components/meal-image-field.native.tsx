import { useState } from "react";
import { Image, Pressable, StyleSheet, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";

type MealImageFieldProps = {
  onImagePathChange: (path: string | null) => void;
};

export default function MealImageField({ onImagePathChange }: MealImageFieldProps) {
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

    // The picker's own URI can live in a temporary/cache location that isn't
    // guaranteed to stick around, so copy it into the app's own persistent
    // storage (Paths.document) right away — this is the file the Meal.image
    // path will actually point to.
    const mealsDir = new Directory(Paths.document, "meals");//paths.document is the app's persistent storage directory, "meals" is a subdirectory for meal images
    mealsDir.create({ idempotent: true });//idempotent: true means that if the directory already exists, it won't throw an error

    const fileName = `${Date.now()}.jpg`;//unique filename
    
    const destination = new File(mealsDir, fileName);
    // Create a File object representing the new file location
    // inside the meals directory, using the unique filename.

    const sourceFile = new File(pickedUri);
    // Create a File object representing the image that was
    // selected by the image picker, using its URI as its location.
    sourceFile.copy(destination); //copy the picked image to the new destination file in the meals directory

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
          {previewUri ? "Andere afbeelding kiezen" : "Selecteer afbeelding"}
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
