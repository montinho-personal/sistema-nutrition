"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { CheckIcon, SlidersHorizontalIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { KCAL_PER_GRAM } from "@/modules/strategy/constants/parameters";
import { macroOverrideSchema, type MacroOverrideValues } from "@/modules/strategy/validators";
import type { MacroOverride } from "@/modules/strategy/types";

interface MacroOverrideFormProps {
  /** Valores iniciais (normalmente os macros calculados no momento). */
  initial: MacroOverride;
  onSubmit: (override: MacroOverride) => void;
  onCancel: () => void;
}

/** Converte um percentual das calorias em gramas do macro (para o preview). */
function gramsFor(calories: number, pct: number, kcalPerGram: number): number {
  if (!Number.isFinite(calories) || !Number.isFinite(pct)) return 0;
  return Math.round((calories * pct) / 100 / kcalPerGram);
}

/**
 * Ajuste manual de calorias e da divisão de macros pelo treinador. O sistema
 * segue flexível: quando salvo, estes números substituem o cálculo automático
 * na estratégia e no plano alimentar.
 */
export function MacroOverrideForm({ initial, onSubmit, onCancel }: MacroOverrideFormProps) {
  const form = useForm<MacroOverrideValues>({
    resolver: zodResolver(macroOverrideSchema),
    mode: "onChange",
    defaultValues: {
      calories: initial.calories,
      proteinPct: initial.proteinPct,
      carbPct: initial.carbPct,
      fatPct: initial.fatPct,
    },
  });

  const calories = useWatch({ control: form.control, name: "calories" });
  const proteinPct = useWatch({ control: form.control, name: "proteinPct" });
  const carbPct = useWatch({ control: form.control, name: "carbPct" });
  const fatPct = useWatch({ control: form.control, name: "fatPct" });
  const total = (proteinPct || 0) + (carbPct || 0) + (fatPct || 0);
  const totalOk = Math.abs(total - 100) <= 1;

  const pctFields = [
    { name: "proteinPct" as const, label: "Proteína %", kcal: KCAL_PER_GRAM.protein },
    { name: "carbPct" as const, label: "Carboidrato %", kcal: KCAL_PER_GRAM.carb },
    { name: "fatPct" as const, label: "Gordura %", kcal: KCAL_PER_GRAM.fat },
  ];

  return (
    <Card className="max-w-lg border-l-2 border-l-gold">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontalIcon className="size-4 text-gold" />
          Ajustar calorias e macros
        </CardTitle>
        <CardDescription>
          Defina os números que você quer para este aluno. Eles substituem o cálculo automático — na
          estratégia e no plano alimentar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => onSubmit(v))}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="calories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calorias-alvo (kcal)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      step="10"
                      placeholder="Ex.: 2200"
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

            <div className="grid grid-cols-3 gap-3">
              {pctFields.map((f) => (
                <FormField
                  key={f.name}
                  control={form.control}
                  name={f.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{f.label}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          step="1"
                          value={field.value === undefined || Number.isNaN(field.value) ? "" : field.value}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? NaN : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground">
                        {gramsFor(calories, field.value, f.kcal)} g
                      </p>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div
              className={cn(
                "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
                totalOk
                  ? "border-success/30 text-success"
                  : "border-destructive/30 text-destructive",
              )}
            >
              <span>Soma dos macros</span>
              <span className="font-semibold">
                {Math.round(total)}% {totalOk ? "· ok" : "· precisa somar 100%"}
              </span>
            </div>
            {/* Mensagem de validação da soma (schema aponta para carbPct). */}
            <FormField
              control={form.control}
              name="carbPct"
              render={() => (
                <FormItem className="-mt-2">
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Button type="submit" variant="gold" disabled={!form.formState.isValid}>
                <CheckIcon className="size-4" />
                Aplicar ajuste
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
