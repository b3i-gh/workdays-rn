import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { loadData, STORAGE_KEYS } from "./storage";

export const exportBackup = async () => {
  try {
    const workDays = (await loadData(STORAGE_KEYS.workDays)) ?? {};
    const expenses = (await loadData(STORAGE_KEYS.expenses)) ?? [];

    // Filter out days with false values
    const filteredWorkDays = Object.entries(workDays).reduce(
      (acc, [date, worked]) => {
        if (worked) {
          acc[date] = true;
        }
        return acc;
      },
      {} as Record<string, boolean>
    );

    const backupData = {
      exportedAt: new Date().toISOString(),
      workDays: filteredWorkDays,
      expenses,
    };

    const json = JSON.stringify(backupData, null, 2);
    const fileUri =
      FileSystem.documentDirectory + `appiva-backup-${Date.now()}.json`;

    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(fileUri);
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
};
