import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class YScaleService {
  updateYScale(prices: number[]): { yMin: number, yMax: number } {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const targetPoint = prices[prices.length - 2];
    const lowerRange = targetPoint - minPrice;
    const upperRange = maxPrice - targetPoint;
    const maxRange = Math.max(lowerRange, upperRange);

    return {
      yMin: targetPoint - maxRange,
      yMax: targetPoint + maxRange
    }
  }
}
