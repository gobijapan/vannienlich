import React from 'react';
import { ViewMode } from '../types';
import { CalendarIcon, DayIcon, SettingsIcon, MenuIcon } from './Icons';

interface NavigationProps {
    currentView: ViewMode;
    onChangeView: (view: ViewMode) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView }) => {
    const navItems = [
        { view: ViewMode.DAILY, icon: DayIcon, label: 'Hôm Nay' },
        { view: ViewMode.MONTHLY, icon: CalendarIcon, label: 'Tháng' },
        { view: ViewMode.EVENTS, icon: MenuIcon, label: 'Sự Kiện' },
        { view: ViewMode.SETTINGS, icon: SettingsIcon, label: 'Cài Đặt' },
    ];

    return (
        <div className="flex-none bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 pb-safe pt-2 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 transition-colors duration-300">
            <div className="flex justify-between items-end max-w-sm mx-auto">
                {navItems.map((item) => {
                    const isActive = currentView === item.view;
                    return (
                        <button
                            key={item.view}
                            onClick={() => onChangeView(item.view)}
                            className={`flex flex-col items-center justify-center w-16 py-1 transition-all duration-200 group`}
                        >
                            <div className={`p-1.5 rounded-xl mb-1 transition-all duration-300 ${
                                isActive ? 'bg-[var(--theme-color)] text-white -translate-y-2 shadow-md' : 'text-stone-400 dark:text-stone-500 group-hover:text-[var(--theme-color)] bg-transparent'
                            }`}>
                                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />
                            </div>
                            <span className={`text-[10px] font-medium tracking-wide transition-colors ${
                                isActive ? 'text-[var(--theme-color)] font-bold' : 'text-stone-400 dark:text-stone-500'
                            }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};