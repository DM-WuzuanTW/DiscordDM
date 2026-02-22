const configLoader = require('../config/config.loader');
const authService = require('../services/auth.service');
const StorageService = require('../services/storage.service');
const GmailService = require('../services/gmail.service');
const DiscordService = require('../services/discord.service');
const Logger = require('../utils/logger');

class GmailNotifierApp {
    constructor() {
        this.logger = new Logger('App');
        this.isRunning = false;
    }

    async bootstrap() {
        try {
            this.logger.info('正在啟動應用程式...');
            const config = await configLoader.load();
            this.config = config;
            this.storage = new StorageService();
            await this.storage.init();
            const authClient = await authService.getClient();
            this.gmailService = new GmailService(authClient);
            this.discordService = new DiscordService(config.discord);
            this.discordService.onMarkAsRead = async (id) => {
                await this.gmailService.markAsRead(id);
                this.logger.info(`使用者透過 Discord 標記已讀: ${id}`);
            };
            await this.discordService.init();
            this.logger.info('所有服務初始化完成');
            this.startPolling();
        } catch (error) {
            this.logger.error('應用程式啟動失敗', error);
            process.exit(1);
        }
    }

    startPolling() {
        this.isRunning = true;
        const intervalMinutes = this.config.gmail.pollingIntervalMinutes || 1;
        this.logger.info(`開始監測任務，頻率: 每 ${intervalMinutes} 分鐘`);
        this.runTask();
        setInterval(() => this.runTask(), intervalMinutes * 60 * 1000);
    }

    async runTask() {
        try {
            const messages = await this.gmailService.getUnreadMessages();
            if (messages.length === 0) {
                return;
            }
            const newMessages = [];
            for (const msg of messages) {
                const hasBeenProcessed = await this.storage.has(msg.id);
                if (!hasBeenProcessed) {
                    newMessages.push(msg);
                }
            }
            if (newMessages.length === 0) {
                return;
            }
            this.logger.info(`發現 ${newMessages.length} 封新未讀郵件`);
            for (const msg of newMessages) {
                const details = await this.gmailService.getMessageDetails(msg.id);
                await this.discordService.sendDM(this.config.discord.targetUserId, details);
                await this.storage.add(msg.id);
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (error) {
            this.logger.error('執行監測任務時發生錯誤', error);
        }
    }
}

module.exports = GmailNotifierApp;