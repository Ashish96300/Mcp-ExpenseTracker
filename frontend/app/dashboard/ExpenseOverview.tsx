
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

export default function ExpenseOverview() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const response = await fetch("/api/expenses");

        if (!response.ok) {
          throw new Error("Could not load your expenses.");
        }

        const data = await response.json();
        setExpenses(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, []);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const monthlyExpenses = expenses.filter((expense) =>
    expense.date.startsWith(currentMonth)
  );

  const monthlyTotal = monthlyExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );
  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
  const monthDate = new Date(
    now.getFullYear(),
    now.getMonth() - (5 - index),
    1
  );

  const monthKey = `${monthDate.getFullYear()}-${String(
    monthDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const total = expenses
    .filter((expense) => expense.date.startsWith(monthKey))
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  return {
    month: monthDate.toLocaleString("en-IN", { month: "short" }),
    total,
  };
});
  const categoryTotals = monthlyExpenses.reduce(
  (acc, expense) => {
    const category = expense.category;
    acc[category] = (acc[category] || 0) + Number(expense.amount);
    return acc;
  },
  {} as Record<string, number>
);

    const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
        category,
        amount,
        percentage:
        monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
  const recentExpenses = expenses.slice(0, 5);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading your financial data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Summary */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Monthly Expenses
          </p>
          <h3 className="mt-3 text-3xl font-bold text-slate-800">
            {formatAmount(monthlyTotal)}
          </h3>
          <p className="mt-3 text-xs text-slate-400">
            {monthlyExpenses.length} transactions this month
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Transactions
          </p>
          <h3 className="mt-3 text-3xl font-bold text-slate-800">
            {expenses.length}
          </h3>
          <p className="mt-3 text-xs text-slate-400">
            All recorded expenses
          </p>
        </div>
      </section>
      {/* Monthly Spending Trend */}
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-6">
        <h3 className="font-semibold text-slate-800">
        Spending Overview
        </h3>
        <p className="mt-1 text-sm text-slate-400">
        Your monthly spending over the last six months.
        </p>
    </div>

    <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart
            data={monthlyTrend}
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
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
            tick={{ fill: "#64748B", fontSize: 12 }}
            />

            <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            tickFormatter={(value) =>
                value >= 1000
                ? `₹${(value / 1000).toFixed(1)}k`
                : `₹${value}`
            }
            width={65}
            />

            <Tooltip
            formatter={(value) => formatAmount(Number(value))}
            cursor={{ fill: "#EFF6FF" }}
            contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                fontSize: "13px",
            }}
            />

            <Bar
            dataKey="total"
            name="Expenses"
            fill="#2563EB"
            radius={[6, 6, 0, 0]}
            barSize={38}
            />
        </BarChart>
        </ResponsiveContainer>
    </div>
    </section>
        {/* Spending by Category */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
            <h3 className="font-semibold text-slate-800">
            Spending by Category
            </h3>
            <p className="mt-1 text-sm text-slate-400">
            Where your money goes this month.
            </p>
        </div>

        {categoryBreakdown.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-slate-400">
                No spending data available for this month.
            </p>
            </div>
        ) : (
            <div className="mt-7 space-y-6">
            {categoryBreakdown.map((item) => (
                <div key={item.category}>
                <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-700">
                    {item.category}
                    </span>

                    <div className="text-right">
                    <span className="text-sm font-semibold text-slate-800">
                        {formatAmount(item.amount)}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                        {item.percentage.toFixed(1)}%
                    </span>
                    </div>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                    />
                </div>
                </div>
            ))}
            </div>
        )}
        </section>
      {/* Recent transactions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">
              Recent Transactions
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Your latest financial activity.
            </p>
          </div>

          <span className="text-sm font-medium text-blue-600">
            Latest 5
          </span>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-slate-400">
              No expenses recorded yet.
            </p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-slate-100">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {expense.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {expense.category} · {expense.date}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-slate-800">
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
