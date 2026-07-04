"use client";

import * as React from "react";
import { PrinterIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/empty-state";
import { LockIcon } from "lucide-react";
import { ageFromBirthDate, buildDiagnosisDashboard } from "@/modules/diagnosis/services";
import {
  DIRECTION_LABELS,
  VELOCITY_LABELS,
} from "@/modules/strategy/constants/parameters";
import { resolveDietApproach } from "@/modules/strategy/services";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { useStudentPlan } from "@/modules/meal-plan/hooks/use-student-plan";
import { useNutritionistOpinion } from "@/modules/meal-plan/hooks/use-nutritionist-opinion";
import { ROLE_LABELS, MEAL_OBJECTIVES } from "@/modules/meal-plan/constants/parameters";
import type { NutritionistOpinion } from "@/modules/meal-plan/services/nutritionistOpinion";
import { buildPremiumDocument, type PremiumDoc } from "@/modules/reports/services";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex break-inside-avoid flex-col gap-2">
      <h2 className="border-b border-gold/40 pb-1 text-sm font-semibold tracking-wide text-gold uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TipList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2">
          <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-gold" />
          {t}
        </li>
      ))}
    </ul>
  );
}

function OpinionSubList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
      ) : null}
      <ul className="flex flex-col gap-1 text-sm">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2">
            <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-gold" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Parecer do nutricionista no documento premium — no estilo de impressão. */
