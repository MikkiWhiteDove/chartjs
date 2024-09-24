import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GestureService {
  private x = 0;
  private y = 0;

  private gestureSubject = new Subject<{ x: number, y: number, directionX: string, directionY: string }>();

   // Метод для получения данных жестов (как Observable)
   getGestures() {
    return this.gestureSubject.asObservable();
  }

  // Метод для обработки начала касания
  startTouch(touchStartX: number, touchStartY: number) {
    this.x = touchStartX;
    this.y = touchStartY;
  }


  moveTouch(touchMoveX: number, touchMoveY: number) {
    const deltaX = touchMoveX - this.x;
    const deltaY = touchMoveY - this.y;

    let directionX = '';
    let directionY = '';

    // Определяем направление
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      directionX = deltaX > 0 ? 'right' : 'left';
    } else {
      directionY = deltaY > 0 ? 'down' : 'up';
    }

    // Обновляем координаты и передаем направление
    this.gestureSubject.next({ x: touchMoveX, y: touchMoveY, directionX, directionY });
  }

  // Метод для обработки завершения касания
  endTouch(touchEndX: number, touchEndY: number) {
    // const deltaX = touchEndX - this.x;
    // const deltaY = touchEndY - this.y;

    // if (Math.abs(deltaX) > Math.abs(deltaY)) {
    //   // Горизонтальный свайп
    //   if (deltaX > 0) {
    //     console.log('Right:', deltaX);
    //     this.onSwipeRight();
    //   } else {
    //     console.log('Left:', deltaX);
    //     this.onSwipeLeft();
    //   }
    // } else {
    //   // Вертикальный свайп
    //   if (deltaY > 0) {
    //     console.log('Down:', deltaY);
    //     this.onSwipeDown();
    //   } else {
    //     console.log('Up:', deltaY);
    //     this.onSwipeUp();
    //   }
    // }
  }




  // onSwipeUp() {
  //   this.y++;
  //   this.gestureSubject.next({ x: this.x, y: this.y });
  // }

  // onSwipeDown() {
  //   this.y--;
  //   this.gestureSubject.next({ x: this.x, y: this.y });
  // }

  // onSwipeLeft() {
  //   this.x--;
  //   this.gestureSubject.next({ x: this.x, y: this.y });
  // }

  // onSwipeRight() {
  //   this.x++;
  //   this.gestureSubject.next({ x: this.x, y: this.y });
  // }
}
