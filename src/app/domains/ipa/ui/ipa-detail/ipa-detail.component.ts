import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IpaDataService, IpaSymbol, WordPractice } from '../../data/ipa-data.service';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-ipa-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TabViewModule, CardModule],
  template: `
    <div class="min-h-screen surface-ground p-4" *ngIf="symbolData">
      
      <!-- Back Button -->
      <button pButton icon="pi pi-arrow-left" label="Back to Garden" 
              class="p-button-text mb-4" (click)="goBack()"></button>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        <!-- Left Column: Info Card -->
        <div class="lg:col-span-1">
          <p-card styleClass="shadow-4 border-round-2xl text-center h-full">
            <div class="flex flex-column align-items-center gap-4 py-4">
              <div class="w-8rem h-8rem bg-primary-50 border-circle flex align-items-center justify-content-center">
                <span class="text-6xl font-bold text-primary font-serif">{{ symbolData.symbol }}</span>
              </div>
              <div>
                <h2 class="text-3xl font-bold text-900 m-0">{{ symbolData.name }}</h2>
                <span class="text-600 uppercase text-sm font-semibold tracking-wider">{{ symbolData.category }}</span>
              </div>
              
              <p class="text-700 line-height-3 px-4">{{ symbolData.description }}</p>

              <!-- Placeholder for Mouth Image/Video -->
              <div class="w-full h-10rem surface-200 border-round flex align-items-center justify-content-center text-500">
                <i class="pi pi-image text-4xl mr-2"></i> Mouth Diagram
              </div>
            </div>
          </p-card>
        </div>

        <!-- Right Column: Word Lists & Practice -->
        <div class="lg:col-span-2">
          <p-card styleClass="shadow-4 border-round-2xl h-full">
            <h3 class="text-xl font-bold text-900 mb-4">Practice Words</h3>
            
            <p-tabView>
              <p-tabPanel [header]="'Level ' + level.level" *ngFor="let level of symbolData.levels">
                <div class="flex flex-column gap-3">
                  <div *ngIf="level.words.length === 0" class="text-center p-5 text-500">
                    <i class="pi pi-lock text-4xl mb-2 block"></i>
                    Coming soon...
                  </div>

                  <div *ngFor="let word of level.words" 
                       class="flex align-items-center justify-content-between p-3 surface-50 border-round hover:surface-100 transition-colors">
                    <div class="flex align-items-center gap-3">
                      <button pButton icon="pi pi-volume-up" class="p-button-rounded p-button-text p-button-sm"></button>
                      <div>
                        <div class="font-bold text-lg text-900">{{ word.targetWord }}</div>
                        <div class="text-sm text-500 font-serif">{{ word.targetIpa }}</div>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="level.words.length > 0" class="mt-4 text-center">
                     <button pButton label="Start Practice" icon="pi pi-microphone" 
                             class="p-button-lg p-button-rounded w-full md:w-auto px-6"
                             (click)="startPractice(level.level)"></button>
                  </div>
                </div>
              </p-tabPanel>
            </p-tabView>
          </p-card>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .font-serif { font-family: 'Times New Roman', serif; }
  `]
})
export class IpaDetailComponent implements OnInit {
  symbolData: IpaSymbol | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ipaService: IpaDataService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const symbolChar = params.get('symbol');
      if (symbolChar) {
        this.symbolData = this.ipaService.getSymbol(symbolChar);
      }
    });
  }

  goBack() {
    this.router.navigate(['/ipa/chart']);
  }

  startPractice(level: number) {
    // Navigate to the practice component with parameters
    console.log(`Starting practice for ${this.symbolData?.symbol} Level ${level}`);
    this.router.navigate(['/ipa/practice', this.symbolData?.symbol, level]);
  }
}
