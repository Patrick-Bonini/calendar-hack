import { createEvents, EventAttributes } from "ics";
import { addDays } from "date-fns";
import { RacePlan } from "./dategrid";
import { getWeekDistance, render, renderDist } from "./rendering";
import { Units } from "types/app";

function normalize(value: string | undefined): string {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

type RestLabelKind = "none" | "pure-rest" | "cross-train";

function classifyRestLabel(summary: string): RestLabelKind {
  const normalized = normalize(summary).replace(/[\/_-]/g, " ");

  if (!normalized) {
    return "none";
  }

  if (
    normalized === "rest" ||
    normalized === "rest day" ||
    normalized === "off day"
  ) {
    return "pure-rest";
  }

  if (
    normalized.includes("cross train") ||
    normalized.includes("cross training") ||
    normalized.includes("strength training")
  ) {
    return "cross-train";
  }

  return "none";
}

function shouldDropRestEvent(summary: string, keepPureRest: boolean): boolean {
  const kind = classifyRestLabel(summary);

  if (kind === "none") {
    return false;
  }

  if (kind === "cross-train") {
    return true;
  }

  return !keepPureRest;
}

function shouldKeepPureRestEvents(plan: RacePlan, units: Units): boolean {
  let hasPureRest = false;
  let hasCrossTrainRest = false;

  const weeks = plan.dateGrid.weeks;
  for (let i = 0; i < weeks.length; i++) {
    const currWeek = weeks[i];
    for (let j = 0; j < currWeek.days.length; j++) {
      const currWorkout = currWeek.days[j];
      if (!currWorkout.event) {
        continue;
      }

      const [renderedTitle] = render(currWorkout.event, plan.sourceUnits, units);
      const kind = classifyRestLabel(renderedTitle || "");
      if (kind === "pure-rest") {
        hasPureRest = true;
      } else if (kind === "cross-train") {
        hasCrossTrainRest = true;
      }

      if (hasPureRest && hasCrossTrainRest) {
        return true;
      }
    }
  }

  return false;
}

function simplifyWorkout(summary: string, description: string): [string, string] {
  let title = summary.trim().replace(/(\r\n|\n|\r)/gm, "\n");
  let desc = description.trim().replace(/(\r\n|\n|\r)/gm, "\n");

  // Many plan titles include ", consisting of:" and all details after it.
  // Keep concise title and move the workout details into description.
  const consistingOfMatch = title.match(/,?\s+consisting of:?\s*/i);
  if (consistingOfMatch && typeof consistingOfMatch.index === "number") {
    const detailsStart = consistingOfMatch.index + consistingOfMatch[0].length;
    const details = title.slice(detailsStart).trim();
    title = title.slice(0, consistingOfMatch.index).trim().replace(/,$/, "");
    desc = details;
  }

  const withIndex = title.toLowerCase().indexOf(" with ");
  if (withIndex > 0) {
    const details = title.slice(withIndex + 6).trim();
    title = title.slice(0, withIndex).trim();
    desc = details;
  }

  // If title still has line breaks, keep first line as title and move the rest to description.
  const titleParts = title
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  if (titleParts.length > 1) {
    title = titleParts[0];
    desc = titleParts.slice(1).join("\n");
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
  const keepPureRest = shouldKeepPureRestEvents(plan, units);

  weeks.forEach((week, i) => {
    const distance = getWeekDistance(week, units);
    if (distance.length === 0 || distance[0] <= 0) {
      return;
    }

    const weekStart = week.days[0]?.date;
    if (!weekStart) {
      return;
    }

    const weekLabel = `Week ${1 + i}: ${renderDist(distance, units, units)}`;
    events.push({
      title: "Training Plan Weekly Total",
      uid: `${weekStart.toISOString()}-weekly-total-${1 + i}`,
      description: weekLabel,
      start: toDate(weekStart),
      end: toDate(addDays(weekStart, 1)),
      transp: "TRANSPARENT",
      busyStatus: "FREE",
    });
  });

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
        if (shouldDropRestEvent(title, keepPureRest)) {
          continue;
        }

        [title, desc] = simplifyWorkout(title, desc);

        const safeTitle = title || "Workout";

        events.push({
          title: safeTitle,
          uid: `${currWorkout.date.toISOString()}-${i}-${j}`,
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