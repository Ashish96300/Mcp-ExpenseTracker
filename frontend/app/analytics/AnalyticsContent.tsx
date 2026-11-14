
"use client";

import { useEffect, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

// Keep your existing formatCurrency() and formatMonth() functions here.
function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(year, monthNumber - 1, 1).toLocaleDateString(
    "en-IN",
    { month: "short", year: "2-digit" }
  );
}
export default function AnalyticsContent(){

        const [currentMonth, setCurrentMonth] = useState("");
        const [selectedMonth, setSelectedMonth] = useState("");

        useEffect(() => {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}`;

        setCurrentMonth(month);
        setSelectedMonth(month);
        }, []);

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [trend, setTrend] = useState<TrendItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

useEffect(() => {
  if (!selectedMonth) return;

  const controller = new AbortController();

  async function loadAnalytics() {
    try {

      const [summaryResponse, categoryResponse, trendResponse] =
        await Promise.all([
          fetch(`/api/summary/monthly?month=${selectedMonth}`, {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(`/api/summary/categories?month=${selectedMonth}`, {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/summary/trend?months=6", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

      if (
        !summaryResponse.ok ||
        !categoryResponse.ok ||
        !trendResponse.ok
      ) {
        throw new Error("Unable to load analytics.");
      }

      const [summaryData, categoryData, trendData] =
        await Promise.all([
          summaryResponse.json(),
          categoryResponse.json(),
          trendResponse.json(),
        ]);

      if (controller.signal.aborted) return;

      setSummary(summaryData);
      setCategories(categoryData);
      setTrend(trendData);
      setError("");
    } catch (err) {
      if (controller.signal.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  loadAnalytics();

  return () => controller.abort();
}, [selectedMonth ,retryKey]);

  const totalSpent = Number(summary?.total_spent ?? 0);
  const previousTotal = Number(summary?.previous_month_total ?? 0);

  const highestCategory = categories[0];

  const maxCategoryAmount = Math.max(
    ...categories.map((item) => Number(item.total)),
    0
  );

  return (
    <>
      {/* Main Content */}
      <main className="min-w-0 flex-1">

        <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-9">
          <h2 className="text-lg font-semibold text-slate-800">
            Analytics
          </h2>
          <p className="text-sm text-slate-500">
            Understand your spending habits.
          </p>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 md:p-9">

          {/* Heading and on Selector */}
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                Financial Analytics
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                A closer look at your expenses.
              </p>
            </div>

            <input
            type="month"
            value={selectedMonth}
            max={currentMonth}
            disabled={!currentMonth}
            onChange={(e) => {
            setLoading(true);
            setError("");
            setSelectedMonth(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            />
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            <button
            type="button"
            onClick={() => {
                setLoading(true);
                setError("");
                setRetryKey((previous) => previous + 1);
                }}
            className="ml-3 font-semibold underline"
            >
            Retry
            </button>
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-white py-20 text-center text-sm text-slate-400">
              Loading analytics...
            </div>
          ) : !error ? (
            <>
              {/* Summary Cards */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Total Spent
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900">
                    {formatCurrency(totalSpent)}
                  </h2>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatMonth(selectedMonth)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Transactions
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900">
                    {summary?.transaction_count ?? 0}
                  </h2>
                  <p className="mt-2 text-xs text-slate-400">
                    Transactions this month
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
                  <p className="text-sm text-slate-500">
                    Previous Month
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900">
                    {formatCurrency(previousTotal)}
                  </h2>
                  <p className="mt-2 text-xs text-slate-400">
                    {summary?.percentage_change === null ||
                    summary?.percentage_change === undefined
                      ? "No previous spending to compare"
                      : `${summary.percentage_change > 0 ? "+" : ""}${summary.percentage_change.toFixed(1)}% compared with previous month`}
                  </p>
                </div>
              </section>

              {/* Monthly Trend */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800">
                    Spending Trend
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Your monthly spending over the last six months.
                  </p>
                </div>

                <div className="h-64 w-full sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trend.map((item) => ({
                        ...item,
                        amount: Number(item.total_spent),
                        label: formatMonth(item.month),
                      }))}
                      margin={{
                        top: 10,
                        right: 5,
                        left: -15,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        tickFormatter={(value) =>
                          `₹${value >= 1000
                            ? `${value / 1000}k`
                            : value}`
                        }
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(Number(value)),
                          "Spent",
                        ]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                        }}
                      />

                      <Bar
                        dataKey="amount"
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Category Breakdown */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800">
                    Category Breakdown
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Where your money went in {formatMonth(selectedMonth)}.
                  </p>
                </div>

                {categories.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No expenses recorded for this month.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {categories.map((item) => {
                      const amount = Number(item.total);
                      const percentage =
                        totalSpent > 0
                          ? (amount / totalSpent) * 100
                          : 0;

                      return (
                        <div key={item.category}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-700">
                                {item.category}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {item.transaction_count} transactions
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-slate-800">
                                {formatCurrency(amount)}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {percentage.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: `${Math.min(percentage, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Spending Insight */}
              {highestCategory && (
                <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
                  <p className="text-sm font-semibold text-blue-800">
                    Your biggest spending category
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {highestCategory.category}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    You spent{" "}
                    {formatCurrency(Number(highestCategory.total))}{" "}
                    in this category during{" "}
                    {formatMonth(selectedMonth)}.
                  </p>
                </section>
              )}
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}
