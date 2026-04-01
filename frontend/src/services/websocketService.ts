import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type SubscriptionCallback = (message: any) => void;

class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private pendingSubscriptions: Map<string, SubscriptionCallback[]> = new Map();
  private activeSubscriptions: Map<string, any> = new Map();

  connect() {
    if (this.client || this.isConnected) return;

    // We use the base API URL. Vite typically provides VITE_API_BASE_URL or similar
    // We need the root domain, not the /api/v1 suffix
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '');
    const wsUrl = `${baseUrl.replace(/\/$/, '')}/ws`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[WebSocket] Connected');
        this.isConnected = true;
        
        // Subscribe to all pending topics
        this.pendingSubscriptions.forEach((callbacks, topic) => {
           const stompSubscription = this.client!.subscribe(topic, (message) => {
             const body = message.body ? JSON.parse(message.body) : null;
             callbacks.forEach(cb => cb(body));
           });
           this.activeSubscriptions.set(topic, stompSubscription);
        });
        // Clear pending since they are active now
        this.pendingSubscriptions.clear();
      },
      onDisconnect: () => {
        console.log('[WebSocket] Disconnected');
        this.isConnected = false;
        this.activeSubscriptions.clear();
      },
      onStompError: (frame) => {
        console.error('[WebSocket] Broker config error:', frame.headers['message']);
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.pendingSubscriptions.clear();
      this.activeSubscriptions.clear();
    }
  }

  subscribe(topic: string, callback: SubscriptionCallback) {
    if (!this.client) {
        this.connect();
    }

    if (this.isConnected && this.client) {
      // If already connected, subscribe directly
      if (!this.activeSubscriptions.has(topic)) {
         const stompSub = this.client.subscribe(topic, (message) => {
            const body = message.body ? JSON.parse(message.body) : null;
            // if multiple callbacks were registered somehow, we could manage it
            callback(body);
         });
         this.activeSubscriptions.set(topic, stompSub);
      }
      return () => this.unsubscribe(topic);
    } else {
      // Pending subscription
      const callbacks = this.pendingSubscriptions.get(topic) || [];
      callbacks.push(callback);
      this.pendingSubscriptions.set(topic, callbacks);
      
      return () => {
        // remove callback
        const cbList = this.pendingSubscriptions.get(topic);
        if (cbList) {
           const index = cbList.indexOf(callback);
           if (index > -1) cbList.splice(index, 1);
        }
      };
    }
  }

  unsubscribe(topic: string) {
    const sub = this.activeSubscriptions.get(topic);
    if (sub) {
      sub.unsubscribe();
      this.activeSubscriptions.delete(topic);
    }
    this.pendingSubscriptions.delete(topic);
  }

  subscribePayment(orderId: string, callback: SubscriptionCallback) {
    return this.subscribe(`/topic/payment/${orderId}`, callback);
  }
}

export const webSocketService = new WebSocketService();
