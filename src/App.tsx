import React, { useState } from "react";
import { repo } from "./ch/planrepo";
import { endOfWeek, addWeeks, isAfter } from "date-fns";
import { RacePlan } from "./ch/dategrid";
import { build, swap, swapDow } from "./ch/planbuilder";
import { CalendarGrid } from "./components/CalendarGrid";
import { toIcal } from "./ch/icalservice";
import { toCsv } from "./ch/csvService";
import { download } from "./ch/downloadservice";
import UnitsButtons from "./components/UnitsButtons";
import PlanAndDate from "./components/PlanAndDate";
import UndoButton from "./components/UndoButton";
import history from "./defy/history";
import {
  useQueryParams,
  StringParam,
  DateParam,
  NumberParam,
} from "use-query-params";
import { PlanDetailsCard } from "./components/PlanDetailsCard";
import { WeekStartsOn, WeekStartsOnValues } from "./ch/datecalc";
import WeekStartsOnPicker from "./components/WeekStartsOnPicker";
import { useMountEffect } from "./ch/hooks";
import { AnchorType, Units, PlanSummary, dayOfWeek } from "types/app";
import { getLocaleUnits } from "./ch/localize";

const App = () => {
  const [{ u, p, d, s, a }, setq] = useQueryParams({
    u: StringParam,
    p: StringParam,
    d: DateParam,
    s: NumberParam,
    a: StringParam,
  });
  const [selectedUnits, setSelectedUnits] = useState<Units>(
    u === "mi" || u === "km" ? u : getLocaleUnits(),
  );
  var [selectedPlan, setSelectedPlan] = useState(repo.find(p || ""));
  var [racePlan, setRacePlan] = useState<RacePlan | undefined>(undefined);
  var [undoHistory, setUndoHistory] = useState([] as RacePlan[]);
  var [weekStartsOn, setWeekStartsOn] = useState<WeekStartsOn>(
    s === 0 || s === 1 || s === 6 ? s : WeekStartsOnValues.Monday,
  );
  var [anchorType, setAnchorType] = useState<AnchorType>(
    a === "start" ? "start" : "end",
  );
  var [anchorDate, setAnchorDate] = useState(
    d && isAfter(d, new Date())
      ? d
      : addWeeks(endOfWeek(new Date(), { weekStartsOn: weekStartsOn }), 20),
  );

  useMountEffect(() => {
    initialLoad(selectedPlan, anchorDate, selectedUnits, weekStartsOn, anchorType);
  });

  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    // listen for changes to the URL and force the app to re-render
    history.listen(() => {
      forceUpdate();
    });
  }, []);

  const getParams = (
    units: Units,
    plan: PlanSummary,
    date: Date,
    weekStartsOn: WeekStartsOn,
    anchorType: AnchorType,
  ) => {
    return {
      u: units,
      p: plan[0],
      d: date,
      s: weekStartsOn,
      a: anchorType,
    };
  };

  const initialLoad = async (
    plan: PlanSummary,
    date: Date,
    units: Units,
    weekStartsOn: WeekStartsOn,
    anchorType: AnchorType,
  ) => {
    const racePlan = build(await repo.fetch(plan), date, weekStartsOn, anchorType);
    setRacePlan(racePlan);
    setUndoHistory([racePlan]);
    setq(getParams(units, plan, date, weekStartsOn, anchorType));
  };

  const onSelectedPlanChange = async (plan: PlanSummary) => {
    const racePlan = build(
      await repo.fetch(plan),
      anchorDate,
      weekStartsOn,
      anchorType,
    );
    setSelectedPlan(plan);
    setRacePlan(racePlan);
    setUndoHistory([racePlan]);
    setq(getParams(selectedUnits, plan, anchorDate, weekStartsOn, anchorType));
  };

  const onSelectedAnchorDateChange = async (date: Date) => {
    const racePlan = build(
      await repo.fetch(selectedPlan),
      date,
      weekStartsOn,
      anchorType,
    );
    setAnchorDate(date);
    setRacePlan(racePlan);
    setUndoHistory([racePlan]);
    setq(getParams(selectedUnits, selectedPlan, date, weekStartsOn, anchorType));
  };

  const onAnchorTypeChanged = async (newAnchorType: AnchorType) => {
    const racePlan = build(
      await repo.fetch(selectedPlan),
      anchorDate,
      weekStartsOn,
      newAnchorType,
    );
    setAnchorType(newAnchorType);
    setRacePlan(racePlan);
    setUndoHistory([racePlan]);
    setq(
      getParams(
        selectedUnits,
        selectedPlan,
        anchorDate,
        weekStartsOn,
        newAnchorType,
      ),
    );
  };

  const onSelectedUnitsChanged = (u: Units) => {
    setSelectedUnits(u);
    setq(getParams(u, selectedPlan, anchorDate, weekStartsOn, anchorType));
  };

  const onWeekStartsOnChanged = async (v: WeekStartsOn) => {
    const racePlan = build(await repo.fetch(selectedPlan), anchorDate, v, anchorType);
    setWeekStartsOn(v);
    setRacePlan(racePlan);
    setUndoHistory([racePlan]);
    setq(getParams(selectedUnits, selectedPlan, anchorDate, v, anchorType));
  };

  function swapDates(d1: Date, d2: Date): void {
    if (racePlan) {
      const newRacePlan = swap(racePlan, d1, d2);
      setRacePlan(newRacePlan);
      setUndoHistory((history) => [...history, newRacePlan]);
    }
  }

  function doSwapDow(dow1: dayOfWeek, dow2: dayOfWeek) {
    if (racePlan) {
      const newRacePlan = swapDow(racePlan, dow1, dow2);
      setRacePlan(newRacePlan);
      setUndoHistory((history) => [...history, newRacePlan]);
    }
  }

  function downloadIcalHandler() {
    if (racePlan) {
      const eventsStr = toIcal(racePlan, selectedUnits);
      if (eventsStr) {
        download(eventsStr, "plan", "ics");
      }
    }
  }

  function downloadCsvHandler() {
    if (racePlan) {
      const eventsStr = toCsv(racePlan, selectedUnits, weekStartsOn);
      if (eventsStr) {
        download(eventsStr, "plan", "csv");
      }
    }
  }

  function undoHandler() {
    if (undoHistory.length <= 1) {
      return;
    }

    const newHistory = undoHistory.slice(0, -1);
    setUndoHistory(newHistory);
    setRacePlan(newHistory[newHistory.length - 1]);
  }

  return (
    <>
      <PlanAndDate
        availablePlans={repo.available}
        selectedPlan={selectedPlan}
        selectedDate={anchorDate}
        anchorType={anchorType}
        racePlan={racePlan}
        dateChangeHandler={onSelectedAnchorDateChange}
        anchorTypeChangeHandler={onAnchorTypeChanged}
        selectedPlanChangeHandler={onSelectedPlanChange}
        weekStartsOn={weekStartsOn}
      />
      <div className="controls-grid">
        <section className="control-section" aria-label="Plan settings">
          <h2 className="control-title">Settings</h2>
          <div className="control-row">
            <div className="control-field">
              <span className="field-label">Distance units</span>
              <div className="units">
                <UnitsButtons
                  units={selectedUnits}
                  unitsChangeHandler={onSelectedUnitsChanged}
                />
              </div>
            </div>
            <div className="control-field">
              <WeekStartsOnPicker
                weekStartsOn={weekStartsOn}
                changeHandler={onWeekStartsOnChanged}
                showHeading={false}
              />
            </div>
          </div>
        </section>
        <section className="control-section" aria-label="Plan actions">
          <h2 className="control-title">Actions</h2>
          <div className="control-row control-actions">
            <details className="export-menu">
              <summary className="app-button app-button--primary export-summary">Export plan</summary>
              <div className="export-options">
                <button
                  className="app-button app-button--menu"
                  onClick={downloadIcalHandler}
                  disabled={!racePlan}
                >
                  iCalendar (.ics)
                </button>
                <button
                  className="app-button app-button--menu"
                  onClick={downloadCsvHandler}
                  disabled={!racePlan}
                >
                  CSV (.csv)
                </button>
              </div>
            </details>
            <UndoButton
              className="app-button--ghost"
              disabled={undoHistory.length <= 1}
              undoHandler={undoHandler}
            />
          </div>
        </section>
      </div>
      <PlanDetailsCard racePlan={racePlan} />
      <div className="main-ui">
        {racePlan && (
          <CalendarGrid
            racePlan={racePlan}
            units={selectedUnits}
            weekStartsOn={weekStartsOn}
            swapDates={swapDates}
            swapDow={doSwapDow}
          />
        )}
      </div>
    </>
  );
};

export default App;
