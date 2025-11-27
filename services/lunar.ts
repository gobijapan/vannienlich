
/**
 * THƯ VIỆN LỊCH ÂM VIỆT NAM - CODE GỐC HỒ NGỌC ĐỨC
 * Source: https://www.informatik.uni-leipzig.de/~duc/amlich/
 * Adapted for TypeScript/App integration
 */

import { LunarDate, Holiday } from '../types';

const PI = Math.PI;

function INT(d: number): number {
    return Math.floor(d);
}

function jdFromDate(dd: number, mm: number, yy: number): number {
    var a, y, m, jd;
    a = INT((14 - mm) / 12);
    y = yy + 4800 - a;
    m = mm + 12 * a - 3;
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    return jd;
}

function jdToDate(jd: number): { day: number, month: number, year: number } {
    var a, b, c, d, e, m, day, month, year;
    if (jd > 2299160) {
        a = jd + 32044;
        b = INT((4 * a + 3) / 146097);
        c = a - INT((b * 146097) / 4);
    } else {
        b = 0;
        c = jd + 32082;
    }
    d = INT((4 * c + 3) / 1461);
    e = c - INT((1461 * d) / 4);
    m = INT((5 * e + 2) / 153);
    day = e - INT((153 * m + 2) / 5) + 1;
    month = m + 3 - 12 * INT(m / 10);
    year = b * 100 + d - 4800 + INT(m / 10);
    return { day, month, year };
}

function getNewMoonDay(k: number, timeZone: number): number {
    var T, T2, T3, dr, Jd1, M, Mpr, F, C1, deltat, JdNew;
    T = k / 1236.85;
    T2 = T * T;
    T3 = T2 * T;
    dr = PI / 180;
    Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    if (T < -11) {
        deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
    } else {
        deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
    };
    JdNew = Jd1 + C1 - deltat;
    return INT(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn: number, timeZone: number): number {
    var T, T2, dr, M, L0, DL, L;
    T = (jdn - 2451545.5 - timeZone / 24) / 36525;
    T2 = T * T;
    dr = PI / 180;
    M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    L = L0 + DL;
    L = L * dr;
    L = L - PI * 2 * (INT(L / (PI * 2)));
    return INT(L / PI * 6);
}

function getLunarMonth11(yy: number, timeZone: number): number {
    var k, off, nm, sunLong;
    off = jdFromDate(31, 12, yy) - 2415021;
    k = INT(off / 29.530588853);
    nm = getNewMoonDay(k, timeZone);
    sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) {
        nm = getNewMoonDay(k - 1, timeZone);
    }
    return nm;
}

function getLeapMonthOffset(a11: number, timeZone: number): number {
    var k, last, arc, i;
    k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    last = 0;
    i = 1;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
        last = arc;
        i++;
        arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc != last && i < 14);
    return i - 1;
}

function convertSolar2Lunar(dd: number, mm: number, yy: number, timeZone: number): number[] {
    var k, dayNumber, monthStart, a11, b11, lunarDay, lunarMonth, lunarYear, lunarLeap, diff, leapMonthDiff;
    dayNumber = jdFromDate(dd, mm, yy);
    k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) {
        monthStart = getNewMoonDay(k, timeZone);
    }
    a11 = getLunarMonth11(yy, timeZone);
    b11 = a11;
    if (a11 >= monthStart) {
        lunarYear = yy;
        a11 = getLunarMonth11(yy - 1, timeZone);
    } else {
        lunarYear = yy + 1;
        b11 = getLunarMonth11(yy + 1, timeZone);
    }
    lunarDay = dayNumber - monthStart + 1;
    diff = INT((monthStart - a11) / 29);
    lunarLeap = 0;
    lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
        leapMonthDiff = getLeapMonthOffset(a11, timeZone);
        if (diff >= leapMonthDiff) {
            lunarMonth = diff + 10;
            if (diff == leapMonthDiff) {
                lunarLeap = 1;
            }
        }
    }
    if (lunarMonth > 12) {
        lunarMonth = lunarMonth - 12;
    }
    if (lunarMonth >= 11 && diff < 4) {
        lunarYear -= 1;
    }
    return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

