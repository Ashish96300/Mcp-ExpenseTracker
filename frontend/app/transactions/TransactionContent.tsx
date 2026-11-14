
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

type ExpenseListResponse = {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

const PAGE_SIZE = 10;

const initialForm = {
  amount: "",
  description: "",
  date: "",
  category: "",
};

export default function TransactionContent() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [listError, setListError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState(initialForm);

  // Fetch the current page whenever page or refreshKey changes.
  useEffect(() => {
    const controller = new AbortController();

    async function loadExpenses() {
      try {
        const response = await fetch(
          `/api/expenses?page=${page}&limit=${PAGE_SIZE}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load transactions.");
        }

        const data: ExpenseListResponse = await response.json();

        if (!Array.isArray(data.items)) {
          throw new Error("Invalid transaction response.");
        }

        setExpenses(data.items);
        setTotalRecords(data.total);
        setTotalPages(Math.max(1, data.total_pages));
        setListError("");
      } catch (err) {
        if (controller.signal.aborted) return;

        setListError(
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

    loadExpenses();

    return () => {
      controller.abort();
    };
  }, [page, refreshKey]);
  async function handleDelete(expense: Expense) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${expense.description}"? This action cannot be undone.`
  );

  if (!confirmed) return;

  setDeletingId(expense.id);
  setListError("");
  setSuccess("");

  try {
    const response = await fetch(
      `/api/expenses/${expense.id}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to delete transaction."
      );
    }

    setSuccess("Transaction deleted successfully!");

    // If this was the only record on the current page,
    // move to the previous page.
    if (expenses.length === 1 && page > 1) {
      setLoading(true);
      setPage((previous) => previous - 1);
    } else {
      setLoading(true);
      setRefreshKey((previous) => previous + 1);
    }
  } catch (err) {
    setListError(
      err instanceof Error
        ? err.message
        : "Something went wrong."
    );
  } finally {
    setDeletingId(null);
  }
}
    function handleEdit(expense: Expense) {
      setEditingId(expense.id);

      setForm({
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        category: expense.category,
      });

      setFormError("");
      setSuccess("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

 async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  setSubmitting(true);
  setFormError("");
  setSuccess("");

  const isEditing = editingId !== null;

  try {
    const response = await fetch(
      isEditing
        ? `/api/expenses/${editingId}`
        : "/api/expenses",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(form.amount),
          description: form.description.trim(),
          expense_date: form.date,
          category: form.category.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          `Could not ${isEditing ? "update" : "create"} the expense.`
      );
    }

    setForm(initialForm);
    setEditingId(null);

    setSuccess(
      isEditing
        ? "Transaction updated successfully!"
        : "Expense added successfully!"
    );

    setLoading(true);
    setListError("");
    setRefreshKey((previous) => previous + 1);
  } catch (err) {
    setFormError(
      err instanceof Error
        ? err.message
        : "Something went wrong."
    );
  } finally {
    setSubmitting(false);
  }
}

  function changePage(nextPage: number) {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page
    ) {
      return;
    }

    setLoading(true);
    setListError("");
    setPage(nextPage);
  }

  function retryLoading() {
    setLoading(true);
    setListError("");
    setRefreshKey((previous) => previous + 1);
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  const firstRecord =
    totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const lastRecord = Math.min(
    page * PAGE_SIZE,
    totalRecords
  );

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <main className="min-w-0 flex-1">

        {/* Header */}
        <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-9">
          <h2 className="text-lg font-semibold text-slate-800">
            Transactions
          </h2>

          <p className="text-sm text-slate-500">
            Manage and track your expenses.
          </p>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 md:space-y-7 md:p-9">

          {/* Page Heading */}
          <section>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Your Transactions
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Keep track of where your money goes.
            </p>
          </section>

          {/* Add Expense Form */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div>
              <h3 className="font-semibold text-slate-800">
                {editingId !== null ? "Edit Transaction" : "Add New Expense"}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {editingId !== null
                  ? "Update the details of your transaction."
                  : "Record a new financial transaction."}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>

                <input
                  id="description"
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="e.g. Grocery shopping"
                  maxLength={255}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Amount (₹)
                </label>

                <input
                  id="amount"
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
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Category
                </label>

                <input
                  id="category"
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Food, Travel, Shopping"
                  maxLength={100}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Date
                </label>

                <input
                  id="date"
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
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {editingId !== null
                    ? submitting
                      ? "Saving Changes..."
                      : "Save Changes"
                    : submitting
                      ? "Adding Expense..."
                      : "+ Add Expense"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(initialForm);
                      setFormError("");
                    }}
                    className="ml-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {formError && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {formError}
              </p>
            )}

            {success && (
              <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {success}
              </p>
            )}
          </section>

          {/* Transactions List */}
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">
                  All Transactions
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Your recorded expenses.
                </p>
              </div>

              <span className="w-fit rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">
                {totalRecords} Records
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-slate-400">
                Loading transactions...
              </div>
            ) : listError ? (
              <div className="py-12 text-center">
                <p className="text-sm text-red-600">
                  {listError}
                </p>

                <button
                  type="button"
                  onClick={retryLoading}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Try Again
                </button>
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
              <>
                {/* Desktop Table */}
                <div className="mt-5 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[600px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                        <th className="px-3 py-4 font-medium">
                          Description
                        </th>

                        <th className="px-3 py-4 font-medium">
                          Category
                        </th>

                        <th className="px-3 py-4 font-medium">
                          Date
                        </th>

                        <th className="px-3 py-4 text-right font-medium">
                          Amount
                        </th>
                        <th className="px-3 py-4 text-right font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {expenses.map((expense) => (
                        <tr
                          key={expense.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="max-w-xs wrap-break-word px-3 py-4 text-sm font-medium text-slate-800">
                            {expense.description}
                          </td>

                          <td className="px-3 py-4">
                            <span className="inline-block max-w-48 truncate rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                              {expense.category}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                            {formatDate(expense.date)}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-semibold text-slate-800">
                            {formatAmount(Number(expense.amount))}
                          </td>
                          <td className="px-3 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(expense)}
                            disabled={deletingId === expense.id}
                            className="rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === expense.id ? "Deleting..." : "Delete"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(expense)}
                            disabled={deletingId !== null}
                            className="rounded-lg px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                          >
                            Edit
                          </button>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Transaction Cards */}
                <div className="mt-5 divide-y divide-slate-100 md:hidden">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-start justify-between gap-3 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-slate-800">
                          {expense.description}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="max-w-full truncate rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            {expense.category}
                          </span>

                          <span className="text-xs text-slate-400">
                            {formatDate(expense.date)}
                          </span>
                        </div>
                      </div>

                      <p className="shrink-0 text-right text-sm font-semibold text-slate-800">
                        {formatAmount(Number(expense.amount))}
                      </p>
                      <div className="mt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(expense)}
                          disabled={deletingId !== null}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(expense)}
                          disabled={deletingId === expense.id}
                          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingId === expense.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

                  <p className="text-center text-xs text-slate-500 sm:text-left sm:text-sm">
                    Showing {firstRecord}–{lastRecord} of {totalRecords}
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => changePage(page - 1)}
                      disabled={page <= 1}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <span className="whitespace-nowrap text-sm font-medium text-slate-600">
                      {page} / {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => changePage(page + 1)}
                      disabled={page >= totalPages}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
