import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createPortal } from "react-dom";
import { WeekStartsOn } from "../ch/datecalc";
import { format } from "../ch/localize";

interface Props {
  label: string;
  selectedDate: Date;
  onDateChanged: (date: Date) => void;
  weekStartsOn: WeekStartsOn;
}
interface ButtonProps {
  label: string;
  selectedDate: Date;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}

// using a class component to avoid "Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?"
class DateInputButton extends React.Component<ButtonProps> {
  render() {
    if (!this.props.selectedDate) {
      return <p></p>;
    }
    return (
      <button
        type="button"
        className="app-button"
        aria-label={`${this.props.label}: ${format(this.props.selectedDate)}`}
        onClick={this.props.onClick}
      >
        <span>{this.props.label}: {format(this.props.selectedDate)}</span>
      </button>
    );
  }
}

// using a class component to avoid "Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?"
export class DateControl extends React.Component<Props> {
  render() {
    const popperContainer = ({
      children,
    }: {
      children: React.ReactNode;
    }) => createPortal(children, document.body);

    const input = (
      <DateInputButton
        label={this.props.label}
        selectedDate={this.props.selectedDate}
        onClick={() => {}}
      />
    );

    const { selectedDate, onDateChanged, weekStartsOn } = this.props;
    return (
      <div className="date-picker-wrapper">
        <DatePicker
          selected={selectedDate}
          onChange={onDateChanged}
          dateFormat="P"
          customInput={input}
          calendarStartDay={weekStartsOn}
          popperContainer={popperContainer}
          popperPlacement="bottom-start"
        />
      </div>
    );
  }
}
