import { Routes } from '@angular/router';
import { TradeComponent } from './pages/trade/trade.component';

export const routes: Routes = [
    {path:'', component: TradeComponent ,pathMatch: 'full'}
];
