
import React, { useEffect, useState } from 'react';
import { DayInfo, UserEvent, Holiday } from '../types';
import { convertSolarToLunar, getLunarMonthDays, getBuddhistYear, getHolidays } from '../services/lunar';
import { getEventsForDate, hasReminderOnDate, getEvents, getRemindingEvents, getSettings, getActiveSystemReminders } from '../services/storage';
import { ChevronLeft } from './Icons';
import { EventDetailModal } from './EventDetailModal';

interface DailyViewProps {
  date: Date;
  onBack?: () => void;
}

export const DailyView: React.FC<DailyViewProps> = ({ date, onBack }) => {
  const [todaysEvents, setTodaysEvents] = useState<UserEvent[]>([]);
  const [todaysHolidays, setTodaysHolidays] = useState<Holiday[]>([]);
  const [vnTimeStr, setVnTimeStr] = useState<string>("");
  const [hasActiveReminder, setHasActiveReminder] = useState(false);
  const [remindingEvents, setRemindingEvents] = useState<UserEvent[]>([]);
  const [systemReminders, setSystemReminders] = useState<string[]>([]);
  
  // Modals
  const [selectedEvent, setSelectedEvent] = useState<UserEvent | null>(null);
  const [showReminderList, setShowReminderList] = useState(false);

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const lunar = convertSolarToLunar(day, month, year);
  const info: DayInfo = {
      solar: { day, month, year, weekDay: date.getDay() },
      lunar: lunar,
      isHoliday: false, 
  };
  
  const daysInLunarMonth = getLunarMonthDays(lunar.month, lunar.year, lunar.leap === 1);
  const lunarMonthType = daysInLunarMonth === 30 ? "Đủ" : "Thiếu";
  const dayOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][info.solar.weekDay];
  const plYear = getBuddhistYear(lunar.day, lunar.month, year);

  useEffect(() => {
      const tick = () => {
          const now = new Date();
          const timeString = now.toLocaleTimeString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
          });
          setVnTimeStr(timeString);
      };
      tick();
      const timer = setInterval(tick, 1000);
      return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Events happening TODAY
    getEventsForDate(day, month, year).then(setTodaysEvents);
    
    // Check if TODAY is a reminder day for ANY event
    getEvents().then(allEvents => {
        const isReminderDay = hasReminderOnDate(date, allEvents);
        setHasActiveReminder(isReminderDay);
        if (isReminderDay) {
            setRemindingEvents(getRemindingEvents(date, allEvents));
        } else {
            setRemindingEvents([]);
        }
    });

    // Get Fixed Holidays for today
    const monthHols = getHolidays(month, year);
    const dayHols = monthHols.filter(h => h.day === day);
    setTodaysHolidays(dayHols);

    // Get System Reminders
    const settings = getSettings();
    const activeSysReminders = getActiveSystemReminders(date, settings);
    setSystemReminders(activeSysReminders);

  }, [day, month, year, date]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden animate-fade-in" key={date.toISOString()}>
       
       <div className="h-4 shrink-0"></div>

       {/* HEADER */}
       <div className="shrink-0 px-4 py-2 flex justify-between items-center relative z-10 text-stone-800 dark:text-stone-100">
          {onBack && (
              <button onClick={onBack} className="absolute left-4 top-2 p-2 -ml-2 hover:text-[var(--theme-color)] transition z-20 bg-white/50 dark:bg-black/20 rounded-full backdrop-blur-sm">
                  <ChevronLeft className="w-6 h-6" />
              </button>
          )}
          
          <div className={`flex flex-col ${onBack ? 'ml-10' : ''}`}>
             <span className="text-3xl font-bold leading-none drop-shadow-sm">
                Tháng {info.solar.month}
             </span>
             <span className="text-sm opacity-70 font-medium">{info.solar.year}</span>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="text-sm font-bold uppercase tracking-wider">{dayOfWeek}</div>
             <div className="text-xs bg-[var(--theme-color)] text-white px-2 py-0.5 rounded-full mt-1 font-bold shadow-sm">
                 PL: {plYear}
             </div>
          </div>
       </div>

       {/* CONTENT */}
       <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 pt-2 flex flex-col">
          
          {/* CLOCK */}
          <div className="mb-4 glass-panel rounded-full py-2 px-5 flex items-center justify-center gap-3 w-max mx-auto shadow-sm border border-white/40">
             <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
             <span className="font-bold text-xl text-[var(--theme-color)] tabular-nums">{vnTimeStr}</span>
             <span className="text-[10px] font-bold uppercase text-stone-500 ml-1">Giờ VN</span>
          </div>

          {/* MAIN CARD */}
          <div className="glass-panel rounded-[2rem] shadow-float mb-6 relative p-0 text-center transform transition-all border border-white/50 dark:border-white/10 flex flex-col shrink-0">
             
             {/* Solar - Big Number (Centered Vertically) */}
             <div className="h-40 sm:h-48 flex items-center justify-center bg-gradient-to-b from-transparent to-stone-50/50 dark:to-black/20 relative">
                <div className="text-[8rem] sm:text-[10rem] leading-none font-bold text-[var(--theme-color)] drop-shadow-[4px_8px_12px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] font-sans -mt-4">
                    {info.solar.day}
                </div>
             </div>
             
             {/* Divider */}
             <div className="w-full h-[1px] bg-[var(--theme-color)] opacity-20"></div>

             {/* Lunar Section */}
             <div className="bg-stone-50/50 dark:bg-black/40 p-4 rounded-b-[2rem] flex flex-col justify-center">
                
                {/* Lunar Date Row (Day | Month) */}
                <div className="flex justify-center items-center gap-6 mb-5 text-stone-700 dark:text-stone-200">
                    <div className="flex flex-col items-center min-w-[60px]">
                         <span className="text-4xl font-bold">{info.lunar.day}</span>
                         <span className="text-[10px] uppercase opacity-60 font-bold mt-1">Ngày Âm</span>
                    </div>
                    
                    <div className="h-10 w-[2px] bg-stone-300 dark:bg-stone-600/50 rounded-full"></div>
                    
                    <div className="flex flex-col items-center min-w-[60px]">
                         <div className="flex items-center gap-2">
                             <span className="text-4xl font-bold">{info.lunar.month}</span>
                             {info.lunar.leap === 1 && (
                                 <span className="text-[10px] font-bold uppercase bg-red-600 text-white px-2 py-1 rounded-lg shadow-sm">
                                     Nhuận
                                 </span>
                             )}
                         </div>
                         <span className="text-[10px] uppercase opacity-60 font-bold mt-1">Tháng {lunarMonthType}</span>
                    </div>
                </div>

                {/* Can Chi 3 Columns */}
                <div className="grid grid-cols-3 divide-x divide-stone-300 dark:divide-stone-600 border-t border-stone-200 dark:border-stone-700 pt-4">
                    <div className="flex flex-col items-center px-1">
                        <span className="text-sm font-bold text-stone-800 dark:text-white truncate w-full text-center">{info.lunar.canChiDay}</span>
                        <span className="text-[9px] uppercase opacity-50 mt-1">Ngày</span>
                    </div>
                    <div className="flex flex-col items-center px-1">
                        <span className="text-sm font-bold text-stone-800 dark:text-white truncate w-full text-center">{info.lunar.canChiMonth}</span>
                        <span className="text-[9px] uppercase opacity-50 mt-1">Tháng</span>
                    </div>
                    <div className="flex flex-col items-center px-1">
                        <span className="text-sm font-bold text-stone-800 dark:text-white truncate w-full text-center">{info.lunar.canChiYear}</span>
                        <span className="text-[9px] uppercase opacity-50 mt-1">Năm</span>
                    </div>
                </div>
             </div>
          </div>

          {/* EVENTS & HOLIDAYS (Replacing Ngũ Hành Năm) */}
          <div className="mb-4 space-y-3">
             
             {/* System Reminders Card */}
             {systemReminders.length > 0 && (
                 <div className="glass-panel p-3 rounded-xl flex items-center gap-3 bg-purple-50 dark:bg-purple-900/10 border-l-4 border-l-purple-500 animate-fade-in shadow-sm">
                     <div className="p-2 bg-purple-100 dark:bg-purple-800/30 rounded-full text-purple-600 dark:text-purple-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                     </div>
                     <div className="flex-1">
                         {systemReminders.map((msg, i) => (
                             <div key={i} className="font-bold text-sm text-stone-800 dark:text-white leading-tight mb-1 last:mb-0">{msg}</div>
                         ))}
                     </div>
                 </div>
             )}

             {/* Reminders Alert - Clickable */}
             {hasActiveReminder && (
                 <div onClick={() => setShowReminderList(true)} className="glass-panel p-3 rounded-xl flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700 animate-pulse cursor-pointer hover:scale-[1.02] transition">
                     <div className="p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded-full text-yellow-600 dark:text-yellow-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.0001 22C10.8955 22 10.0001 21.1046 10.0001 20H14.0001C14.0001 21.1046 13.1046 22 12.0001 22ZM20.0001 19H4.00006V18L6.00006 16V11C6.00006 7.968 7.66006 5.405 10.4131 4.755C10.6551 4.321 11.0121 3.961 11.4551 3.737C11.5977 2.72304 12.4485 1.98453 13.4731 2.00331C14.4977 2.0221 15.3526 2.79153 15.4851 3.809C15.9317 4.0253 16.2952 4.38048 16.5411 4.81C19.3241 5.438 21.0001 7.986 21.0001 11V16L23.0001 18V19H20.0001Z"/></svg>
                     </div>
                     <div>
                         <div className="font-bold text-sm text-stone-800 dark:text-white">Có nhắc nhở hôm nay</div>
                         <div className="text-xs text-stone-500 dark:text-stone-300">Chạm để xem chi tiết ({remindingEvents.length})</div>
                     </div>
                 </div>
             )}

             {/* Combined List */}
             {todaysHolidays.length > 0 && (
                 <div className="space-y-2">
                     {todaysHolidays.map((hol, i) => (
                        <div key={`h-${i}`} className="glass-panel p-3 rounded-xl flex items-center gap-3 border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10">
                             <div className="flex-1">
                                 <div className="font-bold text-sm text-stone-800 dark:text-white">{hol.name}</div>
                                 <div className="text-xs text-stone-500 dark:text-stone-300 font-medium mt-0.5">
                                    {hol.type === 'LUNAR' ? 'Lễ Âm Lịch' : 'Lễ Dương Lịch'}
                                 </div>
                             </div>
                        </div>
                     ))}
                 </div>
             )}

             {todaysEvents.map(ev => {
                 let anniversaryText = "";
                 if (ev.startYear) {
                     const years = info.lunar.year - ev.startYear;
                     if (years > 0) anniversaryText = ` • Kỷ niệm năm thứ ${years}`;
                 }
                 const isLunar = ev.type === 'LUNAR';
                 return (
                     <div key={ev.id} onClick={() => setSelectedEvent(ev)} className={`glass-panel p-3 rounded-xl flex items-center gap-3 border-l-4 cursor-pointer hover:bg-white/40 active:scale-[0.98] transition ${isLunar ? 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10'}`}>
                         <div className="flex-1">
                             <div className="font-bold text-sm text-stone-800 dark:text-white">{ev.title}</div>
                             <div className="text-xs text-stone-500 dark:text-stone-300 font-medium mt-0.5">
                                {isLunar ? 'Sự kiện Âm Lịch' : 'Sự kiện Dương Lịch'}{anniversaryText}
                             </div>
                             {ev.description && <div className="text-xs text-stone-500 italic mt-1 truncate">{ev.description}</div>}
                         </div>
                     </div>
                 )
             })}

             {todaysHolidays.length === 0 && todaysEvents.length === 0 && systemReminders.length === 0 && (
                 <div className="glass-panel p-4 rounded-xl text-center">
                     <span className="text-stone-400 text-sm italic">Hôm nay không có sự kiện đặc biệt</span>
                 </div>
             )}
          </div>

          {/* DETAILS GRID */}
          <div className="grid grid-cols-1 gap-3 mb-4">
              <div className="glass-panel p-4 rounded-xl">
                  <div className="text-[10px] font-bold uppercase mb-3 opacity-70 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Giờ Hoàng Đạo
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {info.lunar.gioHoangDao.map((h, i) => (
                          <span key={i} className="px-2.5 py-1.5 bg-white/40 dark:bg-black/20 rounded-md text-xs font-medium border border-white/20 shadow-sm">
                              {h}
                          </span>
                      ))}
                  </div>
              </div>
          </div>
       </div>

       {/* MODALS */}
       
       {/* Event Detail Modal */}
       {selectedEvent && (
           <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
       )}

       {/* Reminder List Modal */}
       {showReminderList && (
           <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowReminderList(false)}>
               <div className="bg-stone-50 dark:bg-stone-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="bg-yellow-500 p-4 text-white">
                        <h3 className="text-xl font-bold">Nhắc nhở hôm nay</h3>
                        <div className="text-sm opacity-90 font-medium mt-1">
                             {date.getDate()}/{date.getMonth() + 1}/{date.getFullYear()}
                        </div>
                    </div>
                    <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {remindingEvents.length === 0 && <p className="text-center text-stone-500 italic">Không tìm thấy thông tin chi tiết.</p>}
                        {remindingEvents.map(ev => (
                             <div key={ev.id} onClick={() => { setShowReminderList(false); setSelectedEvent(ev); }} className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer hover:bg-white dark:hover:bg-black/40">
                                 <div className="font-bold text-stone-800 dark:text-white">{ev.title}</div>
                                 <div className="text-xs text-stone-500 mt-1">
                                     Sự kiện: {ev.day}/{ev.month} ({ev.type === 'LUNAR' ? 'Âm' : 'Dương'})
                                 </div>
                             </div>
                        ))}
                    </div>
                    <div className="p-4 pt-2 border-t border-stone-200 dark:border-stone-700">
                         <button onClick={() => setShowReminderList(false)} className="w-full py-3 bg-stone-200 dark:bg-stone-800 font-bold rounded-xl text-stone-600 dark:text-stone-300">
                             Đóng
                         </button>
                    </div>
               </div>
           </div>
       )}
    </div>
  );
};
