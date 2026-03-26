import { DateControl } from "./DateControl";
import PlanPicker from "./PlanPicker";
import { AnchorType, PlanSummary } from "types/app";
import { WeekStartsOn } from "../ch/datecalc";
import { RacePlan } from "../ch/dategrid";
import { format } from "../ch/localize";

interface Props {
  availablePlans: PlanSummary[];
  selectedPlan: PlanSummary;
  selectedDate: Date;
  anchorType: AnchorType;
  racePlan: RacePlan | undefined;
  dateChangeHandler: (d: Date) => void;
  anchorTypeChangeHandler: (anchorType: AnchorType) => void;
  selectedPlanChangeHandler: (p: PlanSummary) => void;
  weekStartsOn: WeekStartsOn;
}

const PlanAndDate = ({
  selectedPlan,
  selectedPlanChangeHandler,
  availablePlans,
  selectedDate,
  anchorType,
  racePlan,
  dateChangeHandler,
  anchorTypeChangeHandler,
  weekStartsOn,
}: Props) => {
  const modeLabel = anchorType === "start" ? "starting on" : "ending on";
  const dateLabel = anchorType === "start" ? "Start date" : "End date";
  const derivedDate =
    anchorType === "start"
      ? racePlan?.planDates.planEndDate
      : racePlan?.planDates.planStartDate;
  const derivedLabel =
    anchorType === "start" ? "Computed end date" : "Computed start date";
  const weekCount = racePlan?.dateGrid.weekCount;

  return (
    <div className="plan-and-date">
      <div className="plan-and-date-card">
        <h3 className="section-title">Training plan</h3>
        <PlanPicker
          availablePlans={availablePlans}
          selectedPlan={selectedPlan}
          planChangeHandler={selectedPlanChangeHandler}
        />
        <p className="plan-meta">
          <strong>{selectedPlan[2]}</strong>
          {weekCount ? ` - ${weekCount} weeks` : ""}
        </p>
        <p className="control-hint">
          Choose the base schedule here. You can still customize workouts below using drag-and-drop.
        </p>
      </div>
      <div className="plan-and-date-card">
        <h3 className="section-title">Schedule anchor</h3>
        <div className="anchor-type-picker picker-field">
          <label className="field-label" htmlFor="anchor-type-picker">Schedule by</label>
          <select
            id="anchor-type-picker"
            className="select"
            value={anchorType}
            onChange={(e) =>
              anchorTypeChangeHandler(e.currentTarget.value as AnchorType)
            }
          >
            <option value="start">Start date</option>
            <option value="end">End date</option>
          </select>
        </div>
        <div className="picker-field">
          <span className="field-label">{modeLabel}</span>
          <DateControl
            label={dateLabel}
            selectedDate={selectedDate}
            onDateChanged={dateChangeHandler}
            weekStartsOn={weekStartsOn}
          />
        </div>
        <p className="derived-date">
          <strong>{derivedLabel}:</strong> {derivedDate ? format(derivedDate) : "-"}
        </p>
      </div>
    </div>
  );
};

export default PlanAndDate;
