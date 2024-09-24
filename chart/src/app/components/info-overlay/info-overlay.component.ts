import { Component, OnInit } from '@angular/core';
import { LineService } from '../../service/line.service';
import { GestureService } from '../../service/gesture.service';
import { WebSocketService } from '../../service/web-socket.service';

@Component({
  selector: 'app-info-overlay',
  standalone: true,
  imports: [],
  template: `
    <div class="info-container">
      <p>Длина линии: {{ lineLength }}%</p>
      <p>Угол линии: {{ lineAngle }}°</p>
      <p>Текущая цена: {{ currentPrice }}</p>
      <p>Направление X: {{ gestureDirectionX }}</p>
      <p>Направление Y: {{ gestureDirectionY }}</p>
    </div>
  `,
  styleUrl: './info-overlay.component.css'
})
export class InfoOverlayComponent implements OnInit {
  lineLength: number = 0;
  lineAngle: number = 0;
  currentPrice: number = 0;
  
  gestureX: number = 0;
  gestureY: number = 0;
  gestureDirectionX: string = '';
  gestureDirectionY: string = '';

  constructor(
    private lineService: LineService,
    private gestureService: GestureService,
    private webSocketService: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.lineService.currentAngle$.subscribe((angle) => {
      this.lineAngle = angle;
    });

    this.lineService.currentLength$.subscribe((length) => {
      this.lineLength = length;
    });
    // this.gestureService.gestureX$.subscribe(x => this.gestureX = x);
    // this.gestureService.gestureY$.subscribe(y => this.gestureY = y);
    // this.gestureService.gestureDirectionX$.subscribe(dirX => this.gestureDirectionX = dirX);
    // this.gestureService.gestureDirectionY$.subscribe(dirY => this.gestureDirectionY = dirY);

    // // Подписываемся на обновление цены через WebSocket
    // this.webSocketService.currentPrice$.subscribe(price => this.currentPrice = price);
  }
}
