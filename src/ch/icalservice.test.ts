import { eachDayOfInterval } from "date-fns";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { register, unregister } from "timezone-mock";
import { toDate, toIcal } from "./icalservice";
import { build } from "./planbuilder";
import { WeekStartsOnValues } from "./datecalc";
import { TrainingPlan } from "types/app";

beforeAll(() => {
  register("Europe/London");
});

afterAll(() => {
  unregister();
});

it("should handle date intervals in which timezone offset changes (e.g. daylight savings)", () => {
  // Date range includes March 26 2023 when London enters daylight savings
  const dates: Date[] = eachDayOfInterval({
    start: new Date(2023, 2, 25),
    end: new Date(2023, 2, 28),
  });

  const actual = dates.map(toDate);
  const expected = [
    [2023, 3, 25],
    [2023, 3, 26],
    [2023, 3, 27],
    [2023, 3, 28],
  ];
  expect(actual).toEqual(expected);
});

function normalizePlan(raw: unknown): TrainingPlan {
  const plan = raw as TrainingPlan;
  plan.schedule.forEach((week) => {
    week.workouts.forEach((workout) => {
      workout.description = workout.description || workout.title || "";
      workout.tags = workout.tags || [];
      workout.distance = workout.distance || [];
      workout.units = workout.units || plan.units;
    });
  });
  return plan;
}

function unfoldIcs(ics: string): string {
  return ics.replace(/\r?\n[ \t]/g, "");
}

function lineValue(block: string, key: string): string {
  const match = block.match(new RegExp(`^${key}:(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

it("should clean exported events for real plans without hardcoded workout strings", () => {
  const planFiles = [
    "hansons_adv_mara.json",
    "higdon_int_mara1.json",
    "pfitz_18_55.json",
  ];

  planFiles.forEach((planFile) => {
    const fullPath = join(process.cwd(), "public", "plans", "json", planFile);
    const raw = JSON.parse(readFileSync(fullPath, "utf8"));
    const trainingPlan = normalizePlan(raw);
    const racePlan = build(
      trainingPlan,
      new Date(2026, 9, 25),
      WeekStartsOnValues.Monday,
    );

    const ics = toIcal(racePlan, trainingPlan.units);
    expect(ics).toBeDefined();

    const text = unfoldIcs(ics as string);
    const events = text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
    expect(events.length).toBeGreaterThan(0);
    expect(text).toContain("SUMMARY:Training Plan Weekly Totals");
    expect(text).toContain("DESCRIPTION:Week 1:");
    expect(text).not.toContain("Weekly distance:");

    // Rule checks on generated output, independent of specific workout values.
    events.forEach((eventBlock) => {
      const summary = lineValue(eventBlock, "SUMMARY");
      const description = lineValue(eventBlock, "DESCRIPTION");
      const normalizedSummary = summary.toLowerCase().trim();
      const normalizedDescription = description.toLowerCase().trim();

      expect(normalizedSummary).not.toBe("rest");
      expect(normalizedSummary).not.toBe("rest or cross-train");
      expect(normalizedSummary.includes("training week")).toBe(false);
      expect(normalizedSummary.includes("distance")).toBe(false);
      expect(normalizedSummary.includes(" with ")).toBe(false);

      if (description) {
        expect(normalizedDescription).not.toBe(normalizedSummary);
      }
    });
  });
});
