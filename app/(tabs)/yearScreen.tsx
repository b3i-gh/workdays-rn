import { useFocusEffect } from "@react-navigation/native";
import { format, parseISO, endOfMonth, differenceInDays } from "date-fns";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { calcTaxesFromGross } from "../../utils/finance";
import { loadData } from "../../utils/storage";

type MonthSummary = {
  month: string;
  workedDays: number;
  gross: number;
  net: number;
  taxes: number;
};

// Utility function to format currency with thousand separators
const formatCurrency = (value: number): string => {
  return `€${value.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Utility function to check if month is more than 60 days old
const isInvoicePaid = (monthStr: string): boolean => {
  const lastDayOfMonth = endOfMonth(parseISO(monthStr + "-01"));
  const today = new Date();
  const daysDifference = differenceInDays(today, lastDayOfMonth);
  return daysDifference > 60;
};

const YearScreen = () => {
  const [summary, setSummary] = useState<MonthSummary[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        const workDays = (await loadData("workDays")) ?? {};
        const rate = (await loadData("dailyRate")) ?? 220;

        const months: { [month: string]: number } = {};

        // Count worked days per month
        Object.entries(workDays).forEach(([dateStr, worked]) => {
          if (!worked) return;
          const monthKey = format(parseISO(dateStr), "yyyy-MM");
          months[monthKey] = (months[monthKey] || 0) + 1;
        });

        const summaryData: MonthSummary[] = Object.entries(months).map(
          ([month, count]) => {
            const gross = count * rate;
            const { impostaSostitutiva, contributiInps, net } =
              calcTaxesFromGross(gross);

            return {
              month,
              workedDays: count,
              gross,
              net,
              taxes: impostaSostitutiva + contributiInps,
            };
          }
        );

        // Sort chronologically
        summaryData.sort((a, b) => a.month.localeCompare(b.month));

        setSummary(summaryData);
      };
      fetchData();
    }, [])
  );

  const total = summary.reduce(
    (acc, curr) => ({
      month: "TOTAL",
      workedDays: acc.workedDays + curr.workedDays,
      gross: acc.gross + curr.gross,
      net: acc.net + curr.net,
      taxes: acc.taxes + curr.taxes,
    }),
    { month: "TOTAL", workedDays: 0, gross: 0, net: 0, taxes: 0 }
  );

  return (
    <SafeAreaView style={styles.safearea}>
      <Text style={styles.title}>Year Recap</Text>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.rowHeader}>
          <Text style={styles.cell}>Month</Text>
          <Text style={styles.cell}>Days</Text>
          <Text style={styles.cell}>Gross</Text>
          <Text style={styles.cell}>Net</Text>
          <Text style={styles.cell}>Taxes</Text>
        </View>
        {summary.map((item) => (
          <View
            key={item.month}
            style={[
              styles.row,
              isInvoicePaid(item.month) ? styles.oldMonthRow : null,
            ]}
          >
            <Text style={styles.cell}>
              {format(parseISO(item.month + "-01"), "MMM yyyy")}
            </Text>
            <Text style={styles.cell}>{item.workedDays}</Text>
            <Text style={styles.cell}>{formatCurrency(item.gross)}</Text>
            <Text style={styles.cell}>{formatCurrency(item.net)}</Text>
            <Text style={styles.cell}>{formatCurrency(item.taxes)}</Text>
          </View>
        ))}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.cell}>{total.month}</Text>
          <Text style={styles.cell}>{total.workedDays}</Text>
          <Text style={styles.cell}>{formatCurrency(total.gross)}</Text>
          <Text style={styles.cell}>{formatCurrency(total.net)}</Text>
          <Text style={styles.cell}>{formatCurrency(total.taxes)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default YearScreen;

const styles = StyleSheet.create({
  safearea: {
    backgroundColor: "#fff",
    paddingTop: 50,
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  rowHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  totalRow: {
    marginTop: 8,
    borderTopWidth: 1,
    paddingTop: 6,
  },
  cell: {
    flex: 1,
    fontSize: 14,
    textAlign: "center",
  },
  oldMonthRow: {
    backgroundColor: "#e8f5e8", // Light green background for old months
  },
});
