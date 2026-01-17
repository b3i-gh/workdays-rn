import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import type { Saving, WorkDay } from "../contexts/GlobalStateProvider";
import { clearAllData, saveData, STORAGE_KEYS } from "./storage";

export const restoreBackup = async (
  onRestore: (workDays: WorkDay, expenses: Saving[]) => void,
) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri);
    const data = JSON.parse(content);

    // Basic structure validation
    if (!data || typeof data !== "object")
      throw new Error("Invalid backup format");

    const { workDays, expenses, invoicePaymentDates } = data;
    console.log("[DEBUG] Restored data:", data);

    // Clear all existing data first
    await clearAllData();

    // Restore the backup data and update global state
    await saveData(STORAGE_KEYS.workDays, workDays);
    await saveData(STORAGE_KEYS.savings, expenses);
    if (invoicePaymentDates) {
      await saveData(STORAGE_KEYS.invoicePaymentDates, invoicePaymentDates);
    }
    onRestore(workDays, expenses);

    return true;
  } catch (error) {
    console.error("Restore error:", error);
    throw error;
  }
};
