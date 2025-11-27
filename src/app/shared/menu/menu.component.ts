import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { UserProfileService } from '../../domains/user/user.api';
import { GamificationCompactComponent } from '../gamification-compact/gamification-compact.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MenubarModule,
    ButtonModule,
    OverlayPanelModule,
    AvatarModule,
    BadgeModule,
    TooltipModule,
    GamificationCompactComponent
  ],
  templateUrl: './menu.component.html',
})
export class MenuComponent implements OnInit {
  items: MenuItem[] | undefined;
  isDarkMode = false;

  profile$;

  constructor(private userProfileService: UserProfileService) {
    this.profile$ = this.userProfileService.profile$;
  }

  ngOnInit() {
    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-fw pi-home',
        routerLink: '/home'
      },
      {
        label: 'Practice',
        icon: 'pi pi-fw pi-bolt',
        items: [
          {
            label: 'Exercises',
            icon: 'pi pi-fw pi-list',
            routerLink: '/exercises'
          },
          {
            label: 'Smart IPA',
            icon: 'pi pi-fw pi-microphone',
            routerLink: '/ipa'
          },
          {
            label: 'Shadowing',
            icon: 'pi pi-fw pi-comments',
            routerLink: '/shadowing'
          }
        ]
      },
      {
        label: 'Create',
        icon: 'pi pi-fw pi-plus',
        routerLink: '/exercises/create'
      }
    ];

    // Check system preference or saved preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      this.isDarkMode = savedMode === 'true';
    } else {
      this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyDarkMode();
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    this.applyDarkMode();
  }

  applyDarkMode() {
    const element = document.querySelector('html');
    if (this.isDarkMode) {
      element?.classList.add('my-app-dark');
    } else {
      element?.classList.remove('my-app-dark');
    }
  }
}
