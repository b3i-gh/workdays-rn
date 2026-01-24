import { useFocusEffect } from "@react-navigation/native";
import { format, parseISO } from "date-fns";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { calcTaxesFromGross } from "../../utils/finance";
import { loadData, saveData, STORAGE_KEYS } from "../../utils/storage";
import type { DayStatus } from "../../contexts/GlobalStateProvider";

type MonthSummary = {
  month: string;
  workedDays: number;
  vacationDays: number;
  sickDays: number;
  gross: number;
  net: number;
  taxes: number;
  paymentDate?: string;
};

type YearSection = {
  year: number | null; // null for unassigned
  months: MonthSummary[];
  totals: {
    workedDays: number;
    vacationDays: number;
    sickDays: number;
    gross: number;
    net: number;
    taxes: number;
  };
};

// Utility function to format currency with thousand separators
const formatCurrency = (value: number): string => {
  return `€${value.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const YearScreen = () => {
  const [sections, setSections] = useState<YearSection[]>([]);
  const [collapsedYears, setCollapsedYears] = useState<Set<number | null>>(
    new Set(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const fetchData = async () => {
    const workDays = (await loadData(STORAGE_KEYS.workDays)) ?? {};
    const rate = 220;
    const paymentDates: { [month: string]: string } =
      (await loadData(STORAGE_KEYS.invoicePaymentDates)) ?? {};

    // Count days per month by status
    const monthsData: {
      [month: string]: {
        worked: number;
        vacation: number;
        sick: number;
      };
    } = {};

    Object.entries(workDays).forEach(([dateStr, status]) => {
      const monthKey = format(parseISO(dateStr), "yyyy-MM");
      if (!monthsData[monthKey]) {
        monthsData[monthKey] = { worked: 0, vacation: 0, sick: 0 };
      }

      if (status === "worked") monthsData[monthKey].worked++;
      else if (status === "vacation") monthsData[monthKey].vacation++;
      else if (status === "sick") monthsData[monthKey].sick++;
    });

    // Create month summaries
    const allMonths: MonthSummary[] = Object.entries(monthsData).map(
      ([month, counts]) => {
        const gross = counts.worked * rate;
        const { impostaSostitutiva, contributiInps, net } =
          calcTaxesFromGross(gross);

        return {
          month,
          workedDays: counts.worked,
          vacationDays: counts.vacation,
          sickDays: counts.sick,
          gross,
          net,
          taxes: impostaSostitutiva + contributiInps,
          paymentDate: paymentDates[month],
        };
      },
    );

    // Sort chronologically
    allMonths.sort((a, b) => a.month.localeCompare(b.month));

    // Group by fiscal year
    const yearGroups: { [year: number]: MonthSummary[] } = {};
    const unassigned: MonthSummary[] = [];

    allMonths.forEach((monthSummary) => {
      if (monthSummary.paymentDate) {
        const paymentYear = parseInt(
          monthSummary.paymentDate.split("-")[0],
          10,
        );
        if (!yearGroups[paymentYear]) yearGroups[paymentYear] = [];
        yearGroups[paymentYear].push(monthSummary);
      } else {
        unassigned.push(monthSummary);
      }
    });

    // Create sections
    const newSections: YearSection[] = [];

    // Unassigned section (if any)
    if (unassigned.length > 0) {
      const totals = unassigned.reduce(
        (acc, m) => ({
          workedDays: acc.workedDays + m.workedDays,
          vacationDays: acc.vacationDays + m.vacationDays,
          sickDays: acc.sickDays + m.sickDays,
          gross: acc.gross + m.gross,
          net: acc.net + m.net,
          taxes: acc.taxes + m.taxes,
        }),
        {
          workedDays: 0,
          vacationDays: 0,
          sickDays: 0,
          gross: 0,
          net: 0,
          taxes: 0,
        },
      );
      newSections.push({ year: null, months: unassigned, totals });
    }

    // Year sections (sorted descending)
    const years = Object.keys(yearGroups)
      .map(Number)
      .sort((a, b) => b - a);

    years.forEach((year) => {
      const months = yearGroups[year];
      const totals = months.reduce(
        (acc, m) => ({
          workedDays: acc.workedDays + m.workedDays,
          vacationDays: acc.vacationDays + m.vacationDays,
          sickDays: acc.sickDays + m.sickDays,
          gross: acc.gross + m.gross,
          net: acc.net + m.net,
          taxes: acc.taxes + m.taxes,
        }),
        {
          workedDays: 0,
          vacationDays: 0,
          sickDays: 0,
          gross: 0,
          net: 0,
          taxes: 0,
        },
      );
      newSections.push({ year, months, totals });
    });

    setSections(newSections);

    // Collapse all sections except the first one
    const yearsToCollapse = new Set<number | null>();
    newSections.forEach((section, index) => {
      if (index > 0) {
        yearsToCollapse.add(section.year);
      }
    });
    setCollapsedYears(yearsToCollapse);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, []),
  );

  const toggleYear = (year: number | null) => {
    setCollapsedYears((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  const handleMonthPress = (monthStr: string) => {
    setSelectedMonth(monthStr);
    setTempDate(new Date());
    setShowDatePicker(true);
  };

  const handleDateConfirm = async (confirmedDate: Date) => {
    if (!selectedMonth) return;

    const paymentDateStr = format(confirmedDate, "yyyy-MM-dd");

    // Load existing payment dates
    const paymentDates: { [month: string]: string } =
      (await loadData(STORAGE_KEYS.invoicePaymentDates)) ?? {};

    // Update with new date
    paymentDates[selectedMonth] = paymentDateStr;

    // Save to storage
    await saveData(STORAGE_KEYS.invoicePaymentDates, paymentDates);

    // Refresh data
    await fetchData();

    setShowDatePicker(false);
    setSelectedMonth(null);
  };

  return (
    <SafeAreaView style={styles.safearea}>
      <Text style={styles.title}>Fiscal Year Recap</Text>
      <ScrollView contentContainerStyle={styles.container}>
        {sections.map((section, idx) => (
          <View key={section.year ?? "unassigned"} style={styles.section}>
            {/* Section Header */}
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleYear(section.year)}
            >
              <Text style={styles.sectionTitle}>
                {section.year === null
                  ? "📋 Unassigned Months"
                  : `📅 ${section.year}`}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Work: {section.totals.workedDays} | Vacation:{" "}
                {section.totals.vacationDays} | Sick: {section.totals.sickDays}
              </Text>
              <Text style={styles.sectionFinancials}>
                Gross: {formatCurrency(section.totals.gross)} | Net:{" "}
                {formatCurrency(section.totals.net)} | Taxes:{" "}
                {formatCurrency(section.totals.taxes)}
              </Text>
              {section.year === 2025 && (
                <View style={styles.taxInstallments}>
                  <Text style={styles.sectionFinancials}>
                    📊 Balance 2025: {formatCurrency(section.totals.taxes * 1.5)} | Advance 2026: {formatCurrency(section.totals.taxes * 0.5)}
                  </Text>                  
                </View>
              )}
              <Text style={styles.collapseIcon}>
                {collapsedYears.has(section.year) ? "▼" : "▲"}
              </Text>
            </TouchableOpacity>

            {/* Section Content */}
            {!collapsedYears.has(section.year) && (
              <View style={styles.sectionContent}>
                <View style={styles.rowHeader}>
                  <Text style={styles.cellHeader}>Month</Text>
                  <Text style={styles.cellHeader}>Days</Text>
                  <Text style={styles.cellHeader}>Gross</Text>
                  <Text style={styles.cellHeader}>Net</Text>
                  <Text style={styles.cellHeader}>Taxes</Text>
                </View>

                {section.months.map((item) => (
                  <TouchableOpacity
                    key={item.month}
                    style={styles.row}
                    onPress={() => {
                      if (section.year === null) {
                        handleMonthPress(item.month);
                      }
                    }}
                    disabled={section.year !== null}
                  >
                    <Text style={styles.cell}>
                      {format(parseISO(item.month + "-01"), "MMM yyyy")}
                    </Text>
                    <Text style={styles.cell}>{item.workedDays}</Text>
                    <Text style={styles.cell}>
                      {formatCurrency(item.gross)}
                    </Text>
                    <Text style={styles.cell}>{formatCurrency(item.net)}</Text>
                    <Text style={styles.cell}>
                      {formatCurrency(item.taxes)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (event.type === "set" && date) {
              // User confirmed the date
              setTempDate(date);
              handleDateConfirm(date);
            } else {
              // User cancelled
              setShowDatePicker(false);
              setSelectedMonth(null);
            }
          }}
        />
      )}
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
  section: {
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    overflow: "hidden",
  },
  sectionHeader: {
    backgroundColor: "#4caf50",
    padding: 12,
    position: "relative",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#fff",
    marginTop: 4,
  },
  sectionFinancials: {
    fontSize: 11,
    color: "#fff",
    marginTop: 2,
    opacity: 0.9,
  },
  taxInstallments: {
    paddingTop: 3,
  },
  taxInstallmentsTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  taxInstallmentsText: {
    fontSize: 11,
    color: "#fff",
    opacity: 0.95,
  },
  collapseIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    fontSize: 18,
    color: "#fff",
  },
  sectionContent: {
    padding: 12,
  },
  rowHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#4caf50",
    paddingBottom: 6,
    marginBottom: 6,
  },
  cellHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cell: {
    flex: 1,
    fontSize: 12,
    textAlign: "center",
  },
});
