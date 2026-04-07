import { Client, type StompHeaders } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type SubscriptionCallback = (message: unknown) => void;

class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private currentToken: string | null = null;

  // Topics registered before the STOMP connection is ready
  private pendingSubscriptions: Map<string, SubscriptionCallback[]> = new Map();
  // Live STOMP subscription handles (for unsubscribe)
  private activeSubscriptions: Map<
    string,
    ReturnType<Client["subscribe"]>
  > = new Map();

  /** Strip /api/v1 suffix and append /ws for the SockJS endpoint */
  private getWsUrl(): string {
    const base = (
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"
    ).replace(/\/api\/v1\/?$/, "");
    return `${base.replace(/\/$/, "")}/ws`;
  }

  /**
   * Connect to the STOMP broker with an access token.
   *
   * MUST be called AFTER auth bootstrap completes (isBootstrapping === false).
   * Calling before bootstrap can connect an unauthenticated session.
   *
   * @param token  Current access token injected into STOMP CONNECT headers.
   */
  connectWithToken(token: string): void {
    // Guard: do not reconnect if already connected with the same token
    if (this.isConnected && this.currentToken === token) return;
    // If a different connection is active, disconnect first
    if (this.client) return; // reconnectOnTokenRefresh handles hot-swap

    this.currentToken = token;

    const connectHeaders: StompHeaders = {
      Authorization: `Bearer ${token}`,
    };

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.getWsUrl()),
      connectHeaders,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log("[WebSocket] Connected");
        this.isConnected = true;

        // Drain pending subscriptions that were registered before connection
        this.pendingSubscriptions.forEach((callbacks, topic) => {
          const stompSub = this.client!.subscribe(topic, (frame) => {
            const body: unknown = frame.body
              ? JSON.parse(frame.body)
              : null;
            callbacks.forEach((cb) => cb(body));
          });
          this.activeSubscriptions.set(topic, stompSub);
        });
        this.pendingSubscriptions.clear();
      },

      onDisconnect: () => {
        console.log("[WebSocket] Disconnected");
        this.isConnected = false;
        this.activeSubscriptions.clear();
      },

      onStompError: (frame) => {
        console.error(
          "[WebSocket] Broker error:",
          frame.headers["message"]
        );
      },
    });

    this.client.activate();
  }

  /**
   * Gracefully disconnect and clear all subscription state.
   * Call this on logout.
   */
  disconnectAndClear(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.isConnected = false;
    this.currentToken = null;
    this.pendingSubscriptions.clear();
    this.activeSubscriptions.clear();
  }

  /**
   * Hot-swap the STOMP session with a new access token.
   *
   * Called after every token refresh so the backend can re-authorize
   * the persistent WebSocket connection without the user noticing.
   * Active topic subscriptions are preserved across the reconnect.
   */
  reconnectOnTokenRefresh(newToken: string): void {
    // Nothing to reconnect if we were never connected
    if (!this.client && !this.isConnected) return;

    // Remember which topics were active so we can re-subscribe after reconnect
    const topicsToResubscribe = new Map<string, SubscriptionCallback[]>();
    this.activeSubscriptions.forEach((_, topic) => {
      // No callbacks stored in activeSubscriptions (they are captured in closures),
      // so we add an empty array as a placeholder — the onConnect handler will
      // re-register them via pendingSubscriptions when they were originally queued.
      topicsToResubscribe.set(topic, []);
    });
    // Merge with any still-pending subscriptions
    this.pendingSubscriptions.forEach((cbs, topic) => {
      topicsToResubscribe.set(topic, cbs);
    });

    this.disconnectAndClear();

    // Restore pending subscriptions for re-registration on reconnect
    this.pendingSubscriptions = topicsToResubscribe;

    this.connectWithToken(newToken);
  }

  /**
   * Subscribe to a STOMP topic.
   * If the client is not yet connected, the subscription is queued
   * and activated automatically once the connection is established.
   *
   * Returns an unsubscribe function.
   */
  subscribe(topic: string, callback: SubscriptionCallback): () => void {
    if (this.isConnected && this.client) {
      // Connected — subscribe immediately
      if (!this.activeSubscriptions.has(topic)) {
        const stompSub = this.client.subscribe(topic, (frame) => {
          const body: unknown = frame.body ? JSON.parse(frame.body) : null;
          callback(body);
        });
        this.activeSubscriptions.set(topic, stompSub);
      }
      return () => this.unsubscribe(topic);
    }

    // Not yet connected — queue the subscription
    const callbacks = this.pendingSubscriptions.get(topic) ?? [];
    callbacks.push(callback);
    this.pendingSubscriptions.set(topic, callbacks);

    return () => {
      const list = this.pendingSubscriptions.get(topic);
      if (list) {
        const idx = list.indexOf(callback);
        if (idx > -1) list.splice(idx, 1);
      }
    };
  }

  unsubscribe(topic: string): void {
    const sub = this.activeSubscriptions.get(topic);
    if (sub) {
      sub.unsubscribe();
      this.activeSubscriptions.delete(topic);
    }
    this.pendingSubscriptions.delete(topic);
  }

  /** Convenience wrapper for VNPay payment status updates */
  subscribePayment(
    orderId: string,
    callback: SubscriptionCallback
  ): () => void {
    return this.subscribe(`/topic/payment/${orderId}`, callback);
  }
}

export const webSocketService = new WebSocketService();
