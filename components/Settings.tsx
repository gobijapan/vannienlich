
import React, { useEffect, useState, useRef } from 'react';
import { AppSettings, Reminder, AnimationMode } from '../types';
import { getSettings, saveSettings, getEvents } from '../services/storage';
import { convertSolarToLunar } from '../services/lunar';
import { PlusIcon } from './Icons';

interface SettingsProps {
    onSettingsChange: (settings: AppSettings) => void;
}

const FONTS = [
    { name: 'Playfair Display (Mặc định)', value: 'Playfair Display' },
    { name: 'Merriweather (Trang trọng)', value: 'Merriweather' },
    { name: 'Roboto Slab (Hiện đại)', value: 'Roboto Slab' },
    { name: 'Inter (Đơn giản)', value: 'Inter' },
    { name: 'Comfortaa (Bo tròn)', value: 'Comfortaa' },
    { name: 'Montserrat (Thanh thoát)', value: 'Montserrat' },
    { name: 'Dancing Script (Viết tay)', value: 'Dancing Script' },
    { name: 'Patrick Hand (Vui vẻ)', value: 'Patrick Hand' },
];

const COLORS = [
    { name: 'Hỏa (Đỏ)', value: '#B91C1C' },
    { name: 'Thổ (Nâu)', value: '#854d0e' },
    { name: 'Kim (Xám)', value: '#57534e' },
    { name: 'Thủy (Xanh)', value: '#0369a1' },
    { name: 'Mộc (Lá)', value: '#15803d' },
];

const ANIMATIONS: { name: string, value: AnimationMode }[] = [
    { name: 'Trượt ngang (Slide)', value: 'SLIDE' },
    { name: 'Mờ dần (Fade)', value: 'FADE' },
    { name: 'Thu phóng (Zoom)', value: 'ZOOM' },
    { name: 'Lật trang (Flip)', value: 'FLIP' },
    { name: 'Xếp thẻ (Cards)', value: 'CARDS' },
];

