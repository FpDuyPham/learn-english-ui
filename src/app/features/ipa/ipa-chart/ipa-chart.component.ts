import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IpaDataService, IpaSymbol, UserIpaProgress } from '../../../core/ipa-data.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-ipa-chart',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, TooltipModule],
  template: `
    <div class="min-h-screen surface-ground p-4">
      <div class="text-center mb-6">
        <h1 class="text-4xl font-bold text-900 mb-2">IPA Sound Garden</h1>
        <p class="text-lg text-600">Master the sounds of English and grow your garden.</p>
      </div>

      <div class="max-w-7xl mx-auto">
        
        <!-- Monophthongs -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-800 mb-4 border-bottom-1 surface-border pb-2">Vowels (Monophthongs)</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div *ngFor="let s of getSymbolsByCategory('monophthong')" 
                 class="ipa-card cursor-pointer transition-transform hover:scale-105"
                 (click)="openDetail(s)">
               <div class="surface-card p-3 border-round-xl shadow-2 flex flex-column align-items-center relative overflow-hidden h-full"
                    [ngClass]="{'border-green-500 border-2': getProgress(s.symbol).status === 'mastered'}">
                  
                  <!-- Plant Indicator -->
                  <div class="absolute top-0 right-0 p-2">
                    <i class="pi" [ngClass]="getPlantIcon(getProgress(s.symbol).plantStage)" 
                       [style.color]="getPlantColor(getProgress(s.symbol).plantStage)"></i>
                  </div>

                  <span class="text-3xl font-bold text-900 mb-1 font-serif">{{ s.symbol }}</span>
                  <span class="text-xs text-500 text-center">{{ s.name }}</span>
                  
                  <!-- Progress Bar -->
                  <div class="w-full h-1rem surface-100 mt-3 border-round overflow-hidden">
                    <div class="h-full bg-green-500 transition-all duration-500" 
                         [style.width.%]="getProgress(s.symbol).xp % 100"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <!-- Diphthongs -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-800 mb-4 border-bottom-1 surface-border pb-2">Diphthongs</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
             <div *ngFor="let s of getSymbolsByCategory('diphthong')" 
                 class="ipa-card cursor-pointer transition-transform hover:scale-105"
                 (click)="openDetail(s)">
               <div class="surface-card p-3 border-round-xl shadow-2 flex flex-column align-items-center relative overflow-hidden h-full">
                  <div class="absolute top-0 right-0 p-2">
                    <i class="pi" [ngClass]="getPlantIcon(getProgress(s.symbol).plantStage)" 
                       [style.color]="getPlantColor(getProgress(s.symbol).plantStage)"></i>
                  </div>
                  <span class="text-3xl font-bold text-900 mb-1 font-serif">{{ s.symbol }}</span>
                  <span class="text-xs text-500 text-center">{{ s.name }}</span>
               </div>
            </div>
          </div>
        </div>

        <!-- Consonants -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-800 mb-4 border-bottom-1 surface-border pb-2">Consonants</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
             <div *ngFor="let s of getSymbolsByCategory('consonant')" 
                 class="ipa-card cursor-pointer transition-transform hover:scale-105"
                 (click)="openDetail(s)">
               <div class="surface-card p-3 border-round-xl shadow-2 flex flex-column align-items-center relative overflow-hidden h-full">
                  <div class="absolute top-0 right-0 p-2">
                    <i class="pi" [ngClass]="getPlantIcon(getProgress(s.symbol).plantStage)" 
                       [style.color]="getPlantColor(getProgress(s.symbol).plantStage)"></i>
                  </div>
                  <span class="text-3xl font-bold text-900 mb-1 font-serif">{{ s.symbol }}</span>
                  <span class="text-xs text-500 text-center">{{ s.name }}</span>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .grid {
      display: grid;
    }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @media (min-width: 768px) { .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    @media (min-width: 1024px) { .lg\\:grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
    .gap-3 { gap: 1rem; }
    .font-serif { font-family: 'Times New Roman', serif; }
  `]
})
export class IpaChartComponent implements OnInit {
  symbols: IpaSymbol[] = [];
  progressMap = new Map<string, UserIpaProgress>();

  constructor(
    private ipaService: IpaDataService,
    private router: Router
  ) { }

  ngOnInit() {
    this.symbols = this.ipaService.getSymbols();
    this.ipaService.progress$.subscribe(map => {
      this.progressMap = map;
    });
  }

  getSymbolsByCategory(cat: string) {
    return this.symbols.filter(s => s.category === cat);
  }

  getProgress(symbol: string) {
    return this.ipaService.getProgress(symbol);
  }

  openDetail(symbol: IpaSymbol) {
    this.router.navigate(['/ipa/detail', symbol.symbol]);
  }

  getPlantIcon(stage: number): string {
    switch (stage) {
      case 0: return 'pi-circle'; // Seed
      case 1: return 'pi-spin pi-spinner'; // Sprout (using spinner as placeholder or maybe a leaf if available)
      case 2: return 'pi-apple'; // Plant
      case 3: return 'pi-verified'; // Tree/Mastered
      default: return 'pi-circle';
    }
  }

  getPlantColor(stage: number): string {
    switch (stage) {
      case 0: return '#94a3b8'; // Gray
      case 1: return '#84cc16'; // Lime
      case 2: return '#22c55e'; // Green
      case 3: return '#15803d'; // Dark Green
      default: return '#94a3b8';
    }
  }
}
