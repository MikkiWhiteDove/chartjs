import { Component } from '@angular/core';
import { ChartComponent } from '../../components/chart/chart.component';
import { NewChartComponent } from "../../components/new-chart/new-chart.component";
import { GestureDetectorComponent } from "../../components/gesture-detector/gesture-detector.component";
import { InfoOverlayComponent } from "../../components/info-overlay/info-overlay.component";

@Component({
  selector: 'app-trade',
  standalone: true,
  imports: [NewChartComponent, InfoOverlayComponent],
  template: `
    <app-info-overlay/>
    <app-new-chart class="chart"/>
  `,
  styleUrl: './trade.component.css'
})

export class TradeComponent {

}
