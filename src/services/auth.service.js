const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');
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

    async getClient(discordService, targetUserId) {
        if (this.client) return this.client;
        this.client = await this._loadSavedCredentialsIfExist();
        if (this.client) {
            return this.client;
        }
        this.logger.info('無有效 Token，啟動新認證流程...');
        this.client = await this._authenticate(discordService, targetUserId);
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

    async _authenticate(discordService, targetUserId) {
        const content = await fs.readFile(this.CREDENTIALS_PATH);
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;

        // 通常 Google OAuth 客戶端桌面版會有這個 redirect_uris
        const redirectUri = (key.redirect_uris && key.redirect_uris.length > 0) ? key.redirect_uris[0] : 'http://localhost:3000/oauth2callback';
        let isOob = false;
        let urlObj;
        let port;

        if (redirectUri.startsWith('urn:ietf:wg:oauth:2.0:oob')) {
            isOob = true;
        } else {
            urlObj = new url.URL(redirectUri);
            port = urlObj.port || 3000;
        }

        const oAuth2Client = new google.auth.OAuth2(
            key.client_id,
            key.client_secret,
            redirectUri
        );

        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: this.SCOPES,
        });

        // 透過 Discord 發送認證連結
        await discordService.sendAuthMessage(targetUserId, authorizeUrl);
        this.logger.info('已將 Google 授權連結發送至您的 Discord 私訊中，請前往點擊。');

        return new Promise((resolve, reject) => {
            const connections = new Set();
            let server;

            if (!isOob) {
                // 開啟本地伺服器以接收回調
                server = http.createServer(async (req, res) => {
                    try {
                        if (req.url.indexOf(urlObj.pathname) > -1) {
                            const qs = new url.URL(req.url, `http://localhost:${port}`).searchParams;
                            const code = qs.get('code');

                            if (code) {
                                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                                res.end('<h1>驗證成功！請關閉此頁面並返回 Discord。</h1>');

                                const { tokens } = await oAuth2Client.getToken(code);
                                oAuth2Client.setCredentials(tokens);

                                server.close();
                                for (const conn of connections) conn.destroy();

                                await discordService.client.users.cache.get(targetUserId)?.send('✅ **Google 帳號授權成功！** 系統已正式開始運作，會自動監控您的信箱。');
                                resolve(oAuth2Client);
                            } else {
                                res.end('<h1>驗證失敗：找不到驗證碼。</h1>');
                            }
                        }
                    } catch (e) {
                        reject(e);
                    }
                });

                server.on('connection', (conn) => {
                    connections.add(conn);
                    conn.on('close', () => connections.delete(conn));
                });

                server.listen(port, () => {
                    this.logger.info(`驗證伺服器已在 port ${port} 啟動，等待您完成授權...`);
                });
            } else {
                this.logger.info(`設定為 out-of-band(oob) 模式，跳過開啟本地伺服器。`);
            }

            discordService.client.on('interactionCreate', async (interaction) => {
                if (interaction.user.id !== targetUserId) return;

                if (interaction.isButton() && interaction.customId === 'auth_manual_input') {
                    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

                    const modal = new ModalBuilder()
                        .setCustomId('auth_modal')
                        .setTitle('手動輸入授權網址或代碼');

                    const input = new TextInputBuilder()
                        .setCustomId('auth_code_input')
                        .setLabel("請貼上包含 code=... 的 localhost 網址")
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder("http://localhost:3000/?code=4/0AeanS0...")
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(input));
                    await interaction.showModal(modal);
                }

                if (interaction.isModalSubmit() && interaction.customId === 'auth_modal') {
                    const text = interaction.fields.getTextInputValue('auth_code_input').trim();
                    let code = null;
                    if (text.startsWith('http')) {
                        try {
                            const parsed = new url.URL(text);
                            code = parsed.searchParams.get('code');
                        } catch (e) { }
                    } else if (text.length > 20) {
                        code = text;
                    }

                    if (code) {
                        await interaction.deferReply({ ephemeral: true });
                        try {
                            const { tokens } = await oAuth2Client.getToken(code);
                            oAuth2Client.setCredentials(tokens);

                            if (server) {
                                server.close();
                                for (const conn of connections) conn.destroy();
                            }

                            await interaction.editReply('✅ **Google 帳號授權手動綁定成功！** 系統已正式開始運作，會自動監控您的信箱。');

                            // 更新原本的按鈕為已完成
                            const message = interaction.message;
                            if (message && message.components) {
                                const newComponents = message.components.map(row => {
                                    const newRow = row.toJSON();
                                    newRow.components = newRow.components.map(comp => {
                                        comp.disabled = true;
                                        return comp;
                                    });
                                    return newRow;
                                });
                                await message.edit({ components: newComponents }).catch(() => { });
                            }

                            resolve(oAuth2Client);
                        } catch (err) {
                            await interaction.editReply('❌ **綁定失敗：** 授權碼無效或已過期，請重新索取。');
                        }
                    } else {
                        await interaction.reply({ content: '❌ 無法從您的輸入中解析出授權碼。', ephemeral: true });
                    }
                }
            });
        });
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