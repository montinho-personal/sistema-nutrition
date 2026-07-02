import * as React from "react";

import { Badge } from "@/shared/components/ui/badge";
import { CLASSIFICATION_LABELS } from "@/modules/foods/constants";
import type { StrategicClassification } from "@/modules/foods/types";

const variantByClassification: Record<
  StrategicClassification,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  excellent: "success",
  good: "success",
  neutral: "secondary",
  poor: "warning",
  context_dependent: "gold",
};

/** Badge da classificação estratégica de um alimento (Documento 15). */
export function FoodClassificationBadge({
  classification,
}: {
  classification: StrategicClassification;
}) {
  return (
    <Badge variant={variantByClassification[classification]}>
      {CLASSIFICATION_LABELS[classification]}
    </Badge>
  );
}
