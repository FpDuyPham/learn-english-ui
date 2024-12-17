import { Routes } from '@angular/router';

// export const routes: Routes = [];

export const routes: Routes = [
  {
    path: 'audio-splitter',
    loadComponent: () =>
      import('./audio-splitter/audio-splitter.component').then(
        (c) => c.AudioSplitterComponent
      ),
  },
  { path: 'listen-and-write', loadComponent: () =>
      import('./listen-and-write/listen-and-write.component').then(
        (c) => c.ListenAndWriteComponent
      ),
  }, // New route
  {
    path: '',
    redirectTo: 'audio-splitter',
    pathMatch: 'full',
  }
];
