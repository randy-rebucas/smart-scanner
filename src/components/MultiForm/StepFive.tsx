"use client";
import React from "react";

interface StepFiveProps {
  email: string;
  skillCategory: string;
  services: string;
  availability: string;
  output: string;
  onStartOver: () => void;
}

export default function StepFive({
  email,
  skillCategory,
  services,
  availability,
  output,
  onStartOver,
}: StepFiveProps) {
  return (
    <div className="flex flex-col gap-4 items-center">
      <h2 className="text-2xl font-bold text-green-600">Success!</h2>
      <p className="text-zinc-700 dark:text-zinc-200">Your information has been submitted and a copy has been sent to your email.</p>
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded p-4 w-80 text-left">
        <div><b>Email:</b> {email}</div>
        <div><b>Skill Category:</b> {skillCategory}</div>
        <div><b>Services:</b> {services}</div>
        <div><b>Availability:</b> {availability}</div>
        <div><b>Output:</b> <pre className="whitespace-pre-wrap break-words">{output}</pre></div>
      </div>
      <button
        className="mt-4 px-6 py-2 rounded bg-blue-600 text-white font-semibold"
        onClick={onStartOver}
      >
        Start Over
      </button>
    </div>
  );
}
