# 性別趴網站 — Vercel 部署教學

## 已完成
- 首頁 `/`：原本五個線索、即時投票結果、QR Code（自動連結本站 `/vote`）
- 手機投票 `/vote`：暱稱、Emoji、男／女投票及改票
- 連接原本 Firebase 專案 `gender-reveal-party-55ec0`，共用 `events/party/stages/initial/votes`
- 使用原先 Firebase REST 程式碼，不需要 `firebase/app` 套件

## 第一步：放入照片（重要）
在 `public/photos/` 放入五張 JPG，名稱必須完全相同：
- `height167.jpg` — 167 公分照片
- `height173.jpg` — 173 公分照片
- `mouse.jpg` — 丫鼠照片
- `partial.jpg` — 局部特寫
- `engineer.jpg` — 機電工程師照片

照片不會從 Framer 自動同步。請用你電腦的原始照片，不要以為已經包含在本 ZIP。

## 第二步：上傳 GitHub
1. 解壓縮 ZIP。
2. 登入 GitHub，建立新的 repository（例如 `gender-reveal-vercel`）。
3. 選 **uploading an existing file**，把解壓縮後專案資料夾**裡面的檔案及資料夾**上傳到 repository 根目錄（不要只上傳 ZIP）。
4. 按 **Commit changes**。

## 第三步：Vercel 發布
1. 登入 https://vercel.com ，選 **Add New → Project**。
2. 選 GitHub，Import 剛建立的 repository。
3. Framework Preset 選 **Vite**，Root Directory 選 `./`。
4. Build Command：`npm run build`；Output Directory：`dist`。
5. 按 Deploy，完成後會拿到 `https://xxxx.vercel.app`。

## 第四步：驗收
- 打開 `/` 確認五個線索和照片。
- 打開 `/vote`，輸入暱稱、Emoji，選一隊並送出。
- 再換另一隊、按「更新我的投票」，確認改票成功。
- 回到首頁，等約 2 秒確認票數更新。
- 用手機掃首頁 QR Code，應進入目前 Vercel 網域的 `/vote`。

## 注意
- 先前在 Framer 投過票的匿名身分，因為網域不同，通常**不會自動帶到新網域**；舊票仍留在同一個 Firestore 資料庫。正式活動前如需清空測試票，應先確認後再操作。
- 如果 Firebase 顯示 `PERMISSION_DENIED`，需檢查原 Firestore Rules 與匿名登入設定。
- 如果顯示 `OPERATION_NOT_ALLOWED`，請確認 Firebase Authentication 已開啟匿名登入。
- 本 ZIP 尚未在你的 Vercel 帳號實際發布；部署後仍需做真機投票驗收。
