import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import {
  useGlobalState,
  WorkDay,
  DayStatus,
} from "../../contexts/GlobalStateProvider";

export default function HomeScreen() {
  const { workDays, setWorkDays, yearlyStats } = useGlobalState();
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM"),
  );

  const emptyMonthlyStats = {
    daysWorked: 0,
    vacationDays: 0,
    sickDays: 0,
    totalGross: 0,
    redditoImponibile: 0,
    impostaSostitutiva: 0,
    contributiInps: 0,
    net: 0,
  };

  const getMonthlyStats = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map((v) => parseInt(v, 10));
    const monthIndex = month - 1;
    return yearlyStats[year]?.ms[monthIndex] || emptyMonthlyStats;
  };

  const [monthlyStats, setMonthlyStats] = useState(
    getMonthlyStats(format(new Date(), "yyyy-MM")),
  );

  useEffect(() => {
    const updatedMonthlyStats = getMonthlyStats(selectedMonth);
    setMonthlyStats(updatedMonthlyStats);
  }, [selectedMonth, yearlyStats]);

  const handleDayPress = (day: DateData) => {
    const dateStr = day.dateString;
    setWorkDays((prev: WorkDay) => {
      const updated = { ...prev };
      const currentStatus = updated[dateStr];

      if (!currentStatus) {
        // not worked -> worked
        updated[dateStr] = "worked";
      } else if (currentStatus === "worked") {
        // worked -> vacation
        updated[dateStr] = "vacation";
      } else if (currentStatus === "vacation") {
        // vacation -> sick
        updated[dateStr] = "sick";
      } else {
        // sick -> not worked (remove)
        delete updated[dateStr];
      }
      return updated;
    });
  };

  // Calcola i giorni da evidenziare (60 giorni dopo l'ultimo giorno lavorato di ogni mese)
  const highlightDates: Record<string, boolean> = {};
  const workDaysByMonth: Record<string, string[]> = {};
  Object.keys(workDays).forEach((date) => {
    if (workDays[date] === "worked") {
      const month = date.slice(0, 7); // yyyy-MM
      if (!workDaysByMonth[month]) workDaysByMonth[month] = [];
      workDaysByMonth[month].push(date);
    }
  });
  Object.entries(workDaysByMonth).forEach(([month, dates]) => {
    // Trova l'ultimo giorno lavorato del mese
    const lastDay = dates.sort().slice(-1)[0];
    if (lastDay) {
      const highlightDate = format(
        new Date(new Date(lastDay).getTime() + 60 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd",
      );
      highlightDates[highlightDate] = true;
    }
  });

  // Unisci i giorni con diversi stati e quelli da evidenziare
  const markedDates = Object.entries(workDays).reduce((acc, [date, status]) => {
    let color = "#4caf50"; // verde per worked
    if (status === "vacation") {
      color = "#2196F3"; // blu per vacation
    } else if (status === "sick") {
      color = "#f44336"; // rosso per sick
    }

    acc[date] = { selected: true, marked: true, selectedColor: color };
    return acc;
  }, {} as any);
  Object.keys(highlightDates).forEach((date) => {
    if (!markedDates[date]) {
      markedDates[date] = {
        marked: true,
        dotColor: "#3213e6ff",
        customStyles: {
          container: {
            backgroundColor: "#ffe0e6",
            borderColor: "#3213e6ff",
            borderWidth: 2,
          },
        },
      };
    } else {
      // Se il giorno è sia lavorato che evidenziato, aggiungi un bordo rosa
      markedDates[date] = {
        ...markedDates[date],
        customStyles: {
          container: { borderColor: "#3213e6ff", borderWidth: 2 },
        },
      };
    }
  });

  return (
    <SafeAreaView style={styles.safearea}>
      <Text style={styles.title}>Month Recap</Text>
      <ScrollView contentContainerStyle={styles.container}>
        <Calendar
          firstDay={1}
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType="custom"
          enableSwipeMonths
          current={selectedMonth}
          onMonthChange={(currentMonth: { year: any; month: any }) => {
            const newMonth = `${currentMonth.year}-${String(
              currentMonth.month,
            ).padStart(2, "0")}`;
            setSelectedMonth(newMonth);
          }}
        />
        <View style={styles.stats}>
          <Text style={styles.statText}>
            ✅ Days Worked: {monthlyStats.daysWorked}
          </Text>
          {monthlyStats.vacationDays > 0 && (
            <Text style={styles.statText}>
              🏖️ Vacation Days: {monthlyStats.vacationDays}
            </Text>
          )}
          {monthlyStats.sickDays > 0 && (
            <Text style={styles.statText}>
              🤒 Sick Days: {monthlyStats.sickDays}
            </Text>
          )}
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
