import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})

export class ChartBinanceService {
  private apiUrl = 'https://api.binance.com/api/v3/klines'
  constructor() { }
  async getBTCData() {
    const response = await axios.get(this.apiUrl, {
      params:{
        symbol: 'BTCUSDT',
        interval: '1m',
        limit: 60
      } 
    });
    return response.data.map((entry: any) => ({
      time: entry[0],
      close: entry[4],
    }));
  }
}