const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');

let client;
let isReady = false;

async function initBot(token) {
    if (client) return client;

    console.log('正在啟動 Discord Bot...');

    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.DirectMessages
        ],
        partials: [Partials.Channel]
    });

    client.once('ready', () => {
        console.log(`Discord Bot 已登入為：${client.user.tag}`);
        isReady = true;
    });

    try {
        await client.login(token);
    } catch (error) {
        console.error('Discord Bot 登入失敗:', error);
        throw error;
    }

    return client;
}

async function sendNotification(userId, emailData) {
    if (!isReady) {
        console.error('Bot 尚未就緒，無法發送訊息。');
        return;
    }

    try {
        const user = await client.users.fetch(userId);
        if (!user) {
            console.error(`找不到使用者 ID: ${userId}`);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xEA4335)
            .setTitle('📧 收到新郵件！')
            .setURL(emailData.link)
            .addFields(
                { name: '寄件者', value: emailData.sender || '未知寄件者', inline: false },
                { name: '主旨', value: emailData.subject || '無主旨', inline: false },
                { name: '內容摘要', value: emailData.snippet || '無內容...', inline: false }
            )
            .setFooter({ text: 'Gmail 通知機器人', iconURL: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' })
            .setTimestamp();

        await user.send({ embeds: [embed] });
        console.log(`[成功] 已發送通知給 ${user.tag} (郵件主旨: ${emailData.subject})`);

    } catch (error) {
        console.error('發送 Discord 通知時發生錯誤:', error);
    }
}

module.exports = {
    initBot,
    sendNotification
};
