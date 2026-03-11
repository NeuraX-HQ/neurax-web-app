export const mockMeals: any[] = [];

export const mockFridgeItems: any[] = [];

export const mockRecipes = [
    {
        id: '1',
        name: 'Beef Noodle Soup',
        description: 'A rich, comforting broth with tender beef slices and rice noodles.',
        calories: 450,
        protein: '25g',
        time: '45 min',
        match: 98,
        emoji: '🍜',
    },
    {
        id: '2',
        name: 'Avocado Toast',
        description: 'Crispy toast topped with fresh avocado.',
        calories: 320,
        protein: '12g',
        time: '15 min',
        match: 85,
        emoji: '🥑',
    },
    {
        id: '3',
        name: 'Green Salad',
        description: 'Fresh mixed greens with vinaigrette.',
        calories: 180,
        protein: '8g',
        time: '10 min',
        match: 90,
        emoji: '🥗',
    },
];

export const mockLeaderboard = [
    { rank: 1, name: 'Alex M.', score: 2890, streak: 15, change: 0, petScore: 1250 },
    { rank: 2, name: 'Sarah K.', score: 2450, streak: 10, change: 0, petScore: 1680 },
    { rank: 3, name: 'Jenna R.', score: 2310, streak: 7, change: 0, petScore: 980 },
    { rank: 4, name: 'Mike Ross', score: 2150, streak: 5, change: 12, petScore: 1420 },
    { rank: 5, name: 'David L.', score: 2080, streak: 8, change: 0, petScore: 1100 },
    { rank: 6, name: 'Emma Watson', score: 1950, streak: 12, change: -2, petScore: 1550 },
    { rank: 7, name: 'Chris P.', score: 1820, streak: 2, change: 0, petScore: 760 },
];

export const mockNotifications = [
    {
        id: '1',
        title: "AI Bảo: Don't forget your water goal! 💧",
        body: 'Keep hydrated to maintain energy.',
        time: '2m ago',
        icon: '💧',
        color: '#4A90D9',
        section: 'TODAY',
    },
    {
        id: '2',
        title: 'Streak kept! 🔥',
        body: "You've logged meals for 14 days straight.",
        time: '2h ago',
        icon: '🔥',
        color: '#E74C3C',
        section: 'TODAY',
    },
    {
        id: '3',
        title: 'Lunch time 🥗',
        body: 'Time to log your lunch. Keep it balanced!',
        time: '4h ago',
        icon: '🍴',
        color: '#F39C12',
        section: 'TODAY',
    },
    {
        id: '4',
        title: 'Leaderboard Update 👑',
        body: 'You reached the top 5% in your community!',
        time: '1d ago',
        icon: '🏆',
        color: '#7F8C9B',
        section: 'EARLIER',
    },
    {
        id: '5',
        title: 'Daily Goal Met ✅',
        body: 'Great job hitting your protein target yesterday.',
        time: '1d ago',
        icon: '✅',
        color: '#2ECC71',
        section: 'EARLIER',
    },
    {
        id: '6',
        title: 'Hydration check 💧',
        body: 'You missed your afternoon water intake.',
        time: '2d ago',
        icon: '💧',
        color: '#4A90D9',
        section: 'EARLIER',
    },
];

export const mockChatMessages = [
    {
        id: '1',
        sender: 'ai',
        text: 'Chào Admin! Bạn đã uống 800ml nước hôm nay, chỉ còn 1700ml nữa thôi. Bạn có muốn ghi chú món ăn tối không? 🥗',
        time: '08:30 AM',
    },
    {
        id: '2',
        sender: 'user',
        text: 'Cho tôi gợi ý món tối giàu protein',
        time: '08:32 AM',
    },
    {
        id: '3',
        sender: 'ai',
        text: 'Đây là một gợi ý tuyệt vời cho bạn:',
        time: '08:32 AM',
        foodCard: {
            name: 'Grilled Salmon with Asparagus',
            description: 'Cá hồi nướng giàu Omega-3 kết hợp với măng tây giòn, cung cấp 35g protein cho b...',
            calories: 450,
            emoji: '🐟',
        },
    },
];

export const goals = [
    { id: 'lose', label: 'Giảm cân', icon: '📦', vectorIcon: 'trending-down-outline' },
    { id: 'maintain', label: 'Duy trì cân nặng', icon: '⚖️', vectorIcon: 'swap-horizontal-outline' },
    { id: 'gain', label: 'Tăng cân', icon: '📈', vectorIcon: 'trending-up-outline' },
    { id: 'muscle', label: 'Tăng cơ', icon: '💪', vectorIcon: 'fitness-outline' },
    { id: 'improve', label: 'Cải thiện thói quen ăn uống', icon: '🍽️', vectorIcon: 'restaurant-outline' },
];

export const activityLevels = [
    { id: 'sedentary', label: 'Ít vận động', description: 'Làm việc văn phòng', icon: '🖥️', vectorIcon: 'desktop-outline' },
    { id: 'light', label: 'Vận động nhẹ', description: '1-2 ngày/tuần', icon: '🚶', vectorIcon: 'walk-outline' },
    { id: 'moderate', label: 'Vận động vừa', description: '3-5 ngày/tuần', icon: '🏃', vectorIcon: 'bicycle-outline' },
    { id: 'active', label: 'Vận động nhiều', description: '6-7 ngày/tuần', icon: '🏋️', vectorIcon: 'barbell-outline' },
    { id: 'extreme', label: 'Vận động cực độ', description: 'Vận động viên', icon: '⚡', vectorIcon: 'flash-outline' },
];

export const dietaryRestrictions = [
    { id: 'dairy', label: 'Không sữa', icon: '💧', vectorIcon: 'water-outline' },
    { id: 'gluten', label: 'Không Gluten', icon: '🌿', vectorIcon: 'leaf-outline' },
    { id: 'nuts', label: 'Dị ứng hạt', icon: '❄️', vectorIcon: 'nutrition-outline' },
    { id: 'vegetarian', label: 'Ăn chay', icon: '🍃', vectorIcon: 'flower-outline' },
    { id: 'vegan', label: 'Ăn chay trường', icon: '🌱', vectorIcon: 'sunny-outline' },
    { id: 'seafood', label: 'Không hải sản', icon: '🐟', vectorIcon: 'fish-outline' },
];

export const drinkTypes = [
    { id: 'water', label: 'Water', emoji: '💧' },
    { id: 'tea', label: 'Tea', emoji: '🍵' },
    { id: 'coffee', label: 'Coffee', emoji: '☕' },
    { id: 'juice', label: 'Juice', emoji: '🍊' },
    { id: 'beer', label: 'Beer', emoji: '🍺' },
];
