const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class MessageFormatter {
    static createEmailMessage(emailData) {
        const embed = new EmbedBuilder()
            .setColor(0xEA4335)
            .setTitle(`📧 ${emailData.subject || '收到新郵件！'}`)
            .setURL(emailData.link)
            .setDescription('您有一封新的未讀郵件。')
            .addFields(
                { name: '👤 寄件者', value: emailData.sender || 'Unknown', inline: false },
                { name: '📑 主旨', value: emailData.subject || 'No Subject', inline: false },
                { name: '📝 內容摘要', value: emailData.snippet || '(無內容摘要)', inline: false }
            )
            .setFooter({
                text: 'Gmail 通知機器人',
                iconURL: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico'
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('在網頁中回覆 (Web)')
                    .setStyle(ButtonStyle.Link)
                    .setURL(emailData.link),
                new ButtonBuilder()
                    .setCustomId(`mark_read_${emailData.id}`)
                    .setLabel('標記已讀')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📬')
            );

        return { embeds: [embed], components: [row] };
    }

    static createUploadCredentialsMessage() {
        const embed = new EmbedBuilder()
            .setColor(0xF4B400)
            .setTitle('⚙️ 機器人初始設定：需要 credentials.json')
            .setDescription('我目前沒有存取 Google API 的權限，請前往 Google Cloud Console 建立「桌面應用程式」的 OAuth 2.0 用戶端 ID，並下載 `credentials.json` 檔案。')
            .addFields(
                { name: '如何提供', value: '請直接在**這個對話框中**，將 `credentials.json` 檔案拖曳上傳/附加給我即可。' },
                { name: '為保障安全', value: '您上傳的檔案內容將會進行**高強度加密**並存入本地資料庫，程式不會直接儲存明碼檔案。' }
            )
            .setFooter({
                text: 'Gmail 通知機器人',
                iconURL: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico'
            })
            .setTimestamp();

        return { embeds: [embed] };
    }

    static createAuthMessage(authUrl) {
        const embed = new EmbedBuilder()
            .setColor(0x4285F4)
            .setTitle('🔐 需要您的 Google 授權')
            .setDescription('首次啟動或憑證已過期，請點擊下方第一顆按鈕進行授權。')
            .addFields(
                { name: '如果您在遠端 (VPS) 執行', value: '授權後重新導向至 localhost 會失敗，顯示「無法連線」。\n請將該失敗網頁的**完整網址**複製下來，並點擊下方「手動輸入網址/授權碼」按鈕提交！' }
            )
            .setFooter({
                text: 'Gmail 通知機器人',
                iconURL: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico'
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('點擊前往授權頁面')
                    .setStyle(ButtonStyle.Link)
                    .setURL(authUrl),
                new ButtonBuilder()
                    .setCustomId('auth_manual_input')
                    .setLabel('手動輸入網址/授權碼')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔗')
            );

        return { embeds: [embed], components: [row] };
    }
}

module.exports = MessageFormatter;