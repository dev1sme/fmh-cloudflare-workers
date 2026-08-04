/**
 * Builds `SET col = ?` fragments for a partial update.
 *
 * Column names come from a fixed allowlist at each call site — never from
 * request data — and values are always bound, never interpolated.
 */
export function buildSet(patch: Record<string, unknown>): {
  clause: string;
  values: unknown[];
} | null {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return null;

  return {
    clause: entries.map(([column]) => `${column} = ?`).join(", "),
    values: entries.map(([, value]) => value),
  };
}

/** Collects `WHERE` conditions that are only applied when a filter is present. */
export class Where {
  private readonly conditions: string[] = [];
  private readonly values: unknown[] = [];

  add(condition: string, value: unknown): this {
    if (value !== undefined && value !== null) {
      this.conditions.push(condition);
      this.values.push(value);
    }
    return this;
  }

  /** Condition with no bound value, e.g. `ngay_ra IS NULL`. */
  addRaw(condition: string, enabled: boolean): this {
    if (enabled) this.conditions.push(condition);
    return this;
  }

  clause(): string {
    return this.conditions.length === 0 ? "" : ` WHERE ${this.conditions.join(" AND ")}`;
  }

  bindings(): unknown[] {
    return this.values;
  }
}
