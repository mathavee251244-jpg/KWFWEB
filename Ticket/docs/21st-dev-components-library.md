# 21st.dev — คลัง UI Components สำหรับงานเว็บไซต์

> **เว็บไซต์:** https://21st.dev/community/components
> คลัง React components คุณภาพสูงจาก community — copy/paste ใช้ได้เลย รองรับ shadcn + Tailwind CSS + TypeScript
> ใช้เป็น "แหล่งช้อป component" สำหรับเก็บไอเดียและประกอบเว็บไซต์ลูกค้าแต่ละโปรเจกต์

---

## วิธีใช้เอกสารนี้

1. เวลาเริ่มโปรเจกต์ใหม่ → เปิดหมวดที่ต้องการด้านล่าง เลือก component
2. แต่ละ component ในเว็บจะมีโค้ด + คำสั่งติดตั้งให้ครบ (รูปแบบเดียวกับ shape-landing-hero ที่เคยทำ)
3. วางไฟล์ใน `/components/ui` ของโปรเจกต์ แล้วติดตั้ง dependencies ตามที่ระบุ
4. จดบันทึก component ที่ใช้แล้วในตาราง [ประวัติการใช้งาน](#ประวัติการใช้งานในโปรเจกต์) ท้ายเอกสาร

### ลิงก์หลัก

| หน้า | URL |
|---|---|
| Featured (แนะนำ) | https://21st.dev/community/components/featured |
| Newest (มาใหม่) | https://21st.dev/community/components/newest |
| Best of the Week | https://21st.dev/community/components/week |
| Themes | https://21st.dev/community/themes |
| Top Authors | https://21st.dev/community/authors |

---

## หมวด Marketing Blocks (สำหรับหน้า Landing / หน้าแรก)

เหมาะกับเว็บลูกค้าประเภท ร้านอาหาร โรงแรม คาเฟ่ corporate site

| หมวด | จำนวน | URL | เหมาะกับ |
|---|---|---|---|
| **Heroes** | 73 | https://21st.dev/community/components/s/hero | ส่วนเปิดหน้าแรก — สำคัญสุด |
| **Features** | 36 | https://21st.dev/community/components/s/features | โชว์จุดเด่นบริการ/เมนู/ห้องพัก |
| **Calls to Action** | 34 | https://21st.dev/community/components/s/call-to-action | ปุ่มจอง/สั่งซื้อ/ติดต่อ |
| **Backgrounds** | 33 | https://21st.dev/community/components/s/background | พื้นหลัง animated (เช่นเอฟเฟกต์น้ำ) |
| **Hooks** | 31 | https://21st.dev/community/components/s/hook | utility hooks |
| **Images** | 26 | https://21st.dev/community/components/s/image | แกลเลอรีรูปร้าน/โรงแรม |
| **Scroll Areas** | 24 | https://21st.dev/community/components/s/scroll-area | scroll effects |
| **Texts** | 58 | https://21st.dev/community/components/s/text | text animation, typography effects |
| **Pricing Sections** | 17 | https://21st.dev/community/components/s/pricing-section | ตารางราคาห้องพัก/แพ็กเกจ |
| **Clients** | 16 | https://21st.dev/community/components/s/clients | โลโก้ลูกค้า/พาร์ตเนอร์ |
| **Testimonials** | 15 | https://21st.dev/community/components/s/testimonials | รีวิวลูกค้า |
| **Shaders** | 15 | https://21st.dev/community/components/s/shader | เอฟเฟกต์ WebGL/shader (เข้ากับงาน Three.js) |
| **Footers** | 14 | https://21st.dev/community/components/s/footer | ส่วนท้ายเว็บ |
| **Borders** | 12 | https://21st.dev/community/components/s/border | กรอบ/เส้นตกแต่ง |
| **Navigation Menus** | 11 | https://21st.dev/community/components/s/navbar-navigation | เมนูนำทาง |
| **Announcements** | 10 | https://21st.dev/community/components/s/announcement | แบนเนอร์ประกาศ/โปรโมชัน |
| **Videos** | 9 | https://21st.dev/community/components/s/video | วิดีโอ background (ใช้กับ AI video assets ได้) |
| **Docks** | 6 | https://21st.dev/community/components/s/dock | dock-style menu |
| **Comparisons** | 6 | https://21st.dev/community/components/s/comparison | ตารางเปรียบเทียบ |
| **Maps** | 2 | https://21st.dev/community/components/s/map | แผนที่ที่ตั้งร้าน |

---

## หมวด UI Components (สำหรับระบบ / Dashboard / ฟอร์ม)

เหมาะกับงานประเภท dashboard, ระบบจัดการ, monitoring

| หมวด | จำนวน | URL | เหมาะกับ |
|---|---|---|---|
| **Buttons** | 130 | https://21st.dev/community/components/s/button | ปุ่มทุกสไตล์ |
| **Inputs** | 102 | https://21st.dev/community/components/s/input | ช่องกรอกข้อมูล |
| **Cards** | 79 | https://21st.dev/community/components/s/card | การ์ดข้อมูล/สถานะ |
| **Selects** | 62 | https://21st.dev/community/components/s/select | dropdown เลือกค่า |
| **Sliders** | 45 | https://21st.dev/community/components/s/slider | แถบเลื่อน |
| **Accordions** | 40 | https://21st.dev/community/components/s/accordion | FAQ / เนื้อหาพับเก็บ |
| **Tabs** | 38 | https://21st.dev/community/components/s/tabs | แท็บสลับมุมมอง |
| **Dialogs / Modals** | 37 | https://21st.dev/community/components/s/modal-dialog | หน้าต่าง popup |
| **Calendars** | 34 | https://21st.dev/community/components/s/calendar | ปฏิทินจอง |
| **Tables** | 30 | https://21st.dev/community/components/s/table | ตารางข้อมูล (dashboard) |
| **AI Chats** | 30 | https://21st.dev/community/components/s/ai-chat | UI แชท AI |
| **Tooltips** | 28 | https://21st.dev/community/components/s/tooltip | คำอธิบายลอย |
| **Dropdowns** | 25 | https://21st.dev/community/components/s/dropdown | เมนูแบบเลื่อนลง |
| **Badges** | 25 | https://21st.dev/community/components/s/badge | ป้ายสถานะ (online/offline) |
| **Forms** | 23 | https://21st.dev/community/components/s/form | ฟอร์มติดต่อ/จอง |
| **Alerts** | 23 | https://21st.dev/community/components/s/alert | แจ้งเตือนในหน้า |
| **Popovers** | 23 | https://21st.dev/community/components/s/popover | popup เล็ก |
| **Text Areas** | 22 | https://21st.dev/community/components/s/textarea | ช่องข้อความยาว |
| **Radio Groups** | 22 | https://21st.dev/community/components/s/radio-group | ตัวเลือกแบบ radio |
| **Spinner Loaders** | 21 | https://21st.dev/community/components/s/spinner-loader | loading animation |
| **Paginations** | 20 | https://21st.dev/community/components/s/pagination | แบ่งหน้า |
| **Checkboxes** | 19 | https://21st.dev/community/components/s/checkbox | กล่องติ๊ก |
| **Menus** | 18 | https://21st.dev/community/components/s/menu | เมนูทั่วไป |
| **Numbers** | 18 | https://21st.dev/community/components/s/number | ตัวเลข animated (สถิติ) |
| **Avatars** | 17 | https://21st.dev/community/components/s/avatar | รูปโปรไฟล์ |
| **Carousels** | 16 | https://21st.dev/community/components/s/carousel | สไลด์รูป |
| **Links** | 13 | https://21st.dev/community/components/s/link | ลิงก์มีเอฟเฟกต์ |
| **Toggles** | 12 | https://21st.dev/community/components/s/toggle | สวิตช์เปิด/ปิด |
| **Date Pickers** | 12 | https://21st.dev/community/components/s/date-picker | เลือกวันที่ (ระบบจอง) |
| **Sidebars** | 10 | https://21st.dev/community/components/s/sidebar | แถบข้าง (dashboard) |
| **Icons** | 10 | https://21st.dev/community/components/s/icons | ชุดไอคอน |
| **File Uploads** | 7 | https://21st.dev/community/components/s/upload-download | อัปโหลดไฟล์ |
| **Tags** | 6 | https://21st.dev/community/components/s/chip-tag | แท็ก/ชิป |
| **Notifications** | 5 | https://21st.dev/community/components/s/notification | แจ้งเตือน |
| **Sign Ins** | 4 | https://21st.dev/community/components/s/sign-in | หน้า login |
| **Sign ups** | 4 | https://21st.dev/community/components/s/registration-signup | หน้าสมัครสมาชิก |
| **Toasts** | 2 | https://21st.dev/community/components/s/toast | toast แจ้งเตือนชั่วคราว |
| **File Trees** | 2 | https://21st.dev/community/components/s/file-tree | โครงสร้างไฟล์ |
| **Empty States** | 1 | https://21st.dev/community/components/s/empty-state | หน้าว่าง/ไม่มีข้อมูล |

---

## ชุด Component แนะนำตามประเภทเว็บไซต์

### 🍽️ ร้านอาหาร / คาเฟ่ / โรงแรม (เช่น Ruean Chainam)
- **Hero** + **Background/Shader** (เอฟเฟกต์น้ำ/บรรยากาศ)
- **Image Gallery** + **Carousel** (รูปอาหาร/ห้องพัก)
- **Testimonials** (รีวิวลูกค้า)
- **Pricing Section** (ราคาห้อง/แพ็กเกจ)
- **Calendar + Date Picker + Form** (ระบบจอง)
- **Map** (ที่ตั้งร้าน) + **Footer**

### 🏢 Corporate Site (เช่น bangkokseafood.co.th)
- **Hero** แบบ professional + **Navigation Menu**
- **Features** (บริการ/สินค้า) + **Clients** (พาร์ตเนอร์)
- **Numbers** (สถิติบริษัท) + **CTA** + **Form** (ติดต่อ)

### 📊 Dashboard / ระบบ Monitoring (เช่น IT Operations Center)
- **Sidebar** + **Tabs** + **Table**
- **Card** (สถานะอุปกรณ์) + **Badge** (online/offline)
- **Alert + Notification + Toast** (แจ้งเตือน)
- **Spinner Loader** + **Empty State**

### 🎨 Portfolio
- **Hero** มี text animation + **Text Components**
- **Card** แบบ project showcase + **Scroll Area** effects
- **Link** มีเอฟเฟกต์ hover

---

## Workflow มาตรฐานเวลาดึง Component มาใช้

```bash
# 1. โปรเจกต์ต้องมีพื้นฐานครบ (ทำครั้งเดียวต่อโปรเจกต์)
npx create-next-app@latest project-name --typescript --tailwind --eslint
npx shadcn@latest init

# 2. dependencies ที่ component ส่วนใหญ่ใน 21st.dev ใช้
npm install framer-motion lucide-react
```

```
# 3. โครงสร้างวางไฟล์
components/
└── ui/
    └── <component-name>.tsx   ← วางโค้ดที่ copy มา
lib/
└── utils.ts                   ← ต้องมี cn() helper
```

**เช็กลิสต์ก่อนใช้ทุกครั้ง:**
- [ ] มี `"use client"` ไหม (จำเป็นถ้าใช้ framer-motion ใน App Router)
- [ ] import path เป็น `@/lib/utils` และ `@/components/ui/...` ตรงกับ alias ในโปรเจกต์
- [ ] dependencies ติดตั้งครบตามที่หน้า component ระบุ
- [ ] ปรับสี/ฟอนต์ให้เข้ากับ brand ลูกค้า (อย่าใช้ default ทุกตัว)
- [ ] ทดสอบ responsive บนมือถือ

---

## ประวัติการใช้งานในโปรเจกต์

| วันที่ | โปรเจกต์ | Component | ลิงก์ต้นทาง | หมายเหตุ |
|---|---|---|---|---|
| 2026-06 | (ตัวอย่าง) | shape-landing-hero | 21st.dev / Kokonut UI | Hero geometric, framer-motion |
| | | | | |
| | | | | |

> 💡 เพิ่มแถวทุกครั้งที่ดึง component ใหม่มาใช้ จะได้รู้ว่าโปรเจกต์ไหนใช้ตัวไหน เวลาแก้บั๊กหรืออัปเดตจะตามได้ง่าย
