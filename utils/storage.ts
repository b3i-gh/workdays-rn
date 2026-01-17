import AsyncStorage from "@react-native-async-storage/async-storage";

// storage.ts
export const STORAGE_KEYS = {
  workDays: "workDays",
  savings: "expenses",
  invoicePaymentDates: "invoicePaymentDates",
};

export const saveData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error("[Storage] Failed to save data for key:", key, "Error:", e);
    throw e; // Re-throw the error to handle it in the component
  }
};

export const loadData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    const parsedValue = jsonValue != null ? JSON.parse(jsonValue) : null;
    return parsedValue;
  } catch (e) {
    console.error("[Storage] Failed to load data for key:", key, "Error:", e);
    throw e; // Re-throw the error to handle it in the component
  }
};

export const deleteData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error("[Storage] Failed to delete data for key:", key, "Error:", e);
    throw e; // Re-throw the error to handle it in the component
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    throw e; // Re-throw the error to handle it in the component
  }
};
