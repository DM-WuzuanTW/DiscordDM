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

    static createAuthMessage(authUrl) {
        const embed = new EmbedBuilder()
            .setColor(0x4285F4)
            .setTitle('🔐 需要您的 Google 授權')
            .setDescription('首次啟動或憑證已過期，請點擊下方按鈕進行授權。')
            .addFields(
                { name: '如果您在遠端 (VPS) 執行', value: '授權後重新導向至 localhost 會失敗，顯示「無法連線」。\n請將該失敗網頁的**完整網址**複製下來，直接在這個對話中回覆給我即可！' }
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
                    .setURL(authUrl)
            );

        return { embeds: [embed], components: [row] };
    }
}

module.exports = MessageFormatter;