
export interface SolarDate {
  day: number;
  month: number;
  year: number;
  weekDay: number; // 0 (CN) - 6 (T7)
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: number; // 0: không nhuận, 1: nhuận
  jd: number; // Julian Day
  canChiDay: string;
  canChiMonth: string;
  canChiYear: string;
  tietKhi: string;
  nguHanh: string; 
  truc: string;    
  sao: string;     
  gioHoangDao: string[];
}

export interface DayInfo {
  solar: SolarDate;
  lunar: LunarDate;
  isHoliday: boolean;
}

export interface Holiday {
    day: number;
    month: number;
    name: string;
    type: 'SOLAR' | 'LUNAR';
}

export interface Reminder {
  type: 'SAMEDAY_7AM' | 'DAYBEFORE_7AM' | 'CUSTOM';
  daysBefore?: number; // Number of days before event
  time?: string; // "HH:mm" format
  enabled: boolean;
}

export interface UserEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  type: 'SOLAR' | 'LUNAR';
  day: number;
  month: number;
  startYear?: number;
  reminders: Reminder[];
  uid: string;
}

export type AnimationMode = 'SLIDE' | 'FADE' | 'ZOOM' | 'FLIP' | 'CARDS';

export interface AppSettings {
  userName: string;
  birthDate: string; 
  darkMode: boolean;
  themeColor: string;
  fontFamily: string;
  backgroundImage: string; // URL or preset ID
  startWeekDay: number; // 0 for Sunday, 1 for Monday
  animationMode: AnimationMode; // New Animation Setting
  
  // System Reminders
  enableSystemReminders: boolean;
  notifyMoon: boolean; // Rằm, Mùng 1
  notifySolarHolidays: boolean;
  notifyLunarHolidays: boolean;
  systemReminders: Reminder[];
}

export enum ViewMode {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  EVENTS = 'EVENTS',
  SETTINGS = 'SETTINGS'
}
