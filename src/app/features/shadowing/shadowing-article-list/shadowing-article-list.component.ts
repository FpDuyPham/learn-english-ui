import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { ShadowingDataService } from '../../../core/shadowing-data.service';
import { Article, UserShadowingProgress, LevelProgress, SentencePack } from '../../../core/models/shadowing.models';

@Component({
    selector: 'app-shadowing-article-list',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, CardModule, TabsModule, BadgeModule, ProgressBarModule],
    templateUrl: './shadowing-article-list.component.html',
    styleUrls: ['./shadowing-article-list.component.scss']
})
export class ShadowingArticleListComponent implements OnInit {
    level1Articles: SentencePack[] = [];
    level2Articles: SentencePack[] = [];
    level3Articles: SentencePack[] = [];

    level1Progress: LevelProgress | null = null;
    level2Progress: LevelProgress | null = null;
    level3Progress: LevelProgress | null = null;

    totalXP = 0;
    activeTabIndex: string = '0';

    progressMap = new Map<string, UserShadowingProgress>();

    constructor(
        private shadowingService: ShadowingDataService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadArticles();
        this.loadProgress();
        this.totalXP = this.shadowingService.getTotalXP();

        // Subscribe to progress changes
        this.shadowingService.progress$.subscribe(progress => {
            this.progressMap = progress;
            this.loadProgress();
            this.totalXP = this.shadowingService.getTotalXP();
        });
    }

    loadArticles() {
        this.level1Articles = this.shadowingService.getArticlesByLevel(1);
        this.level2Articles = this.shadowingService.getArticlesByLevel(2);
        this.level3Articles = this.shadowingService.getArticlesByLevel(3);
    }

    loadProgress() {
        this.level1Progress = this.shadowingService.getLevelProgress(1);
        this.level2Progress = this.shadowingService.getLevelProgress(2);
        this.level3Progress = this.shadowingService.getLevelProgress(3);
    }

    getArticleProgress(articleId: string): UserShadowingProgress {
        return this.shadowingService.getProgress(articleId);
    }

    startPractice(articleId: string) {
        this.router.navigate(['/shadowing/train', articleId]);
    }

    createArticle() {
        this.router.navigate(['/shadowing/articles/create']);
    }

    editArticle(articleId: string) {
        this.router.navigate(['/shadowing/articles', articleId, 'edit']);
    }

    isLevel2Unlocked(): boolean {
        return this.shadowingService.isLevelUnlocked(2);
    }

    isLevel3Unlocked(): boolean {
        return this.shadowingService.isLevelUnlocked(3);
    }

    getStatusBadge(status: string): { severity: 'success' | 'info' | 'warn' | 'danger', label: string } {
        switch (status) {
            case 'completed':
                return { severity: 'success', label: 'Completed' };
            case 'in_progress':
                return { severity: 'warn', label: 'In Progress' };
            default:
                return { severity: 'info', label: 'Not Started' };
        }
    }

    getAccuracyClass(accuracy: number): string {
        if (accuracy >= 80) return 'high-accuracy';
        if (accuracy >= 60) return 'medium-accuracy';
        return 'low-accuracy';
    }
}
