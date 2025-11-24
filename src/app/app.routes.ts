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
  // IPA Learning Module
  {
    path: 'ipa',
    children: [
      {
        path: '',
        redirectTo: 'levels',
        pathMatch: 'full'
      },
      {
        path: 'levels',
        loadComponent: () => import('./features/ipa/ipa-list/ipa-list.component').then(m => m.IpaListComponent)
      },
      {
        path: 'train/:symbol/:level',
        loadComponent: () => import('./features/ipa/ipa-trainer/ipa-trainer.component').then(m => m.IpaTrainerComponent)
      }
    ]
  },
  // Shadowing & Fluency Checker Module
  {
    path: 'shadowing',
    children: [
      {
        path: '',
        redirectTo: 'articles',
        pathMatch: 'full'
      },
      {
        path: 'articles',
        loadComponent: () => import('./features/shadowing/shadowing-article-list/shadowing-article-list.component').then(m => m.ShadowingArticleListComponent)
      },
      {
        path: 'train/:articleId',
        loadComponent: () => import('./features/shadowing/shadowing-trainer/shadowing-trainer.component').then(m => m.ShadowingTrainerComponent)
      }
    ]
  },
  // Admin Module
  {
    path: 'admin',
    children: [
      {
        path: 'lesson-generator',
        loadComponent: () => import('./features/admin/lesson-generator/lesson-generator.component').then(m => m.LessonGeneratorComponent)
      }
    ]
  },

];
