import React, { useState, useEffect, useRef } from 'react';
import { convertSolarToLunar, getVietnamDate, getHolidays, convertLunarToSolar } from '../services/lunar';
import { getEvents, getSettings, hasReminderOnDate } from '../services/storage';
import { DailyView } from './DailyView';
import { UserEvent, Holiday } from '../types';
import { ChevronLeft, ChevronRight } from './Icons';
import { EventDetailModal } from './EventDetailModal';

interface MonthlyViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({ currentDate }) => {
  const [detailDate, setDetailDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState<Date>(currentDate);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [startWeekDay, setStartWeekDay] = useState(1); 
  
  // Animation State
  const [animClass, setAnimClass] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50; 

  // Event Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<UserEvent | null>(null);

  // Picker state
  const [pickerMonth, setPickerMonth] = useState(viewDate.getMonth());
  const [pickerYear, setPickerYear] = useState(viewDate.getFullYear());

  const selectedYearRef = useRef<HTMLDivElement>(null);
  const selectedMonthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getEvents().then(setEvents);
    const settings = getSettings();
    setStartWeekDay(settings.startWeekDay !== undefined ? settings.startWeekDay : 1);
  }, []);

  useEffect(() => {
      setPickerMonth(viewDate.getMonth());
      setPickerYear(viewDate.getFullYear());
  }, [viewDate]);

  useEffect(() => {
      if (showPicker) {
          setTimeout(() => {
              selectedYearRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
              selectedMonthRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
          }, 10);
      }
  }, [showPicker]);

  const changeMonth = (delta: number) => {
      if (isAnimating) return;
      
      // 1. Slide Out Old
      setIsAnimating(true);
      setAnimClass(delta > 0 ? 'slide-out-left' : 'slide-out-right');

      setTimeout(() => {
          // 2. Update Data
          const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
          setViewDate(newDate);

          // 3. Prep New (Instant Move to start position)
          setAnimClass(delta > 0 ? 'slide-hidden-right' : 'slide-hidden-left');

          // 4. Slide In New (Next Tick)
          setTimeout(() => {
              setAnimClass('');
              setIsAnimating(false);
          }, 20);
      }, 250); // Wait for CSS transition time
  };

  const handlePickerSubmit = () => {
      setViewDate(new Date(pickerYear, pickerMonth, 1));
      setShowPicker(false);
  };

  const getDayEvents = (d: number, m: number, y: number, ld: number, lm: number) => {
      return events.filter(e => {
        if (e.type === 'SOLAR') return e.day === d && e.month === m;
        return e.day === ld && e.month === lm;
      });
  };

  // --- Swipe Handlers ---
  const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) {
          // Swipe Left -> Next Month
          changeMonth(1);
      }
      if (isRightSwipe) {
          // Swipe Right -> Prev Month
          changeMonth(-1);
      }
  };

  if (detailDate) {
    return <DailyView date={detailDate} onBack={() => setDetailDate(null)} />;
  }

  const vnDate = getVietnamDate();
  const todayDay = vnDate.getDate();
  const todayMonth = vnDate.getMonth();
  const todayYear = vnDate.getFullYear();

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const dayOfWeek = firstDayObj.getDay(); 
  
  const offset = (dayOfWeek - startWeekDay + 7) % 7;
  const emptyDays = Array(offset).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const WEEK_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const sortedWeekDays = startWeekDay === 1 
    ? [...WEEK_DAYS.slice(1), WEEK_DAYS[0]] 
    : WEEK_DAYS; 

  const monthlyHolidays = getHolidays(viewDate.getMonth() + 1, viewDate.getFullYear());

  const allEventsInMonth: {day: number, name: string, type: string, isHoliday: boolean, lunarDay?: number, lunarMonth?: number, lunarLeap?: number, originalEvent?: UserEvent}[] = [];
  
  for(let d=1; d<=daysInMonth; d++) {
      const hols = monthlyHolidays.filter(h => h.day === d);
      hols.forEach(h => {
          const lunar = convertSolarToLunar(d, viewDate.getMonth()+1, viewDate.getFullYear());
          allEventsInMonth.push({ 
              day: d, 
              name: h.name, 
              type: h.type === 'LUNAR' ? 'AL' : 'DL', 
              isHoliday: true,
              lunarDay: lunar.day,
              lunarMonth: lunar.month,
              lunarLeap: lunar.leap
          });
      });
      
      const lunar = convertSolarToLunar(d, viewDate.getMonth()+1, viewDate.getFullYear());
      const uEvts = getDayEvents(d, viewDate.getMonth()+1, viewDate.getFullYear(), lunar.day, lunar.month);
      uEvts.forEach(e => allEventsInMonth.push({ 
          day: d, 
          name: e.title, 
          type: e.type === 'LUNAR' ? 'AL' : 'DL', 
          isHoliday: false, 
          lunarDay: lunar.day, 
          lunarMonth: lunar.month,
          lunarLeap: lunar.leap,
          originalEvent: e
      }));
  }

  allEventsInMonth.sort((a,b) => a.day - b.day);

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header with Navigation */}
      <div className="shrink-0 pt-4 pb-2 px-4 glass-panel border-b-0 rounded-b-3xl z-20 mx-2 mt-2">
         <div className="flex justify-between items-center mb-4">
             <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition">
                 <ChevronLeft className="w-6 h-6 text-stone-600 dark:text-stone-300" />
             </button>
             
             <button onClick={() => setShowPicker(true)} className="flex flex-col items-center active:opacity-70">
                <span className="text-xl font-bold text-[var(--theme-color)]">
                    Tháng {viewDate.getMonth() + 1}
                </span>
                <span className="text-sm font-bold opacity-60">{viewDate.getFullYear()}</span>
             </button>

             <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition">
                 <ChevronRight className="w-6 h-6 text-stone-600 dark:text-stone-300" />
             </button>
         </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-2 pt-2">
         <div 
            className={`glass-panel rounded-lg p-2 mb-4 overflow-hidden shadow-sm touch-pan-y calendar-transition ${animClass}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
         >
             {/* Header Grid */}
             <div className="grid grid-cols-7 border-b border-stone-300 dark:border-stone-600 mb-0">
                {sortedWeekDays.map((d, i) => (
                    <div key={d} className={`text-center py-2 text-[11px] font-bold uppercase tracking-wide border-r border-stone-200 dark:border-stone-700 last:border-r-0 ${d === 'CN' ? 'text-red-500' : 'text-stone-500 dark:text-stone-400'}`}>
                        {d}
                    </div>
                ))}
             </div>

             {/* Days Grid */}
             <div className="grid grid-cols-7 border-l border-t border-stone-300 dark:border-stone-600 select-none">
                 {emptyDays.map((_, i) => (
                     <div key={`e-${i}`} className="h-20 border-b border-r border-stone-300 dark:border-stone-600 bg-stone-100/30 dark:bg-black/20"></div>
                 ))}
                 {days.map(d => {
                     const lunar = convertSolarToLunar(d, viewDate.getMonth() + 1, viewDate.getFullYear());
                     const isToday = d === todayDay && viewDate.getMonth() === todayMonth && viewDate.getFullYear() === todayYear;
                     const isMajor = lunar.day === 1 || lunar.day === 15;
                     const uEvts = getDayEvents(d, viewDate.getMonth() + 1, viewDate.getFullYear(), lunar.day, lunar.month);
                     const hasEvt = uEvts.length > 0;
                     const hasHoliday = monthlyHolidays.some(h => h.day === d);
                     const isWeekend = new Date(viewDate.getFullYear(), viewDate.getMonth(), d).getDay() === 0;
                     
                     const gridDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                     const hasReminder = hasReminderOnDate(gridDate, events);

                     return (
                         <div 
                            key={d}
                            onClick={() => setDetailDate(gridDate)}
                            className={`
                                h-20 flex flex-col items-center justify-start pt-1.5 cursor-pointer relative border-b border-r border-stone-300 dark:border-stone-600 transition-colors
                                ${isToday ? 'bg-[var(--theme-color)]/10 dark:bg-[var(--theme-color)]/20 shadow-[inset_0_0_0_2px_var(--theme-color)]' : 'hover:bg-white/50 dark:hover:bg-white/10'}
                            `}
                         >
                             {hasReminder && (
                                 <div className="absolute top-1 right-1">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-orange-500 drop-shadow-sm"><path d="M12 22C10.8954 22 10 21.1046 10 20H14C14 21.1046 13.1046 22 12 22ZM20 19H4V18L6 16V11C6 7.968 7.66 5.405 10.413 4.755C10.655 4.321 11.012 3.961 11.455 3.737C11.597 2.723 12.448 1.984 13.473 2.003C14.497 2.022 15.352 2.791 15.485 3.809C15.931 4.025 16.295 4.38 16.541 4.81C19.324 5.438 21 7.986 21 11V16L23 18V19H20Z"/></svg>
                                 </div>
                             )}

                             <span className={`text-lg font-bold leading-none ${isToday ? 'text-[var(--theme-color)]' : (isWeekend ? 'text-red-500' : 'text-stone-800 dark:text-stone-200')}`}>{d}</span>
                             <span className={`text-[11px] mt-1.5 leading-none ${isMajor ? 'text-[var(--theme-color)] font-bold' : 'text-stone-500 dark:text-stone-400'}`}>
                                 {isMajor ? `${lunar.day}/${lunar.month}` : lunar.day}
                                 {lunar.leap === 1 && <sup className="text-[8px] ml-0.5 text-red-500">N</sup>}
                             </span>
                             {(hasEvt || hasHoliday) && !isToday && (
                                 <div className={`absolute bottom-1.5 flex gap-0.5`}>
                                     {hasHoliday && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                                     {hasEvt && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                 </div>
                             )}
                         </div>
                     )
                 })}
             </div>
         </div>

         {/* Events List */}
         <div className={`space-y-3 pb-8 px-2 calendar-transition ${animClass}`}>
             <h3 className="text-xs font-bold uppercase text-stone-500 dark:text-stone-400 pl-2">Sự kiện trong tháng</h3>
             {allEventsInMonth.length === 0 ? (
                 <div className="text-center text-xs text-stone-400 italic py-4">Không có sự kiện nào</div>
             ) : (
                 allEventsInMonth.map((e, i) => {
                     const isLunar = e.type === 'AL';
                     return (
                        <div 
                            key={i} 
                            onClick={() => {
                                if (e.originalEvent) setSelectedEvent(e.originalEvent);
                            }}
                            className={`glass-panel p-3 rounded-xl flex items-center gap-3 border-l-4 ${isLunar ? 'border-l-red-500' : 'border-l-blue-500'} ${e.originalEvent ? 'cursor-pointer hover:bg-white/40 active:scale-[0.98] transition' : ''}`}
                        >
                            <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-sm ${isLunar ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                                <span className="text-xl font-bold leading-none">{e.day}</span>
                                <span className="text-[10px] font-medium opacity-90 mt-1 leading-tight text-center">
                                     {e.lunarDay}/{e.lunarMonth} Âm
                                     {e.lunarLeap === 1 && <span className="block text-[8px] font-bold text-red-500">Nhuận</span>}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-bold text-stone-800 dark:text-white truncate">{e.name}</div>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] font-bold px-1.5 rounded border ${isLunar ? 'text-red-600 border-red-200 bg-red-50' : 'text-blue-600 border-blue-200 bg-blue-50'}`}>
                                        {isLunar ? 'Âm Lịch' : 'Dương Lịch'}
                                    </span>
                                    <span className="text-[10px] text-stone-500 uppercase font-medium">{e.isHoliday ? 'Ngày Lễ' : 'Sự kiện riêng'}</span>
                                </div>
                            </div>
                        </div>
                     );
                 })
             )}
         </div>
      </div>

      {/* Picker Modal */}
      {showPicker && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPicker(false)}>
              <div className="bg-stone-50 dark:bg-stone-900 w-full max-w-xs p-6 rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-center mb-4 text-[var(--theme-color)]">Chọn Thời Gian</h3>
                  <div className="flex gap-4 mb-6">
                      <div className="flex-1 h-48 overflow-y-auto no-scrollbar bg-stone-200 dark:bg-black/30 rounded-lg">
                          {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                              <div 
                                key={m}
                                ref={pickerMonth === m - 1 ? selectedMonthRef : null}
                                onClick={() => setPickerMonth(m - 1)}
                                className={`p-2 text-center text-sm font-bold cursor-pointer ${pickerMonth === m - 1 ? 'bg-[var(--theme-color)] text-white' : 'text-stone-600 dark:text-stone-400'}`}
                              >
                                  Tháng {m}
                              </div>
                          ))}
                      </div>
                      <div className="flex-1 h-48 overflow-y-auto no-scrollbar bg-stone-200 dark:bg-black/30 rounded-lg">
                          {Array.from({length: 201}, (_, i) => 1900 + i).map(y => (
                              <div 
                                key={y}
                                ref={pickerYear === y ? selectedYearRef : null}
                                onClick={() => setPickerYear(y)}
                                className={`p-2 text-center text-sm font-bold cursor-pointer ${pickerYear === y ? 'bg-[var(--theme-color)] text-white' : 'text-stone-600 dark:text-stone-400'}`}
                              >
                                  {y}
                              </div>
                          ))}
                      </div>
                  </div>
                  <button onClick={handlePickerSubmit} className="w-full py-3 bg-[var(--theme-color)] text-white font-bold rounded-xl shadow-lg">
                      Xác Nhận
                  </button>
              </div>
          </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
          <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};