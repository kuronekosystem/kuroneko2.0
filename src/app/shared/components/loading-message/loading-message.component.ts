import { Component, input } from '@angular/core';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-loading-message',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  templateUrl: './loading-message.component.html',
  styleUrls: ['./loading-message.component.scss']
})
export class LoadingMessageComponent {
  readonly title = input('読み込み中...');
  readonly description = input('');
  readonly spinnerLabel = input('処理中...');
  readonly slowTitle = input('通信に時間がかかっています。');
  readonly slowDescription = input('そのまま少しお待ちください。');
  readonly verySlowTitle = input('まだ処理を続けています。');
  readonly verySlowDescription = input('通信環境やGoogle Apps Scriptの応答により時間がかかる場合があります。');
}
