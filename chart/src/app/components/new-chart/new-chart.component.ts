import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChartBinanceService } from '../../service/chart-binance.service';
import { Chart, Legend, registerables } from 'chart.js'
import 'chartjs-adapter-date-fns';
import { WebSocketService } from '../../service/web-socket.service';
import { Subscription } from 'rxjs';
import { GestureService } from '../../service/gesture.service';
import { LineOverlayComponent } from "../line-overlay/line-overlay.component";
import { InfoOverlayComponent } from "../info-overlay/info-overlay.component";
import { YScaleService } from '../../service/yscale.service';


interface KlineData {
  time: number;  // Время свечи в виде таймстемпа
  close: string;  // Цена закрытия свечи в виде строки
}


@Component({
  selector: 'app-new-chart',
  standalone: true,
  imports: [LineOverlayComponent],
  template: `
  <div slass="container">
    <div class="chart-container">
      <canvas #newbtcChart></canvas>
      <app-line-overlay />
    </div>
  </div>
  `,
  styleUrl: './new-chart.component.css'
})

export class NewChartComponent implements OnInit, OnDestroy {
  @ViewChild('newbtcChart', { static: true }) newbtcChart!: ElementRef<HTMLCanvasElement>;
  chart: any;
  private websocketSubscription: any;

  // Массив для хранения данных за последний час
  private lastHourData: { time: Date, price: number }[] = [];
  private currentPrice: number = 0;

  private yMin!: number;
  private yMax!: number;


  private gestureSubscription!: Subscription;

  x: number = 0;
  y: number = 0;
  directionX: string = '';
  directionY: string = '';


  constructor(
    private binanceService: ChartBinanceService,
    private webSocketService: WebSocketService,
    private gestureService: GestureService,
    private yScaleService: YScaleService
  ) {
    Chart.register(...registerables);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    this.gestureService.startTouch(touch.clientX, touch.clientY);
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    const touch = event.touches[0];
    this.gestureService.moveTouch(touch.clientX, touch.clientY);
  }

  // Обрабатываем завершение касания и отправляем его в сервис
  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    const touch = event.changedTouches[0];
    this.gestureService.endTouch(touch.clientX, touch.clientY);
  }


  async ngOnInit() {
    const url = 'wss://stream.binance.com:9443/ws/btcusdt@kline_1m';

    const btcData: KlineData[] = await this.binanceService.getBTCData();
    this.lastHourData = btcData.map(data => ({
      time: new Date(data.time),
      price: parseFloat(data.close)
    }));

    this.currentPrice = this.lastHourData[this.lastHourData.length - 1].price;

    this.chart = new Chart(this.newbtcChart.nativeElement, {
      type: 'line',
      data: {
        labels: this.lastHourData.map(d => d.time), // Пустые метки, будут добавляться динамически
        datasets: [
          {
            label: 'Price BTC',
            data: this.lastHourData.map(d => d.price), // Данные будут добавляться в реальном времени
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 1,
            pointHoverRadius: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            grid: {
              display: false,
            },
            ticks: {
              display: false,
            },
          },
          y: {
            min: this.yMin,
            max: this.yMax,
            grid: {
              display: false,
            },
            ticks: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
      plugins: [
        {
          id: 'pulseEffect',
          afterDatasetsDraw: (chart) => {
            const ctx = chart.ctx;
            const dataset = chart.data.datasets[0];
            const lastIndex = dataset.data.length - 1; // Последняя точка
            const meta = chart.getDatasetMeta(0);
            const lastPoint = meta.data[lastIndex];

            const time = Date.now() / 1000; // Скорость анимации
            const pulseSize = 3 + Math.sin(time) * 2; // Радиус анимации пульсации

            ctx.save();
            ctx.beginPath();
            ctx.arc(lastPoint.x, lastPoint.y, pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Красный цвет для эффекта
            ctx.fill();
            ctx.restore();
          },
        },
      ],
    });

    this.updateYScale();
    this.updateChartWithInitialData();

    this.websocketSubscription = this.webSocketService.connect(url).subscribe((message: any) => {
      
      try {
        // Проверяем, что сообщение содержит данные и корректный JSON
        if (message && message.k) {  // Поле `k` уже доступно в объекте
          const kline = message.k;
          const time = new Date(kline.T);  // Время закрытия свечи
          const price = parseFloat(kline.c);  // Цена закрытия свечи
    
          this.currentPrice = price;
    
          // Если свеча закрыта, добавляем новую точку
          if (kline.x) {
            this.updateChart(time, price);
          } else {
            // Обновляем только последнюю цену без сдвига
            this.updateLastPrice(price);
          }
        } else {
          console.log('Некорректное сообщение WebSocket:', message);
        }
      } catch (error) {
        console.error('Ошибка парсинга WebSocket сообщения:', error);
      }
    });

    this.gestureSubscription = this.gestureService.getGestures().subscribe(coords => {
      this.x = coords.x;
      this.y = coords.y;
      this.directionX = coords.directionX;
      this.directionY = coords.directionY;
      this.updateChartWithGestures(); // Обновляем график при изменении координат
    });
  }

  updateChart(time: Date, price: number) {
     this.lastHourData.push({ time, price });

    if (this.lastHourData.length > 60) {
      this.lastHourData.shift();
    }

    this.updateYScale();
    this.updateChartWithInitialData();

    this.chart.data.labels = this.lastHourData.map(d => d.time);
    this.chart.update();
  }


  updateLastPrice(price: number) {
    const lastData = this.chart.data.datasets[0].data;
    if (lastData.length > 0) {
      lastData[lastData.length - 1] = price;
      this.chart.update();
    }
  }

  updateChartWithInitialData() {
    const last30MinutesData = this.lastHourData.slice(-30);
    this.chart.data.labels = this.lastHourData.map(d => d.time);
    this.chart.data.datasets[0].data = last30MinutesData.map(d => d.price);
    this.chart.update();
  }


  private updateYScale() {
    const prices = this.lastHourData.map(d => d.price);
    const { yMin, yMax } = this.yScaleService.updateYScale(prices);

    this.yMin = yMin;
    this.yMax = yMax;

    if (this.chart) {
      this.chart.options.scales.y.min = this.yMin;
      this.chart.options.scales.y.max = this.yMax;
    }
  }

  ngOnDestroy() {
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
    this.webSocketService.close();
  }

  updateChartWithGestures() {}

}