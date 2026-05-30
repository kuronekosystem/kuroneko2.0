import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-age-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './age-verification.component.html',
  styleUrls: ['./age-verification.component.scss']
})
export class AgeVerificationComponent {
  @Output() verified = new EventEmitter<boolean>();

  onUnderage(): void {
    window.location.href = 'https://www.google.com';
  }

  onAdult(): void {
    this.verified.emit(true);
  }
}
