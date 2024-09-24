import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class WebSocketService {
  private socket!: WebSocket;
  private subject: Subject<any>;

  constructor() {
    this.subject = new Subject<any>()
  }

  public connect(url: string): Subject<any> {
    this.socket = new WebSocket(url);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.subject.next(data)
    };

    this.socket.onerror = (error) => {
      console.log('WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    }
    
    return this.subject;
  };

  public send(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  };
  public close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
