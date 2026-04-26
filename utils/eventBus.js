const EventEmitter = require('events');

class EventBus extends EventEmitter {}

// Create a singleton instance to be shared across the application
const eventBus = new EventBus();

module.exports = eventBus;
