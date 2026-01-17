import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { loadData, STORAGE_KEYS } from "./storage";

export const exportBackup = async () => {
  try {
    const workDays = (await loadData(STORAGE_KEYS.workDays)) ?? {};
    const expenses = (await loadData(STORAGE_KEYS.savings)) ?? [];

    // Keep all days with their status (worked, vacation, sick)
    const filteredWorkDays = Object.entries(workDays).reduce(
      (acc, [date, status]) => {
        if (status) {
          acc[date] = status;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const backupData = {
      exportedAt: new Date().toISOString(),
      workDays: filteredWorkDays,
      expenses,
    };

    const json = JSON.stringify(backupData, null, 2);
    const fileUri =
      FileSystem.documentDirectory + `workdays-backup-${Date.now()}.json`;

    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(fileUri);
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
};
