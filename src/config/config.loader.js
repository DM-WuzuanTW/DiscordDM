const Logger = require('../utils/logger');

class ConfigLoader {
    constructor() {
        this.logger = new Logger('ConfigLoader');
        this.config = null;
    }

    async load() {
        try {
            this.config = {
                discord: {
                    token: process.env.DISCORD_TOKEN,
                    targetUserId: process.env.DISCORD_TARGET_USER_ID
                },
                gmail: {
                    pollingIntervalMinutes: parseInt(process.env.GMAIL_POLLING_INTERVAL_MINUTES || '1', 10)
                }
            };
            this.validate();
            this.logger.info('環境變數設定載入成功');
            return this.config;
        } catch (error) {
            this.logger.error('環境變數設定載入失敗', error);
            throw error;
        }
    }

    validate() {
        const missing = [];
        if (!this.config.discord?.token) missing.push('DISCORD_TOKEN');
        if (!this.config.discord?.targetUserId) missing.push('DISCORD_TARGET_USER_ID');
        if (missing.length > 0) {
            throw new Error(`環境變數缺少必要欄位: ${missing.join(', ')}`);
        }
    }

    get() {
        if (!this.config) throw new Error('設定檔尚未載入');
        return this.config;
    }
}

module.exports = new ConfigLoader();