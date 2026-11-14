
"use client";

import { useState } from "react";
import type { GuideStep } from "./types";

interface GuideStepsProps {
  steps: GuideStep[];
}

export default function GuideSteps({ steps }: GuideStepsProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">
          Setup instructions are not available yet.
        </p>
      </div>
    );
  }

  const activeStep = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Setup walkthrough
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Step {currentStep + 1} of {steps.length}
          </h2>
        </div>

        <span className="text-sm font-medium text-slate-500">
          {Math.round(progress)}% completed
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Setup progress"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step navigation */}
      <div className="mt-6 flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <button
            key={`${index}-${step.title}`}
            type="button"
            onClick={() => setCurrentStep(index)}
            aria-label={`Go to step ${index + 1}: ${step.title}`}
            aria-current={currentStep === index ? "step" : undefined}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
              currentStep === index
                ? "border-blue-600 bg-blue-600 text-white"
                : index < currentStep
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-blue-300"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Active step */}
      <div className="mt-7 min-w-0">
        <h3 className="text-xl font-semibold text-slate-900">
          {activeStep.title}
        </h3>

        <p className="mt-2 text-sm leading-7 text-slate-600">
          {activeStep.description}
        </p>

        {/* Screenshot */}
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-4">
          <img
            src={activeStep.image}
            alt={`Screenshot for ${activeStep.title}`}
            className="mx-auto h-auto max-h-[520px] w-full object-contain"
          />
        </div>

        {/* Optional tip */}
        {activeStep.tip && (
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm leading-6 text-blue-900">
              <span className="font-semibold">Tip: </span>
              {activeStep.tip}
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
          disabled={currentStep === 0}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(0)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Start again
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              setCurrentStep((step) => Math.min(steps.length - 1, step + 1))
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Next step
          </button>
        )}
      </div>
    </section>
  );
}
