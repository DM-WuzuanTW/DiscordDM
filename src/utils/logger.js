class Logger {
    constructor(context) {
        this.context = context;
    }

    _timestamp() {
        return new Date().toISOString();
    }

    _format(level, message, ...args) {
        const prefix = `[${this._timestamp()}] [${level}] [${this.context}]`;
        return [prefix, message, ...args];
    }

    info(message, ...args) {
        console.log(...this._format('INFO', message, ...args));
    }

    warn(message, ...args) {
        console.warn(...this._format('WARN', message, ...args));
    }

    error(message, ...args) {
        console.error(...this._format('ERROR', message, ...args));
    }

    debug(message, ...args) {
        if (process.env.DEBUG) {
            console.debug(...this._format('DEBUG', message, ...args));
        }
    }
}

module.exports = Logger;