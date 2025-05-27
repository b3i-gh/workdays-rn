import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useGlobalState, WorkDay } from "../GlobalStateProvider";

export default function HomeScreen() {
  const { workDays, setWorkDays, yearlyStats } = useGlobalState();
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );

  const startingMonth = parseInt(selectedMonth.split("-")[1], 10) - 1;
  const [monthlyStats, setMonthlyStats] = useState(
    yearlyStats.ms[startingMonth]
  );

  useEffect(() => {
    const selectedMonthIndex = parseInt(selectedMonth.split("-")[1], 10) - 1;
    const updatedMonthlyStats = yearlyStats.ms[selectedMonthIndex];
    setMonthlyStats(updatedMonthlyStats);
  }, [selectedMonth, yearlyStats]);

  const handleDayPress = (day: DateData) => {
    const dateStr = day.dateString;
    setWorkDays((prev: WorkDay) => {
      const updated = { ...prev };
      if (updated[dateStr]) {
        delete updated[dateStr];
      } else {
        updated[dateStr] = true;
      }
      return updated;
    });
  };

  const markedDates = Object.keys(workDays).reduce((acc, date) => {
    acc[date] = { selected: true, marked: true, selectedColor: "#4caf50" };
    return acc;
  }, {} as any);

  return (
    <SafeAreaView style={styles.safearea}>
      <Text style={styles.title}>Month Recap</Text>
      <ScrollView contentContainerStyle={styles.container}>
        <Calendar
          firstDay={1}
          onDayPress={handleDayPress}
          markedDates={markedDates}
          enableSwipeMonths
          current={selectedMonth}
          onMonthChange={(currentMonth: { year: any; month: any }) => {
            const newMonth = `${currentMonth.year}-${String(
              currentMonth.month
            ).padStart(2, "0")}`;
            setSelectedMonth(newMonth);
          }}
        />
        <View style={styles.stats}>
          <Text style={styles.statText}>
            ✅ Days Worked: {monthlyStats.daysWorked}
          </Text>
          <Text style={styles.statText}>
            💰 Gross: €{monthlyStats.totalGross.toFixed(2)}
          </Text>
          <Text style={styles.statText}>
            📉 Reddito Imponibile: €{monthlyStats.redditoImponibile.toFixed(2)}
          </Text>
          <Text style={styles.statText}>
            🧾 Imposta Sostitutiva (5%): €
            {monthlyStats.impostaSostitutiva.toFixed(2)}
          </Text>
          <Text style={styles.statText}>
            🧾 Contributi INPS (26.07%): €
            {monthlyStats.contributiInps.toFixed(2)}
          </Text>
          <Text style={styles.statText}>
            💸 Totale Tasse: €
            {(
              monthlyStats.impostaSostitutiva + monthlyStats.contributiInps
            ).toFixed(2)}
          </Text>
          <Text style={styles.statText}>
            💵 Net: €{monthlyStats.net.toFixed(2)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safearea: {
    backgroundColor: "#fff",
    paddingTop: 50,
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  summary: {
    marginVertical: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f1f1f1",
  },
  stats: {
    marginTop: 30,
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
  },
  statText: {
    fontSize: 16,
    marginBottom: 8,
  },
});
