"use client";
import React from "react";

interface StepTwoProps {
  output: string;
  setOutput: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepTwo({ output, setOutput, onBack, onNext }: StepTwoProps) {
  return (
    <div className="flex flex-col gap-4 items-center">
      <h2 className="text-2xl font-bold">Step 2: Validate Output</h2>
      <textarea
        className="border rounded px-3 py-2 w-80"
        placeholder="Paste or edit the scanned output here..."
        value={output}
        onChange={e => setOutput(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded bg-gray-300" onClick={onBack}>Back</button>
        <button
          className="px-6 py-2 rounded bg-blue-600 text-white font-semibold"
          onClick={onNext}
          disabled={!output.trim()}
        >
          Next: Details
        </button>
      </div>
    </div>
  );
}
