import { build } from "./planbuilder";
import { WeekStartsOnValues } from "./datecalc";
import { TrainingPlan } from "types/app";

const samplePlan: TrainingPlan = {
  id: "sample-plan",
  name: "Sample Plan",
  description: "sample",
  units: "mi",
  type: "5K",
  source: "https://example.com",
  schedule: [
    {
      description: "week 1",
      workouts: [
        { title: "D1", description: "", tags: ["Run"], distance: [1], units: "mi" },
        { title: "D2", description: "", tags: ["Run"], distance: [2], units: "mi" },
        { title: "D3", description: "", tags: ["Run"], distance: [3], units: "mi" },
        { title: "D4", description: "", tags: ["Run"], distance: [4], units: "mi" },
        { title: "D5", description: "", tags: ["Run"], distance: [5], units: "mi" },
        { title: "D6", description: "", tags: ["Run"], distance: [6], units: "mi" },
        { title: "D7", description: "", tags: ["Run"], distance: [7], units: "mi" },
      ],
    },
  ],
};

describe("planbuilder anchor scheduling", function () {
  it("keeps end-date scheduling behavior unchanged", function () {
    const endDate = new Date(2026, 4, 10);
    const plan = build(samplePlan, endDate, WeekStartsOnValues.Monday, "end");

    expect(plan.planDates.planStartDate).toEqual(new Date(2026, 4, 4));
    expect(plan.planDates.planEndDate).toEqual(endDate);
    expect(plan.dateGrid.getEvent(new Date(2026, 4, 4))?.title).toEqual("D1");
    expect(plan.dateGrid.getEvent(new Date(2026, 4, 10))?.title).toEqual("D7");
  });

  it("schedules forward when anchored by start date", function () {
    const startDate = new Date(2026, 4, 4);
    const plan = build(samplePlan, startDate, WeekStartsOnValues.Monday, "start");

    expect(plan.planDates.planStartDate).toEqual(startDate);
    expect(plan.planDates.planEndDate).toEqual(new Date(2026, 4, 10));
    expect(plan.dateGrid.getEvent(startDate)?.title).toEqual("D1");
    expect(plan.dateGrid.getEvent(new Date(2026, 4, 10))?.title).toEqual("D7");
  });

  it("mode switching with same selected date keeps that date as the anchor", function () {
    const selectedDate = new Date(2026, 6, 1);
    const endAnchored = build(
      samplePlan,
      selectedDate,
      WeekStartsOnValues.Monday,
      "end",
    );
    const startAnchored = build(
      samplePlan,
      selectedDate,
      WeekStartsOnValues.Monday,
      "start",
    );

    expect(endAnchored.planDates.planEndDate).toEqual(selectedDate);
    expect(startAnchored.planDates.planStartDate).toEqual(selectedDate);
  });
});
