import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChartBinanceService } from '../../service/chart-binance.service';
import { Chart, Legend, registerables } from 'chart.js'
import 'chartjs-adapter-date-fns';
import { WebSocketService } from '../../service/web-socket.service';


interface KlineData {
  time: number;  // Время свечи в виде таймстемпа
  close: string;  // Цена закрытия свечи в виде строки
}

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [],
  template: `
  <div slass="container">
    <canvas #btcChart></canvas>
  </div>
  `,
  styleUrl: './chart.component.css'
})
export class ChartComponent implements OnInit, OnDestroy {
  @ViewChild('btcChart', { static: true }) btcChart!: ElementRef<HTMLCanvasElement>;
  chart: any;
  private websocketSubscription: any;

  // Массив для хранения данных за последний час
  private lastHourData: { time: Date, price: number }[] = [];
  private currentPrice: number = 0;

  constructor(private binanceService: ChartBinanceService, private webSocketService: WebSocketService) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    const url = 'wss://stream.binance.com:9443/ws/btcusdt@kline_1m';

    const btcData: KlineData[] = await this.binanceService.getBTCData();
    this.lastHourData = btcData.map(data => ({
      time: new Date(data.time),
      price: parseFloat(data.close)
    }));

    this.currentPrice = this.lastHourData[this.lastHourData.length - 1].price;

    this.chart = new Chart(this.btcChart.nativeElement, {
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
            afterBuildTicks: (scale) => {
              const secondLastTime = this.lastHourData[this.lastHourData.length - 2].time.getTime();
            const fullTimeRange = this.lastHourData[this.lastHourData.length - 1].time.getTime() - this.lastHourData[0].time.getTime();

            // Добавляем одинаковый отступ слева и справа от второй точки
            const extraTime = fullTimeRange / 2;
  
              // Центрируем график по второй точке
              scale.min = secondLastTime - extraTime;
              scale.max = secondLastTime + extraTime;
            }
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              display: false,
            },
            afterBuildTicks: (scale) => {
              // --- Центрирование по Y ---
              const prices = this.lastHourData.map(d => d.price);
              const minPrice = Math.min(...prices); // Минимальная цена
              const maxPrice = Math.max(...prices); // Максимальная цена
  
              const secondLastPrice = this.lastHourData[this.lastHourData.length - 2].price;
  
              // Вычисляем полный диапазон цен
              const priceRange = maxPrice - minPrice;
  
              // Добавляем одинаковый отступ сверху и снизу от второй точки
              const extraPriceRange = priceRange / 2;
  
              // Устанавливаем min и max по оси Y для центрирования
              scale.min = secondLastPrice - extraPriceRange;
              scale.max = secondLastPrice + extraPriceRange;
            }
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
      plugins: [
        // 2. Кастомный плагин для пульсации
        {
          id: 'pulseEffect',
          afterDatasetsDraw: (chart) => {
            const ctx = chart.ctx;
            const dataset = chart.data.datasets[0];
            const lastIndex = dataset.data.length - 1; // Последняя точка
            const meta = chart.getDatasetMeta(0);
            const lastPoint = meta.data[lastIndex];

            const time = Date.now() / 300; // Скорость анимации
            const pulseSize = 3 + Math.sin(time) * 2; // Радиус анимации пульсации

            ctx.save();
            ctx.beginPath();
            ctx.arc(lastPoint.x, lastPoint.y, pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Красный цвет для эффекта
            ctx.fill();
            ctx.restore();
          },
        },
        {
          id: 'resizePlugin',
          beforeDraw: (chart) => {
            chart.canvas.style.width = '100%';  // Явно задаем размеры через стиль
            chart.canvas.style.height = '100%';
          },
        },
      ],
    });

    this.updateChartWithInitialData();

