
import React, { useEffect, useState } from 'react';
import { UserEvent, Reminder } from '../types';
import { getEvents, saveEvent, deleteEvent, updateEvent } from '../services/storage';
import { PlusIcon, SortIcon } from './Icons';
import { convertSolarToLunar, convertLunarToSolar, getVietnamDate } from '../services/lunar';

export const EventList: React.FC = () => {
    const [events, setEvents] = useState<UserEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<UserEvent[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Filters & Sort
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'SOLAR' | 'LUNAR'>('ALL');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [day, setDay] = useState(1);
    const [month, setMonth] = useState(1);
    const [year, setYear] = useState<number | ''>(''); 
    const [type, setType] = useState<'SOLAR' | 'LUNAR'>('LUNAR');
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [previewDate, setPreviewDate] = useState<string>('');
    
    // Custom Reminder State
    const [customDaysBefore, setCustomDaysBefore] = useState<number>(0);
    const [customTime, setCustomTime] = useState<string>('07:00');

    // Initialize state
    useEffect(() => {
        const vnDate = getVietnamDate();
        setDay(vnDate.getDate());
        setMonth(vnDate.getMonth() + 1);
        loadEvents();
    }, []);

    useEffect(() => {
        let res = [...events];
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(e => e.title.toLowerCase().includes(lower) || e.description?.toLowerCase().includes(lower));
        }
        if (filterType !== 'ALL') {
            res = res.filter(e => e.type === filterType);
        }
        res.sort((a, b) => {
            // Sort by month/day. Since years are optional/variable, we focus on calendar order for the year
            const valA = a.month * 100 + a.day;
            const valB = b.month * 100 + b.day;
            return sortOrder === 'ASC' ? valA - valB : valB - valA;
        });
        setFilteredEvents(res);
    }, [events, searchTerm, filterType, sortOrder]);

    useEffect(() => {
        const currentYear = typeof year === 'number' ? year : getVietnamDate().getFullYear();
        if (type === 'LUNAR') {
            const solar = convertLunarToSolar(day, month, currentYear, false);
            if (solar) {
                setPreviewDate(`Dương Lịch: ${solar.day}/${solar.month}/${solar.year}`);
            } else {
                setPreviewDate('Không tồn tại');
            }
        } else {
            const lunar = convertSolarToLunar(day, month, currentYear);
            setPreviewDate(`Âm Lịch: ${lunar.day}/${lunar.month}/${lunar.year} ${lunar.leap === 1 ? '(Nhuận)' : ''}`);
        }
    }, [day, month, year, type]);

    const loadEvents = async () => {
        const data = await getEvents();
        setEvents(data);
    };

    const handleEdit = (ev: UserEvent) => {
        setEditingId(ev.id);
        setTitle(ev.title);
        setDescription(ev.description || '');
        setLocation(ev.location || '');
        setDay(ev.day);
        setMonth(ev.month);
        setYear(ev.startYear || '');
        setType(ev.type);
        setReminders(ev.reminders || []);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const eventData: UserEvent = {
            id: editingId || Date.now().toString(),
            uid: 'user',
            title,
            description,
            location,
            day,
            month,
            type,
            startYear: typeof year === 'number' ? year : undefined,
            reminders
        };
        if (editingId) {
            await updateEvent(eventData);
        } else {
            await saveEvent(eventData);
        }
        if (reminders.length > 0 && Notification.permission !== 'granted') {
             Notification.requestPermission();
        }
        setShowForm(false);
        resetForm();
        loadEvents();
    };

    const resetForm = () => {
        const vnDate = getVietnamDate();
        setEditingId(null);
        setTitle('');
        setDescription('');
        setLocation('');
        setDay(vnDate.getDate());
        setMonth(vnDate.getMonth() + 1);
        setYear('');
        setType('LUNAR');
        setReminders([]);
        setCustomDaysBefore(0);
        setCustomTime('07:00');
    };

    const toggleReminder = (type: Reminder['type']) => {
        const exists = reminders.find(r => r.type === type);
        if (exists) {
            setReminders(reminders.filter(r => r.type !== type));
        } else {
            let reminder: Reminder = { type, enabled: true };
            if (type === 'DAYBEFORE_7AM') {
                 reminder.daysBefore = 1;
                 reminder.time = '07:00';
            } else if (type === 'SAMEDAY_7AM') {
                 reminder.daysBefore = 0;
                 reminder.time = '07:00';
            }
            setReminders([...reminders, reminder]);
        }
    };

    const addCustomReminder = () => {
        if (!customTime) return;
        setReminders([...reminders, { 
            type: 'CUSTOM', 
            daysBefore: customDaysBefore,
            time: customTime,
            enabled: true 
        }]);
    };

    const removeReminder = (index: number) => {
        const newReminders = [...reminders];
        newReminders.splice(index, 1);
        setReminders(newReminders);
    }

    const handleStrictInput = (setter: React.Dispatch<React.SetStateAction<any>>, max: number, maxLen: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.length > maxLen) return;
        const num = parseInt(val);
        if (val === '') {
            setter('');
            return;
        }
        if (!isNaN(num) && num >= 0 && num <= max) {
            setter(num);
        }
    }

    const getCorrespondingDateText = (ev: UserEvent) => {
        const currentYear = getVietnamDate().getFullYear();
        if (ev.type === 'LUNAR') {
            const solar = convertLunarToSolar(ev.day, ev.month, currentYear, false);
            if (solar) return `Tương ứng ngày DL ${solar.day}/${solar.month} năm nay`;
            return 'Năm nay không có ngày này';
        } else {
            const lunar = convertSolarToLunar(ev.day, ev.month, currentYear);
            return `Tương ứng ngày AL ${lunar.day}/${lunar.month}${lunar.leap === 1 ? ' (Nhuận)':''} năm nay`;
        }
    }

    const getReminderPreviewDate = (daysBefore: number) => {
        if (daysBefore === 0) return "(Ngày diễn ra)";
        
        const vnDate = getVietnamDate();
        const currentYear = vnDate.getFullYear();
        
        // Find the "Occurrence" date in the current year
        let targetSolar: { day: number, month: number, year: number } | null = null;
        
        if (type === 'SOLAR') {
            // Fixed date this year
            targetSolar = { day: day, month: month, year: currentYear };
        } else {
            // Convert lunar date to solar for this year
            targetSolar = convertLunarToSolar(day, month, currentYear, false);
        }

        if (!targetSolar) return "(Không có trong năm nay)";

        // Construct Date object
        const d = new Date(targetSolar.year, targetSolar.month - 1, targetSolar.day);
        d.setDate(d.getDate() - daysBefore);
        
        return `(Dự kiến: ${d.getDate()}/${d.getMonth() + 1})`;
    }

    return (
        <div className="flex flex-col h-full bg-transparent p-4 pb-32 overflow-y-auto no-scrollbar">
            {/* Header & Controls */}
            <div className="flex flex-col gap-4 mb-6 mt-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-[var(--theme-color)]">Sự Kiện</h2>
                    <button 
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="w-10 h-10 bg-[var(--theme-color)] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition"
                    >
                        <PlusIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="glass-panel p-2 rounded-xl flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-sm px-2 placeholder-stone-500 text-stone-800 dark:text-stone-100 min-w-0"
                    />
                    
                    {/* Filter Type */}
                    <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-transparent text-xs font-bold text-stone-600 dark:text-stone-300 outline-none w-20">
                        <option value="ALL">Tất cả</option>
                        <option value="LUNAR">Âm lịch</option>
                        <option value="SOLAR">Dương lịch</option>
                    </select>
                    
                    {/* Sort Button */}
                    <button 
                        onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                        className="w-8 flex items-center justify-center text-[var(--theme-color)] border-l border-stone-300 dark:border-stone-600 pl-2"
                        title={sortOrder === 'ASC' ? "Ngày tăng dần" : "Ngày giảm dần"}
                    >
                        <SortIcon className={`w-5 h-5 transition-transform ${sortOrder === 'DESC' ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Event List */}
            <div className="space-y-3 pb-8">
                {filteredEvents.map(ev => {
                    const isLunar = ev.type === 'LUNAR';
                    return (
                        <div key={ev.id} onClick={() => handleEdit(ev)} className={`glass-panel p-4 rounded-xl cursor-pointer hover:bg-white/40 dark:hover:bg-black/40 transition border-l-4 ${isLunar ? 'border-l-red-500 bg-red-50/30 dark:bg-red-900/10' : 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`w-16 h-16 rounded-lg text-white flex flex-col items-center justify-center shrink-0 shadow-md ${isLunar ? 'bg-red-500' : 'bg-blue-500'}`}>
                                    <span className="text-xl font-bold leading-none">{ev.day}</span>
                                    <span className="text-[10px] opacity-90 leading-tight mt-1 text-center px-1">
                                        Tháng {ev.month}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-stone-800 dark:text-white truncate">{ev.title}</h4>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 rounded ml-2 border ${isLunar ? 'text-red-600 border-red-200 bg-red-100' : 'text-blue-600 border-blue-200 bg-blue-100'}`}>
                                            {isLunar ? 'Âm Lịch' : 'Dương Lịch'}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 italic font-medium">
                                        {getCorrespondingDateText(ev)}
                                    </div>
                                    {ev.description && <p className="text-xs text-stone-500 dark:text-stone-300 truncate mt-1">{ev.description}</p>}
                                    <div className="flex gap-3 mt-1.5 text-[10px] text-stone-400 font-medium">
                                        {ev.location && <span>📍 {ev.location}</span>}
                                        {ev.reminders?.length > 0 && <span>🔔 {ev.reminders.length} nhắc nhở</span>}
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(ev.id); }}
                                    className="text-stone-300 hover:text-red-500 transition px-2"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    );
                })}
                {filteredEvents.length === 0 && <div className="text-center text-stone-400 text-sm mt-10">Không có sự kiện</div>}
            </div>

            {/* FORM MODAL - Lifted, Rounded, Inner Scroll */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm">
                    {/* Added pb-20 to spacer to lift it up from nav, used rounded-3xl for bottom as well */}
                    <div className="w-full max-w-md mb-24 sm:mb-0 bg-stone-50 dark:bg-stone-900 rounded-3xl shadow-2xl flex flex-col max-h-[75vh]">
                        {/* Header Fixed */}
                        <div className="shrink-0 p-6 pb-2">
                             <h3 className="text-xl font-bold font-serif text-[var(--theme-color)]">{editingId ? 'Sửa Sự Kiện' : 'Thêm Sự Kiện'}</h3>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input type="text" placeholder="Tên sự kiện" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-stone-800 border-none outline-none focus:ring-2 focus:ring-[var(--theme-color)] text-stone-800 dark:text-stone-100" />
                                
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setType('LUNAR')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${type === 'LUNAR' ? 'bg-red-500 text-white shadow-md' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'}`}>Âm Lịch</button>
                                    <button type="button" onClick={() => setType('SOLAR')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${type === 'SOLAR' ? 'bg-blue-500 text-white shadow-md' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'}`}>Dương Lịch</button>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <input type="number" placeholder="Ngày" value={day} onChange={handleStrictInput(setDay, 31, 2)} className="w-full p-3 rounded-xl bg-white dark:bg-stone-800 text-center font-bold text-stone-800 dark:text-stone-100 outline-none" />
                                    </div>
                                    <div className="flex-1">
                                        <input type="number" placeholder="Tháng" value={month} onChange={handleStrictInput(setMonth, 12, 2)} className="w-full p-3 rounded-xl bg-white dark:bg-stone-800 text-center font-bold text-stone-800 dark:text-stone-100 outline-none" />
                                    </div>
                                    <div className="flex-[1.5]">
                                        <input type="number" placeholder="Năm (Tùy)" value={year} onChange={handleStrictInput(setYear, 2100, 4)} className="w-full p-3 rounded-xl bg-white dark:bg-stone-800 text-center font-bold text-stone-800 dark:text-stone-100 outline-none" />
                                    </div>
                                </div>
                                <p className="text-center text-xs font-medium text-[var(--theme-color)]">{previewDate}</p>

                                <textarea placeholder="Chi tiết..." rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-stone-800 border-none outline-none text-stone-800 dark:text-stone-100 text-sm"></textarea>
                                <input type="text" placeholder="Địa điểm" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-stone-800 border-none outline-none text-stone-800 dark:text-stone-100 text-sm" />

                                {/* Reminders Section */}
                                <div className="bg-white dark:bg-stone-800 p-3 rounded-xl">
                                    <label className="text-xs font-bold text-stone-400 uppercase block mb-2">Nhắc nhở</label>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-stone-100 dark:bg-black/20 rounded-lg">
                                            <input type="checkbox" checked={reminders.some(r => r.type === 'SAMEDAY_7AM')} onChange={() => toggleReminder('SAMEDAY_7AM')} className="accent-[var(--theme-color)] w-4 h-4" />
                                            <span className="text-sm">7:00 sáng ngày diễn ra</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-stone-100 dark:bg-black/20 rounded-lg">
                                            <input type="checkbox" checked={reminders.some(r => r.type === 'DAYBEFORE_7AM')} onChange={() => toggleReminder('DAYBEFORE_7AM')} className="accent-[var(--theme-color)] w-4 h-4" />
                                            <span className="text-sm">Trước 1 ngày (7:00 sáng)</span>
                                        </label>
                                        
                                        {/* Custom List */}
                                        {reminders.filter(r => r.type === 'CUSTOM').map((r, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-[var(--theme-color)]/10 rounded-lg border border-[var(--theme-color)]/20">
                                                <span className="text-xs font-medium text-[var(--theme-color)]">
                                                    Trước {r.daysBefore} ngày, lúc {r.time} {getReminderPreviewDate(r.daysBefore || 0)}
                                                </span>
                                                <button type="button" onClick={() => removeReminder(reminders.indexOf(r))} className="text-red-500 font-bold px-2">&times;</button>
                                            </div>
                                        ))}

                                        <div className="flex flex-wrap gap-2 mt-2 items-center bg-stone-100 dark:bg-black/20 p-2 rounded-lg">
                                            <span className="text-xs text-stone-500 whitespace-nowrap">Trước</span>
                                            <input 
                                                type="number" 
                                                max={30}
                                                value={customDaysBefore}
                                                onChange={e => setCustomDaysBefore(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                                                className="w-12 p-1 text-center rounded bg-white dark:bg-stone-800 text-xs font-bold outline-none"
                                                placeholder="0"
                                            />
                                            <span className="text-xs text-stone-500 whitespace-nowrap">ngày, lúc</span>
                                            <input 
                                                type="time" 
                                                value={customTime}
                                                onChange={e => setCustomTime(e.target.value)}
                                                className="flex-1 p-1 rounded bg-white dark:bg-stone-800 text-xs font-bold outline-none"
                                            />
                                            <button type="button" onClick={addCustomReminder} className="bg-[var(--theme-color)] p-1.5 rounded text-white ml-1">
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                            <div className="w-full text-[10px] text-stone-400 text-right italic">
                                                {customDaysBefore > 0 ? getReminderPreviewDate(customDaysBefore) : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-stone-200 dark:bg-stone-800 rounded-xl font-bold text-stone-600 dark:text-stone-300">Hủy</button>
                                    <button type="submit" className="flex-1 py-3 bg-[var(--theme-color)] text-white rounded-xl font-bold">Lưu</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* DELETE CONFIRM */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                     <div className="bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-xl w-full max-w-xs text-center">
                         <h3 className="font-bold text-lg mb-2 text-stone-800 dark:text-white">Xóa sự kiện?</h3>
                         <div className="flex gap-3 mt-4">
                             <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 bg-stone-100 dark:bg-stone-700 rounded-lg font-bold">Không</button>
                             <button onClick={async () => { await deleteEvent(confirmDeleteId); setConfirmDeleteId(null); loadEvents(); }} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold">Xóa</button>
                         </div>
                     </div>
                </div>
            )}
        </div>
    );
};