// --- DATA ---
const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tị", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const TIET_KHI = [
    "Xuân Phân", "Thanh Minh", "Cốc Vũ", "Lập Hạ", "Tiểu Mãn", "Mang Chủng",
    "Hạ Chí", "Tiểu Thử", "Đại Thử", "Lập Thu", "Xử Thử", "Bạch Lộ",
    "Thu Phân", "Hàn Lộ", "Sương Giáng", "Lập Đông", "Tiểu Tuyết", "Đại Tuyết",
    "Đông Chí", "Tiểu Hàn", "Đại Hàn", "Lập Xuân", "Vũ Thủy", "Kinh Trập"
];
const TRUC = ["Kiến", "Trừ", "Mãn", "Bình", "Định", "Chấp", "Phá", "Nguy", "Thành", "Thu", "Khai", "Bế"];
const SAO = [
    "Giác", "Cang", "Đê", "Phòng", "Tâm", "Vĩ", "Cơ",
    "Đẩu", "Ngưu", "Nữ", "Hư", "Nguy", "Thất", "Bích",
    "Khuê", "Lâu", "Vị", "Mão", "Tất", "Chủy", "Sâm",
    "Tỉnh", "Quỷ", "Liễu", "Tinh", "Trương", "Dực", "Chẩn"
];

// Mapping Lục Thập Hoa Giáp -> Ngũ Hành Nạp Âm
const LUC_THAP_HOA_GIAP: Record<string, string> = {
    "Giáp Tý": "Hải Trung Kim", "Ất Sửu": "Hải Trung Kim",
    "Bính Dần": "Lư Trung Hỏa", "Đinh Mão": "Lư Trung Hỏa",
    "Mậu Thìn": "Đại Lâm Mộc", "Kỷ Tị": "Đại Lâm Mộc",
    "Canh Ngọ": "Lộ Bàng Thổ", "Tân Mùi": "Lộ Bàng Thổ",
    "Nhâm Thân": "Kiếm Phong Kim", "Quý Dậu": "Kiếm Phong Kim",
    "Giáp Tuất": "Sơn Đầu Hỏa", "Ất Hợi": "Sơn Đầu Hỏa",
    "Bính Tý": "Giản Hạ Thủy", "Đinh Sửu": "Giản Hạ Thủy",
    "Mậu Dần": "Thành Đầu Thổ", "Kỷ Mão": "Thành Đầu Thổ",
    "Canh Thìn": "Bạch Lạp Kim", "Tân Tị": "Bạch Lạp Kim",
    "Nhâm Ngọ": "Dương Liễu Mộc", "Quý Mùi": "Dương Liễu Mộc",
    "Giáp Thân": "Tuyền Trung Thủy", "Ất Dậu": "Tuyền Trung Thủy",
    "Bính Tuất": "Ốc Thượng Thổ", "Đinh Hợi": "Ốc Thượng Thổ",
    "Mậu Tý": "Tích Lịch Hỏa", "Kỷ Sửu": "Tích Lịch Hỏa",
    "Canh Dần": "Tùng Bách Mộc", "Tân Mão": "Tùng Bách Mộc",
    "Nhâm Thìn": "Trường Lưu Thủy", "Quý Tị": "Trường Lưu Thủy",
    "Giáp Ngọ": "Sa Trung Kim", "Ất Mùi": "Sa Trung Kim",
    "Bính Thân": "Sơn Hạ Hỏa", "Đinh Dậu": "Sơn Hạ Hỏa",
    "Mậu Tuất": "Bình Địa Mộc", "Kỷ Hợi": "Bình Địa Mộc",
    "Canh Tý": "Bích Thượng Thổ", "Tân Sửu": "Bích Thượng Thổ",
    "Nhâm Dần": "Kim Bạch Kim", "Quý Mão": "Kim Bạch Kim",
    "Giáp Thìn": "Phúc Đăng Hỏa", "Ất Tị": "Phúc Đăng Hỏa",
    "Bính Ngọ": "Thiên Hà Thủy", "Đinh Mùi": "Thiên Hà Thủy",
    "Mậu Thân": "Đại Trạch Thổ", "Kỷ Dậu": "Đại Trạch Thổ",
    "Canh Tuất": "Thoa Xuyến Kim", "Tân Hợi": "Thoa Xuyến Kim",
    "Nhâm Tý": "Tang Đố Mộc", "Quý Sửu": "Tang Đố Mộc",
    "Giáp Dần": "Đại Khê Thủy", "Ất Mão": "Đại Khê Thủy",
    "Bính Thìn": "Sa Trung Thổ", "Đinh Tị": "Sa Trung Thổ",
    "Mậu Ngọ": "Thiên Thượng Hỏa", "Kỷ Mùi": "Thiên Thượng Hỏa",
    "Canh Thân": "Thạch Lựu Mộc", "Tân Dậu": "Thạch Lựu Mộc",
    "Nhâm Tuất": "Đại Hải Thủy", "Quý Hợi": "Đại Hải Thủy"
};

