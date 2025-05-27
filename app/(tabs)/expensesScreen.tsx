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
import { Expense, useGlobalState } from "../GlobalStateProvider";

const ExpensesScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({});
  const { expenses, setExpenses, yearlyStats } = useGlobalState();

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.payDate || !newExpense.amount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Ensure amount is a number
    const amount =
      typeof newExpense.amount === "string"
        ? parseFloat(newExpense.amount)
        : newExpense.amount;

    const newExpenseObj: Expense = {
      id: Date.now().toString(),
      description: newExpense.description!,
      payDate: newExpense.payDate!,
      amount: amount,
    };

    setExpenses((prevExpenses) => {
      const updatedExpenses = [...prevExpenses, newExpenseObj];
      return updatedExpenses;
    });

    setNewExpense({});
    setIsModalVisible(false);
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setExpenses((prev) => prev.filter((exp) => exp.id !== id));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safearea}>
      <Text style={styles.title}>Expenses Coverage</Text>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Yearly Coverage</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: "100%",
                  backgroundColor: "#4caf50", // Green for yearly gross
                },
              ]}
            />
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.abs(
                    Math.min(
                      ((yearlyStats.futureExpensesAmount + yearlyStats.taxes) /
                        (yearlyStats.totalGross -
                          yearlyStats.pastExpensesAmount)) *
                        100,
                      100
                    )
                  )}%`,

                  backgroundColor:
                    yearlyStats.totalGross - yearlyStats.pastExpensesAmount <
                    yearlyStats.futureExpensesAmount + yearlyStats.taxes
                      ? "#ff4444"
                      : "#e2aa1b",
                  position: "absolute",
                  left: 0,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>
              Expected Expenses: €
              {(yearlyStats.futureExpensesAmount + yearlyStats.taxes).toFixed(
                2
              )}
            </Text>
            <Text style={styles.progressLabel}>
              Yearly Gross to date: €
              {(
                yearlyStats.totalGross - yearlyStats.pastExpensesAmount
              ).toFixed(2)}
            </Text>
          </View>
          {yearlyStats.totalGross - yearlyStats.pastExpensesAmount <
            yearlyStats.futureExpensesAmount + yearlyStats.taxes && (
            <Text style={styles.warningText}>
              ⚠️ Warning: Expected expenses exceed net income!
            </Text>
          )}
        </View>

        <View style={styles.expensesList}>
          <Text style={styles.sectionTitle}>Expenses</Text>

          {/* Special taxes expense item */}
          <View key="taxes" style={[styles.expenseItem, styles.taxesItem]}>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseDescription}>
                Yearly Taxes (INPS + Imposta Sostitutiva)
              </Text>
              <Text style={styles.expenseDate}>
                Due:{" "}
                {format(
                  new Date(new Date().getFullYear() + 1, 0, 1),
                  "dd/MM/yyyy"
                )}
              </Text>
              <Text style={styles.expenseAmount}>
                €{yearlyStats.taxes.toFixed(2)}
              </Text>
            </View>
            <View style={styles.lockIcon}>
              <Text style={styles.lockIconText}>🔒</Text>
            </View>
          </View>

          {/* Regular expenses */}
          {expenses.map((expense, index) => (
            <View
              key={expense.id}
              style={[
                styles.expenseItem,
                { backgroundColor: index % 2 === 0 ? "#f5f5f5" : "#e8e8e8" },
              ]}
            >
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseDescription}>
                  {expense.description}
                </Text>
                <Text style={styles.expenseDate}>
                  Due: {format(parseISO(expense.payDate), "dd/MM/yyyy")}
                </Text>
                <Text
                  style={[
                    styles.expenseAmount,
                    {
                      color:
                        parseISO(expense.payDate) >= new Date()
                          ? "#2196f3"
                          : "#aaa",
                    },
                  ]}
                >
                  €{expense.amount.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteExpense(expense.id)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Expense</Text>
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={newExpense.description}
                onChangeText={(text) =>
                  setNewExpense((prev) => ({ ...prev, description: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Pay Date (YYYY-MM-DD)"
                value={newExpense.payDate}
                onChangeText={(text) =>
                  setNewExpense((prev) => ({ ...prev, payDate: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Amount"
                keyboardType="numeric"
                value={newExpense.amount?.toString()}
                onChangeText={(text) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    amount: parseFloat(text) || 0,
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
                  onPress={handleAddExpense}
                >
                  <Text style={styles.modalButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
    paddingBottom: 40,
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
    // flexDirection: "row",
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
  expensesList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "bold",
  },
  expenseDate: {
    fontSize: 14,
    color: "#666",
  },
  expenseAmount: {
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
});

export default ExpensesScreen;