function ParecerSection({ opinion }: { opinion: NutritionistOpinion }) {
  return (
    <Section title="Parecer do nutricionista">
      <div className="flex flex-col gap-3">
        <p className="border-l-2 border-l-gold pl-3 text-sm font-medium">{opinion.headline}</p>
        <OpinionSubList label="Leitura do caso" items={opinion.reading} />
        <OpinionSubList label="Por que esta estratégia" items={opinion.strategyRationale} />
        <OpinionSubList label="Por que este cardápio" items={opinion.menuRationale} />

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            O que este plano respeita
          </span>
          <ul className="flex flex-col gap-0.5 text-sm">
            {opinion.respects.map((c) => (
              <li key={c.label}>
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground"> — {c.reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {opinion.risks.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Riscos e atenção
            </span>
            <ul className="flex flex-col gap-1 text-sm">
              {opinion.risks.map((r) => (
                <li key={r.title}>
                  <span className="font-medium">{r.title}</span>
                  <span className="text-muted-foreground"> → {r.solution}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {opinion.memory.hasHistory ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Memória e evolução
            </span>
            <p className="text-sm text-muted-foreground">{opinion.memory.headline}</p>
            <OpinionSubList label="" items={opinion.memory.notes} />
          </div>
        ) : null}

        <OpinionSubList label="Próximos passos" items={opinion.nextSteps} />
      </div>
    </Section>
  );
}

function DocBody({ doc, opinion, studentName, goalLabel, dateLabel }: {
  doc: PremiumDoc;
  opinion: NutritionistOpinion | null;
  studentName: string;
  goalLabel: string;
  dateLabel: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-7">
      {/* Capa */}
      <header className="flex flex-col gap-2 border-b-2 border-gold pb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-gold text-xs font-bold text-gold-foreground">
            M
          </span>
          <span className="text-sm font-semibold">Montinho Nutrition Strategy</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Plano Nutricional — {studentName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {goalLabel} · gerado em {dateLabel}
        </p>
      </header>

      <p className="text-[15px] leading-relaxed">{doc.message}</p>

      <Section title="Resumo do diagnóstico">
        <p className="text-sm leading-relaxed">{doc.diagnosis.parecer}</p>
        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {doc.diagnosis.strengths.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-success uppercase">Pontos fortes</span>
              <span className="text-sm">{doc.diagnosis.strengths.join(", ")}</span>
            </div>
          ) : null}
          {doc.diagnosis.weaknesses.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-warning uppercase">Pontos de atenção</span>
              <span className="text-sm">{doc.diagnosis.weaknesses.join(", ")}</span>
            </div>
          ) : null}
        </div>
      </Section>

      <Section title="Objetivos">
        <p className="text-sm">
          <strong>Principal:</strong> {doc.objectives.main ?? "—"}
        </p>
        {doc.objectives.secondary.length > 0 ? (
          <TipList items={doc.objectives.secondary} />
        ) : null}
      </Section>

      <Section title="Estratégia escolhida">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span>Velocidade: <strong>{doc.strategy.velocity}</strong></span>
          <span>Direção: <strong>{doc.strategy.direction}</strong></span>
          <span>Abordagem: <strong>{doc.strategy.approach}</strong></span>
          <span>Refeições/dia: <strong>{doc.strategy.mealsPerDay}</strong></span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{doc.strategy.justification}</p>
      </Section>

      <Section title="Metas de macronutrientes">
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { k: "Calorias", v: `${doc.macros.calories}`, u: "kcal" },
            { k: "Proteína", v: `${doc.macros.proteinG}`, u: "g" },
            { k: "Carboidrato", v: `${doc.macros.carbG}`, u: "g" },
            { k: "Gordura", v: `${doc.macros.fatG}`, u: "g" },
          ].map((m) => (
            <div key={m.k} className="flex flex-col rounded-lg border p-2">
              <span className="text-[10px] tracking-wide text-muted-foreground uppercase">{m.k}</span>
              <span className="text-lg font-semibold tabular-nums">{m.v}</span>
              <span className="text-[10px] text-muted-foreground">{m.u}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Plano alimentar">
        <div className="flex flex-col gap-3">
          {doc.meals.map((meal) => (
            <div key={meal.slot} className="break-inside-avoid rounded-lg border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{meal.title}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {meal.totals.kcal} kcal
                </span>
              </div>
              <span className="text-xs text-gold">{MEAL_OBJECTIVES[meal.slot]}</span>
              <ul className="mt-1.5 flex flex-col gap-1 text-sm">
                {meal.items.map((item) => (
                  <li key={item.role} className="flex items-baseline justify-between gap-2">
                    <span>
                      {item.foodName}
                      <span className="text-muted-foreground">
                        {" "}
                        — {item.grams} g{item.portionLabel ? ` (${item.portionLabel})` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {ROLE_LABELS[item.role]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {opinion ? <ParecerSection opinion={opinion} /> : null}

      <Section title="Substituições">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Cada alimento pode ser trocado por um equivalente do mesmo grupo, mantendo os valores
          nutricionais. Use o app (Plano Alimentar → Trocar) para ver opções com saciedade, preço e
          tempo de preparo — a porção se ajusta sozinha.
        </p>
      </Section>

      <Section title="Lista de compras">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {doc.shoppingList.map((group) => (
            <div key={group.category} className="break-inside-avoid flex flex-col gap-1">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {group.category}
              </span>
              <ul className="flex flex-col gap-0.5 text-sm">
                {group.items.map((it) => (
                  <li key={it.name} className="flex items-baseline justify-between gap-2">
                    <span>{it.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {it.grams} g
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Quantidades por dia — multiplique pelos dias da semana.</p>
      </Section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Section title="Restaurante"><TipList items={doc.guidance.restaurant} /></Section>
        <Section title="Viagens"><TipList items={doc.guidance.travel} /></Section>
        <Section title="Finais de semana"><TipList items={doc.guidance.weekend} /></Section>
        <Section title="Plano B"><TipList items={doc.guidance.planB} /></Section>
      </div>

      <Section title="Hidratação, sono e suplementação">
        {doc.hydrationL ? (
          <p className="text-sm">
            <strong>Água:</strong> mire cerca de {doc.hydrationL.toLocaleString("pt-BR")} L por dia.
          </p>
        ) : null}
        <span className="text-xs font-medium text-muted-foreground uppercase">Sono</span>
        <TipList items={doc.guidance.sleep} />
        <span className="mt-1 text-xs font-medium text-muted-foreground uppercase">Suplementação</span>
        <TipList items={doc.guidance.supplements} />
      </Section>

      <Section title="Cronograma"><TipList items={doc.schedule} /></Section>
      <Section title="Próximos passos"><TipList items={doc.nextSteps} /></Section>

      <footer className="border-t pt-3 text-sm text-muted-foreground">
        Dúvidas? Fale com o seu treinador — este plano evolui com você.
      </footer>
    </div>
  );
}

/**
 * Documento Premium (Workflow V1 — Etapa 7): o plano profissional completo,
 * pronto para impressão/PDF. Reaproveita a cadeia (diagnóstico, estratégia,
 * macros, cardápio) e monta as peças finais (mensagem, lista de compras,
 * orientações). Imprimir isola só o documento.
 */
export function PremiumDocument({ studentId }: { studentId: string }) {
  const { student, input, strategy, macros, scores, plan, mealsPerDay } =
    useStudentPlan(studentId);
  const opinion = useNutritionistOpinion(studentId);

  const dateLabel = React.useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date()),
    [],
  );

  const doc = React.useMemo(() => {
    if (!student?.mainGoal || !strategy || !macros || !scores || !plan || !input || !mealsPerDay) {
      return null;
    }
    const dashboard = buildDiagnosisDashboard({
      answers: {},
      scores,
      goal: student.mainGoal,
      ageYears: ageFromBirthDate(student.birthDate),
      weightKg: input.currentWeightKg,
      heightCm: student.heightCm,
      tdee: macros.tdee,
    });
    const approach = resolveDietApproach(input.dietApproach ?? null, student.mainGoal);
    return buildPremiumDocument({
      firstName: student.fullName.trim().split(/\s+/)[0] ?? "",
      studentName: student.fullName,
      goalLabel: STUDENT_GOAL_LABELS[student.mainGoal],
      ageYears: ageFromBirthDate(student.birthDate),
      generatedAt: dateLabel,
      velocityLabel: VELOCITY_LABELS[strategy.velocity],
      directionLabel: DIRECTION_LABELS[strategy.direction],
      approachLabel: approach.label,
      approachEmphasis: approach.emphasis,
      mealsPerDay,
      macros: {
        calories: macros.calories,
        proteinG: macros.proteinG,
        carbG: macros.carbG,
        fatG: macros.fatG,
      },
      dashboard,
      plan,
      foods: curatedFoods,
    });
  }, [student, strategy, macros, scores, plan, input, mealsPerDay, dateLabel]);

  if (!doc || !student) {
    return (
      <EmptyState
        icon={<LockIcon />}
        title="Conclua as etapas anteriores"
        description="Monte a estratégia e o cardápio para gerar o documento."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #premium-doc, #premium-doc * { visibility: visible !important; }
        #premium-doc { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
      }`}</style>
      <div className="flex justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <PrinterIcon className="size-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>
      <div id="premium-doc" className="rounded-xl border bg-card p-6 print:border-0 print:p-0">
        <DocBody
          doc={doc}
          opinion={opinion}
          studentName={student.fullName}
          goalLabel={STUDENT_GOAL_LABELS[student.mainGoal!]}
          dateLabel={dateLabel}
        />
      </div>
    </div>
  );
}
