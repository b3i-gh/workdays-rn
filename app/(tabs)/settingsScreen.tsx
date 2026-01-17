import { restoreBackup } from "@/utils/restoreBackup";
import React from "react";
import {
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useGlobalState } from "../../contexts/GlobalStateProvider";
import { exportBackup } from "../../utils/exportBackup";

const SettingsScreen = () => {
  const { restoreFromBackup } = useGlobalState();

  return (
    <SafeAreaView style={styles.safearea}>
      <Text style={styles.title}>Settings</Text>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button
              title="📤 Export Backup (JSON)"
              onPress={() => {
                exportBackup()
                  .then(() => console.log("Backup exported"))
                  .catch(() =>
                    Alert.alert("❌ Error", "Failed to export backup"),
                  );
              }}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="📥 Restore from Backup"
              onPress={() => {
                restoreBackup(restoreFromBackup)
                  .then(() =>
                    Alert.alert("✅ Restored", "Backup has been restored!"),
                  )
                  .catch(() =>
                    Alert.alert("❌ Error", "Failed to restore backup"),
                  );
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  safearea: {
    backgroundColor: "#fff",
    paddingTop: 50,
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  buttonWrapper: {
    marginBottom: 16, // Space between buttons
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
});
