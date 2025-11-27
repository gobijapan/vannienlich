import React, { useState, useEffect } from 'react';
import { DailyView } from './components/DailyView';
import { MonthlyView } from './components/MonthlyView';
import { EventList } from './components/EventList';
import { Settings } from './components/Settings';
import { Navigation } from './components/Navigation';
import { ViewMode, AppSettings } from './types';
import { getSettings, getEvents } from './services/storage';
import { getVietnamDate, convertSolarToLunar, convertLunarToSolar, getHolidays } from './services/lunar';

const WALLPAPERS: Record<string, string> = {
    'bg-1': 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600&auto=format&fit=crop&q=80',
    'bg-2': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    'bg-3': 'https://images.unsplash.com/photo-1623150502742-6a849aa94bed?w=600&auto=format&fit=crop&q=80',
    'bg-4': 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=600&auto=format&fit=crop&q=80',
    'bg-5': 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=600&auto=format&fit=crop&q=80',
    'bg-6': 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&auto=format&fit=crop&q=80',
    'bg-7': 'https://images.unsplash.com/photo-1576506542790-512445489979?w=600&auto=format&fit=crop&q=80',
    'bg-8': 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&auto=format&fit=crop&q=80',
    'bg-9': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    'bg-10': 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=600&auto=format&fit=crop&q=80',
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DAILY);
  const [selectedDate, setSelectedDate] = useState<Date>(getVietnamDate());
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      setCurrentView(ViewMode.DAILY);
  };

  // Theme & Font
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-color', settings.themeColor);
    
    if (settings.darkMode) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    // Force font application to body
    document.body.style.setProperty('font-family', `"${settings.fontFamily}", sans-serif`, 'important');
  }, [settings]);

  // Check Reminders (Simulation every minute) - OPTIMIZED FOR CURRENT YEAR
  useEffect(() => {
    const checkReminders = async () => {
        if (Notification.permission !== 'granted') return;
        
        const now = getVietnamDate();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        
        // 1. Check User Created Events
        const events = await getEvents();
        events.forEach(ev => {
            if (!ev.reminders || ev.reminders.length === 0) return;
            if (!ev.reminders.some(r => r.enabled)) return;

            let eventDateCurrentYear: Date | null = null;
            if (ev.type === 'SOLAR') {
                eventDateCurrentYear = new Date(currentYear, ev.month - 1, ev.day);
            } else {
                const solar = convertLunarToSolar(ev.day, ev.month, currentYear, false);
                if (solar) {
                    eventDateCurrentYear = new Date(solar.year, solar.month - 1, solar.day);
                }
            }

            if (!eventDateCurrentYear) return;

            ev.reminders.forEach(r => {
                if (!r.enabled) return;
                let daysBefore = r.type === 'DAYBEFORE_7AM' ? 1 : (r.daysBefore || 0);
                const triggerDate = new Date(eventDateCurrentYear!);
                triggerDate.setDate(triggerDate.getDate() - daysBefore);
                
                if (triggerDate.getDate() === currentDay && 
                    triggerDate.getMonth() + 1 === currentMonth && 
                    triggerDate.getFullYear() === currentYear) {
                    
                    const [targetH, targetM] = (r.time || "07:00").split(':').map(Number);
                    if (now.getHours() === targetH && now.getMinutes() === targetM) {
                         new Notification(`Nhắc nhở: ${ev.title}`, {
                             body: r.daysBefore && r.daysBefore > 0 ? `Sự kiện sẽ diễn ra trong ${r.daysBefore} ngày nữa.` : `Sự kiện diễn ra hôm nay!`,
                             icon: '/icon.png'
                         });
                    }
                }
            });
        });

        // 2. Check System Reminders (Holidays, Moon)
        const currentSettings = getSettings();
        if (currentSettings.enableSystemReminders && currentSettings.systemReminders) {
            
            // Function to trigger system notification
            const triggerSystemNotify = (title: string, daysBefore: number) => {
                 new Notification(title, {
                     body: daysBefore > 0 ? `Sắp đến ngày này trong ${daysBefore} ngày nữa.` : `Hôm nay là ngày đặc biệt!`,
                     icon: '/icon.png'
                 });
            };

            currentSettings.systemReminders.forEach(r => {
                if (!r.enabled) return;
                const daysOffset = r.daysBefore || 0;
                
                // Calculate "Target Date" based on "Trigger Date (Now)"
                // i.e., What date are we reminding ABOUT? -> Today + daysOffset
                const targetDateToCheck = new Date(now);
                targetDateToCheck.setDate(targetDateToCheck.getDate() + daysOffset);

                const tDay = targetDateToCheck.getDate();
                const tMonth = targetDateToCheck.getMonth() + 1;
                const tYear = targetDateToCheck.getFullYear();
                
                // Check if target date is a Holiday/Moon day
                
                // A. Check Lunar (Moon days & Holidays)
                if (currentSettings.notifyMoon || currentSettings.notifyLunarHolidays) {
                    const lunar = convertSolarToLunar(tDay, tMonth, tYear);
                    
                    // Rằm / Mùng 1
                    if (currentSettings.notifyMoon) {
                        if (lunar.day === 1) triggerSystemNotify(daysOffset === 0 ? "Hôm nay là Mùng 1 Âm lịch" : "Sắp đến Mùng 1 Âm lịch", daysOffset);
                        if (lunar.day === 15) triggerSystemNotify(daysOffset === 0 ? "Hôm nay là Rằm" : "Sắp đến ngày Rằm", daysOffset);
                    }

                    // Lunar Holidays
                    if (currentSettings.notifyLunarHolidays) {
                        const hols = getHolidays(tMonth, tYear);
                        // Filter for Lunar only holidays on this specific day
                        const lunarHols = hols.filter(h => h.type === 'LUNAR' && h.day === tDay);
                        lunarHols.forEach(h => triggerSystemNotify(`Lễ: ${h.name}`, daysOffset));
                    }
                }

                // B. Check Solar Holidays
                if (currentSettings.notifySolarHolidays) {
                    const hols = getHolidays(tMonth, tYear);
                    const solarHols = hols.filter(h => h.type === 'SOLAR' && h.day === tDay);
                    solarHols.forEach(h => triggerSystemNotify(`Lễ: ${h.name}`, daysOffset));
                }
            });
        }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case ViewMode.DAILY:
        return <DailyView date={selectedDate} />;
      case ViewMode.MONTHLY:
        return <MonthlyView currentDate={selectedDate} onDateSelect={handleDateSelect} />;
      case ViewMode.EVENTS:
        return <EventList />;
      case ViewMode.SETTINGS:
        return <Settings onSettingsChange={setSettings} />;
      default:
        return <DailyView date={selectedDate} />;
    }
  };

  const bgUrl = WALLPAPERS[settings.backgroundImage] || WALLPAPERS['bg-1'];

  return (
    <div 
        className={`w-full shadow-2xl relative flex flex-col overflow-hidden sm:rounded-[32px] sm:border-8 sm:border-stone-800 transition-colors duration-300 bg-cover bg-center h-[100dvh] sm:h-[90vh] sm:max-w-[420px]`}
        style={{ backgroundImage: `url(${bgUrl})` }}
    >
       {/* Glass Overlay for whole app legibility */}
       <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] z-0"></div>
       
       <div className="h-1 w-full bg-transparent absolute top-0 left-0 z-50 pt-safe"></div>

       <div className="flex-1 overflow-hidden relative z-10">
          {renderContent()}
       </div>

       <div className="relative z-20">
            <Navigation currentView={currentView} onChangeView={setCurrentView} />
       </div>
    </div>
  );
};

export default App;