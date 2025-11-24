import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-bottom-nav',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div class="flex justify-around items-center h-16">
        <a routerLink="/" routerLinkActive="text-indigo-600" [routerLinkActiveOptions]="{exact: true}"
          class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-indigo-600 transition-colors no-underline">
          <svg class="w-6 h-6 mb-1" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span class="text-xs font-medium">Home</span>
        </a>

        <a routerLink="/exercises" routerLinkActive="text-indigo-600"
          class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-indigo-600 transition-colors no-underline">
          <svg class="w-6 h-6 mb-1" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span class="text-xs font-medium">Practice</span>
        </a>

        <a routerLink="/admin/lesson-generator" routerLinkActive="text-indigo-600"
          class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-indigo-600 transition-colors no-underline">
          <svg class="w-6 h-6 mb-1" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span class="text-xs font-medium">Create</span>
        </a>
      </div>
    </nav>
  `,
    styles: [`
    .pb-safe {
      padding-bottom: env(safe-area-inset-bottom);
    }
  `]
})
export class BottomNavComponent { }
