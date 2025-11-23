import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default route - redirect to login
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Login route
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },

  // Home route
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },

  // Exercise routes
  {
    path: 'exercises',
    loadComponent: () => import('./exercise/exercise-list/exercise-list.component').then(m => m.ExerciseListComponent)
  },
  {
    path: 'exercises/create',
    loadComponent: () => import('./exercise/exercise-create/exercise-create.component').then(m => m.ExerciseCreateComponent)
  },
  {
    path: 'exercises/:id',
    loadComponent: () => import('./exercise/exercise-detail/exercise-detail.component').then(m => m.ExerciseDetailComponent)
  },
  {
    path: 'exercises/:id/edit',
    loadComponent: () => import('./exercise/exercise-edit/exercise-edit.component').then(m => m.ExerciseEditComponent)
  },
  {
    path: 'exercises/:id/audio-splitter',
    loadComponent: () => import('./audio-splitter/audio-splitter.component').then(m => m.AudioSplitterComponent)
  },
  {
    path: 'exercises/:id/listen-write',
    loadComponent: () => import('./listen-and-write/listen-and-write.component').then(m => m.ListenAndWriteComponent)
  },
  {
    path: 'exercises/:id/passive-listen',
    loadComponent: () => import('./exercise/exercise-passive-listening/exercise-passive-listening.component').then(m => m.ExercisePassiveListeningComponent)
  },
  {
    path: 'smart-ipa-trainer',
    loadComponent: () => import('./features/smart-ipa-trainer/smart-ipa-trainer.component').then(m => m.SmartIpaTrainerComponent)
  },
];
