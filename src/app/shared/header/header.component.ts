import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserProfileService } from '../../domains/user/user.api';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { StyleClassModule } from 'primeng/styleclass';
import { RippleModule } from 'primeng/ripple';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { BadgeModule } from 'primeng/badge';
import { ToolbarModule } from 'primeng/toolbar';
import { ChipModule } from 'primeng/chip';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarModule,
    ButtonModule,
    AvatarModule,
    StyleClassModule,
    RippleModule,
    OverlayPanelModule,
    BadgeModule,
    ToolbarModule,
    ChipModule,
    MenubarModule
  ],
  template: `
    <div class="sticky top-0 z-50">
      <p-menubar [model]="items" styleClass="bg-white shadow-2 border-none px-4 py-2">
        <ng-template pTemplate="start">
          <a routerLink="/" class="flex items-center gap-2 no-underline cursor-pointer mr-4">
            <i class="pi pi-book text-indigo-600 text-2xl"></i>
            <span class="text-xl font-bold text-gray-800">LearnEnglish</span>
          </a>
        </ng-template>

        <ng-template pTemplate="end">
          <div class="flex items-center gap-3">
            <!-- Stats (Desktop) -->
            <div class="hidden md:flex gap-2">
              <p-chip styleClass="bg-orange-50 text-orange-600 font-bold pl-2 pr-3">
                <i class="pi pi-fire mr-2"></i>
                <span>{{ streak() }}</span>
              </p-chip>
              <p-chip styleClass="bg-blue-50 text-blue-600 font-bold pl-2 pr-3">
                <i class="pi pi-star-fill mr-2"></i>
                <span>{{ xp() }}</span>
              </p-chip>
            </div>

            <!-- Avatar (Always Visible) -->
            <div class="relative cursor-pointer" (click)="op.toggle($event)">
              <p-avatar 
                [label]="userInitial()" 
                shape="circle" 
                size="large" 
                [style]="{'background-color': avatarColor(), 'color': '#ffffff', 'font-weight': 'bold'}">
              </p-avatar>
              <p-badge [value]="level().toString()" severity="success" styleClass="absolute -bottom-1 -right-1"></p-badge>
            </div>

            <!-- Mobile Menu Button -->
            <p-button icon="pi pi-bars" styleClass="p-button-text md:hidden" (click)="sidebarVisible.set(true)"></p-button>
          </div>
        </ng-template>
      </p-menubar>
    </div>

    <!-- User Profile Overlay -->
    <p-overlayPanel #op styleClass="w-80">
      <div class="flex flex-col gap-4 p-1">
        <!-- Header: Avatar + Name -->
        <div class="flex items-center gap-3">
          <p-avatar 
            [label]="userInitial()" 
            shape="circle" 
            size="xlarge" 
            [style]="{'background-color': avatarColor(), 'color': '#ffffff', 'font-weight': 'bold', 'width': '4rem', 'height': '4rem', 'font-size': '1.5rem'}">
          </p-avatar>
          <div class="flex flex-col">
            <span class="font-bold text-lg text-gray-800">{{ userName() }}</span>
            <span class="text-gray-500 text-sm">Level {{ level() }}</span>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="bg-slate-50 rounded-lg p-3 grid grid-cols-1 gap-2 border border-slate-100">
          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-700 text-sm">XP</span>
            <span class="font-bold text-blue-600">{{ xp() }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-700 text-sm">Streak</span>
            <span class="font-bold text-orange-600">{{ streak() }} days</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-700 text-sm">Words Learned</span>
            <span class="font-bold text-green-600">{{ wordsLearned() }}</span>
          </div>
        </div>

        <!-- Logout Button -->
        <button pButton type="button" label="Logout" icon="pi pi-sign-out" 
          class="p-button-outlined p-button-danger w-full justify-center" 
          (click)="logout()">
        </button>
      </div>
    </p-overlayPanel>

    <!-- Mobile Sidebar Navigation -->
    <p-sidebar [(visible)]="sidebarVisible" position="right" styleClass="w-full sm:w-20rem">
      <ng-template pTemplate="header">
        <div class="flex items-center gap-2">
           <i class="pi pi-book text-indigo-600 text-2xl"></i>
           <span class="text-xl font-bold text-gray-800">Menu</span>
        </div>
      </ng-template>
      
      <div class="flex flex-col gap-2 mt-4">
        <!-- Mobile Stats -->
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
           <div class="flex flex-col items-center">
             <span class="text-xs text-gray-500 uppercase font-semibold">Streak</span>
             <div class="flex items-center gap-1 text-orange-600 font-bold">
               <i class="pi pi-fire"></i> {{ streak() }}
             </div>
           </div>
           <div class="w-px h-8 bg-gray-200"></div>
           <div class="flex flex-col items-center">
             <span class="text-xs text-gray-500 uppercase font-semibold">Level</span>
             <div class="flex items-center gap-1 text-yellow-600 font-bold">
               <i class="pi pi-trophy"></i> {{ level() }}
             </div>
           </div>
           <div class="w-px h-8 bg-gray-200"></div>
           <div class="flex flex-col items-center">
             <span class="text-xs text-gray-500 uppercase font-semibold">XP</span>
             <div class="flex items-center gap-1 text-blue-600 font-bold">
               <i class="pi pi-star-fill"></i> {{ xp() }}
             </div>
           </div>
        </div>

        <button pButton label="Home" icon="pi pi-home" class="p-button-text text-left justify-start text-gray-700" (click)="sidebarVisible.set(false)" routerLink="/"></button>
        <button pButton label="Practice" icon="pi pi-bolt" class="p-button-text text-left justify-start text-gray-700" (click)="sidebarVisible.set(false)" routerLink="/exercises"></button>
        <button pButton label="Phoneme Practice" icon="pi pi-microphone" class="p-button-text text-left justify-start text-gray-700" (click)="sidebarVisible.set(false)" routerLink="/ipa/practice-free"></button>
        <button pButton label="Create" icon="pi pi-plus" class="p-button-text text-left justify-start text-gray-700" (click)="sidebarVisible.set(false)" routerLink="/admin/lesson-generator"></button>
        
        <div class="my-2 border-t border-gray-100"></div>
        
        <button pButton type="button" label="Logout" icon="pi pi-sign-out" 
          class="p-button-text p-button-danger text-left justify-start" 
          (click)="logout()">
        </button>
      </div>
    </p-sidebar>
  `,
  styles: [`
    :host ::ng-deep .p-menubar {
      background: transparent;
      border: none;
      padding: 0;
    }
    :host ::ng-deep .p-menubar-button {
      display: none; /* Hide default menubar hamburger, use custom one */
    }
    :host ::ng-deep .p-menuitem-link {
      color: #4b5563 !important; /* text-gray-600 */
    }
    :host ::ng-deep .p-menuitem-link:hover {
      color: #4f46e5 !important; /* text-indigo-600 */
      background: transparent !important;
    }
    :host ::ng-deep .p-menuitem-link:focus {
      background: transparent !important;
    }
    /* Hide menu items on mobile since we use sidebar */
    @media screen and (max-width: 768px) {
      :host ::ng-deep .p-menubar-root-list {
        display: none !important;
      }
    }
  `]
})
export class HeaderComponent {
  private userProfileService = inject(UserProfileService);

