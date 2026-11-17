# 旅遊 Log

以卡片呈現旅程，每天分上午、下午、晚上，提供 Day 切換與收藏。

## 擴充內容
- 每個旅程位於 content/trips/，使用一份 JSON。
- 新旅程沿用 templates/trip.template.json，檔名須與 slug 相同。
- 填寫城市、標題、每日三個時段的地點與簡短活動，並附官方來源。
- 建置後會自動加入新卡片和 Day 按鈕。
- 外觀集中在 public/styles.css，互動集中在 public/app.js。
- 詳細資料格式與開發規則見 AGENTS.md。
