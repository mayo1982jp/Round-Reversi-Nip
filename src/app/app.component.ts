import { Component } from '@angular/core';
import { ReversiBoardComponent } from './reversi/reversi-board.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReversiBoardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dyad-angular-template';
}