# DiscordDM

DiscordDM 是一個強大的 Node.js 基礎應用程式，能夠即時監控您的 Gmail 信箱，並在收到新郵件時透過 Discord 機器人發送帶有按鈕的通知私訊給您。
您可以直接在 Discord 中點擊前往 Web 版 Gmail 回覆，或者是按下「標記為已讀」按鈕，同步您的 Gmail 狀態。

## 功能特色
- **即時通知**: 自動檢查新郵件並即時發送 Discord 私訊通知。
- **精美介面**: Embed 訊息展示郵件主旨、寄件者、內文摘要。
- **快速回覆**: 帶有「在網頁中回覆」連結按鈕，一鍵跳轉到 Gmail。
- **遠端已讀**: 直接在 Discord 點擊「標記已讀」，背景同步更新您的 Gmail 狀態。
- **持久化存儲**: 使用 SQLite 作為背景儲存，保證程式重啟後已處理過的歷史紀錄不會遺失或重複發送。

## 先決條件
- [Node.js](https://nodejs.org/) (建議 v18 以上)
- 一個 [Discord Bot Token](https://discord.com/developers/applications)
- [Google Cloud Console](https://console.cloud.google.com/) 的 Credentials JSON (需開啟 Gmail API)

## 安裝與執行

### 1. 複製專案
```bash
git clone https://github.com/DM-WuzuanTW/DiscordDM.git
cd DiscordDM
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 設定環境變數
複製範例環境變數檔並填寫：
```bash
cp .env.example .env
```

在 `.env` 中填寫您的設定：
```env
DISCORD_TOKEN=您的_DISCORD_BOT_TOKEN
DISCORD_TARGET_USER_ID=要接收通知的您的_DC_使用者ID
GMAIL_POLLING_INTERVAL_MINUTES=1
```

### 4. 設定 Google API 權限
1. 在 Google Cloud Console 新增一個專案。
2. 啟用 **Gmail API**。
3. 建立 OAuth 客戶端 ID (桌面應用程式)，下載 JSON 檔案並備用。

### 5. 啟動應用程式
```bash
npm run start
```
應用程式將會啟動，並且此時會先登入 Discord 您設定的 Bot 機器人。
- **首次設定**：機器人會發送私訊，請直接將剛剛下載的手把手 `credentials.json` 檔案從電腦拖曳**傳送給該機器人**，機器人收到後會以最高規格**使用您的 Discord Token 進行金鑰加密**，安全寫入本地輕量伺服器中並把明碼丟棄。
- 接著，機器人會傳送一個 Google 授權的認證連結。點開核准後，複製那一長串授權碼並依照機器人的提示貼上，從頭到尾完全在您的 Discord 可以遠端無痛完成佈署。

### 常見問題排解 (Troubleshooting)
- **遇到 `403 access_denied` 或未核准測試人員：** 如果您的 Google Cloud 專案仍在「測試階段」，請確保您的個人 Gmail 地址已經被加入 OAuth 同意畫面的「測試使用者 (Test users)」清單中。
- **重新認證：** 若欲更換綁定的帳號或權限過期，或者想更換 API 金鑰，請先停止應用程式，刪除 `processed_ids.sqlite` 資料庫後，重新啟動 `npm run start` 即可觸發重新授權或上傳。

## 技術棧
- `discord.js`: 與 Discord API 的無縫連線與互動。
- `googleapis`: Gmail 與 Google 權限的串接。
- `sqlite`: 歷史郵件資料保存庫。
- `dotenv`: 環境變數管理。

## 授權
開源軟體 - 版權所有 © 2026 DM-WuzuanTW
