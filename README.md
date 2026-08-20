# Qoyod MCP Server

خادم MCP (Model Context Protocol) صغير يربط Claude مباشرة ببرنامج **قيود (Qoyod)** المحاسبي عبر REST API الرسمي الخاص بهم (`https://api.qoyod.com/2.0`).

بعد نشره (deploy) على أي استضافة، تحصل على رابط HTTPS مثل:

```
https://your-app.onrender.com/mcp
```

تضيف هذا الرابط كـ **Custom Connector** داخل إعدادات Claude، ويصبح Claude قادر على قراءة وإنشاء العملاء، الفواتير، الموردين، القيود اليومية، وغيرها من موارد قيود — في أي محادثة، بدون الحاجة لفتح المتصفح.

---

## 1) الأدوات (Tools) المتوفرة

- `qoyod_request` — أداة عامة (passthrough) تغطي أي مورد موثّق في apidoc.qoyod.com (Accounts, Products, Inventories, Vendors, Purchase Orders, Bills, Customers, Quotes, Invoices, Credit/Debit Notes, Receipts, Journal Entries...).
- أدوات جاهزة للاستخدام السريع: `qoyod_list_customers`, `qoyod_get_customer`, `qoyod_create_customer`, `qoyod_list_products`, `qoyod_list_invoices`, `qoyod_get_invoice`, `qoyod_create_invoice`, `qoyod_list_bills`, `qoyod_list_vendors`, `qoyod_list_journal_entries`, `qoyod_create_journal_entry`, `qoyod_list_accounts`.

> ملاحظة: توثيق قيود العام لا يذكر كل حقول كل مورد بالتفصيل. عند الإنشاء (`create_*`) تحقق من شكل الـ payload الصحيح عبر apidoc.qoyod.com أو جرّب أولاً عبر `qoyod_request` مع بيانات اختبارية.

---

## 2) التشغيل محليًا (اختياري، للتجربة قبل النشر)

يتطلب Node.js 18 أو أحدث.

```bash
npm install
cp .env.example .env
# افتح .env وضع مفتاح الـ API الخاص بك من قيود (Settings > General Settings > API Key)
npm start
```

سيعمل الخادم على `http://localhost:3000/mcp`.

---

## 3) النشر (Deploy) على استضافة مجانية — مثال باستخدام Render.com

1. أنشئ حساب مجاني على [render.com](https://render.com) (أو استخدم حساب GitHub لتسجيل الدخول).
2. ارفع هذا المجلد إلى مستودع GitHub جديد (يمكنك إنشاء مستودع فارغ على github.com ثم رفع الملفات من واجهة الويب مباشرة إذا لم تكن معتادًا على git).
3. من لوحة Render: **New +** → **Web Service** → اختر المستودع.
4. الإعدادات:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variable:** أضف `QOYOD_API_KEY` وقيمته مفتاح الـ API من قيود.
5. اضغط **Deploy**. بعد انتهاء البناء ستحصل على رابط مثل:
   `https://qoyod-mcp-server.onrender.com`
6. رابط MCP الكامل الذي ستستخدمه في Claude هو:
   `https://qoyod-mcp-server.onrender.com/mcp`

### بدائل أخرى
نفس الخطوات تقريبًا تنطبق على [Railway](https://railway.app) و[Fly.io](https://fly.io) و[Cloudflare Workers](https://developers.cloudflare.com/workers/) (يحتاج تعديل بسيط ليتوافق مع بيئة Workers).

> ملاحظة على الخطة المجانية في Render: الخادم "ينام" بعد فترة خمول ويحتاج ~30-50 ثانية لأول طلب بعد الخمول. إذا أردت استجابة فورية دائمًا، تحتاج خطة مدفوعة أو استضافة أخرى لا تنيّم الخدمة.

---

## 4) ربطه بـ Claude

1. في إعدادات Claude، ابحث عن قسم **Connectors** (الموصلات) → **Add custom connector**.
2. الصق الرابط: `https://your-app.onrender.com/mcp`
3. احفظ. بعدها ستظهر أدوات قيود ضمن أدوات Claude المتاحة في أي محادثة تفعّل فيها هذا الموصل.

---

## 5) الأمان

- مفتاح الـ API الخاص بك يُخزَّن فقط كمتغيّر بيئة (`QOYOD_API_KEY`) على استضافتك — لا يظهر في الكود ولا يُرسل لأي طرف آخر.
- لا تشارك رابط `/mcp` الخاص بك مع أي شخص لا تثق به؛ فهو يعطي وصولاً كاملاً لحساب قيود المرتبط به (بحسب صلاحيات المفتاح).
- إذا اشتبهت أن المفتاح تسرّب، اذهب إلى قيود → الإعدادات العامة → اضغط **Generate New Key** لإصدار مفتاح جديد يُلغي القديم فورًا.
