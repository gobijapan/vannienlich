
import { GoogleGenAI } from "@google/genai";
import { LunarDate } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const CACHE_PREFIX = 'lvn_cultural_cache_';

// Extensive offline database for instant loading
const OFFLINE_QUOTES = [
    "Uống nước nhớ nguồn.",
    "Ăn quả nhớ kẻ trồng cây.",
    "Công cha như núi Thái Sơn, nghĩa mẹ như nước trong nguồn chảy ra.",
    "Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.",
    "Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau.",
    "Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một giàn.",
    "Lá lành đùm lá rách.",
    "Một con ngựa đau, cả tàu bỏ cỏ.",
    "Gần mực thì đen, gần đèn thì rạng.",
    "Đi một ngày đàng, học một sàng khôn.",
    "Chim có tổ, người có tông.",
    "Đói cho sạch, rách cho thơm.",
    "Giấy rách phải giữ lấy lề.",
    "Lời chào cao hơn mâm cỗ.",
    "Tiên học lễ, hậu học văn.",
    "Tốt gỗ hơn tốt nước sơn.",
    "Cái nết đánh chết cái đẹp.",
    "Thương người như thể thương thân.",
    "Ở hiền gặp lành.",
    "Gieo gió gặt bão.",
    "Đừng thấy sóng cả mà ngã tay chèo.",
    "Lửa thử vàng, gian nan thử sức.",
    "Có công mài sắt, có ngày nên kim.",
    "Nước chảy đá mòn.",
    "Kiến tha lâu cũng đầy tổ.",
    "Học thầy không tày học bạn.",
    "Muốn biết phải hỏi, muốn giỏi phải học.",
    "Máu chảy ruột mềm.",
    "Môi hở răng lạnh.",
    "Tay làm hàm nhai, tay quai miệng trễ.",
    "Nhàn cư vi bất thiện."
];

export const fetchCulturalInfo = async (lunarDate: LunarDate): Promise<string> => {
    // 1. Get from Cache
    const cacheKey = `${CACHE_PREFIX}${lunarDate.day}_${lunarDate.month}_${lunarDate.year}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) return cachedData;

    // 2. Return random offline quote IMMEDIATELY if no key or as placeholder
    // In React component, we can display this first. 
    // But here we return it if API fails or no key.
    
    if (!apiKey) {
        // Deterministic random based on date so it doesn't change on refresh
        const idx = (lunarDate.day + lunarDate.month + lunarDate.year) % OFFLINE_QUOTES.length;
        return OFFLINE_QUOTES[idx];
    }

    try {
        const prompt = `Hôm nay là ngày âm lịch: ${lunarDate.day}/${lunarDate.month}/${lunarDate.year} (${lunarDate.canChiDay}). 
        Hãy cung cấp 1 câu tục ngữ, ca dao hoặc sự kiện lịch sử/văn hóa Việt Nam ý nghĩa (ngắn gọn dưới 25 từ) phù hợp với ngày này hoặc ngẫu nhiên.
        Không dùng markdown. Chỉ trả về text.`;

        // We assume the caller handles the async wait. 
        // Ideally, UI shows offline quote first, then updates.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text?.trim();
        if (text) {
            localStorage.setItem(cacheKey, text);
            return text;
        }
    } catch (error) {
        console.warn("Gemini Error, using fallback");
    }
    
    const idx = (lunarDate.day + lunarDate.month + lunarDate.year) % OFFLINE_QUOTES.length;
    return OFFLINE_QUOTES[idx];
};

export const getInstantQuote = (lunarDate: LunarDate): string => {
     const idx = (lunarDate.day + lunarDate.month + lunarDate.year) % OFFLINE_QUOTES.length;
     return OFFLINE_QUOTES[idx];
}
