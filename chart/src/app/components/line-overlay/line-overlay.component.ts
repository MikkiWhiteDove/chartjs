import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LineService } from '../../service/line.service';
import { GestureService } from '../../service/gesture.service';

@Component({
  selector: 'app-line-overlay',
  standalone: true,
  imports: [],
  styleUrl: './line-overlay.component.css',
  template: `
  <div class="overlay-container">
    <!-- <p>Угол: {{ angle }}°</p>
    <p>Длина: {{ length }}%</p> -->
    <canvas #lineCanvas></canvas>
      
    </div>
  `,
})
export class LineOverlayComponent implements OnInit {
  @ViewChild('lineCanvas', { static: true }) lineCanvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  angle: number = 0;
  length: number = Math.min(window.innerWidth, window.innerHeight) / 3;

  constructor(
    private lineService: LineService, 
    private gestureService: GestureService) {}

  ngOnInit(): void {
    const canvas = this.lineCanvas.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.ctx = this.lineCanvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    this.drawLine();

    // Подписываемся на обновление угла и длины
    this.lineService.currentAngle$.subscribe((angle) => {
      this.angle = angle;
      this.drawLine();
    });

    this.lineService.currentLength$.subscribe((length) => {
      this.length = length;
      this.drawLine();
    });

    this.gestureService.getGestures().subscribe((gesture) => {
      this.handleGestures(gesture);
    })
  }

  private handleGestures(gesture: { x: number; y: number; directionX: string; directionY: string }) {
     // Обрабатываем вертикальные свайпы для изменения угла
     if (gesture.directionY === 'up' && this.angle < 90) {
      this.angle += 2; // Увеличиваем угол
    } else if (gesture.directionY === 'down' && this.angle > -90) {
      this.angle -= 2; // Уменьшаем угол
    }

    // Обрабатываем горизонтальные свайпы для изменения длины
    if (gesture.directionX === 'right' && this.length < 100) {
      this.length += 1; // Увеличиваем длину
    } else if (gesture.directionX === 'left' && this.length > 0) {
      this.length -= 1; // Уменьшаем длину
    }

    // Обновляем отрисовку линии
    this.drawLine();
  }

  private drawLine() {
    const canvas = this.lineCanvas.nativeElement;
    const ctx = this.ctx;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    

     // Радиус окружности равен половине ширины экрана

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const radius = Math.min(canvas.width, canvas.height) / 2 - 30;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(100, 100, 255, 0.1)'; // Закрашиваем внутреннюю область (полупрозрачный голубой)
    ctx.fill();


    ctx.beginPath();
    ctx.setLineDash([5, 15]); // Делаем пунктирной
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'; // Еле заметный цвет
    ctx.lineWidth = 0.5; // Очень тонкая линия
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]); // Сбрасываем пунктир


    // Вычисляем длину линии в пикселях (например, от 20px до 40px)
    const minLength = Math.min(canvas.width, canvas.height) / 6;
    const maxLength = Math.min(canvas.width, canvas.height) / 2 - 50;
    const lengthInPx = minLength + (maxLength - minLength) * (this.length / 100);

    // Преобразуем угол в радианы и вычисляем конечные координаты линии
    const angleInRadians = (this.angle * Math.PI) / 180;
    const endX = centerX + lengthInPx * Math.cos(angleInRadians);
    const endY = centerY - lengthInPx * Math.sin(angleInRadians);

    // Цвет линии: зеленый, если угол вверх, красный — если вниз
    const lineColor = this.angle < 0 ? 'red' : 'green';

    // Рисуем линию
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // this.lineService.updateAngle(this.angle);
    // this.lineService.updateLength(this.length);
  }
}
