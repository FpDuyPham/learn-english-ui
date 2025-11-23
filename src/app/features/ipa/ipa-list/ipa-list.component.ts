import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IpaDataService, IpaSound } from '../../../core/ipa-data.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TabViewModule } from 'primeng/tabview';

@Component({
    selector: 'app-ipa-list',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, BadgeModule, TabViewModule],
    templateUrl: './ipa-list.component.html',
    styleUrls: ['./ipa-list.component.scss']
})
export class IpaListComponent implements OnInit {
    level1IPAs: IpaSound[] = [];
    filteredIPAs: IpaSound[] = [];
    isLevel2Unlocked = false;
    selectedFilter: 'all' | 'new' | 'learning' | 'mastered' = 'all';
    totalXP = 0;

    constructor(
        private ipaService: IpaDataService,
        private router: Router
    ) { }

    ngOnInit() {
        this.level1IPAs = this.ipaService.getIPAsForLevel(1);
        this.isLevel2Unlocked = this.ipaService.isLevelUnlocked(2);
        this.calculateTotalXP();
        this.applyFilter();
    }

    calculateTotalXP() {
        this.totalXP = this.level1IPAs.reduce((sum, ipa) => {
            const progress = this.getProgress(ipa);
            return sum + (progress.wordsCorrect * 20); // 20 XP per correct word
        }, 0);
    }

    applyFilter() {
        switch (this.selectedFilter) {
            case 'new':
                this.filteredIPAs = this.level1IPAs.filter(ipa =>
                    this.getProgress(ipa).status === 'not_learned'
                );
                break;
            case 'learning':
                this.filteredIPAs = this.level1IPAs.filter(ipa =>
                    this.getProgress(ipa).status === 'in_progress'
                );
                break;
            case 'mastered':
                this.filteredIPAs = this.level1IPAs.filter(ipa =>
                    this.getProgress(ipa).status === 'mastered'
                );
                break;
            default:
                this.filteredIPAs = this.level1IPAs;
        }
    }

    setFilter(filter: 'all' | 'new' | 'learning' | 'mastered') {
        this.selectedFilter = filter;
        this.applyFilter();
    }

    getProgress(ipa: IpaSound) {
        return this.ipaService.getProgress(ipa.symbol, ipa.level);
    }

    getStatusClass(ipa: IpaSound): string {
        const status = this.getProgress(ipa).status;
        return `status-${status.replace('_', '-')}`;
    }

    getStatusIcon(ipa: IpaSound): string {
        const status = this.getProgress(ipa).status;
        switch (status) {
            case 'mastered': return '✓';
            case 'in_progress': return '◐';
            default: return '○';
        }
    }

    getMasteredCount(level: 1 | 2 | 3): number {
        const ipas = this.ipaService.getIPAsForLevel(level);
        return ipas.filter(ipa => this.getProgress(ipa).status === 'mastered').length;
    }

    getNewCount(): number {
        return this.level1IPAs.filter(ipa => this.getProgress(ipa).status === 'not_learned').length;
    }

    getLearningCount(): number {
        return this.level1IPAs.filter(ipa => this.getProgress(ipa).status === 'in_progress').length;
    }

    getLevel1CompletionPercent(): number {
        const total = this.level1IPAs.length;
        if (total === 0) return 0;
        const mastered = this.getMasteredCount(1);
        return Math.round((mastered / total) * 100);
    }

    openTrainer(ipa: IpaSound) {
        this.router.navigate(['/ipa/train', ipa.symbol, ipa.level]);
    }
}
