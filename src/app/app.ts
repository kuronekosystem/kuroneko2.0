import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  showLoader = signal(true);
  loadProgress = signal(0);

  ngOnInit(): void {
    const interval = setInterval(() => {
      this.loadProgress.update(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            this.showLoader.set(false);
          }, 500);
          return 100;
        }
        const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 90 ? 1 : 0.5;
        return Math.min(100, prev + increment);
      });
    }, 100);
  }

}
