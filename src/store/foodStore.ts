import { create } from 'zustand';

interface Ingredient {
    id: string;
    name: string;
    amount: number;
    unit: string;
    caloriesPer100: number;
    proteinPer100: number;
    carbsPer100: number;
    fatPer100: number;
}

interface FoodState {
    name: string;
    ingredients: Ingredient[];
    portions: number;
    unit: string;
    setIngredients: (ingredients: Ingredient[]) => void;
    setPortions: (portions: number) => void;
    setUnit: (unit: string) => void;
    parseIngredientsFromText: (text: string) => void;
}

const INITIAL_INGREDIENTS: Ingredient[] = [
    { id: '1', name: 'Bánh phở', amount: 150, unit: 'g', caloriesPer100: 160, proteinPer100: 3, carbsPer100: 35, fatPer100: 1 },
    { id: '2', name: 'Thịt bò thái mỏng', amount: 50, unit: 'g', caloriesPer100: 250, proteinPer100: 26, carbsPer100: 0, fatPer100: 15 },
    { id: '3', name: 'Nước dùng phở', amount: 300, unit: 'ml', caloriesPer100: 20, proteinPer100: 1.5, carbsPer100: 1, fatPer100: 1 },
    { id: '4', name: 'Rau thơm & Giá', amount: 30, unit: 'g', caloriesPer100: 15, proteinPer100: 1, carbsPer100: 2, fatPer100: 0.1 },
];

export const useFoodStore = create<FoodState>((set) => ({
    name: 'Phở Bò (Beef Noodle Soup)',
    ingredients: INITIAL_INGREDIENTS,
    portions: 1,
    unit: 'tô',
    setIngredients: (ingredients: Ingredient[]) => set({ ingredients }),
    setPortions: (portions: number) => set({ portions }),
    setUnit: (unit: string) => set({ unit }),
    parseIngredientsFromText: (text: string) => {
        // Mock AI parsing: split by newline and extract name/amount
        // Example text: "Bánh phở 200g\nThịt bò 100g"
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const newIngredients: Ingredient[] = lines.map((line: string, index: number) => {
            const match = line.match(/(.+?)\s*(\d+)\s*(g|ml|kg|l)?/i);
            if (match) {
                const name = match[1].trim();
                const amount = parseFloat(match[2]);
                const unit = match[3] || 'g';
                return {
                    id: String(index + 1),
                    name,
                    amount,
                    unit,
                    caloriesPer100: 150, // Mock default
                    proteinPer100: 10,  // Mock default
                    carbsPer100: 20,    // Mock default
                    fatPer100: 5,       // Mock default
                };
            }
            return {
                id: String(index + 1),
                name: line.trim(),
                amount: 100,
                unit: 'g',
                caloriesPer100: 100,
                proteinPer100: 5,
                carbsPer100: 15,
                fatPer100: 2,
            };
        });
        set({ ingredients: newIngredients });
    }
}));
