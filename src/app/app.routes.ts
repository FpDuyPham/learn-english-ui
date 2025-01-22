import {RouterModule, Routes} from '@angular/router';
import {ExerciseListComponent} from './exercise/exercise-list/exercise-list.component';
import {ExerciseCreateComponent} from './exercise/exercise-create/exercise-create.component';
import {ExerciseDetailComponent} from './exercise/exercise-detail/exercise-detail.component';
import {ExerciseEditComponent} from './exercise/exercise-edit/exercise-edit.component';
import {AudioSplitterComponent} from './audio-splitter/audio-splitter.component';
import {ListenAndWriteComponent} from './listen-and-write/listen-and-write.component';
import {ExercisePassiveListeningComponent} from './exercise/exercise-passive-listening/exercise-passive-listening.component';
import {NgModule} from '@angular/core';

// export const routes: Routes = [];

// export const routes: Routes = [
//   {
//     path: 'audio-splitter',
//     loadComponent: () =>
//       import('./audio-splitter/audio-splitter.component').then(
//         (c) => c.AudioSplitterComponent
//       ),
//   },
//   { path: 'listen-and-write', loadComponent: () =>
//       import('./listen-and-write/listen-and-write.component').then(
//         (c) => c.ListenAndWriteComponent
//       ),
//   }, // New route
//   {
//     path: '',
//     redirectTo: 'audio-splitter',
//     pathMatch: 'full',
//   }
// ];
//
//
// export const routes: Routes = [
//   { path: '', redirectTo: '/exercises', pathMatch: 'full' },
//   { path: 'exercises', component: ExerciseListComponent },
//   { path: 'exercises/create', component: ExerciseCreateComponent },
//   { path: 'exercises/:id', component: ExerciseDetailComponent },
//   { path: 'exercises/:id/edit', component: ExerciseEditComponent },
//   { path: 'exercises/:id/audio-splitter', component: AudioSplitterComponent },
//   { path: 'exercises/:id/listen-write', component: ListenAndWriteComponent },
//   { path: 'exercises/:id/passive-listen', component: ExercisePassiveListeningComponent },
// ];

export const routes: Routes = [
  { path: '', redirectTo: '/exercises', pathMatch: 'full' },
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
];
