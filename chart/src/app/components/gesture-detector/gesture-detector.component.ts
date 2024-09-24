import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-gesture-detector',
  standalone: true,
  imports: [],
  template: `
     <div class="gesture-area">
      <p>X: {{ x }}</p>
      <p>Y: {{ y }}</p>
    </div>
  `,
  styleUrl: './gesture-detector.component.css'
})
export class GestureDetectorComponent {
  x: number = 0;
  y: number = 0;

  private touchStartX: number = 0;
  private touchStartY: number = 0;

  @HostListener('touched', ['$event'])
  onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        this.onSwipeRight();
      } else {
        this.onSwipeLeft();
      }
    } else {
      if (deltaY > 0) {
        this.onSwipeDown();
      }else {
        this.onSwipeUp();
      }
    }
  }

  onSwipeUp() {
    this.y++;
  }

  onSwipeDown() {
    this.y--;
  }

  onSwipeLeft() {
    this.x--;
  }

  onSwipeRight() {
    this.x++;
  }
}
