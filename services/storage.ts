
import { UserEvent, AppSettings } from '../types';
import { convertSolarToLunar, convertLunarToSolar, getVietnamDate, getHolidays } from './lunar';

const STORAGE_KEY = 'lich_van_nien_events';
const SETTINGS_KEY = 'lich_van_nien_settings';

export const saveEvent = async (event: UserEvent): Promise<void> => {
    const events = await getEvents();
    events.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

export const updateEvent = async (updatedEvent: UserEvent): Promise<void> => {
    const events = await getEvents();
    const index = events.findIndex(e => e.id === updatedEvent.id);
    if (index !== -1) {
        events[index] = updatedEvent;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
};

export const getEvents = async (): Promise<UserEvent[]> => {
    const str = localStorage.getItem(STORAGE_KEY);
    return str ? JSON.parse(str) : [];
};

export const deleteEvent = async (id: string): Promise<void> => {
    const events = await getEvents();
    const newEvents = events.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
};

export const getEventsForDate = async (solarDay: number, solarMonth: number, solarYear: number): Promise<UserEvent[]> => {
    const events = await getEvents();
    const lunar = convertSolarToLunar(solarDay, solarMonth, solarYear);
    
    return events.filter(ev => {
        if (ev.type === 'SOLAR') {
            return ev.day === solarDay && ev.month === solarMonth;
        } else {
            return ev.day === lunar.day && ev.month === lunar.month;
        }
    });
};

// Check if a specific date triggers any reminder for the current year
export const hasReminderOnDate = (date: Date, events: UserEvent[]): boolean => {
    // FIX: Only show bell icon if the year being viewed is the CURRENT REAL-TIME YEAR
    const vnDate = getVietnamDate();
    if (date.getFullYear() !== vnDate.getFullYear()) {
        return false;
    }

    const checkDay = date.getDate();
    const checkMonth = date.getMonth() + 1;
    const checkYear = date.getFullYear();

    for (const ev of events) {
        if (!ev.reminders || ev.reminders.length === 0) continue;
        if (!ev.reminders.some(r => r.enabled)) continue;

        // 1. Determine the Solar Date of the Event in the Grid's Year
        let eventSolarDate: Date | null = null;

        if (ev.type === 'SOLAR') {
             eventSolarDate = new Date(checkYear, ev.month - 1, ev.day);
        } else {
             const solar = convertLunarToSolar(ev.day, ev.month, checkYear, false); 
             if (solar) {
                 eventSolarDate = new Date(solar.year, solar.month - 1, solar.day);
             }
        }

        if (!eventSolarDate) continue;

        // 2. Check each reminder
        for (const r of ev.reminders) {
            if (!r.enabled) continue;
            
            let daysBefore = 0;
            if (r.type === 'DAYBEFORE_7AM') daysBefore = 1;
            if (r.type === 'CUSTOM') daysBefore = r.daysBefore || 0;
            
            // Calculate Trigger Date
            const triggerDate = new Date(eventSolarDate);
            triggerDate.setDate(triggerDate.getDate() - daysBefore);
            
            if (triggerDate.getDate() === checkDay && 
                triggerDate.getMonth() + 1 === checkMonth && 
                triggerDate.getFullYear() === checkYear) {
                return true;
            }
        }
    }
    return false;
};

// Get list of events that are triggering a reminder TODAY
export const getRemindingEvents = (date: Date, events: UserEvent[]): UserEvent[] => {
    const vnDate = getVietnamDate();
    // Only valid if date is today (logic-wise for "Today's reminders")
    // But function is generic. However, logic for reminders is Year-bound to current year.
    if (date.getFullYear() !== vnDate.getFullYear()) return [];

    const checkDay = date.getDate();
    const checkMonth = date.getMonth() + 1;
    const checkYear = date.getFullYear();
    
    const remindingEvents: UserEvent[] = [];

    for (const ev of events) {
        if (!ev.reminders || ev.reminders.length === 0) continue;
        if (!ev.reminders.some(r => r.enabled)) continue;

        let eventSolarDate: Date | null = null;
        if (ev.type === 'SOLAR') {
             eventSolarDate = new Date(checkYear, ev.month - 1, ev.day);
        } else {
             const solar = convertLunarToSolar(ev.day, ev.month, checkYear, false); 
             if (solar) {
                 eventSolarDate = new Date(solar.year, solar.month - 1, solar.day);
             }
        }

        if (!eventSolarDate) continue;

        for (const r of ev.reminders) {
            if (!r.enabled) continue;
            
            let daysBefore = 0;
            if (r.type === 'DAYBEFORE_7AM') daysBefore = 1;
            if (r.type === 'CUSTOM') daysBefore = r.daysBefore || 0;
            
            const triggerDate = new Date(eventSolarDate);
            triggerDate.setDate(triggerDate.getDate() - daysBefore);
            
            if (triggerDate.getDate() === checkDay && 
                triggerDate.getMonth() + 1 === checkMonth && 
                triggerDate.getFullYear() === checkYear) {
                remindingEvents.push(ev);
                break; // Event is added once
            }
        }
    }
    return remindingEvents;
};

export const getActiveSystemReminders = (date: Date, settings: AppSettings): string[] => {
    const messages: string[] = [];
    if (!settings.enableSystemReminders || !settings.systemReminders) return messages;

    settings.systemReminders.forEach(r => {
        if (!r.enabled) return;
        const daysOffset = r.daysBefore || 0;
        
        // We want to know if 'date' (today) matches (TargetEventDate - daysOffset)
        // Equivalently: TargetEventDate = date + daysOffset
        const targetDate = new Date(date);
        targetDate.setDate(date.getDate() + daysOffset);

        const tDay = targetDate.getDate();
        const tMonth = targetDate.getMonth() + 1;
        const tYear = targetDate.getFullYear();
        
        // Check Moon
        if (settings.notifyMoon) {
            const lunar = convertSolarToLunar(tDay, tMonth, tYear);
            if (lunar.day === 1) messages.push(daysOffset === 0 ? "Hôm nay là Mùng 1 Âm lịch" : `Còn ${daysOffset} ngày nữa là Mùng 1 Âm lịch`);
            if (lunar.day === 15) messages.push(daysOffset === 0 ? "Hôm nay là ngày Rằm" : `Còn ${daysOffset} ngày nữa là ngày Rằm`);
        }

        // Check Holidays (Solar)
        if (settings.notifySolarHolidays) {
            const hols = getHolidays(tMonth, tYear);
            hols.filter(h => h.type === 'SOLAR' && h.day === tDay).forEach(h => {
                    messages.push(daysOffset === 0 ? `Hôm nay là ${h.name}` : `Còn ${daysOffset} ngày nữa tới ${h.name}`);
            });
        }
        
        // Check Holidays (Lunar)
        if (settings.notifyLunarHolidays) {
                const hols = getHolidays(tMonth, tYear);
                hols.filter(h => h.type === 'LUNAR' && h.day === tDay).forEach(h => {
                    messages.push(daysOffset === 0 ? `Hôm nay là ${h.name}` : `Còn ${daysOffset} ngày nữa tới ${h.name}`);
            });
        }
    });
    
    // Remove duplicates
    return Array.from(new Set(messages));
}

export const saveSettings = (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = (): AppSettings => {
    const str = localStorage.getItem(SETTINGS_KEY);
    const defaults: AppSettings = {
        userName: 'Bạn',
        birthDate: '',
        darkMode: false,
        themeColor: '#B91C1C', 
        fontFamily: 'Playfair Display',
        backgroundImage: 'bg-1', 
        startWeekDay: 1,
        // New System Reminders Defaults
        enableSystemReminders: true,
        notifyMoon: true,
        notifySolarHolidays: true,
        notifyLunarHolidays: true,
        systemReminders: [
            { type: 'SAMEDAY_7AM', enabled: true, daysBefore: 0, time: '07:00' }
        ]
    };
    
    if (str) {
        return { ...defaults, ...JSON.parse(str) };
    }
    return defaults;
};
