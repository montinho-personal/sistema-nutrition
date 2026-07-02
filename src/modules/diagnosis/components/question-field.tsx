"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Slider } from "@/shared/components/ui/slider";
import { Badge } from "@/shared/components/ui/badge";
import type { AnswerValue, Question } from "@/modules/diagnosis/types";

interface QuestionFieldProps {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

/** Renderiza uma pergunta conforme o tipo, priorizando clique e escala (Documento 07). */
export function QuestionField({ question, value, onChange }: QuestionFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          {question.label}
          {question.optional ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">(opcional)</span>
          ) : null}
        </label>
        {question.help ? <p className="text-xs text-muted-foreground">{question.help}</p> : null}
      </div>

      {question.type === "single" ? (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((option) => {
            const active = value === option.value;
            return (
              <OptionChip key={option.value} active={active} onClick={() => onChange(option.value)}>
                {option.label}
              </OptionChip>
            );
          })}
        </div>
      ) : null}

      {question.type === "multi" ? (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((option) => {
            const selected = Array.isArray(value) && value.includes(option.value);
            return (
              <OptionChip
                key={option.value}
                active={selected}
                onClick={() => {
                  const current = Array.isArray(value) ? value : [];
                  onChange(
                    selected
                      ? current.filter((v) => v !== option.value)
                      : [...current, option.value],
                  );
                }}
              >
                {option.label}
              </OptionChip>
            );
          })}
        </div>
      ) : null}

      {question.type === "scale" && question.scale ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <Slider
              min={question.scale.min}
              max={question.scale.max}
              step={1}
              value={[
                typeof value === "number"
                  ? value
                  : Math.round((question.scale.max + question.scale.min) / 2),
              ]}
              onValueChange={(v) => onChange(v[0])}
              className="flex-1"
            />
            <Badge variant="secondary" className="w-9 justify-center tabular-nums">
              {typeof value === "number" ? value : "–"}
            </Badge>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{question.scale.minLabel}</span>
            <span>{question.scale.maxLabel}</span>
          </div>
        </div>
      ) : null}

      {question.type === "number" ? (
        <Input
          type="number"
          inputMode="numeric"
          placeholder={question.placeholder}
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="max-w-40"
        />
      ) : null}

      {question.type === "text" ? (
        <Textarea
          placeholder={question.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      ) : null}
    </div>
  );
}

function OptionChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
