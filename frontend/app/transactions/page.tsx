
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Expense = {
  id: number;
  amount: string;
  description: string;
  date: string;
  category: string;
};

export default function TransactionsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    amount: "",
    description: "",
    date: "",
    category: "",
  });

  async function fetchExpenses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/expenses");

      if (!response.ok) {
        throw new Error("Unable to load transactions.");
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

  useEffect(() => {
    fetchExpenses();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(form.amount),
          description: form.description,
           expense_date: form.date,
          category: form.category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not create the expense."
        );
      }

      setForm({
        amount: "",
        description: "",
        date: "",
        category: "",
      });

      setSuccess("Expense added successfully!");

      await fetchExpenses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <div className="min-h-screen bg-slate-100 md:flex">

      {/* Sidebar */}
      <aside className="flex w-full flex-col bg-[#101B35] text-white md:min-h-screen md:w-64 md:shrink-0">
        <div className="border-b border-white/10 px-7 py-6">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold tracking-wide">
              Finora<span className="text-blue-400">.</span>
            </h1>
          </Link>
          <p className="mt-1 text-xs text-slate-400">
            Personal Finance Manager
          </p>
        </div>

        <nav className="flex gap-2 overflow-x-auto p-4 md:flex-1 md:flex-col">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <span className="text-lg">◫</span>
            Overview
          </Link>

          <Link
            href="/transactions"
            className="flex shrink-0 items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
          >
            <span className="text-lg">⇄</span>
            Transactions
          </Link>

          <Link
            href="/analytics"
            className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <span className="text-lg">▥</span>
            Analytics
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">

        <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-9">
          <h2 className="text-lg font-semibold text-slate-800">
            Transactions
          </h2>
          <p className="text-sm text-slate-500">
            Manage and track your expenses.
          </p>
        </header>

        <div className="mx-auto max-w-7xl space-y-7 p-5 md:p-9">

          {/* Page heading */}
          <section>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Your Transactions
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Keep track of where your money goes.
            </p>
          </section>

          {/* Add expense form */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800">
              Add New Expense
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Record a new financial transaction.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="e.g. Grocery shopping"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Food, Travel, Shopping"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Adding Expense..." : "+ Add Expense"}
                </button>
              </div>
            </form>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}

            {success && (
              <p className="mt-4 text-sm text-green-600">{success}</p>
            )}
          </section>

          {/* Transactions list */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">
                  All Transactions
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Your recorded expenses.
                </p>
              </div>

              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">
                {expenses.length} Records
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-slate-400">
                Loading transactions...
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-slate-500">
                  No transactions yet.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Add your first expense using the form above.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-4 font-medium">Description</th>
                      <th className="px-3 py-4 font-medium">Category</th>
                      <th className="px-3 py-4 font-medium">Date</th>
                      <th className="px-3 py-4 text-right font-medium">Amount</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-3 py-4 text-sm font-medium text-slate-800">
                          {expense.description}
                        </td>

                        <td className="px-3 py-4">
                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                            {expense.category}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-500">
                          {expense.date}
                        </td>

                        <td className="px-3 py-4 text-right text-sm font-semibold text-slate-800">
                          {formatAmount(Number(expense.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
