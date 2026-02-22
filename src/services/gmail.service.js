const { google } = require('googleapis');
const Logger = require('../utils/logger');

class GmailService {
    constructor(authClient) {
        this.client = google.gmail({ version: 'v1', auth: authClient });
        this.logger = new Logger('GmailService');
    }

    async getUnreadMessages(maxResults = 10) {
        try {
            const res = await this.client.users.messages.list({
                userId: 'me',
                q: 'is:unread',
                maxResults: maxResults
            });
            return res.data.messages || [];
        } catch (error) {
            this.logger.error('搜尋郵件失敗', error);
            throw error;
        }
    }

    async getMessageDetails(id) {
        try {
            const res = await this.client.users.messages.get({
                userId: 'me',
                id: id,
                format: 'full',
            });
            return this._parseMessage(id, res.data);
        } catch (error) {
            this.logger.error(`獲取郵件詳情失敗 ID: ${id}`, error);
            throw error;
        }
    }

    async markAsRead(id) {
        try {
            await this.client.users.messages.modify({
                userId: 'me',
                id: id,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });
        } catch (error) {
            this.logger.error(`標記已讀失敗 ID: ${id}`, error);
            throw error;
        }
    }

    _parseMessage(id, data) {
        const headers = data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '(無主旨)';
        const sender = headers.find(h => h.name === 'From')?.value || '(未知寄件者)';
        return {
            id,
            subject,
            sender,
            snippet: data.snippet,
            link: `https://mail.google.com/mail/u/0/#inbox/${id}`
        };
    }
}

module.exports = GmailService;