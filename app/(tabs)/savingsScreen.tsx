import { format, parseISO } from "date-fns";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Saving, useGlobalState } from "../GlobalStateProvider";

// Enum for entry types
enum EntryType {
  LT_SAVING = "LT SAVING",
  ST_SAVING = "ST SAVING",
  NEXO = "NEXO",
  TAX_SAVING = "TAX SAVING",
}

// Extended Saving type with type field
interface ExtendedSavings extends Saving {
  type: EntryType;
}

// Form state interface
interface SavingFormState {
  description?: string;
  payDate?: string;
  amount?: string;
  type?: EntryType;
}

const CATEGORY_LABELS = {
  [EntryType.LT_SAVING]: "LT Savings",
  [EntryType.ST_SAVING]: "ST Savings",
  [EntryType.NEXO]: "Nexo",
  [EntryType.TAX_SAVING]: "Tax Savings",
};

const SavingsScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newSaving, setNewSaving] = useState<SavingFormState>({});
  const {
    savings: savings,
    setSavings: setSavings,
    yearlyStats,
  } = useGlobalState();
  const [openCategory, setOpenCategory] = useState<EntryType | null>(
    EntryType.LT_SAVING
  );

  // Group entries by type
  const categorizedSavings = Object.values(EntryType).reduce((acc, type) => {
    acc[type] = savings.filter((e) => e.type === type);
    return acc;
  }, {} as Record<EntryType, Saving[]>);

  // Calculate tax savings data
  const yearlyTaxes = yearlyStats.taxes;
  const taxSavings = categorizedSavings[EntryType.TAX_SAVING].reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );
  const taxSavingsPercentage =
    yearlyTaxes > 0 ? (taxSavings / yearlyTaxes) * 100 : 0;

  // Calculate available income for savings targets
  const totalIncome = yearlyStats.totalGross;
  // New: sum of all months except current and previous two
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-based
  // Exclude current and previous two months
  const monthsToInclude = yearlyStats.ms.filter(
    (_, idx) => idx < currentMonth - 2
  );
  const includedIncome = monthsToInclude.reduce(
    (sum, ms) => sum + (ms.totalGross || 0),
    0
  );
  const availableIncome = includedIncome - taxSavings;

  const handleAddSaving = () => {
    if (
      !newSaving.description ||
      !newSaving.payDate ||
      !newSaving.amount ||
      !newSaving.type
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Handle decimal numbers properly
    let amount: number;
    const amountStr = String(newSaving.amount);
    // Replace comma with dot for proper parsing
    const cleanAmount = amountStr.replace(",", ".");
    amount = parseFloat(cleanAmount);

    if (isNaN(amount)) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const newSavingObj: ExtendedSavings = {
      id: Date.now().toString(),
      description: newSaving.description!,
      payDate: newSaving.payDate!,
      amount: amount,
      type: newSaving.type!,
    };

    setSavings((prevSavings) => {
      const updatedSavings = [...prevSavings, newSavingObj];
      return updatedSavings;
    });

    setNewSaving({});
    setIsModalVisible(false);
  };

  const handleDeleteSaving = (id: string) => {
    Alert.alert(
      "Delete Saving",
      "Are you sure you want to delete this saving?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSavings((prev) => prev.filter((exp) => exp.id !== id));
          },
        },
      ]
    );
  };

  const handleTypeChange = (type: EntryType) => {
    setNewSaving((prev) => {
      const updated = { ...prev, type };

      const today = new Date();
      const formattedDate = format(today, "yyyy-MM-dd");
      updated.payDate = formattedDate;

      return updated;
    });
  };

  // Set default values when modal opens
  const openModal = () => {
    setNewSaving({ type: EntryType.LT_SAVING });
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safearea}>
      <Text style={styles.title}>Savings</Text>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Tax Savings Section */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Tax Savings Progress</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: "100%",
                  backgroundColor: "#e0e0e0", // Light gray for total taxes
                },
              ]}
            />
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(taxSavingsPercentage, 100)}%`,
                  backgroundColor: "#4caf50", // Green for tax savings
                  position: "absolute",
                  left: 0,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>
              Yearly Taxes: €{yearlyTaxes.toFixed(2)}
            </Text>
            <Text style={styles.progressLabel}>
              Tax Savings: €{taxSavings.toFixed(2)} (
              {taxSavingsPercentage.toFixed(1)}%)
            </Text>
          </View>
        </View>

        {/* Savings Distribution */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Savings & Investment Targets</Text>
          <Text style={styles.totalIncomeText}>
            Available Income (after Tax Savings): €
            {availableIncome.toFixed(2)}
          </Text>
          {/* LT Savings Progress */}
          <View style={styles.targetSection}>
            <Text style={styles.targetLabel}>LT Savings (30% target)</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: "100%",
                    backgroundColor: "#e0e0e0",
                  },
                ]}
              />
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (((categorizedSavings[EntryType.LT_SAVING].reduce(
                        (sum, e) => sum + (e.amount || 0),
                        0
                      ) /
                      availableIncome) *
                        100) /
                        30) *
                        100,
                      100
                    )}%`,
                    backgroundColor: "#4ECDC4",
                    position: "absolute",
                    left: 0,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                Target: €{(availableIncome * 0.3).toFixed(2)}
              </Text>
              <Text style={styles.progressLabel}>
                Current: €
                {categorizedSavings[EntryType.LT_SAVING]
                  .reduce((sum, e) => sum + (e.amount || 0), 0)
                  .toFixed(2)}{" "}
                (
                {(
                  (categorizedSavings[EntryType.LT_SAVING].reduce(
                    (sum, e) => sum + (e.amount || 0),
                    0
                  ) /
                    (availableIncome * 0.3)) *
                  100
                ).toFixed(1)}
                %)
              </Text>
            </View>
          </View>

          {/* ST Savings Progress */}
          <View style={styles.targetSection}>
            <Text style={styles.targetLabel}>ST Savings (20% target)</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: "100%",
                    backgroundColor: "#e0e0e0",
                  },
                ]}
              />
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (((categorizedSavings[EntryType.ST_SAVING].reduce(
                        (sum, e) => sum + (e.amount || 0),
                        0
                      ) /
                      availableIncome) *
                        100) /
                        20) *
                        100,
                      100
                    )}%`,
                    backgroundColor: "#45B7D1",
                    position: "absolute",
                    left: 0,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                Target: €{(availableIncome * 0.2).toFixed(2)}
              </Text>
              <Text style={styles.progressLabel}>
                Current: €
                {categorizedSavings[EntryType.ST_SAVING]
                  .reduce((sum, e) => sum + (e.amount || 0), 0)
                  .toFixed(2)}{" "}
                (
                {(
                  (categorizedSavings[EntryType.ST_SAVING].reduce(
                    (sum, e) => sum + (e.amount || 0),
                    0
                  ) /
                    (availableIncome * 0.2)) *
                  100
                ).toFixed(1)}
                %)
              </Text>
            </View>
          </View>

          {/* Nexo Progress */}
          <View style={styles.targetSection}>
            <Text style={styles.targetLabel}>Nexo (10% target)</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: "100%",
                    backgroundColor: "#e0e0e0",
                  },
                ]}
              />
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (((categorizedSavings[EntryType.NEXO].reduce(
                        (sum, e) => sum + (e.amount || 0),
                        0
                      ) /
                      availableIncome) *
                        100) /
                        10) *
                        100,
                      100
                    )}%`,
                    backgroundColor: "#96CEB4",
                    position: "absolute",
                    left: 0,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                Target: €{(availableIncome * 0.1).toFixed(2)}
              </Text>
              <Text style={styles.progressLabel}>
                Current: €
                {categorizedSavings[EntryType.NEXO]
                  .reduce((sum, e) => sum + (e.amount || 0), 0)
                  .toFixed(2)}{" "}
                (
                {(
                  (categorizedSavings[EntryType.NEXO].reduce(
                    (sum, e) => sum + (e.amount || 0),
                    0
                  ) /
                    (availableIncome * 0.1)) *
                  100
                ).toFixed(1)}
                %)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.savingsList}>
          <Text style={styles.sectionTitle}>Entries</Text>

          {/* Special taxes savings item */}
          <View key="taxes" style={[styles.savingItem, styles.taxesItem]}>
            <View style={styles.savingInfo}>
              <Text style={styles.savingDescription}>
                Yearly Taxes (INPS + Imposta Sostitutiva)
              </Text>
              <Text style={styles.savingDate}>
                Due:{" "}
                {format(
                  new Date(new Date().getFullYear() + 1, 0, 1),
                  "dd/MM/yyyy"
                )}
              </Text>
              <Text style={styles.savingAmount}>
                €{yearlyStats.taxes.toFixed(2)}
              </Text>
            </View>
            <View style={styles.lockIcon}>
              <Text style={styles.lockIconText}>🔒</Text>
            </View>
          </View>

          {Object.values(EntryType).map((type) => {
            const total = categorizedSavings[type].reduce(
              (sum, e) => sum + (e.amount || 0),
              0
            );
            return (
              <View key={type} style={styles.accordionSection}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() =>
                    setOpenCategory(openCategory === type ? null : type)
                  }
                >
                  <Text style={styles.accordionHeaderText}>
                    {CATEGORY_LABELS[type]}
                  </Text>
                  <Text style={styles.accordionHeaderIcon}>
                    {openCategory === type ? "▼" : "▶"}
                  </Text>
                </TouchableOpacity>
                {openCategory === type && (
                  <View>
                    {categorizedSavings[type].length === 0 && (
                      <Text
                        style={{
                          textAlign: "center",
                          color: "#aaa",
                          marginVertical: 8,
                        }}
                      >
                        No entries
                      </Text>
                    )}
                    {categorizedSavings[type].map((saving, index) => (
                      <View
                        key={saving.id}
                        style={[
                          styles.savingItem,
                          {
                            backgroundColor:
                              index % 2 === 0 ? "#f5f5f5" : "#e8e8e8",
                          },
                        ]}
                      >
                        <View style={styles.savingInfo}>
                          <Text style={styles.savingDescription}>
                            {saving.description}
                          </Text>
                          <Text style={styles.savingDate}>
                            Due:{" "}
                            {format(parseISO(saving.payDate), "dd/MM/yyyy")}
                          </Text>
                          <Text
                            style={[
                              styles.savingAmount,
                              {
                                color:
                                  parseISO(saving.payDate) >= new Date()
                                    ? "#2196f3"
                                    : "#aaa",
                              },
                            ]}
                          >
                            €{saving.amount.toFixed(2)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteSaving(saving.id)}
                        >
                          <Text style={styles.deleteButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed Add Button */}
      <TouchableOpacity
        style={[styles.addButton, styles.fixedButton]}
        onPress={openModal}
      >
        <Text style={styles.addButtonText}>Add Saving</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Saving</Text>

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newSaving.type}
                onValueChange={(value) => handleTypeChange(value as EntryType)}
                style={styles.picker}
              >
                <Picker.Item label="LT SAVING" value={EntryType.LT_SAVING} />
                <Picker.Item label="ST SAVING" value={EntryType.ST_SAVING} />
                <Picker.Item label="NEXO" value={EntryType.NEXO} />
                <Picker.Item label="TAX SAVING" value={EntryType.TAX_SAVING} />
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter saving description"
              value={newSaving.description}
              onChangeText={(text) =>
                setNewSaving((prev) => ({ ...prev, description: text }))
              }
            />

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={newSaving.payDate}
              onChangeText={(text) =>
                setNewSaving((prev) => ({ ...prev, payDate: text }))
              }
            />

            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount (e.g., 34.56)"
              keyboardType="numeric"
              value={newSaving.amount?.toString()}
              onChangeText={(text) =>
                setNewSaving((prev) => ({
                  ...prev,
                  amount: text,
                }))
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddSaving}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safearea: {
    backgroundColor: "#fff",
    paddingTop: 50,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  container: {
    padding: 16,
    paddingBottom: 80, // Add extra padding for fixed button
    backgroundColor: "#fff",
  },
  progressContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  progressBar: {
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressLabels: {
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 14,
    color: "#666",
  },
  warningText: {
    color: "#ff4444",
    marginTop: 10,
    fontWeight: "bold",
  },
  savingsList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  savingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  savingInfo: {
    flex: 1,
  },
  savingDescription: {
    fontSize: 16,
    fontWeight: "bold",
  },
  savingDate: {
    fontSize: 14,
    color: "#666",
  },
  savingAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 24,
    color: "#ff4444",
  },
  addButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e0e0e0",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  taxesItem: {
    backgroundColor: "#e8f5e9",
  },
  lockIcon: {
    padding: 8,
  },
  lockIconText: {
    fontSize: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    fontWeight: "bold",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#000000",
  },
  accordionSection: {
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#909090",
    padding: 12,
    marginBottom: 5,
  },
  accordionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  accordionHeaderIcon: {
    fontSize: 16,
  },
  accordionTotal: {
    fontSize: 12,
    // color: "#2196f3",
    fontWeight: "bold",
    marginLeft: 8,
  },
  noDataText: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 20,
    fontSize: 16,
  },
  totalIncomeText: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  pieChartContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  pieChart: {
    marginBottom: 10,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 5,
  },
  legendColor: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 14,
    color: "#333",
  },
  fixedButton: {
    position: "absolute",
    bottom: 0,
    left: 10,
    right: 10,
    borderWidth: 4,
    borderColor: "white",
  },
  targetSection: {
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  targetLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default SavingsScreen;
