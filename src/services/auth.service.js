const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const Logger = require('../utils/logger');

class AuthService {
    constructor() {
        this.logger = new Logger('AuthService');
        this.SCOPES = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify'
        ];
        this.TOKEN_PATH = path.join(process.cwd(), 'token.json');
        this.CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
        this.client = null;
    }

    async getClient() {
        if (this.client) return this.client;
        this.client = await this._loadSavedCredentialsIfExist();
        if (this.client) {
            return this.client;
        }
        this.logger.info('無有效 Token，啟動新認證流程...');
        this.client = await this._authenticate();
        if (this.client.credentials) {
            await this._saveCredentials(this.client);
        }
        return this.client;
    }

    async _loadSavedCredentialsIfExist() {
        try {
            const content = await fs.readFile(this.TOKEN_PATH);
            const credentials = JSON.parse(content);
            return google.auth.fromJSON(credentials);
        } catch (err) {
            return null;
        }
    }

    async _authenticate() {
        const client = await authenticate({
            scopes: this.SCOPES,
            keyfilePath: this.CREDENTIALS_PATH,
        });
        return client;
    }

    async _saveCredentials(client) {
        const content = await fs.readFile(this.CREDENTIALS_PATH);
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
        });
        await fs.writeFile(this.TOKEN_PATH, payload);
        this.logger.info('新 Token 已儲存');
    }
}

module.exports = new AuthService();