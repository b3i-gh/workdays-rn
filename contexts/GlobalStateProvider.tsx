import { format } from "date-fns";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { calcTaxesFromGross } from "../utils/finance";
import { loadData, saveData, STORAGE_KEYS } from "../utils/storage";

export type DayStatus = "worked" | "vacation" | "sick";
export type WorkDay = { [date: string]: DayStatus };

export type Saving = {
  id: string;
  description: string;
  payDate: string;
  amount: number;
  type?: string; // Add optional type field for backward compatibility
};
export type MonthlyStats = {
  daysWorked: number;
  vacationDays: number;
  sickDays: number;
  totalGross: number;
  redditoImponibile: number;
  impostaSostitutiva: number;
  contributiInps: number;
  net: number;
};

export type YearlyStats = {
  [year: number]: {
    ms: MonthlyStats[];
    daysWorked: number;
    totalGross: number;
    net: number;
    taxes: number;
  };
  totalSavings: number;
  pastSavingsAmount: number;
  futureSavingsAmount: number;
  // per il 2026 la gestione delle tasse deve cambiare con l'anticipo dell'anno al posto del saldo
};

type GlobalState = {
  workDays: WorkDay;
  setWorkDays: React.Dispatch<React.SetStateAction<WorkDay>>;

  savings: Saving[];
  setSavings: React.Dispatch<React.SetStateAction<Saving[]>>;

  yearlyStats: YearlyStats;
  setYearlyStats: React.Dispatch<React.SetStateAction<YearlyStats>>;

  restoreFromBackup: (workDays: WorkDay, savings: Saving[]) => void;
};

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const GlobalStateProvider = ({ children }: { children: ReactNode }) => {
  const [workDays, setWorkDays] = useState<WorkDay>({});
  const [savings, setSavings] = useState<Saving[]>([]);

  const emptyMonthlyStats: MonthlyStats = {
    daysWorked: 0,
    vacationDays: 0,
    sickDays: 0,
    totalGross: 0,
    redditoImponibile: 0,
    impostaSostitutiva: 0,
    contributiInps: 0,
    net: 0,
  };
  const emptyMS: MonthlyStats[] = [];
  for (let i = 0; i < 12; i++) {
    emptyMS.push(emptyMonthlyStats);
  }

  const [yearlyStats, setYearlyStats] = useState<YearlyStats>({
    totalSavings: 0,
    pastSavingsAmount: 0,
    futureSavingsAmount: 0,
  });

  // Track if initial load is done
  const [initialized, setInitialized] = useState(false);

  // Function to update stats based on workDays and savings
  const updateStats = (loadedWorkDays: WorkDay, loadedSavings: Saving[]) => {
    // For each month, create a new MonthlyStats object based on the workDays
    let yDayWorked = 0;
    let yTotalGross = 0;
    let yTotalNet = 0;
    let yTaxes = 0;
    const ms: MonthlyStats[] = [];
    // Raggruppa i giorni per anno e stato
    const daysByYear: { [year: number]: { [date: string]: DayStatus } } = {};
    Object.keys(loadedWorkDays).forEach((date) => {
      const status = loadedWorkDays[date];
      if (status) {
        const year = parseInt(date.split("-")[0], 10);
        if (!daysByYear[year]) daysByYear[year] = {};
        daysByYear[year][date] = status;
      }
    });

    // Calcola statistiche per ogni anno
    const yearlyStatsData: YearlyStats = {
      totalSavings: 0,
      pastSavingsAmount: 0,
      futureSavingsAmount: 0,
    };

    Object.keys(daysByYear).forEach((yearStr) => {
      const year = parseInt(yearStr, 10);
      const yearDays = daysByYear[year];

      // For each month of this year, create a new MonthlyStats object
      let yDayWorked = 0;
      let yTotalGross = 0;
      let yTotalNet = 0;
      let yTaxes = 0;
      const ms: MonthlyStats[] = [];

      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(year, i, 1);
        const selectedMonth = format(monthDate, "yyyy-MM");

        // Filtra i giorni del mese e conta per stato
        let workedDays = 0;
        let vacationDays = 0;
        let sickDays = 0;

        Object.entries(yearDays).forEach(([date, status]) => {
          if (date.startsWith(selectedMonth)) {
            if (status === "worked") workedDays++;
            else if (status === "vacation") vacationDays++;
            else if (status === "sick") sickDays++;
          }
        });

        yDayWorked += workedDays;
        const dailyRate = 220;
        const totalGross = workedDays * dailyRate;
        yTotalGross += totalGross;
        const taxes = calcTaxesFromGross(totalGross);
        const redditoImponibile = taxes.redditoImponibile || 0;
        const impostaSostitutiva = taxes.impostaSostitutiva || 0;
        const contributiInps = taxes.contributiInps || 0;
        const net = taxes.net || 0;
        yTotalNet += net;
        yTaxes += impostaSostitutiva + contributiInps;
        ms.push({
          daysWorked: workedDays,
          vacationDays: vacationDays,
          sickDays: sickDays,
          totalGross: totalGross,
          redditoImponibile: redditoImponibile,
          impostaSostitutiva: impostaSostitutiva,
          contributiInps: contributiInps,
          net: net,
        });
      }

      yearlyStatsData[year] = {
        ms: ms,
        daysWorked: yDayWorked,
        totalGross: yTotalGross,
        net: yTotalNet,
        taxes: yTaxes,
      };
    });

    // Calculate savings
    let totalSavings = 0;
    let pastSavingsAmount = 0;
    let futureSavingsAmount = 0;
    for (const ex of loadedSavings) {
      const payDate = new Date(ex.payDate);
      totalSavings += ex.amount;
      if (payDate <= new Date()) {
        pastSavingsAmount += ex.amount;
      } else {
        futureSavingsAmount += ex.amount;
      }
    }

    yearlyStatsData.totalSavings = totalSavings;
    yearlyStatsData.pastSavingsAmount = pastSavingsAmount;
    yearlyStatsData.futureSavingsAmount = futureSavingsAmount;

    setYearlyStats(yearlyStatsData);
  };

  const onRestoreBackup = async () => {
    const loadedWorkDays = (await loadData(STORAGE_KEYS.workDays)) ?? {};
    setWorkDays(loadedWorkDays);
    const loadedSavings = await loadData(STORAGE_KEYS.savings);
    console.log("[DEBUG] loadedSavings from storage: ", loadedSavings);
    setSavings(Array.isArray(loadedSavings) ? loadedSavings : []);
    updateStats(
      loadedWorkDays,
      Array.isArray(loadedSavings) ? loadedSavings : [],
    );
  };

  useEffect(() => {
    onRestoreBackup();
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized) return;
    updateStats(workDays, savings);
    saveData(STORAGE_KEYS.workDays, workDays); // save workDays
    saveData(STORAGE_KEYS.savings, savings); // save savings
    console.log("[DEBUG] saving Savings:", savings);
  }, [workDays, savings]);

  return (
    <GlobalStateContext.Provider
      value={{
        workDays,
        setWorkDays,
        savings: savings,
        setSavings: setSavings,
        yearlyStats,
        setYearlyStats,
        restoreFromBackup: onRestoreBackup,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context)
    throw new Error("useGlobalState must be used within GlobalStateProvider");
  return context;
};
