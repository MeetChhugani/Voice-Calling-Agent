import { FilterCondition } from "@/types/workflow";

export interface FilterResult {
  passed: boolean;
  field: string;
  fieldValue: unknown;
  operator: string;
  targetValue: unknown;
  reason: string;
}

export class FilterService {
  /**
   * Evaluate a condition against a record
   */
  static evaluate(condition: FilterCondition, data: Record<string, unknown>): FilterResult {
    const fieldValue = data[condition.field];
    const targetValue = condition.value;

    let passed = false;

    switch (condition.operator) {
      case "equals":
        passed = fieldValue === targetValue || String(fieldValue) === String(targetValue);
        break;
      case "not_equals":
        passed = fieldValue !== targetValue && String(fieldValue) !== String(targetValue);
        break;
      case "greater_than":
        passed = Number(fieldValue) > Number(targetValue);
        break;
      case "greater_than_or_equal":
        passed = Number(fieldValue) >= Number(targetValue);
        break;
      case "less_than":
        passed = Number(fieldValue) < Number(targetValue);
        break;
      case "contains":
        passed = String(fieldValue || "")
          .toLowerCase()
          .includes(String(targetValue || "").toLowerCase());
        break;
      default:
        passed = false;
    }

    return {
      passed,
      field: condition.field,
      fieldValue,
      operator: condition.operator,
      targetValue,
      reason: passed
        ? `Condition met: ${condition.field} (${fieldValue}) ${condition.operator} ${targetValue}. Passed to downstream nodes.`
        : `Filtered out: ${condition.field} (${fieldValue}) did not satisfy ${condition.operator} ${targetValue}. Execution stopped before sheet/notification.`,
    };
  }
}
