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

export type WorkDay = { [date: string]: boolean };

export type Expense = {
  id: string;
  description: string;
  payDate: string;
  amount: number;
};
export type MonthlyStats = {
  daysWorked: number;
  totalGross: number;
  redditoImponibile: number;
  impostaSostitutiva: number;
  contributiInps: number;
  net: number;
};

export type YearlyStats = {
  ms: MonthlyStats[];
  year: number;
  daysWorked: number;
  totalGross: number;
  net: number;
  taxes: number;
  totalExpenses: number;
  pastExpensesAmount: number;
  futureExpensesAmount: number;
  // per il 2026 la gestione delle tasse deve cambiare con l'anticipo dell'anno al posto del saldo
};

type GlobalState = {
  workDays: WorkDay;
  setWorkDays: React.Dispatch<React.SetStateAction<WorkDay>>;

  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;

  yearlyStats: YearlyStats;
  setYearlyStats: React.Dispatch<React.SetStateAction<YearlyStats>>;

  restoreFromBackup: (workDays: WorkDay, expenses: Expense[]) => void;
};

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const GlobalStateProvider = ({ children }: { children: ReactNode }) => {
  const [workDays, setWorkDays] = useState<WorkDay>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const emptyMonthlyStats: MonthlyStats = {
    daysWorked: 0,
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
    ms: emptyMS,
    year: new Date().getFullYear(),
    daysWorked: 0,
    totalGross: 0,
    net: 0,
    taxes: 0,
    totalExpenses: 0,
    pastExpensesAmount: 0,
    futureExpensesAmount: 0,
  });

  // Track if initial load is done
  const [initialized, setInitialized] = useState(false);

  // Function to update stats based on workDays and expenses
  const updateStats = (loadedWorkDays: WorkDay, loadedExpenses: Expense[]) => {
    // For each month, create a new MonthlyStats object based on the workDays
    let yDayWorked = 0;
    let yTotalGross = 0;
    let yTotalNet = 0;
    let yTaxes = 0;
    const ms: MonthlyStats[] = [];
    for (let i = 0; i < 12; i++) {
      const selectedMonth = format(new Date().setMonth(i), "yyyy-MM");
      const filteredDays = Object.keys(loadedWorkDays).filter((date) =>
        date.startsWith(selectedMonth)
      );

      const workedDays = filteredDays.length;
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
        totalGross: totalGross,
        redditoImponibile: redditoImponibile,
        impostaSostitutiva: impostaSostitutiva,
        contributiInps: contributiInps,
        net: net,
      });
    }

    // Calculate expenses
    let totalExpenses = 0;
    let pastExpensesAmount = 0;
    let futureExpensesAmount = 0;
    for (const ex of loadedExpenses) {
      const payDate = new Date(ex.payDate);
      totalExpenses += ex.amount;
      if (payDate <= new Date()) {
        pastExpensesAmount += ex.amount;
      } else {
        futureExpensesAmount += ex.amount;
      }
    }

    const ys: YearlyStats = {
      ms: ms,
      year: new Date().getFullYear(),
      daysWorked: yDayWorked,
      totalGross: yTotalGross,
      net: yTotalNet,
      taxes: yTaxes,
      totalExpenses: totalExpenses,
      pastExpensesAmount: pastExpensesAmount,
      futureExpensesAmount: futureExpensesAmount,
    };
    setYearlyStats(ys);
  };

  // Load workDays and expenses from storage on mount
  const onRestoreBackup = async () => {
    const loadedWorkDays = (await loadData(STORAGE_KEYS.workDays)) || {};
    setWorkDays(loadedWorkDays);
    const loadedExpenses = await loadData(STORAGE_KEYS.expenses);
    console.log("[DEBUG] loadedExpenses from storage: ", loadedExpenses);
    setExpenses(Array.isArray(loadedExpenses) ? loadedExpenses : []);
    updateStats(
      loadedWorkDays,
      Array.isArray(loadedExpenses) ? loadedExpenses : []
    );
  };

  useEffect(() => {
    onRestoreBackup();
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized) return;
    updateStats(workDays, expenses);
    saveData(STORAGE_KEYS.workDays, workDays); // save workDays
    saveData(STORAGE_KEYS.expenses, expenses); // save expenses
    console.log("[DEBUG] saving expenses:", expenses);
  }, [workDays, expenses]);

  return (
    <GlobalStateContext.Provider
      value={{
        workDays,
        setWorkDays,
        expenses,
        setExpenses,
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
