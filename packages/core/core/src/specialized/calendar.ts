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
  firstDayOfWeek?: number | undefined; // 0 = Sunday, 1 = Monday, etc.
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES_SUNDAY_START = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export class CalendarController {
  public readonly id: string;
  public visibleDate: Date;
  public selectedDate: Date | null = null;
  public selectedDates: Date[] = [];
  public selectionMode: CalendarSelectionMode;
  public firstDayOfWeek: number;
  public showNextPrevMonth: boolean;
  public showTitle: boolean;
  public showDayHeader: boolean;
  public showGridLines: boolean;
  public titleFormat: CalendarTitleFormat;
  public nextPrevFormat: CalendarNextPrevFormat;
  public nextMonthText: string;
  public prevMonthText: string;

  public readonly dayRender = new EventDispatcher<CalendarController, DayRenderEventArgs>();
  public readonly selectionChanged = new EventDispatcher<CalendarController, SelectionChangedEventArgs>();
  public readonly visibleMonthChanged = new EventDispatcher<CalendarController, MonthChangedEventArgs>();
  public readonly stateChanged = new EventDispatcher<CalendarController, CalendarState>();

  constructor(options: CalendarOptions = {}) {
    this.id = options.id ?? `Calendar_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();
    this.visibleDate = options.visibleDate ? new Date(options.visibleDate.getTime()) : new Date(now.getFullYear(), now.getMonth(), 1);

    if (options.selectedDate) {
      this.selectedDate = new Date(options.selectedDate.getTime());
      this.selectedDates = [new Date(options.selectedDate.getTime())];
    } else if (options.selectedDates && options.selectedDates.length > 0) {
      this.selectedDates = options.selectedDates.map((d) => new Date(d.getTime()));
      this.selectedDate = this.selectedDates[0] ? new Date(this.selectedDates[0].getTime()) : null;
    }

    this.selectionMode = options.selectionMode ?? "Day";
    this.firstDayOfWeek = options.firstDayOfWeek ?? 0;
    this.showNextPrevMonth = options.showNextPrevMonth ?? true;
    this.showTitle = options.showTitle ?? true;
    this.showDayHeader = options.showDayHeader ?? true;
    this.showGridLines = options.showGridLines ?? false;
    this.titleFormat = options.titleFormat ?? "MonthYear";
    this.nextPrevFormat = options.nextPrevFormat ?? "CustomText";
    this.nextMonthText = options.nextMonthText ?? ">";
    this.prevMonthText = options.prevMonthText ?? "<";
  }

  get titleText(): string {
    const month = MONTH_NAMES[this.visibleDate.getMonth()] ?? "";
    const year = this.visibleDate.getFullYear();
    if (this.titleFormat === "Month") {
      return month;
    }
    return `${month} ${year}`;
  }

  get dayHeaders(): string[] {
    const headers: string[] = [];
    for (let i = 0; i < 7; i++) {
      const idx = (this.firstDayOfWeek + i) % 7;
      const dayName = DAY_NAMES_SUNDAY_START[idx];
      if (dayName) {
        headers.push(dayName);
      }
    }
    return headers;
  }

  async nextMonth(): Promise<void> {
    const previousDate = new Date(this.visibleDate.getTime());
    const nextDate = new Date(this.visibleDate.getFullYear(), this.visibleDate.getMonth() + 1, 1);
    this.visibleDate = nextDate;
    await this.visibleMonthChanged.emit(this, { previousDate, newDate: nextDate });
    this.emitState();
  }

  async prevMonth(): Promise<void> {
    const previousDate = new Date(this.visibleDate.getTime());
    const prevDate = new Date(this.visibleDate.getFullYear(), this.visibleDate.getMonth() - 1, 1);
    this.visibleDate = prevDate;
    await this.visibleMonthChanged.emit(this, { previousDate, newDate: prevDate });
    this.emitState();
  }

  async setVisibleDate(date: Date): Promise<void> {
    const previousDate = new Date(this.visibleDate.getTime());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), 1);
    this.visibleDate = targetDate;
    await this.visibleMonthChanged.emit(this, { previousDate, newDate: targetDate });
    this.emitState();
  }

  async selectDate(date: Date): Promise<boolean> {
    if (this.selectionMode === "None") return false;

    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (!(await this.canSelect(normalized))) return false;   // a dayRender handler marked it unselectable
    this.selectedDate = normalized;
    this.selectedDates = [normalized];

    await this.selectionChanged.emit(this, {
      selectedDate: this.selectedDate,
      selectedDates: [...this.selectedDates],
    });
    this.emitState();
    return true;
  }

  async selectWeek(dateInWeek: Date): Promise<boolean> {
    if (this.selectionMode !== "DayWeek" && this.selectionMode !== "DayWeekMonth") {
      return false;
    }

    const startOfWeek = new Date(dateInWeek.getFullYear(), dateInWeek.getMonth(), dateInWeek.getDate());
    const dayOfWeek = startOfWeek.getDay();
    const diff = (dayOfWeek - this.firstDayOfWeek + 7) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diff);

    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
      if (await this.canSelect(d)) weekDates.push(d);        // unselectable days are left out
    }
    if (weekDates.length === 0) return false;

    this.selectedDate = weekDates[0] ? new Date(weekDates[0].getTime()) : null;
    this.selectedDates = weekDates;

    await this.selectionChanged.emit(this, {
      selectedDate: this.selectedDate,
      selectedDates: [...this.selectedDates],
    });
    this.emitState();
    return true;
  }

  async selectMonth(dateInMonth: Date): Promise<boolean> {
    if (this.selectionMode !== "DayWeekMonth") {
      return false;
    }

    const year = dateInMonth.getFullYear();
    const month = dateInMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthDates: Date[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      if (await this.canSelect(d)) monthDates.push(d);       // unselectable days are left out
    }
    if (monthDates.length === 0) return false;

    this.selectedDate = monthDates[0] ? new Date(monthDates[0].getTime()) : null;
    this.selectedDates = monthDates;

    await this.selectionChanged.emit(this, {
      selectedDate: this.selectedDate,
      selectedDates: [...this.selectedDates],
    });
    this.emitState();
    return true;
  }

  async clearSelection(): Promise<void> {
    this.selectedDate = null;
    this.selectedDates = [];
    await this.selectionChanged.emit(this, {
      selectedDate: null,
      selectedDates: [],
    });
    this.emitState();
  }

  isDateSelected(date: Date): boolean {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    return this.selectedDates.some(
      (sel) => sel.getFullYear() === y && sel.getMonth() === m && sel.getDate() === d
    );
  }

  /** Builds one calendar cell and lets `dayRender` handlers decorate it (and veto selection). */
  private async renderDay(d: Date, today: Date, year: number, month: number): Promise<CalendarDay> {
    const isOtherMonth = d.getMonth() !== month || d.getFullYear() !== year;
    const dayOfWeek = d.getDay();
    const dayObj: CalendarDay = {
      date: d,
      dayNumberText: d.getDate().toString(),
      isOtherMonth,
      isSelectable: this.selectionMode !== "None",
      isSelected: this.isDateSelected(d),
      isToday:
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      cellText: d.getDate().toString(),
    };
    const renderArgs: DayRenderEventArgs = {
      day: dayObj,
      cellText: dayObj.cellText,
      customMarkup: undefined,
      cssClass: undefined,
      isSelectable: dayObj.isSelectable,
    };
    await this.dayRender.emit(this, renderArgs);
    dayObj.cellText = renderArgs.cellText;
    dayObj.customMarkup = renderArgs.customMarkup;
    dayObj.cssClass = renderArgs.cssClass;
    dayObj.isSelectable = renderArgs.isSelectable;
    return dayObj;
  }

  /** True when `dayRender` handlers leave the date selectable. */
  private async canSelect(date: Date): Promise<boolean> {
    const day = await this.renderDay(date, new Date(), this.visibleDate.getFullYear(), this.visibleDate.getMonth());
    return day.isSelectable;
  }

  async getDaysMatrix(): Promise<CalendarDay[][]> {
    const today = new Date();
    const year = this.visibleDate.getFullYear();
    const month = this.visibleDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const firstDayIndex = firstOfMonth.getDay();
    const offset = (firstDayIndex - this.firstDayOfWeek + 7) % 7;

    const startDate = new Date(year, month, 1 - offset);

    const matrix: CalendarDay[][] = [];
    const currentDatePointer = new Date(startDate.getTime());

    for (let row = 0; row < 6; row++) {
      const weekRow: CalendarDay[] = [];
      for (let col = 0; col < 7; col++) {
        const dayObj = await this.renderDay(new Date(currentDatePointer.getTime()), today, year, month);
        weekRow.push(dayObj);
        currentDatePointer.setDate(currentDatePointer.getDate() + 1);
      }
      matrix.push(weekRow);
    }

    return matrix;
  }

  getState(): CalendarState {
    return {
      visibleDate: new Date(this.visibleDate.getTime()),
      selectedDate: this.selectedDate ? new Date(this.selectedDate.getTime()) : null,
      selectedDates: this.selectedDates.map((d) => new Date(d.getTime())),
      selectionMode: this.selectionMode,
      firstDayOfWeek: this.firstDayOfWeek,
      titleText: this.titleText,
      nextMonthText: this.nextMonthText,
      prevMonthText: this.prevMonthText,
      dayHeaders: this.dayHeaders,
    };
  }

  private emitState(): void {
    this.stateChanged.emit(this, this.getState());
  }
}
