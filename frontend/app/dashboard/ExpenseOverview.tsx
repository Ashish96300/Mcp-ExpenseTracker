
"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Expense = {
  id: number;
  amount: string;
  description: string;
  date: string;
  category: string;
};

type MonthlySummary = {
  month: string;
  total_spent: string;
  transaction_count: number;
  previous_month_total: string;
  percentage_change: number | null;
};

type CategorySummary = {
  category: string;
  total: string;
  transaction_count: number;
};

type TrendItem = {
  month: string;
  total_spent: string;
  transaction_count: number;
};

type ExpenseListResponse = {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export default function ExpenseOverview() {
  const [monthlySummary, setMonthlySummary] =
    useState<MonthlySummary | null>(null);

  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<TrendItem[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const now = new Date();

  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [
          monthlyResponse,
          categoriesResponse,
          trendResponse,
          expensesResponse,
        ] = await Promise.all([
          fetch(`/api/summary/monthly?month=${currentMonth}`, {
            cache: "no-store",
          }),
          fetch(`/api/summary/categories?month=${currentMonth}`, {
            cache: "no-store",
          }),
          fetch("/api/summary/trend?months=6", {
            cache: "no-store",
          }),
          fetch("/api/expenses?limit=5", {
            cache: "no-store",
          }),
        ]);

        if (
          !monthlyResponse.ok ||
          !categoriesResponse.ok ||
          !trendResponse.ok ||
          !expensesResponse.ok
        ) {
          throw new Error("Could not load your financial data.");
        }

        const [monthlyData, categoryData, trendData, expensesData] =
          await Promise.all([
            monthlyResponse.json() as Promise<MonthlySummary>,
            categoriesResponse.json() as Promise<CategorySummary[]>,
            trendResponse.json() as Promise<TrendItem[]>,
            expensesResponse.json() as Promise<ExpenseListResponse>,
          ]);

        setMonthlySummary(monthlyData);
        setCategories(categoryData);
        setMonthlyTrend(trendData);
        setRecentExpenses(expensesData.items);
        setTotalTransactions(expensesData.total);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [currentMonth]);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);

    return new Date(year, month - 1, 1).toLocaleString("en-IN", {
      month: "short",
    });
  };

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const monthlyTotal = Number(monthlySummary?.total_spent ?? 0);
  const monthlyTransactionCount =
    monthlySummary?.transaction_count ?? 0;

  const chartData = monthlyTrend.map((item) => ({
    month: formatMonth(item.month),
    total: Number(item.total_spent),
  }));

  const categoryBreakdown = categories
    .map((item) => {
      const amount = Number(item.total);

      return {
        category: item.category,
        amount,
        percentage:
          monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center text-sm text-slate-500">
        Loading your financial data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-7">
      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-500">
            Monthly Expenses
          </p>

          <h3 className="mt-3 break-words text-2xl font-bold text-slate-800 sm:text-3xl">
            {formatAmount(monthlyTotal)}
          </h3>

          <p className="mt-3 text-xs text-slate-400">
            {monthlyTransactionCount} transactions this month
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-500">
            All Transactions
          </p>

          <h3 className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
            {totalTransactions}
          </h3>

          <p className="mt-3 text-xs text-slate-400">
            Across all recorded expenses
          </p>
        </div>
      </section>

      {/* Monthly Spending Trend */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 sm:mb-6">
          <h3 className="font-semibold text-slate-800">
            Spending Overview
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Your monthly spending over the last six months.
          </p>
        </div>

        <div className="h-60 w-full min-w-0 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -15, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 11 }}
                interval={0}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 10 }}
                tickFormatter={(value: number) =>
                  value >= 1000
                    ? `₹${(value / 1000).toFixed(1)}k`
                    : `₹${value}`
                }
                width={55}
              />

              <Tooltip
                formatter={(value) => formatAmount(Number(value ?? 0))}
                cursor={{ fill: "#EFF6FF" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  fontSize: "12px",
                }}
              />

              <Bar
                dataKey="total"
                name="Expenses"
                fill="#2563EB"
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Spending by Category */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div>
          <h3 className="font-semibold text-slate-800">
            Spending by Category
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Where your money goes this month.
          </p>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="flex h-36 items-center justify-center sm:h-40">
            <p className="text-center text-sm text-slate-400">
              No spending data available for this month.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5 sm:space-y-6">
            {categoryBreakdown.map((item) => (
              <div key={item.category}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className="min-w-0 break-words text-sm font-medium text-slate-700">
                    {item.category}
                  </span>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatAmount(item.amount)}
                    </p>

                    <p className="text-xs text-slate-400">
                      {item.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{
                      width: `${Math.min(item.percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800">
              Recent Transactions
            </h3>

            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Your latest financial activity.
            </p>
          </div>

          <span className="shrink-0 text-xs font-medium text-blue-600 sm:text-sm">
            Latest 5
          </span>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="flex h-36 items-center justify-center sm:h-40">
            <p className="text-sm text-slate-400">
              No expenses recorded yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-slate-800">
                    {expense.description}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {expense.category} · {formatDate(expense.date)}
                  </p>
                </div>

                <p className="self-start text-sm font-semibold text-slate-800 sm:shrink-0">
                  {formatAmount(Number(expense.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
