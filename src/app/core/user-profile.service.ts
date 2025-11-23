import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfile, GardenTheme, Plant, PlantStage } from './models/user-profile.model';

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {
    private readonly STORAGE_KEY = 'learn_english_user_profile';

    private profileSubject = new BehaviorSubject<UserProfile>(this.loadProfile());
    public profile$ = this.profileSubject.asObservable();

    constructor() {
        // Check streak on initialization
        this.checkStreak();
    }

    private loadProfile(): UserProfile {
        const storedProfile = localStorage.getItem(this.STORAGE_KEY);
        if (storedProfile) {
            try {
                const parsed = JSON.parse(storedProfile);
                // Restore Date objects from strings
                parsed.joinDate = new Date(parsed.joinDate);
                parsed.streak.lastLoginDate = new Date(parsed.streak.lastLoginDate);
                parsed.garden.plants.forEach((p: Plant) => {
                    p.plantedDate = new Date(p.plantedDate);
                    p.lastWateredDate = new Date(p.lastWateredDate);
                });
                // Restore badge unlock dates
                if (parsed.badges) {
                    parsed.badges.forEach((b: any) => {
                        if (b.unlockedAt) b.unlockedAt = new Date(b.unlockedAt);
                    });
                }
                // Restore achievement unlock dates
                if (parsed.achievements) {
                    parsed.achievements.forEach((a: any) => {
                        if (a.unlockedAt) a.unlockedAt = new Date(a.unlockedAt);
                    });
                }
                // Restore daily mission expiry dates
                if (parsed.dailyMissions) {
                    parsed.dailyMissions.forEach((m: any) => {
                        m.expiresAt = new Date(m.expiresAt);
                    });
                }
                return parsed;
            } catch (e) {
                console.error('Error parsing user profile', e);
                return this.createDefaultProfile();
            }
        }
        return this.createDefaultProfile();
    }

    private createDefaultProfile(): UserProfile {
        const defaultProfile: UserProfile = {
            userId: crypto.randomUUID(),
            name: 'Learner',
            joinDate: new Date(),
            currentLevel: 1.0,
            xp: 0,
            stats: {
                totalWordsLearned: 0,
                wordsInProgress: 0,
                totalTimeSpent: 0
            },
            streak: {
                currentStreak: 0,
                longestStreak: 0,
                lastLoginDate: new Date(),
                freezeCount: 0
            },
            garden: {
                theme: 'GRASS_PATCH',
                plants: []
            },
            settings: {
                dailyGoal: 5,
                notificationsEnabled: true,
                theme: 'system'
            },
            badges: this.initializeBadges(),
            achievements: this.initializeAchievements(),
            dailyMissions: this.generateDailyMissions()
        };
        this.saveProfile(defaultProfile);
        return defaultProfile;
    }

    public saveProfile(profile: UserProfile): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
        this.profileSubject.next(profile);
    }

    public login(username: string): Observable<UserProfile> {
        return new Observable(observer => {
            const existingProfile = this.profileSubject.value;

            // If there's already a profile with this username, use it
            if (existingProfile.name === username) {
                this.checkStreak();
                observer.next(existingProfile);
                observer.complete();
                return;
            }

            // Create new profile with the username
            const newProfile = this.createDefaultProfile();
            newProfile.name = username;
            this.saveProfile(newProfile);
            this.checkStreak();

            observer.next(newProfile);
            observer.complete();
        });
    }

    public logout(): void {
        // Clear the profile and reset to default
        localStorage.removeItem(this.STORAGE_KEY);
        const defaultProfile = this.createDefaultProfile();
        this.profileSubject.next(defaultProfile);
    }

    public getAvatarColor(name: string): string {
        // Generate a consistent color based on the username
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
            '#E63946', '#457B9D', '#F77F00', '#06D6A0', '#118AB2'
        ];

        // Simple hash function to get consistent color for same name
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    public updateProfile(updateFn: (profile: UserProfile) => void): void {
        const currentProfile = this.profileSubject.value;
        updateFn(currentProfile);
        this.saveProfile(currentProfile);
    }

    public checkStreak(): void {
        const profile = this.profileSubject.value;
        const now = new Date();
        const lastLogin = profile.streak.lastLoginDate;

        // Reset time components to compare dates only
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());

        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already logged in today
            return;
        } else if (diffDays === 1) {
            // Consecutive day
            profile.streak.currentStreak++;
            if (profile.streak.currentStreak > profile.streak.longestStreak) {
                profile.streak.longestStreak = profile.streak.currentStreak;
            }
        } else {
            // Streak broken
            if (profile.streak.freezeCount > 0) {
                // Use freeze
                profile.streak.freezeCount--;
                // Streak maintained (or technically paused, but we keep the count)
            } else {
                profile.streak.currentStreak = 1; // Reset to 1 for today
            }
        }

        profile.streak.lastLoginDate = now;
        this.saveProfile(profile);
    }

    public addXP(amount: number): void {
        this.updateProfile(p => {
            p.xp += amount;
            this.checkLevelUp(p);
        });
    }

    private checkLevelUp(profile: UserProfile): void {
        // Simple level up logic based on XP
        // Band 1.0 to 9.0. Let's say every 1000 XP is a 0.5 band increase for simplicity
        // Base level 1.0
        const newLevel = 1.0 + Math.floor(profile.xp / 1000) * 0.5;
        if (newLevel > profile.currentLevel && newLevel <= 9.0) {
            profile.currentLevel = newLevel;
            this.updateGardenTheme(profile);
        }
    }

    private updateGardenTheme(profile: UserProfile): void {
        if (profile.currentLevel >= 8.0) profile.garden.theme = 'COMPLEX_FOREST';
        else if (profile.currentLevel >= 6.5) profile.garden.theme = 'RAINFOREST';
        else if (profile.currentLevel >= 5.0) profile.garden.theme = 'WOODLAND';
        else if (profile.currentLevel >= 3.0) profile.garden.theme = 'MEADOW';
        else profile.garden.theme = 'GRASS_PATCH';
    }

    public plantSeed(wordId: string): void {
        this.updateProfile(p => {
            const newPlant: Plant = {
                id: crypto.randomUUID(),
                wordId: wordId,
                stage: 'SEED',
                plantedDate: new Date(),
                lastWateredDate: new Date()
            };
            p.garden.plants.push(newPlant);
            p.stats.wordsInProgress++;
        });
    }

    public waterPlant(wordId: string, isSuccess: boolean): void {
        this.updateProfile(p => {
            const plant = p.garden.plants.find(pl => pl.wordId === wordId);
            if (plant) {
                plant.lastWateredDate = new Date();
                if (isSuccess) {
                    this.evolvePlant(plant);
                } else {
                    plant.stage = 'WITHERED';
                }
            }
        });
    }

    private evolvePlant(plant: Plant): void {
        const stages: PlantStage[] = ['SEED', 'SPROUT', 'SAPLING', 'TREE', 'FLOWER'];
        const currentIndex = stages.indexOf(plant.stage);
        if (currentIndex < stages.length - 1 && currentIndex !== -1) {
            plant.stage = stages[currentIndex + 1];
        } else if (plant.stage === 'WITHERED') {
            plant.stage = 'SPROUT'; // Recover
        }
    }

    // Badge, Achievement, and Daily Mission methods
    private initializeBadges() {
        return [
            { id: 'first_word', name: 'First Steps', description: 'Learn your first word', icon: 'pi-star', rarity: 'COMMON' as const },
            { id: 'week_streak', name: 'Dedicated', description: 'Maintain a 7-day streak', icon: 'pi-fire', rarity: 'RARE' as const },
            { id: 'month_streak', name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: 'pi-bolt', rarity: 'EPIC' as const },
            { id: 'level_5', name: 'Intermediate', description: 'Reach IELTS Band 5.0', icon: 'pi-trophy', rarity: 'RARE' as const },
            { id: 'level_9', name: 'Master', description: 'Reach IELTS Band 9.0', icon: 'pi-crown', rarity: 'LEGENDARY' as const },
            { id: '100_words', name: 'Vocabulary Builder', description: 'Learn 100 words', icon: 'pi-book', rarity: 'RARE' as const },
        ];
    }

    private initializeAchievements() {
        return [
            { id: 'words_learned_10', name: 'Word Collector', description: 'Learn 10 words', icon: 'pi-book', category: 'LEARNING' as const, progress: 0, target: 10, completed: false, rewardXp: 50 },
            { id: 'words_learned_50', name: 'Book Worm', description: 'Learn 50 words', icon: 'pi-book', category: 'LEARNING' as const, progress: 0, target: 50, completed: false, rewardXp: 200 },
            { id: 'words_learned_100', name: 'Dictionary', description: 'Learn 100 words', icon: 'pi-book', category: 'LEARNING' as const, progress: 0, target: 100, completed: false, rewardXp: 500 },
            { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'pi-fire', category: 'STREAK' as const, progress: 0, target: 7, completed: false, rewardXp: 100 },
            { id: 'streak_30', name: 'Month Master', description: 'Maintain a 30-day streak', icon: 'pi-fire', category: 'STREAK' as const, progress: 0, target: 30, completed: false, rewardXp: 500 },
            { id: 'garden_meadow', name: 'Growing Garden', description: 'Evolve your garden to Meadow', icon: 'pi-sun', category: 'GARDEN' as const, progress: 0, target: 1, completed: false, rewardXp: 150 },
            { id: 'garden_rainforest', name: 'Lush Paradise', description: 'Evolve your garden to Rainforest', icon: 'pi-sun', category: 'GARDEN' as const, progress: 0, target: 1, completed: false, rewardXp: 400 },
        ];
    }

    private generateDailyMissions() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        return [
            { id: 'daily_learn', type: 'LEARN_WORDS' as const, description: 'Learn 5 new words', target: 5, current: 0, completed: false, rewardXp: 50, expiresAt: tomorrow },
            { id: 'daily_review', type: 'REVIEW_WORDS' as const, description: 'Review 10 words', target: 10, current: 0, completed: false, rewardXp: 30, expiresAt: tomorrow },
            { id: 'daily_exercises', type: 'COMPLETE_EXERCISES' as const, description: 'Complete 3 exercises', target: 3, current: 0, completed: false, rewardXp: 40, expiresAt: tomorrow },
        ];
    }

    public unlockBadge(badgeId: string): void {
        this.updateProfile(p => {
            const badge = p.badges.find(b => b.id === badgeId);
            if (badge && !badge.unlockedAt) {
                badge.unlockedAt = new Date();
            }
        });
    }

    public updateAchievement(achievementId: string, progress: number): void {
        this.updateProfile(p => {
            const achievement = p.achievements.find(a => a.id === achievementId);
            if (achievement && !achievement.completed) {
                achievement.progress = Math.min(progress, achievement.target);
                if (achievement.progress >= achievement.target) {
                    achievement.completed = true;
                    achievement.unlockedAt = new Date();
                    this.addXP(achievement.rewardXp);
                }
            }
        });
    }

    public completeDailyMission(missionId: string): void {
        this.updateProfile(p => {
            const mission = p.dailyMissions.find(m => m.id === missionId);
            if (mission && !mission.completed) {
                mission.current++;
                if (mission.current >= mission.target) {
                    mission.completed = true;
                    this.addXP(mission.rewardXp);
                }
            }
        });
    }

    public checkAndRefreshDailyMissions(): void {
        this.updateProfile(p => {
            const now = new Date();
            const hasExpired = p.dailyMissions.some(m => m.expiresAt < now);
            if (hasExpired) {
                p.dailyMissions = this.generateDailyMissions();
            }
        });
    }
}