const WALLPAPERS = [
    { id: 'bg-1', url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=500&auto=format&fit=crop&q=60' }, 
    { id: 'bg-2', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=60' }, 
    { id: 'bg-3', url: 'https://images.unsplash.com/photo-1623150502742-6a849aa94bed?w=500&auto=format&fit=crop&q=60' }, 
    { id: 'bg-4', url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=500&auto=format&fit=crop&q=60' }, 
    { id: 'bg-5', url: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=500&auto=format&fit=crop&q=60' }, 
    { id: 'bg-6', url: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=500&auto=format&fit=crop&q=60' }, 
    { id: 'bg-7', url: 'https://images.unsplash.com/photo-1576506542790-512445489979?w=500&auto=format&fit=crop&q=60' }, 
    { id: 'bg-8', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=500&auto=format&fit=crop&q=60' }, 
    { id: 'bg-9', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60' }, 
    { id: 'bg-10', url: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=500&auto=format&fit=crop&q=60' }, 
];

export const Settings: React.FC<SettingsProps> = ({ onSettingsChange }) => {
    const [settings, setSettings] = useState<AppSettings>(getSettings());
    const [tuoiInfo, setTuoiInfo] = useState<string>("");
    const [showBgModal, setShowBgModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Custom Reminder State for System Events
    const [customDaysBefore, setCustomDaysBefore] = useState<number>(0);
    const [customTime, setCustomTime] = useState<string>('07:00');

    useEffect(() => {
        if (settings.birthDate) {
            const date = new Date(settings.birthDate);
            if (!isNaN(date.getTime())) {
                const day = date.getDate();
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                const lunar = convertSolarToLunar(day, month, year);
                setTuoiInfo(`${lunar.canChiYear} - Mệnh ${lunar.nguHanh}`);
            }
        }
    }, [settings.birthDate]);

    const handleChange = (key: keyof AppSettings, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        saveSettings(newSettings);
        onSettingsChange(newSettings);
        
        if (key === 'enableSystemReminders' && value === true && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    };

    const addSystemReminder = () => {
        if (!customTime) return;
        const newReminders = [...(settings.systemReminders || [])];
        newReminders.push({
            type: 'CUSTOM',
            daysBefore: customDaysBefore,
            time: customTime,
            enabled: true
        });
        handleChange('systemReminders', newReminders);
    };

    const removeSystemReminder = (index: number) => {
        const newReminders = [...(settings.systemReminders || [])];
        newReminders.splice(index, 1);
        handleChange('systemReminders', newReminders);
    };

    // BACKUP & RESTORE LOGIC
    const handleBackup = async () => {
        const events = await getEvents();
        const backupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            settings: settings,
            events: events
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lich_viet_backup_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.version && json.settings && Array.isArray(json.events)) {
                    // Save to local storage
                    saveSettings(json.settings);
                    localStorage.setItem('lich_van_nien_events', JSON.stringify(json.events));
                    
                    alert('Phục hồi dữ liệu thành công! Ứng dụng sẽ tự tải lại.');
                    window.location.reload();
                } else {
                    alert('File không hợp lệ hoặc bị lỗi.');
                }
            } catch (err) {
                alert('Lỗi khi đọc file backup.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col h-full bg-transparent p-6 pb-24 overflow-y-auto no-scrollbar">
            <h2 className="text-3xl font-bold text-[var(--theme-color)] mb-6 drop-shadow-sm">Cài Đặt</h2>

            <div className="space-y-6">
                {/* 1. THÔNG TIN CÁ NHÂN */}
                <div className="glass-panel p-5 rounded-2xl">
                    <h3 className="text-xs font-bold text-stone-500 uppercase mb-4 tracking-wider">Thông tin cá nhân</h3>
                    <div className="space-y-4">
                        <div className="bg-white/50 dark:bg-black/30 p-2 rounded-xl flex items-center border border-white/20">
                            <span className="text-sm font-bold w-24 pl-2 text-stone-700 dark:text-stone-300">Tên bạn</span>
                            <input 
                                type="text" 
                                value={settings.userName}
                                onChange={(e) => handleChange('userName', e.target.value)}
                                className="bg-transparent outline-none flex-1 font-medium text-stone-900 dark:text-white"
                            />
                        </div>
                         <div className="bg-white/50 dark:bg-black/30 p-2 rounded-xl flex items-center border border-white/20">
                            <span className="text-sm font-bold w-24 pl-2 text-stone-700 dark:text-stone-300">Ngày sinh</span>
                            <input 
                                type="date"
                                value={settings.birthDate}
                                onChange={(e) => handleChange('birthDate', e.target.value)}
                                className="bg-transparent outline-none flex-1 font-medium text-stone-900 dark:text-white"
                            />
                        </div>
                        {tuoiInfo && (
                            <div className="p-3 rounded-xl bg-[var(--theme-color)]/10 border border-[var(--theme-color)]/20 text-center">
                                <span className="text-[10px] uppercase font-bold text-[var(--theme-color)]">Tử Vi Sơ Lược</span>
                                <p className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100 mt-1">{tuoiInfo}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. GIAO DIỆN */}
                <div className="glass-panel p-5 rounded-2xl">
                    <h3 className="text-xs font-bold text-stone-500 uppercase mb-4 tracking-wider">Giao diện</h3>
                    
                    {/* Dark Mode */}
                    <div className="flex items-center justify-between mb-6">
                        <span className="font-medium text-stone-800 dark:text-white">Chế độ tối</span>
                        <button 
                            onClick={() => handleChange('darkMode', !settings.darkMode)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.darkMode ? 'bg-[var(--theme-color)]' : 'bg-stone-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${settings.darkMode ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>

                    {/* Week Start */}
                    <div className="mb-6">
                         <label className="block text-sm font-medium mb-2 text-stone-800 dark:text-white">Ngày bắt đầu tuần</label>
                         <select 
                            value={settings.startWeekDay !== undefined ? settings.startWeekDay : 1}
                            onChange={(e) => handleChange('startWeekDay', parseInt(e.target.value))}
                            className="w-full bg-white/50 dark:bg-black/30 border border-white/20 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[var(--theme-color)] text-stone-800 dark:text-white"
                         >
                             <option value={1}>Thứ Hai</option>
                             <option value={0}>Chủ Nhật</option>
                         </select>
                    </div>

                    {/* Font Family */}
                    <div className="mb-6">
                         <label className="block text-sm font-medium mb-2 text-stone-800 dark:text-white">Kiểu chữ</label>
                         <select 
                            value={settings.fontFamily}
                            onChange={(e) => handleChange('fontFamily', e.target.value)}
                            className="w-full bg-white/50 dark:bg-black/30 border border-white/20 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[var(--theme-color)] text-stone-800 dark:text-white font-sans"
                            style={{ fontFamily: settings.fontFamily }}
                         >
                             {FONTS.map(font => (
                                 <option key={font.value} value={font.value} style={{fontFamily: font.value}}>{font.name}</option>
                             ))}
                         </select>
                    </div>

                    {/* Animation Mode */}
                    <div className="mb-6">
                         <label className="block text-sm font-medium mb-2 text-stone-800 dark:text-white">Hiệu ứng chuyển tháng</label>
                         <select 
                            value={settings.animationMode || 'SLIDE'}
                            onChange={(e) => handleChange('animationMode', e.target.value)}
                            className="w-full bg-white/50 dark:bg-black/30 border border-white/20 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[var(--theme-color)] text-stone-800 dark:text-white"
                         >
                             {ANIMATIONS.map(anim => (
                                 <option key={anim.value} value={anim.value}>{anim.name}</option>
                             ))}
                         </select>
                    </div>

                    {/* Custom Color */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-3 text-stone-800 dark:text-white">Màu chủ đạo</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => handleChange('themeColor', c.value)}
                                    className={`w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform ${settings.themeColor === c.value ? 'scale-110 ring-2 ring-stone-400' : ''}`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.name}
                                >
                                    {settings.themeColor === c.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </button>
                            ))}
                            <div className="relative w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-tr from-pink-500 to-yellow-500">
                                <input 
                                    type="color" 
                                    value={settings.themeColor}
                                    onChange={(e) => handleChange('themeColor', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    title="Tùy chọn"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Wallpaper Button */}
                    <div>
                        <button 
                            onClick={() => setShowBgModal(true)}
                            className="w-full py-3 rounded-xl bg-white/50 dark:bg-black/30 border border-white/20 font-bold text-stone-700 dark:text-stone-300 hover:bg-[var(--theme-color)] hover:text-white transition"
                        >
                            Chọn Hình Nền
                        </button>
                    </div>
                </div>

                {/* 3. NHẮC NHỞ HỆ THỐNG */}
                <div className="glass-panel p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Nhắc nhở Hệ thống</h3>
                        <div 
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.enableSystemReminders ? 'bg-[var(--theme-color)]' : 'bg-stone-300'}`}
                            onClick={() => handleChange('enableSystemReminders', !settings.enableSystemReminders)}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${settings.enableSystemReminders ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                    
                    {settings.enableSystemReminders && (
                        <div className="space-y-3 animate-fade-in">
                            <p className="text-xs text-stone-500 italic mb-2">Thông báo cho các ngày đặc biệt:</p>
                            <label className="flex items-center gap-3 p-2 bg-white/40 dark:bg-black/20 rounded-xl cursor-pointer">
                                <input type="checkbox" checked={settings.notifyMoon} onChange={() => handleChange('notifyMoon', !settings.notifyMoon)} className="accent-[var(--theme-color)] w-5 h-5" />
                                <span className="text-sm font-medium text-stone-800 dark:text-white">Rằm & Mùng 1 Âm lịch</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 bg-white/40 dark:bg-black/20 rounded-xl cursor-pointer">
                                <input type="checkbox" checked={settings.notifySolarHolidays} onChange={() => handleChange('notifySolarHolidays', !settings.notifySolarHolidays)} className="accent-[var(--theme-color)] w-5 h-5" />
                                <span className="text-sm font-medium text-stone-800 dark:text-white">Ngày Lễ Việt Nam (DL)</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 bg-white/40 dark:bg-black/20 rounded-xl cursor-pointer">
                                <input type="checkbox" checked={settings.notifyLunarHolidays} onChange={() => handleChange('notifyLunarHolidays', !settings.notifyLunarHolidays)} className="accent-[var(--theme-color)] w-5 h-5" />
                                <span className="text-sm font-medium text-stone-800 dark:text-white">Ngày Lễ Âm Lịch</span>
                            </label>

                            <div className="pt-2 border-t border-stone-200 dark:border-stone-700 mt-2">
                                <div className="text-xs font-bold text-stone-400 uppercase mb-2">Cấu hình thời gian</div>
                                
                                {settings.systemReminders?.map((r, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 mb-2 bg-[var(--theme-color)]/10 rounded-lg border border-[var(--theme-color)]/20">
                                        <span className="text-xs font-medium text-[var(--theme-color)]">
                                            {r.daysBefore === 0 
                                                ? `Vào ngày diễn ra, lúc ${r.time}` 
                                                : `Trước ${r.daysBefore} ngày, lúc ${r.time}`}
                                        </span>
                                        <button onClick={() => removeSystemReminder(idx)} className="text-red-500 font-bold px-2">&times;</button>
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
                                    <button onClick={addSystemReminder} className="bg-[var(--theme-color)] p-1.5 rounded text-white ml-1">
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. DỮ LIỆU */}
                <div className="glass-panel p-5 rounded-2xl">
                    <h3 className="text-xs font-bold text-stone-500 uppercase mb-4 tracking-wider">Dữ liệu</h3>
                    <p className="text-xs text-stone-500 mb-4 italic">Sao lưu dữ liệu để tránh bị mất khi đổi thiết bị hoặc xóa cache trình duyệt.</p>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleBackup}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition shadow-sm"
                        >
                            Sao Lưu
                        </button>
                        <button 
                            onClick={handleRestoreClick}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-sm"
                        >
                            Phục Hồi
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".json" 
                            className="hidden" 
                        />
                    </div>
                </div>

            </div>

            {/* Wallpaper Modal */}
            {showBgModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowBgModal(false)}>
                    <div className="bg-stone-50 dark:bg-stone-900 w-full max-w-sm p-4 rounded-3xl shadow-2xl h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-center mb-4 text-[var(--theme-color)]">Kho Hình Nền</h3>
                        <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 gap-3 p-2">
                            {WALLPAPERS.map(bg => (
                                <button
                                    key={bg.id}
                                    onClick={() => { handleChange('backgroundImage', bg.id); setShowBgModal(false); }}
                                    className={`aspect-[2/3] rounded-xl bg-cover bg-center shadow-sm transition-all hover:scale-105 border-2 ${settings.backgroundImage === bg.id ? 'border-[var(--theme-color)]' : 'border-transparent'}`}
                                    style={{ backgroundImage: `url(${bg.url})` }}
                                ></button>
                            ))}
                        </div>
                        <button onClick={() => setShowBgModal(false)} className="mt-4 w-full py-3 bg-stone-200 dark:bg-stone-800 rounded-xl font-bold">Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
};