const FIXED_SOLAR_HOLIDAYS: Record<string, string> = {
    "1/1": "Tết Dương Lịch",
    "3/2": "Thành lập Đảng CSVN",
    "27/2": "Ngày Thầy thuốc VN",
    "8/3": "Quốc tế Phụ nữ",
    "30/4": "Giải phóng Miền Nam",
    "1/5": "Quốc tế Lao động",
    "19/5": "Sinh nhật Bác Hồ",
    "1/6": "Quốc tế Thiếu nhi",
    "2/9": "Quốc khánh",
    "20/10": "Phụ nữ Việt Nam",
    "20/11": "Nhà giáo Việt Nam",
    "22/12": "Quân đội Nhân dân",
};

const FIXED_LUNAR_HOLIDAYS: Record<string, string> = {
    "1/1": "Tết Nguyên Đán",
    "15/1": "Tết Nguyên Tiêu",
    "3/3": "Tết Hàn Thực",
    "10/3": "Giỗ Tổ Hùng Vương",
    "15/4": "Lễ Phật Đản",
    "5/5": "Tết Đoan Ngọ",
    "15/7": "Lễ Vu Lan",
    "15/8": "Tết Trung Thu",
    "9/9": "Tết Trùng Cửu",
    "23/12": "Ông Công Ông Táo",
};

// --- HELPERS ---

export const getVietnamDate = (): Date => {
    const now = new Date();
    const vnTimeStr = now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"});
    return new Date(vnTimeStr);
};

export const convertSolarToLunar = (dd: number, mm: number, yy: number): LunarDate => {
    const timeZone = 7;
    const [lunarDay, lunarMonth, lunarYear, lunarLeap] = convertSolar2Lunar(dd, mm, yy, timeZone);
    const jd = jdFromDate(dd, mm, yy);
    
    let canDayIdx = (jd + 9) % 10;
    let chiDayIdx = (jd + 1) % 12;
    
    let canYearIdx = (lunarYear + 6) % 10;
    let chiYearIdx = (lunarYear + 8) % 12;
    
    let canMonth1Idx = (canYearIdx * 2 + 2) % 10;
    let canMonthIdx = (canMonth1Idx + (lunarMonth - 1)) % 10;
    let chiMonthIdx = (2 + (lunarMonth - 1)) % 12;
    
    let canDay = CAN[canDayIdx];
    let chiDay = CHI[chiDayIdx];
    let canYear = CAN[canYearIdx];
    let chiYear = CHI[chiYearIdx];
    let canMonth = CAN[canMonthIdx];
    let chiMonth = CHI[chiMonthIdx];
    
    let canChiYearStr = `${canYear} ${chiYear}`;
    let nguHanhNam = LUC_THAP_HOA_GIAP[canChiYearStr] || "";

    let sunLong = getSunLongitude(jd, timeZone);
    let tietKhiIdx = INT(sunLong / 15);
    if (tietKhiIdx >= 24) tietKhiIdx -= 24;
    if (tietKhiIdx < 0) tietKhiIdx += 24;
    
    let truc = TRUC[(jd - 1) % 12];
    let sao = SAO[(jd + 4) % 28];

    return {
        day: lunarDay,
        month: lunarMonth,
        year: lunarYear,
        leap: lunarLeap,
        jd: jd,
        canChiDay: `${canDay} ${chiDay}`,
        canChiMonth: `${canMonth} ${chiMonth}`,
        canChiYear: `${canYear} ${chiYear}`,
        tietKhi: TIET_KHI[tietKhiIdx] || "",
        nguHanh: nguHanhNam,
        truc: truc,
        sao: sao,
        gioHoangDao: calculateGioHoangDao(chiDay)
    };
};

export const getBuddhistYear = (lunarDay: number, lunarMonth: number, solarYear: number): number => {
    // Ngày 16/4 Âm lịch sẽ qua năm Phật Lịch mới (thường là +545)
    // Trước đó là +544
    if (lunarMonth > 4 || (lunarMonth === 4 && lunarDay >= 16)) {
        return solarYear + 544;
    }
    return solarYear + 543;
};

