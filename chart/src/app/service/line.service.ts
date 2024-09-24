import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LineService {
  private angleSource = new BehaviorSubject<number>(0); // Угол линии в градусах
  private lengthSource = new BehaviorSubject<number>(50); // Длина линии в процентах

  currentAngle$ = this.angleSource.asObservable();
  currentLength$ = this.lengthSource.asObservable();

  setAngle(angle: number) {
    if (angle >= -90 && angle <= 90) {
      this.angleSource.next(angle);
    }
  }

  setLength(length: number) {
    if (length >= 0 && length <= 100) {
      this.lengthSource.next(length);
    }
  }


  updateAngle(angle: number) {
    this.angleSource.next(angle);
  }

  updateLength(length: number) {
    this.lengthSource.next(length);
  }
}