  items: MenuItem[] = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      routerLink: '/'
    },
    {
      label: 'Practice',
      icon: 'pi pi-bolt',
      routerLink: '/exercises'
    },
    {
      label: 'Phoneme Practice',
      icon: 'pi pi-microphone',
      routerLink: '/ipa/practice-free'
    },
    {
      label: 'Create',
      icon: 'pi pi-plus',
      routerLink: '/admin/lesson-generator'
    }
  ];

  sidebarVisible = signal(false);

  // Reactive signals from service
  userName = toSignal(this.userProfileService.profile$.pipe(map(p => p.name)), { initialValue: 'User' });
  level = toSignal(this.userProfileService.profile$.pipe(map(p => p.currentLevel)), { initialValue: 1.0 });
  xp = toSignal(this.userProfileService.profile$.pipe(map(p => p.xp)), { initialValue: 0 });
  streak = toSignal(this.userProfileService.profile$.pipe(map(p => p.streak.currentStreak)), { initialValue: 0 });
  wordsLearned = toSignal(this.userProfileService.profile$.pipe(map(p => p.stats.totalWordsLearned)), { initialValue: 0 });
  userInitial = toSignal(this.userProfileService.profile$.pipe(map(p => p.name.charAt(0).toUpperCase())), { initialValue: 'L' });

  // Computed avatar color
  avatarColor = toSignal(this.userProfileService.profile$.pipe(map(p => this.userProfileService.getAvatarColor(p.name))), { initialValue: '#4ECDC4' });

  logout() {
    this.userProfileService.logout();
    this.sidebarVisible.set(false);
  }
}
