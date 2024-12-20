import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-exercise-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule],
  templateUrl: './exercise-detail.component.html',
  styleUrl: './exercise-detail.component.scss'
})
export class ExerciseDetailComponent {

}
