import { Routes } from '@angular/router';
import {ExerciseListComponent} from './exercise/exercise-list/exercise-list.component';
import {ExerciseCreateComponent} from './exercise/exercise-create/exercise-create.component';
import {ExerciseDetailComponent} from './exercise/exercise-detail/exercise-detail.component';
import {ExerciseEditComponent} from './exercise/exercise-edit/exercise-edit.component';
import {AudioSplitterComponent} from './audio-splitter/audio-splitter.component';

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


export const routes: Routes = [
  { path: '', redirectTo: '/exercises', pathMatch: 'full' },
  { path: 'exercises', component: ExerciseListComponent },
  { path: 'exercises/create', component: ExerciseCreateComponent },
  { path: 'exercises/:id', component: ExerciseDetailComponent },
  { path: 'exercises/:id/edit', component: ExerciseEditComponent },
  { path: 'exercises/:id/audio-splitter', component: AudioSplitterComponent },
];
