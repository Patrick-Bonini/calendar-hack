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

  return (
    <div className="plan-and-date">
      <PlanPicker
        availablePlans={availablePlans}
        selectedPlan={selectedPlan}
        planChangeHandler={selectedPlanChangeHandler}
      />
      <div className="anchor-type-picker">
        <h3>schedule by</h3>
        <select
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
      <h3>{modeLabel}</h3>
      <DateControl
        label={dateLabel}
        selectedDate={selectedDate}
        onDateChanged={dateChangeHandler}
        weekStartsOn={weekStartsOn}
      />
      <h3>{derivedLabel}: {derivedDate ? format(derivedDate) : "-"}</h3>
    </div>
  );
};

export default PlanAndDate;
