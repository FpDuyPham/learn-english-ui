import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default route - redirect to login
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Login route
  {
    path: 'login',
    loadComponent: () => import('./domains/auth/feature/login/login.component').then(m => m.LoginComponent)
  },

  // Home route  
  {
    path: 'home',
    loadComponent: () => import('./domains/shell/feature/home/home.component').then(m => m.HomeComponent)
  },

  // Exercise routes
  {
    path: 'exercises',
    loadComponent: () => import('./domains/exercise/feature/exercise-list/exercise-list.component').then(m => m.ExerciseListComponent)
  },
  {
    path: 'exercises/create',
    loadComponent: () => import('./domains/exercise/feature/exercise-create/exercise-create.component').then(m => m.ExerciseCreateComponent)
  },
  {
    path: 'exercises/:id',
    loadComponent: () => import('./domains/exercise/feature/exercise-detail/exercise-detail.component').then(m => m.ExerciseDetailComponent)
  },
  {
    path: 'exercises/:id/edit',
    loadComponent: () => import('./domains/exercise/feature/exercise-edit/exercise-edit.component').then(m => m.ExerciseEditComponent)
  },
  {
    path: 'exercises/:id/audio-splitter',
    loadComponent: () => import('./domains/exercise/feature/audio-splitter/audio-splitter.component').then(m => m.AudioSplitterComponent)
  },
  {
    path: 'exercises/:id/listen-write',
    loadComponent: () => import('./domains/exercise/feature/listen-and-write/listen-and-write.component').then(m => m.ListenAndWriteComponent)
  },
  {
    path: 'exercises/:id/passive-listen',
    loadComponent: () => import('./domains/exercise/feature/passive-listening/exercise-passive-listening.component').then(m => m.ExercisePassiveListeningComponent)
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
        loadComponent: () => import('./domains/ipa/feature/ipa-list/ipa-list.component').then(m => m.IpaListComponent)
      },
      {
        path: 'train/:symbol/:level',
        loadComponent: () => import('./domains/ipa/feature/ipa-trainer/ipa-trainer.component').then(m => m.IpaTrainerComponent)
      },
      {
        path: 'practice-free',
        loadComponent: () => import('./domains/ipa/feature/phoneme-practice/phoneme-practice.component').then(m => m.PhonemePracticeComponent)
      }
    ]
  },

  // Shadowing Module
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
        loadComponent: () => import('./domains/shadowing/feature/article-list/shadowing-article-list.component').then(m => m.ShadowingArticleListComponent)
      },
      {
        path: 'train/:articleId',
        loadComponent: () => import('./domains/shadowing/feature/trainer/shadowing-trainer.component').then(m => m.ShadowingTrainerComponent)
      }
    ]
  },

  // Admin Module
  {
    path: 'admin',
    children: [
      {
        path: 'lesson-generator',
        loadComponent: () => import('./domains/admin/feature/lesson-generator/lesson-generator.component').then(m => m.LessonGeneratorComponent)
      }
    ]
  }
];
