"use client";

import dynamic from "next/dynamic";

const FieldGoalGame = dynamic(() => import("@/components/FieldGoalGame"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center">
      <div className="h-[400px] w-full max-w-[500px] animate-pulse bg-paper" />
    </div>
  ),
});

export default function FieldGoalSection() {
  return <FieldGoalGame />;
}
