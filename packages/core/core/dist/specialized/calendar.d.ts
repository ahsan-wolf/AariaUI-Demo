import { EventDispatcher } from "../events.js";
export type CalendarSelectionMode = "None" | "Day" | "DayWeek" | "DayWeekMonth";
export type CalendarTitleFormat = "MonthYear" | "Month";
export type CalendarNextPrevFormat = "ShortMonth" | "FullMonth" | "CustomText";
export interface CalendarDay {
    date: Date;
    dayNumberText: string;
    isOtherMonth: boolean;
    isSelectable: boolean;
    isSelected: boolean;
    isToday: boolean;
    isWeekend: boolean;
    cellText?: string | undefined;
    customMarkup?: string | undefined;
    cssClass?: string | undefined;
}
export interface DayRenderEventArgs {
    day: CalendarDay;
    cellText?: string | undefined;
    customMarkup?: string | undefined;
    cssClass?: string | undefined;
    isSelectable: boolean;
}
export interface SelectionChangedEventArgs {
    selectedDate: Date | null;
    selectedDates: Date[];
}
export interface MonthChangedEventArgs {
    previousDate: Date;
    newDate: Date;
}
export interface CalendarOptions {
    id?: string | undefined;
    visibleDate?: Date | undefined;
    selectedDate?: Date | undefined;
    selectedDates?: Date[] | undefined;
    selectionMode?: CalendarSelectionMode | undefined;
    firstDayOfWeek?: number | undefined;
    showNextPrevMonth?: boolean | undefined;
    showTitle?: boolean | undefined;
    showDayHeader?: boolean | undefined;
    showGridLines?: boolean | undefined;
    titleFormat?: CalendarTitleFormat | undefined;
    nextPrevFormat?: CalendarNextPrevFormat | undefined;
    nextMonthText?: string | undefined;
    prevMonthText?: string | undefined;
}
export interface CalendarState {
    visibleDate: Date;
    selectedDate: Date | null;
    selectedDates: Date[];
    selectionMode: CalendarSelectionMode;
    firstDayOfWeek: number;
    titleText: string;
    nextMonthText: string;
    prevMonthText: string;
    dayHeaders: string[];
}
export declare class CalendarController {
    readonly id: string;
    visibleDate: Date;
    selectedDate: Date | null;
    selectedDates: Date[];
    selectionMode: CalendarSelectionMode;
    firstDayOfWeek: number;
    showNextPrevMonth: boolean;
    showTitle: boolean;
    showDayHeader: boolean;
    showGridLines: boolean;
    titleFormat: CalendarTitleFormat;
    nextPrevFormat: CalendarNextPrevFormat;
    nextMonthText: string;
    prevMonthText: string;
    readonly dayRender: EventDispatcher<CalendarController, DayRenderEventArgs>;
    readonly selectionChanged: EventDispatcher<CalendarController, SelectionChangedEventArgs>;
    readonly visibleMonthChanged: EventDispatcher<CalendarController, MonthChangedEventArgs>;
    readonly stateChanged: EventDispatcher<CalendarController, CalendarState>;
    constructor(options?: CalendarOptions);
    get titleText(): string;
    get dayHeaders(): string[];
    nextMonth(): Promise<void>;
    prevMonth(): Promise<void>;
    setVisibleDate(date: Date): Promise<void>;
    selectDate(date: Date): Promise<boolean>;
    selectWeek(dateInWeek: Date): Promise<boolean>;
    selectMonth(dateInMonth: Date): Promise<boolean>;
    clearSelection(): Promise<void>;
    isDateSelected(date: Date): boolean;
    /** Builds one calendar cell and lets `dayRender` handlers decorate it (and veto selection). */
    private renderDay;
    /** True when `dayRender` handlers leave the date selectable. */
    private canSelect;
    getDaysMatrix(): Promise<CalendarDay[][]>;
    getState(): CalendarState;
    private emitState;
}