    this.websocketSubscription = this.webSocketService.connect(url).subscribe((message: any) => {
      console.log('message:', message);
      
      try {
        // Проверяем, что сообщение содержит данные и корректный JSON
        if (message && message.k) {  // Поле `k` уже доступно в объекте
          const kline = message.k;
          const time = new Date(kline.T);  // Время закрытия свечи
          const price = parseFloat(kline.c);  // Цена закрытия свечи
          console.log('time:', time, 'price:', price);
    
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

    // const btcData = await this.binanceService.getBTCData();
    // console.log('BTC component data:', btcData);

    // const prices = btcData.map((data: any) => parseFloat(data.close));
    // const times = btcData.map((data: any) => new Date(data.time));

    // const currentPrice = prices[prices.length - 1]; // Текущая цена (последняя точка)
    
    // // Расчёт минимальной и максимальной цены для оси Y
    // const minPrice = Math.min(...prices);
    // const maxPrice = Math.max(...prices);
    
    // // Увеличиваем диапазон Y так, чтобы текущая цена была посередине
    // const rangePadding = Math.max((maxPrice - minPrice) / 1.5, 0.01); // Немного дополнительного пространства для корректного отображения

    // // Добавляем 50% времени после последней точки, чтобы она оказалась в центре
    // const lastTime = times[times.length - 1];
    // const additionalTime = new Date(lastTime.getTime() + (lastTime.getTime() - times[0].getTime())).getTime(); // Преобразуем в timestamp


    

    
    

    // console.log('Times:', times);
    // console.log('Prices:', prices);
    // this.chart = new Chart(this.btcChart.nativeElement, {
    //   type: 'line',
    //   data:{
    //     labels: times,
    //     datasets: [
    //       {
    //         label:'',
    //         data: prices,
    //         borderColor: 'rgba(75, 192, 192, 1)',
    //         borderWidth: 2,
    //         fill: false,
    //         tension: 0.4, // Сглаживание линий
    //         pointRadius: 0, // Отключаем отображение точек
    //         pointHoverRadius: 0, // Отключаем отображение точек при наведении
    //       },
    //     ],
    //   },
    //   options: {
    //     responsive: true,
    //     scales: {
    //       x: {
    //         type: 'time',
    //         min: times[0],
    //         max: additionalTime, 
    //         display: false,
    //         grid: {
    //           display: false, // Отключаем сетку оси Y
    //         },
    //         offset: true,
    //       },
    //       y: {
    //         min: currentPrice - rangePadding,
    //         max: currentPrice + rangePadding,
    //         // display: false,
    //         grid: {
    //           display: false, // Отключаем сетку оси Y
    //         },
    //       },
    //     },
    //     plugins: {
    //       legend: {
    //         display: false,
    //       }
    //     },
    //   },
    // });




  }

  updateChart(time: Date, price: number) {
     // Добавляем новые данные
     this.lastHourData.push({ time, price });

     // Если данных больше 60 минут, удаляем старые
     if (this.lastHourData.length > 60) {
       this.lastHourData.shift();
     }
 
     // Отображаем только последние 30 минут
  const last30MinutesData = this.lastHourData.slice(-30);
  const secondLastPointIndex = last30MinutesData.length - 2;
  const secondLastPoint = last30MinutesData[secondLastPointIndex];
  const lastPoint = last30MinutesData[last30MinutesData.length - 1];


  const fullTimeRange = lastPoint.time.getTime() - last30MinutesData[0].time.getTime();

  // Добавляем дополнительное время для отступа справа
  const extraTime = fullTimeRange;  // Полный диапазон для отступа

  // Устанавливаем минимальное и максимальное значение по оси X
  this.chart.options.scales.x.min = secondLastPoint.time.getTime() - fullTimeRange;  // Сдвигаем график влево, чтобы вторая точка была по центру
  this.chart.options.scales.x.max = secondLastPoint.time.getTime() + fullTimeRange;

  console.log('max:',secondLastPoint.time.getTime() + fullTimeRange / 2 + extraTime, 'min', secondLastPoint.time.getTime() - fullTimeRange / 2);

  // const fixedYRange = 1000; // Например, 1000 единиц ценового диапазона
  // const centerY = secondLastPoint.price;  // Центрируем по текущей цене

  // const prices = last30MinutesData.map(d => d.price);
  // const minPrice = Math.min(...prices);  // Минимальная цена за последние 30 минут
  // const maxPrice = Math.max(...prices);  // Максимальная цена за последние 30 минут


  // const currentRange = maxPrice - minPrice;

  // if (currentRange > fixedYRange) {
  //   // Масштабируем цены, чтобы вписать их в фиксированный диапазон
  //   const scaleFactor = fixedYRange / currentRange;
  //   this.chart.data.datasets[0].data = last30MinutesData.map(d => {
  //     return centerY + (d.price - centerY) * scaleFactor;
  //   });
  // } else {
  //   // Если текущий диапазон меньше, оставляем цены как есть
  //   this.chart.data.datasets[0].data = last30MinutesData.map(d => d.price);
  // }


  // this.chart.options.scales.y.min = centerY - fixedYRange / 2;
  // this.chart.options.scales.y.max = centerY + fixedYRange / 2;


     // Обновляем данные графика
     this.chart.data.labels = last30MinutesData.map(d => d.time);
    //  this.chart.data.datasets[0].data = last30MinutesData.map(d => d.price);
 
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
    this.chart.data.labels = last30MinutesData.map(d => d.time);
    this.chart.data.datasets[0].data = last30MinutesData.map(d => d.price);
    this.chart.update();
  }

  ngOnDestroy() {
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
    this.webSocketService.close();
  }

}
