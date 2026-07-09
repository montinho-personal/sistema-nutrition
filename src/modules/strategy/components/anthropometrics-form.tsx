"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ScaleIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { strategyInputSchema, type StrategyInputValues } from "@/modules/strategy/validators";
import type { StrategyInput } from "@/modules/strategy/types";

interface AnthropometricsFormProps {
  initial: StrategyInput | null;
  /** Peso relatado na anamnese — pré-preenche o campo na primeira vez. */
  suggestedWeightKg?: number | null;
  onSubmit: (input: StrategyInput) => void;
  submitLabel?: string;
}

/**
 * Coleta os únicos dados que a anamnese não captura e que os macros exigem:
 * peso atual e (opcional) % de gordura. O resto vem do diagnóstico.
 */
export function AnthropometricsForm({ initial, suggestedWeightKg, onSubmit, submitLabel }: AnthropometricsFormProps) {
  const form = useForm<StrategyInputValues>({
    resolver: zodResolver(strategyInputSchema),
    defaultValues: {
      currentWeightKg: initial?.currentWeightKg ?? suggestedWeightKg ?? ("" as unknown as number),
      bodyFatPct: initial?.bodyFatPct ?? null,
    },
  });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScaleIcon className="size-4 text-gold" />
          Dados para o cálculo dos macros
        </CardTitle>
        <CardDescription>
          A estratégia já está definida. Agora só falta o peso atual para calcular as calorias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentWeightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso atual (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="Ex.: 82"
                        value={field.value === undefined || Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? NaN : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bodyFatPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>% de gordura (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="Ex.: 22"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>Se informado, usamos Katch-McArdle (mais preciso).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-fit">
              {submitLabel ?? "Calcular macros"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
