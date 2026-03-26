import { createEvents, EventAttributes } from "ics";
import { addDays } from "date-fns";
import { RacePlan } from "./dategrid";
import { getWeekDistance, render, renderDist } from "./rendering";
import { Units } from "types/app";

function normalize(value: string | undefined): string {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function shouldDropRestEvent(summary: string): boolean {
  const normalized = normalize(summary);
  return normalized === "rest" || normalized === "rest or cross-train";
}

function simplifyWorkout(summary: string, description: string): [string, string] {
  let title = summary.trim();
  let desc = description.trim();

  const withIndex = title.toLowerCase().indexOf(" with ");
  if (withIndex > 0) {
    const details = title.slice(withIndex + 6).trim();
    title = title.slice(0, withIndex).trim();
    desc = details;
  }

  if (normalize(title) === normalize(desc)) {
    desc = "";
  }

  return [title, desc];
}

// public for testing
export function toDate(d: Date): [number, number, number] {
  return [d.getFullYear(), 1 + d.getMonth(), d.getDate()];
}

export function toIcal(plan: RacePlan, units: Units): string | undefined {
  const events = new Array<EventAttributes>();
  let weeks = plan.dateGrid.weeks;

  const weeklyTotals = weeks
    .map((week, i) => {
      const distance = getWeekDistance(week, units);
      if (distance.length === 0 || distance[0] <= 0) {
        return undefined;
      }
      return `Week ${1 + i}: ${renderDist(distance, units, units)}`;
    })
    .filter((x): x is string => !!x);

  if (weeklyTotals.length > 0) {
    events.push({
      title: "Training Plan Weekly Totals",
      uid: `${plan.planDates.planStartDate.toISOString()}-weekly-totals`,
      timestamp: Date.now(),
      description: weeklyTotals.join("\n"),
      start: toDate(plan.planDates.planStartDate),
      end: toDate(addDays(plan.planDates.planStartDate, 1)),
    });
  }

  for (let i = 0; i < weeks.length; i++) {
    const currWeek = weeks[i];

    for (var j = 0; j < currWeek.days.length; j++) {
      const currWorkout = currWeek.days[j];
      if (currWorkout.event) {
        const [renderedTitle, renderedDesc] = render(
          currWorkout.event,
          plan.sourceUnits,
          units,
        );
        let title = (renderedTitle || "").trim();
        let desc = (renderedDesc || "").replace(/(\r\n|\n|\r)/gm, "\n");
        if (shouldDropRestEvent(title)) {
          continue;
        }

        [title, desc] = simplifyWorkout(title, desc);

        const safeTitle = title || "Workout";

        events.push({
          title: safeTitle,
          uid: `${currWorkout.date.toISOString()}-${i}-${j}`,
          timestamp: Date.now(),
          description: desc,
          start: toDate(currWorkout.date),
          end: toDate(addDays(currWorkout.date, 1)), // end dates are non-inclusive in iCal
        });
      }
    }
  }
  let res = createEvents(events);
  if (res.error) {
    console.log("Error creating iCal events: " + res.error);
    return undefined;
  }
  return res.value;
}