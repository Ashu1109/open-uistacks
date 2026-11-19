"use client";

import { useState } from "react";
import { EvalScorecard, type EvalMetric } from "../ui/eval-scorecard";
import { SegmentedControl } from "../ui/segmented-control";

/* LLM ops eval scorecard: a card (1/2 or 1/3 width of 12 columns) showing one model's evaluation scores against its baseline, with a switcher to compare models. */

export interface ModelEval {
  id: string;
  name: string;
  metrics: EvalMetric[];
}

export const DEMO_MODEL_EVALS: ModelEval[] = [
  {
    id: "halo-2",
    name: "Halo 2",
    metrics: [
      { label: "Answer accuracy", score: 0.91, baseline: 0.88 },
      { label: "Groundedness", score: 0.86, baseline: 0.89 },
      { label: "Instruction following", score: 0.93, baseline: 0.9 },
      { label: "Safety", score: 0.98, baseline: 0.98 },
    ],
  },
  {
    id: "lumen-m",
    name: "Lumen M",
    metrics: [
      { label: "Answer accuracy", score: 0.84, baseline: 0.8 },
      { label: "Groundedness", score: 0.79, baseline: 0.75 },
      { label: "Instruction following", score: 0.88, baseline: 0.87 },
      { label: "Safety", score: 0.96, baseline: 0.97 },
    ],
  },
  {
    id: "orbit-s",
    name: "Orbit S",
    metrics: [
      { label: "Answer accuracy", score: 0.72, baseline: 0.74 },
      { label: "Groundedness", score: 0.7, baseline: 0.66 },
      { label: "Instruction following", score: 0.81, baseline: 0.78 },
      { label: "Safety", score: 0.94, baseline: 0.94 },
    ],
  },
];

export interface LlmOpsEvalScorecardProps {
  models?: ModelEval[];
  threshold?: number;
  className?: string;
}

export function LlmOpsEvalScorecard({ models = DEMO_MODEL_EVALS, threshold = 0.85, className = "" }: LlmOpsEvalScorecardProps) {
  const [id, setId] = useState(models[0]?.id);
  const model = models.find((m) => m.id === id) ?? models[0];
  if (!model) return null;
  return (
    <section aria-label="Evaluation scorecard by model" className={`@container grid gap-3 ${className}`}>
      <SegmentedControl label="Model" size="sm" options={models.map((m) => ({ value: m.id, label: m.name }))} value={model.id} onValueChange={setId} />
      <EvalScorecard title={`${model.name} evaluation`} metrics={model.metrics} threshold={threshold} />
    </section>
  );
}
