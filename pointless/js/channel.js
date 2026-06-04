/**
 * BroadcastChannel wrapper for Pointless game communication.
 * Provides a typed event system between display and controller tabs.
 */
class GameChannel {
    constructor() {
        this.channel = new BroadcastChannel('pointless-game');
        this.listeners = new Map();
        this.channel.onmessage = (event) => this._dispatch(event.data);
    }

    /**
     * Send a typed message to the other tab.
     * @param {string} type - Event name (e.g. 'REVEAL_ANSWER')
     * @param {object} payload - Event data
     */
    send(type, payload = {}) {
        this.channel.postMessage({ type, payload });
    }

    /**
     * Register a listener for a specific event type.
     * @param {string} type - Event name to listen for
     * @param {function} callback - Handler receiving the payload
     */
    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
    }

    /**
     * Remove all listeners for a given event type.
     */
    off(type) {
        this.listeners.delete(type);
    }

    _dispatch(data) {
        if (!data || !data.type) return;
        const { type, payload } = data;
        const callbacks = this.listeners.get(type);
        if (callbacks) {
            callbacks.forEach(cb => cb(payload));
        }
    }

    destroy() {
        this.channel.close();
    }
}
