"use client";
import React from "react";

interface StepThreeProps {
  skillCategory: string;
  setSkillCategory: (val: string) => void;
  services: string;
  setServices: (val: string) => void;
  availability: string;
  setAvailability: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepThree({
  skillCategory,
  setSkillCategory,
  services,
  setServices,
  availability,
  setAvailability,
  onBack,
  onNext,
}: StepThreeProps) {
  return (
    <div className="flex flex-col gap-4 items-center">
      <h2 className="text-2xl font-bold">Step 3: Details</h2>
      <input
        className="border rounded px-3 py-2 w-80"
        placeholder="Skill Category"
        value={skillCategory}
        onChange={e => setSkillCategory(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2 w-80"
        placeholder="Services Offered"
        value={services}
        onChange={e => setServices(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2 w-80"
        placeholder="Availability"
        value={availability}
        onChange={e => setAvailability(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded bg-gray-300" onClick={onBack}>Back</button>
        <button
          className="px-6 py-2 rounded bg-blue-600 text-white font-semibold"
          onClick={onNext}
          disabled={!(skillCategory && services && availability)}
        >
          Next: Agreement
        </button>
      </div>
    </div>
  );
}