function calculateGioHoangDao(chiDayName: string): string[] {
    const map: Record<string, string[]> = {
        "Tý": ["Tý (23-1)", "Sửu (1-3)", "Mão (5-7)", "Ngọ (11-13)", "Thân (15-17)", "Dậu (17-19)"],
        "Sửu": ["Dần (3-5)", "Mão (5-7)", "Tị (9-11)", "Thân (15-17)", "Tuất (19-21)", "Hợi (21-23)"],
        "Dần": ["Tý (23-1)", "Sửu (1-3)", "Thìn (7-9)", "Tị (9-11)", "Mùi (13-15)", "Tuất (19-21)"],
        "Mão": ["Tý (23-1)", "Dần (3-5)", "Mão (5-7)", "Ngọ (11-13)", "Mùi (13-15)", "Dậu (17-19)"],
        "Thìn": ["Dần (3-5)", "Thìn (7-9)", "Tị (9-11)", "Thân (15-17)", "Dậu (17-19)", "Hợi (21-23)"],
        "Tị": ["Sửu (1-3)", "Thìn (7-9)", "Ngọ (11-13)", "Mùi (13-15)", "Tuất (19-21)", "Hợi (21-23)"],
        "Ngọ": ["Tý (23-1)", "Sửu (1-3)", "Mão (5-7)", "Ngọ (11-13)", "Thân (15-17)", "Dậu (17-19)"],
        "Mùi": ["Dần (3-5)", "Mão (5-7)", "Tị (9-11)", "Thân (15-17)", "Tuất (19-21)", "Hợi (21-23)"],
        "Thân": ["Tý (23-1)", "Sửu (1-3)", "Thìn (7-9)", "Tị (9-11)", "Mùi (13-15)", "Tuất (19-21)"],
        "Dậu": ["Tý (23-1)", "Dần (3-5)", "Mão (5-7)", "Ngọ (11-13)", "Mùi (13-15)", "Dậu (17-19)"],
        "Tuất": ["Dần (3-5)", "Thìn (7-9)", "Tị (9-11)", "Thân (15-17)", "Dậu (17-19)", "Hợi (21-23)"],
        "Hợi": ["Sửu (1-3)", "Thìn (7-9)", "Ngọ (11-13)", "Mùi (13-15)", "Tuất (19-21)", "Hợi (21-23)"]
    };
    return map[chiDayName] || [];
}

export const convertLunarToSolar = (lunarDay: number, lunarMonth: number, lunarYear: number, isLeapMonth: boolean = false): { day: number, month: number, year: number } | null => {
    let guessMonth = lunarMonth + 1;
    let guessYear = lunarYear;
    if (guessMonth > 12) { guessMonth -= 12; guessYear++; }
    
    let startJd = jdFromDate(1, guessMonth, guessYear) - 60;
    let endJd = startJd + 120;
    
    for (let j = startJd; j <= endJd; j++) {
        let date = jdToDate(j);
        let [ld, lm, ly, lleap] = convertSolar2Lunar(date.day, date.month, date.year, 7);
        
        if (ly === lunarYear && lm === lunarMonth && ld === lunarDay) {
            if (isLeapMonth) {
                if (lleap === 1) return date;
            } else {
                if (lleap === 0) return date;
            }
        }
    }
    return null;
};

export const getLunarMonthDays = (lunarMonth: number, lunarYear: number, isLeapMonth: boolean = false): number => {
    const startSolar = convertLunarToSolar(1, lunarMonth, lunarYear, isLeapMonth);
    if (!startSolar) return 30; 
    
    let currentJd = jdFromDate(startSolar.day, startSolar.month, startSolar.year);
    let jd30 = currentJd + 29;
    let date30 = jdToDate(jd30);
    let [ld30, lm, ly, lleap] = convertSolar2Lunar(date30.day, date30.month, date30.year, 7);
    
    if (ld30 === 1) {
        return 29;
    } else {
        return 30;
    }
};

export const getHolidays = (month: number, year: number): Holiday[] => {
    const holidays: Holiday[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for(let d = 1; d <= daysInMonth; d++) {
        // 1. Check Solar Holidays
        const solarKey = `${d}/${month}`;
        if (FIXED_SOLAR_HOLIDAYS[solarKey]) {
            holidays.push({ day: d, month, name: FIXED_SOLAR_HOLIDAYS[solarKey], type: 'SOLAR' });
        }

        // 2. Check Lunar Holidays
        const lunar = convertSolarToLunar(d, month, year);
        const lunarKey = `${lunar.day}/${lunar.month}`;
        if (FIXED_LUNAR_HOLIDAYS[lunarKey] && lunar.leap === 0) {
            holidays.push({ day: d, month, name: FIXED_LUNAR_HOLIDAYS[lunarKey], type: 'LUNAR' });
        }
    }
    return holidays;
}
