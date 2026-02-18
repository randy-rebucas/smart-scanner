"use client";
import React from "react";

interface StepFourProps {
  agreement: boolean;
  setAgreement: (val: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepFour({ agreement, setAgreement, onBack, onNext }: StepFourProps) {
  return (
    <div className="flex flex-col gap-4 items-center">
      <h2 className="text-2xl font-bold">Step 4: Agreement</h2>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={agreement}
          onChange={e => setAgreement(e.target.checked)}
        />
        I confirm the information is correct and agree to the terms.
      </label>
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded bg-gray-300" onClick={onBack}>Back</button>
        <button
          className="px-6 py-2 rounded bg-blue-600 text-white font-semibold"
          onClick={onNext}
          disabled={!agreement}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
