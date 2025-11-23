export interface UserProfile {
    userId: string;
    name: string;
    joinDate: Date;
    currentLevel: number; // IELTS Band 1.0 - 9.0
    xp: number;
    stats: LearningStats;
    streak: StreakStats;
    garden: GardenState;
    settings: UserSettings;
    badges: Badge[];
    achievements: Achievement[];
    dailyMissions: DailyMission[];
}

export interface LearningStats {
    totalWordsLearned: number;
    wordsInProgress: number;
    totalTimeSpent: number; // in minutes
}

export interface StreakStats {
    currentStreak: number;
    longestStreak: number;
    lastLoginDate: Date;
    freezeCount: number; // Number of streak freezes available
}

export interface GardenState {
    theme: GardenTheme;
    plants: Plant[];
}

export type GardenTheme = 'GRASS_PATCH' | 'MEADOW' | 'WOODLAND' | 'RAINFOREST' | 'COMPLEX_FOREST';

export interface Plant {
    id: string;
    wordId: string;
    stage: PlantStage;
    plantedDate: Date;
    lastWateredDate: Date;
}

export type PlantStage = 'SEED' | 'SPROUT' | 'SAPLING' | 'TREE' | 'FLOWER' | 'WITHERED';

export interface UserSettings {
    dailyGoal: number; // Number of words to review/learn
    notificationsEnabled: boolean;
    theme: 'light' | 'dark' | 'system';
}

export interface DailyMission {
    id: string;
    type: 'LEARN_WORDS' | 'REVIEW_WORDS' | 'COMPLETE_EXERCISES' | 'PRACTICE_MINUTES';
    description: string;
    target: number;
    current: number;
    completed: boolean;
    rewardXp: number;
    expiresAt: Date;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // PrimeIcons class name
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    unlockedAt?: Date;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string; // PrimeIcons class name
    category: 'LEARNING' | 'STREAK' | 'GARDEN' | 'SOCIAL';
    progress: number;
    target: number;
    completed: boolean;
    unlockedAt?: Date;
    rewardXp: number;
}
