export class EventDispatcher {
    handlers = new Set();
    subscribe(handler) {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }
    async emit(sender, args) {
        for (const handler of [...this.handlers])
            await handler(sender, args);
    }
    clear() { this.handlers.clear(); }
}
//# sourceMappingURL=events.js.map