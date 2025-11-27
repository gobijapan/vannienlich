
import React from 'react';
import { UserEvent } from '../types';

interface EventDetailModalProps {
    event: UserEvent;
    onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-stone-50 dark:bg-stone-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-[var(--theme-color)] p-4 text-white">
                    <h3 className="text-xl font-bold">{event.title}</h3>
                    <div className="text-sm opacity-90 font-medium flex gap-2 items-center mt-1">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs uppercase">{event.type === 'LUNAR' ? 'Âm Lịch' : 'Dương Lịch'}</span>
                        <span>Ngày {event.day}/{event.month}</span>
                    </div>
                </div>
                <div className="p-5 space-y-4">
                    {event.description && (
                        <div>
                            <div className="text-xs font-bold text-stone-400 uppercase mb-1">Chi tiết</div>
                            <p className="text-stone-800 dark:text-white text-sm leading-relaxed">{event.description}</p>
                        </div>
                    )}
                    {event.location && (
                        <div>
                            <div className="text-xs font-bold text-stone-400 uppercase mb-1">Địa điểm</div>
                            <p className="text-stone-800 dark:text-white text-sm flex items-center gap-1">
                                📍 {event.location}
                            </p>
                        </div>
                    )}
                    {event.reminders && event.reminders.length > 0 && (
                        <div>
                            <div className="text-xs font-bold text-stone-400 uppercase mb-2">Nhắc nhở</div>
                            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                {event.reminders.map((r, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm bg-stone-100 dark:bg-black/20 p-2 rounded-lg text-stone-700 dark:text-stone-300">
                                        <span>🔔</span>
                                        <span>
                                            {r.type === 'SAMEDAY_7AM' && '7:00 sáng cùng ngày'}
                                            {r.type === 'DAYBEFORE_7AM' && '7:00 sáng trước 1 ngày'}
                                            {r.type === 'CUSTOM' && `Trước ${r.daysBefore} ngày lúc ${r.time}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="pt-2">
                        <button onClick={onClose} className="w-full py-3 bg-stone-200 dark:bg-stone-800 font-bold rounded-xl text-stone-600 dark:text-stone-300">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
