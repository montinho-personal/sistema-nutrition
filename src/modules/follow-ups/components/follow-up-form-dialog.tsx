"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Slider } from "@/shared/components/ui/slider";
import {
  MEASUREMENT_KEYS,
  MEASUREMENT_LABELS,
  SCALE_LABELS,
} from "@/modules/follow-ups/constants/parameters";
import { followUpFormSchema, type FollowUpFormValues } from "@/modules/follow-ups/validators";
import type {
  FollowUpInput,
  FollowUpMeasurements,
  FollowUpScales,
} from "@/modules/follow-ups/types";

interface FollowUpFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: FollowUpInput) => void;
  /** Data padrão (yyyy-mm-dd) e peso sugerido (último conhecido). */
  defaultDate: string;
  suggestedWeight: number;
}

const SCALE_KEYS: (keyof FollowUpScales)[] = ["adherence", "hunger", "sleep", "energy", "mood"];

const EMPTY_MEASUREMENTS = {
  waist: null,
  abdomen: null,
  hip: null,
  chest: null,
  arm: null,
  thigh: null,
};

/** Mantém só as medidas preenchidas; devolve null quando nenhuma foi informada. */
function cleanMeasurements(raw: FollowUpFormValues["measurements"]): FollowUpMeasurements | null {
  const result: FollowUpMeasurements = {};
  for (const key of MEASUREMENT_KEYS) {
    const value = raw[key];
    if (typeof value === "number" && !Number.isNaN(value)) result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Registro de um acompanhamento (React Hook Form + Zod). */
export function FollowUpFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultDate,
  suggestedWeight,
}: FollowUpFormDialogProps) {
  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      date: defaultDate,
      weightKg: suggestedWeight,
      scales: { adherence: 7, hunger: 5, sleep: 6, energy: 6, mood: 6 },
      measurements: { ...EMPTY_MEASUREMENTS },
      whatWorked: null,
      whatFailed: null,
      why: null,
    },
  });

  // Ao reabrir, refletir a data/peso sugeridos atuais.
  React.useEffect(() => {
    if (open)
      form.reset({
        ...form.getValues(),
        date: defaultDate,
        weightKg: suggestedWeight,
        measurements: { ...EMPTY_MEASUREMENTS },
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate, suggestedWeight]);

  function handleSubmit(values: FollowUpFormValues) {
    onSubmit({ ...values, measurements: cleanMeasurements(values.measurements) });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo acompanhamento</DialogTitle>
          <DialogDescription>
            Registre o peso e como foi o período. É isso que torna o sistema mais preciso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? NaN : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-lg border p-3">
              {SCALE_KEYS.map((key) => (
                <Controller
                  key={key}
                  control={form.control}
                  name={`scales.${key}`}
                  render={({ field }) => (
                    <div className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-sm">{SCALE_LABELS[key]}</span>
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        className="flex-1"
                      />
                      <span className="w-6 text-right text-sm tabular-nums text-muted-foreground">
                        {field.value}
                      </span>
                    </div>
                  )}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-lg border p-3">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Medidas (cm) — opcional
              </span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {MEASUREMENT_KEYS.map((key) => (
                  <Controller
                    key={key}
                    control={form.control}
                    name={`measurements.${key}`}
                    render={({ field }) => (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {MEASUREMENT_LABELS[key]}
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          placeholder="—"
                          value={typeof field.value === "number" ? field.value : ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? null : Number(e.target.value))
                          }
                          className="h-9"
                        />
                      </div>
                    )}
                  />
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="whatWorked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O que funcionou? (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatFailed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O que não funcionou? (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="why"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Por quê? (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
