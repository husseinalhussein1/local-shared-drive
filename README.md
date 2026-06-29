# Lumina Network — Local Shared Drive
### مشروع التخزين الشبكي المحلي

> **مشروع جامعي متكامل** | Full-Stack University Project  
> Next.js 16 (App Router) · Prisma ORM · SQLite · JWT · Tailwind CSS v4

---

## 📌 فهرس المحتويات | Table of Contents

1. [مقدمة | Introduction](#مقدمة)
2. [التقنيات المستخدمة | Tech Stack](#التقنيات-المستخدمة)
3. [هندسة النظام | Architecture](#هندسة-النظام)
4. [الأدوار والصلاحيات | Roles & Permissions](#الأدوار-والصلاحيات)
5. [تدفق البيانات | Data Flow](#تدفق-البيانات)
6. [خطوات التجهيز | Setup](#خطوات-التجهيز)
7. [توثيق الـ APIs | API Reference](#توثيق-الـ-apis)
8. [تشغيل على الشبكة المحلية | LAN Setup](#تشغيل-على-الشبكة-المحلية)

---

## مقدمة

### العربية
**Lumina Network** هو نظام مشاركة ملفات محلي (Local Network Drive) مبني بالكامل على تقنيات الويب الحديثة. يوفر المشروع واجهة مرئية جميلة بنمط Glassmorphism داكن، مع باك إند قوي يعتمد على **RESTful API** كاملة يمكن اختبارها عبر Postman بشكل مستقل. يدعم النظام ثلاثة مستويات من الصلاحيات لضمان أمان البيانات وتنظيم الوصول.

**هدف المشروع**: بناء نظام تخزين ومشاركة ملفات على الشبكة المحلية يمكن تشغيله على أي لابتوب وربطه بالأجهزة المحيطة (هواتف، لابتوبات) عبر الـ WiFi، مع واجهة برمجية (API) موثقة وآمنة تستطيع اختبار كودات الحماية (401, 403, 404, 500) مباشرة من Postman.

### English
**Lumina Network** is a local network file-sharing system built with modern web technologies. It features a stunning Glassmorphism dark-mode UI, a fully separate RESTful API backend independently testable via Postman, and a three-tier role-based access control system.

**Project Goal**: Build a file storage and sharing system that runs on a local laptop and allows all devices on the same WiFi network to access, upload, and manage files through a secure, documented API — with proper HTTP status codes (401, 403, 404, 500) demonstrable independently via Postman.

---

## التقنيات المستخدمة

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | JavaScript (JS) |
| **Styling** | Tailwind CSS v4 |
| **Database** | SQLite (via Prisma ORM) |
| **Auth** | JWT (via `jose`) stored in `httpOnly` Cookies |
| **Password Hashing** | `bcryptjs` (salt rounds: 12) |
| **File Storage** | Node.js `fs` module → `/uploads` directory |
| **Icons** | Lucide React |
| **Design System** | Lumina Network (Glassmorphism, Geist font) |

---

## هندسة النظام

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│           (React Client Components + Fetch API)          │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP Requests (JSON)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   middleware.js                          │
│   (JWT Verification + Role Guard + Header Injection)     │
└─────────────────────────┬───────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   ┌──────────┐   ┌──────────────┐  ┌──────────────┐
   │ /api/auth│   │ /api/folders │  │  /api/files  │
   │ /api/    │   │ /api/admin/  │  │  /uploads/   │
   │  admin   │   │              │  │  (disk)      │
   └────┬─────┘   └──────┬───────┘  └──────┬───────┘
        │               │                  │
        ▼               ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Prisma ORM  ←→  SQLite (dev.db)            │
│         Tables: User, Folder, File, DownloadLog          │
└─────────────────────────────────────────────────────────┘
```

### هيكل المجلدات

```
local-shared-drive/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.js       ← POST /api/auth/login
│   │   │   ├── logout/route.js      ← POST /api/auth/logout
│   │   │   └── me/route.js          ← GET  /api/auth/me
│   │   ├── folders/
│   │   │   ├── route.js             ← GET  /api/folders
│   │   │   ├── create/route.js      ← POST /api/folders/create
│   │   │   └── [id]/route.js        ← PATCH|DELETE /api/folders/:id
│   │   ├── files/
│   │   │   ├── upload/route.js      ← POST /api/files/upload
│   │   │   ├── download/route.js    ← POST /api/files/download
│   │   │   └── [id]/route.js        ← DELETE /api/files/:id
│   │   └── admin/
│   │       ├── users/create/route.js ← POST /api/admin/users/create
│   │       └── logs/route.js         ← GET  /api/admin/logs
│   ├── login/page.js                ← Login page
│   ├── admin/page.js                ← Admin dashboard
│   ├── page.js                      ← Main file explorer
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── prisma.js                    ← Prisma client singleton
│   └── auth.js                      ← JWT sign/verify utilities
├── prisma/
│   ├── schema.prisma                ← DB schema
│   ├── seed.js                      ← Seed script
│   └── dev.db                       ← SQLite database (auto-created)
├── uploads/                         ← Physical file storage (on disk)
├── middleware.js                    ← Route protection
├── .env.local                       ← Environment variables
└── README.md
```

---

## الأدوار والصلاحيات

| Permission | USER | USER_PLUS | ADMIN |
|-----------|:----:|:---------:|:-----:|
| View public folders/files | ✅ | ✅ | ✅ |
| View private folders | ❌ | ✅ | ✅ |
| Download files | ✅ | ✅ | ✅ |
| Create virtual folders | ❌ | ✅ | ✅ |
| Upload files | ❌ | ✅ | ✅ |
| Delete own files/folders | ❌ | ✅ | ✅ |
| Delete any file/folder | ❌ | ❌ | ✅ |
| Toggle folder visibility | ❌ | ❌ | ✅ |
| Access admin dashboard | ❌ | ❌ | ✅ |
| Create new users | ❌ | ❌ | ✅ |
| View download logs | ❌ | ❌ | ✅ |

---

## تدفق البيانات

### كيفية تخزين الملفات

```
المستخدم يرفع ملف
         │
         ▼
POST /api/files/upload (FormData: file + folderId)
         │
         ├─── يحفظ الملف فيزيائياً في /uploads/{uuid}.ext
         │
         └─── يسجل في قاعدة البيانات:
              File {
                id: 42
                originalName: "thesis_2024.pdf"
                storedName:   "3f8a2b1c-uuid.pdf"  ← اسم فريد لتجنب التعارض
                size: 2048576
                mimeType: "application/pdf"
                folderId: 5    ← الربط بالمجلد الوهمي
                uploadedById: 3
              }
```

### المجلدات الوهمية

```
لا توجد مجلدات حقيقية على الديسك!
جميع الملفات في مجلد واحد فيزيائي: /uploads/

الفصل يتم في قاعدة البيانات فقط عبر:
  File.folderId → Folder.id

مثال: جلب ملفات المجلد رقم 5:
  SELECT * FROM File WHERE folderId = 5;
```

### تدفق التوثيق

```
1. POST /api/auth/login { email, password }
   → يتحقق من bcrypt hash
   → يولد JWT { id, name, email, role }
   → يحفظه في httpOnly Cookie "auth-token" (8 ساعات)

2. كل طلب لاحق يمر عبر middleware.js
   → يقرأ Cookie → يتحقق من JWT
   → يضيف headers: x-user-id, x-user-role, x-user-email
   → يمرر للـ Route Handler

3. Route Handler يقرأ headers لتحديد الهوية
   → يطبق صلاحيات الدور
```

---

## خطوات التجهيز

### 1. تثبيت المتطلبات

```bash
npm install

# تثبيت Prisma
npm install prisma --save-dev
npm install @prisma/client

# مكتبات التوثيق والتشفير
npm install jose bcryptjs

# أيقونات Lucide
npm install lucide-react
```

### 2. إعداد قاعدة البيانات

```bash
# إنشاء الـ migration وتوليد الجداول
npx prisma migrate dev --name init

# توليد Prisma Client
npx prisma generate

# تعبئة قاعدة البيانات ببيانات تجريبية
node prisma/seed.js
```

### 3. تشغيل المشروع

```bash
npm run dev
```

افتح المتصفح على: **http://localhost:3000**

### 4. بيانات الدخول الافتراضية

| الدور | الإيميل | الباسورد |
|------|---------|---------|
| ADMIN | admin@local.net | admin123 |
| USER_PLUS | contributor@local.net | contrib123 |
| USER | user@local.net | user123 |

---

## توثيق الـ APIs

> جميع الـ APIs ترجع JSON. الـ Endpoints المحمية تتطلب Cookie `auth-token` صالح.
> All APIs return JSON. Protected endpoints require a valid `auth-token` cookie.

---

### 🔐 Auth Endpoints

---

#### `POST /api/auth/login`

**الوصف**: تسجيل الدخول وتوليد JWT.
**الصلاحية**: Public

**Request Body:**
```json
{
  "email": "admin@local.net",
  "password": "admin123"
}
```

**Success — 200 OK:**
```json
{
  "success": true,
  "message": "Login successful.",
  "user": {
    "id": 1,
    "name": "System Admin",
    "email": "admin@local.net",
    "role": "ADMIN"
  }
}
```
*Sets httpOnly Cookie: `auth-token=<JWT>`*

**Errors:**
| Status | JSON |
|--------|------|
| 400 | `{"success":false,"message":"Email and password are required."}` |
| 401 | `{"success":false,"message":"Invalid email or password."}` |
| 500 | `{"success":false,"message":"Internal server error."}` |

---

#### `POST /api/auth/logout`

**الصلاحية**: أي مستخدم مسجّل

**Success — 200 OK:**
```json
{"success": true, "message": "Logged out successfully."}
```

---

#### `GET /api/auth/me`

**الصلاحية**: أي مستخدم مسجّل

**Success — 200 OK:**
```json
{
  "success": true,
  "user": {"id": 1, "name": "System Admin", "email": "admin@local.net", "role": "ADMIN"}
}
```

**Errors:**
| Status | JSON |
|--------|------|
| 401 | `{"success":false,"message":"Unauthorized."}` |

---

### 📁 Folder Endpoints

---

#### `GET /api/folders`

**الصلاحية**: أي مستخدم (USER يرى العامة فقط)

**Success — 200 OK:**
```json
{
  "success": true,
  "folders": [
    {
      "id": 1,
      "name": "Public Resources",
      "isPublic": true,
      "createdAt": "2024-06-01T10:00:00.000Z",
      "createdBy": {"id": 1, "name": "System Admin", "email": "admin@local.net"},
      "files": [
        {
          "id": 1,
          "originalName": "syllabus.pdf",
          "storedName": "3f8a2b1c-uuid.pdf",
          "size": 204800,
          "mimeType": "application/pdf",
          "folderId": 1,
          "createdAt": "2024-06-01T11:00:00.000Z",
          "uploadedBy": {"id": 1, "name": "System Admin", "email": "admin@local.net"}
        }
      ]
    }
  ]
}
```

**Errors:**
| Status | JSON |
|--------|------|
| 401 | `{"success":false,"message":"Unauthorized: Authentication required."}` |
| 500 | `{"success":false,"message":"Internal server error."}` |

---

#### `POST /api/folders/create`

**الصلاحية**: USER_PLUS, ADMIN

**Request Body:**
```json
{"name": "Lecture Slides", "isPublic": true}
```

**Success — 201 Created:**
```json
{
  "success": true,
  "message": "Folder created successfully.",
  "folder": {
    "id": 4, "name": "Lecture Slides", "isPublic": true,
    "createdById": 2, "createdAt": "2024-06-15T09:30:00.000Z",
    "createdBy": {"id": 2, "name": "Dr. Contributor", "email": "contributor@local.net"}
  }
}
```

**Errors:**
| Status | JSON |
|--------|------|
| 400 | `{"success":false,"message":"Folder name is required."}` |
| 401 | `{"success":false,"message":"Unauthorized: Authentication required."}` |
| 403 | `{"success":false,"message":"Forbidden: Insufficient permissions."}` |
| 500 | `{"success":false,"message":"Internal server error."}` |

---

#### `PATCH /api/folders/:id`

**الصلاحية**: ADMIN فقط

**Request Body:**
```json
{"isPublic": false}
```

**Success — 200 OK:**
```json
{
  "success": true,
  "message": "Folder is now private.",
  "folder": {"id": 1, "name": "Public Resources", "isPublic": false, "createdById": 1, "createdAt": "..."}
}
```

**Errors:**
| Status | JSON |
|--------|------|
| 400 | `{"success":false,"message":"isPublic must be a boolean value."}` |
| 401 | `{"success":false,"message":"Unauthorized: Authentication required."}` |
| 403 | `{"success":false,"message":"Forbidden: Administrator access required."}` |
| 404 | `{"success":false,"message":"Folder not found."}` |
| 500 | `{"success":false,"message":"Internal server error."}` |

---

#### `DELETE /api/folders/:id`

**الصلاحية**: USER_PLUS (مجلداته فقط), ADMIN (أي مجلد)

**Success — 200 OK:**
```json
{"success": true, "message": "Folder and all its files deleted successfully."}
```

**Errors:**
| Status | JSON |
|--------|------|
| 401 | `{"success":false,"message":"Unauthorized: Authentication required."}` |
| 403 | `{"success":false,"message":"Forbidden: You can only delete your own folders."}` |
| 404 | `{"success":false,"message":"Folder not found."}` |
| 500 | `{"success":false,"message":"Internal server error."}` |

---

### 📄 File Endpoints

---

#### `POST /api/files/upload`

**الصلاحية**: USER_PLUS, ADMIN
**Content-Type**: `multipart/form-data`

**FormData Fields:**
```
file     → <File binary>
folderId → "1"
```

**Success — 201 Created:**
```json
{
  "success": true,
  "message": "File uploaded successfully.",
  "file": {
    "id": 5, "originalName": "report.pdf", "size": 1048576,
    "mimeType": "application/pdf", "folderId": 1,
    "folder": {"id": 1, "name": "Public Resources"},
    "uploadedBy": {"id": 2, "name": "Dr. Contributor", "email": "contributor@local.net"},
    "createdAt": "2024-06-20T14:00:00.000Z"
  }
}
```

**Errors:**
| Status | JSON |
|--------|------|
| 400 | `{"success":false,"message":"No file provided."}` |
| 400 | `{"success":false,"message":"folderId is required."}` |
| 401 | `{"success":false,"message":"Unauthorized: Authentication required."}` |
| 403 | `{"success":false,"message":"Forbidden: Insufficient permissions."}` |
| 404 | `{"success":false,"message":"Target folder not found."}` |
| 500 | `{"success":false,"message":"Internal server error."}` |

---

#### `POST /api/files/download`

**الصلاحية**: أي مستخدم (USER: مجلدات عامة فقط)

**Request Body:**
```json
{"fileId": 5}
```

**Success — 200 OK:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="report.pdf"
Content-Length: 1048576
<binary file stream>
```

**Errors:**
| Status | JSON |
|--------|------|
| 400 | `{"success":false,"message":"fileId is required."}` |
| 401 | `{"success":false,"message":"Unauthorized: Authentication required."}` |
| 403 | `{"success":false,"message":"Forbidden: You do not have access to this file."}` |
| 404 | `{"success":false,"message":"File not found."}` |
| 404 | `{"success":false,"message":"File not found on disk."}` |
| 500 | `{"success":false,"message":"Internal server error."}` |

---

#### `DELETE /api/files/:id`

**الصلاحية**: USER_PLUS (ملفاته فقط), ADMIN (أي ملف)

**Success — 200 OK:**
```json
{"success": true, "message": "File deleted successfully."}
```

**Errors:**
| Status | JSON |
|--------|------|
| 401 | `{"success":false,"message":"Unauthorized: Authentication required."}` |
| 403 | `{"success":false,"message":"Forbidden: You can only delete files you uploaded."}` |
| 404 | `{"success":false,"message":"File not found."}` |
| 500 | `{"success":false,"message":"Internal server error."}` |

---

### 🛡️ Admin Endpoints

---

#### `POST /api/admin/users/create`

**الصلاحية**: ADMIN فقط

**Request Body:**
```json
{
  "name": "Ahmed Hassan",
  "email": "ahmed@local.net",
  "password": "securepass123",
  "userRole": "USER_PLUS"
}
```
> `userRole` مقبول: `"USER"` أو `"USER_PLUS"` فقط.

**Success — 201 Created:**
```json
{
  "success": true,
  "message": "User created successfully.",
  "user": {
    "id": 4, "name": "Ahmed Hassan", "email": "ahmed@local.net",
    "role": "USER_PLUS", "createdAt": "2024-06-25T08:00:00.000Z"
  }
}
```

**Errors:**
| Status | JSON |
|--------|------|
| 400 | `{"success":false,"message":"name, email, password, and userRole are all required."}` |
| 400 | `{"success":false,"message":"userRole must be one of: USER, USER_PLUS."}` |
| 401 | `{"success":false,"message":"Unauthorized: Authentication required."}` |
| 403 | `{"success":false,"message":"Forbidden: Administrator access required."}` |
| 409 | `{"success":false,"message":"A user with this email already exists."}` |
| 500 | `{"success":false,"message":"Internal server error."}` |

---

#### `GET /api/admin/logs`

**الصلاحية**: ADMIN فقط

**Success — 200 OK:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 24,
    "totalFolders": 5,
    "totalUsers": 8,
    "totalDownloads": 142,
    "totalStorageBytes": 524288000,
    "totalStorageMB": 500.0
  },
  "logs": [
    {
      "id": 87,
      "action": "DOWNLOAD",
      "fileName": "thesis_final.pdf",
      "fileSize": 3145728,
      "fileMimeType": "application/pdf",
      "folder": {"id": 2, "name": "Research Papers"},
      "downloadedBy": {
        "id": 3, "name": "Regular User",
        "email": "user@local.net", "role": "USER"
      },
      "createdAt": "2024-06-29T13:45:00.000Z"
    }
  ]
}
```

**Errors:**
| Status | JSON |
|--------|------|
| 401 | `{"success":false,"message":"Unauthorized: Authentication required."}` |
| 403 | `{"success":false,"message":"Forbidden: Administrator access required."}` |
| 500 | `{"success":false,"message":"Internal server error."}` |

---

## تشغيل على الشبكة المحلية

### الخطوة 1: إيجاد الـ IP المحلي

**Windows:**
```powershell
ipconfig
# ابحث عن: IPv4 Address . . . . . . . . : 192.168.x.x
```

**macOS / Linux:**
```bash
hostname -I
```

### الخطوة 2: تشغيل على جميع الواجهات

أضف هذا للـ `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:lan": "next dev --hostname 0.0.0.0 --port 3000"
  }
}
```

```bash
npm run dev:lan
```

### الخطوة 3: الوصول من الأجهزة الأخرى

افترض أن الـ IP هو `192.168.1.50`:

| الجهاز | الرابط |
|-------|--------|
| نفس اللابتوب | `http://localhost:3000` |
| هاتف / لابتوب آخر على نفس WiFi | `http://192.168.1.50:3000` |
| Postman على جهاز آخر | `http://192.168.1.50:3000/api/...` |

### اختبار Postman

**تسجيل الدخول:**
```
POST http://192.168.1.50:3000/api/auth/login
Content-Type: application/json
Body: {"email": "admin@local.net", "password": "admin123"}
```

**رفع ملف:**
```
POST http://192.168.1.50:3000/api/files/upload
Body: form-data
  file     → [اختر ملف]
  folderId → 1
```

**تحميل ملف:**
```
POST http://192.168.1.50:3000/api/files/download
Content-Type: application/json
Body: {"fileId": 1}
```

**اختبار 403 Forbidden (USER يحاول دخول Admin API):**
```
1. سجّل دخول بـ user@local.net
2. GET http://192.168.1.50:3000/api/admin/logs
→ Response 403: {"success":false,"message":"Forbidden: Administrator access required."}
```

**اختبار 401 Unauthorized (بدون Cookie):**
```
1. لا تسجّل دخول أو احذف الـ Cookie
2. GET http://192.168.1.50:3000/api/folders
→ Response 401: {"success":false,"message":"Unauthorized: Authentication required."}
```

---

## ملاحظات تقنية

- **تأمين الإنتاج**: غيّر `JWT_SECRET` في `.env.local` لقيمة عشوائية طويلة.
- **Cascade Delete**: حذف المجلد يحذف ملفاته وسجلات التحميل تلقائياً.
- **Middleware**: يعمل على Edge Runtime مما يجعله سريعاً جداً.
- **File Streaming**: يستخدم Web Streams API بدلاً من Buffer لدعم الملفات الكبيرة.

---

*Built with Next.js 16, Prisma ORM, SQLite, Tailwind CSS v4*
*Lumina Network Design System — Glassmorphism Dark Theme*
