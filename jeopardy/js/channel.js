/**
 * BroadcastChannel wrapper for Jeopardy game communication.
 * Provides a typed event system between the display and host tabs.
 * (Same pattern as the Pointless game's channel.)
 */
class GameChannel {
    constructor() {
        this.channel = new BroadcastChannel('jeopardy-game');
        this.listeners = new Map();
        this.channel.onmessage = (event) => this._dispatch(event.data);
    }

    /**
     * Send a typed message to the other tab.
     * @param {string} type - Event name (e.g. 'STATE')
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
