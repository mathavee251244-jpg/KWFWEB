# 🗂️ คลังเว็บ UI Components ทั้งหมด — สำหรับงานเว็บไซต์ลูกค้า

> เอกสารอ้างอิงประจำ: รวมเว็บ component library / marketplace ทุกแนวที่ใช้ประกอบเว็บไซต์ได้
> Stack หลัก: **Next.js / React + Tailwind CSS + TypeScript** (เข้ากับ shadcn ทั้งหมด)
> อัปเดตล่าสุด: มิถุนายน 2026

---

## ⚡ Quick Pick — เลือกเร็วตามสถานการณ์

| ต้องการ | ไปที่ |
|---|---|
| ฐาน component มาตรฐาน เริ่มทุกโปรเจกต์ | **shadcn/ui** |
| Landing page อลังการ มี animation จัดเต็ม | **Aceternity UI** / **Magic UI** |
| หา component หลากหลายจาก community | **21st.dev** |
| Text/scroll animation เท่ๆ | **React Bits** |
| Dashboard / ระบบจัดการ | **shadcn/ui + Tremor** |
| เว็บเล็ก ทำเร็ว ไม่อยากเขียน JS เยอะ | **daisyUI** / **Flowbite** |
| เอฟเฟกต์พื้นหลัง / shader / 3D | **Aceternity UI** / **21st.dev (Shaders)** |

---

## 1️⃣ กลุ่ม Copy-Paste (แนว shadcn) — แนะนำสุดสำหรับงานคุณ

ปรัชญา: ไม่ติดตั้งเป็น npm package แต่ copy โค้ดเข้าโปรเจกต์ → เป็นเจ้าของโค้ด 100% แก้ได้ทุกบรรทัด

| เว็บ | URL | จุดเด่น | ราคา |
|---|---|---|---|
| **shadcn/ui** | https://ui.shadcn.com | มาตรฐานวงการ ฐานของทุกอย่าง Radix + Tailwind, ติดตั้งผ่าน CLI | ฟรี |
| **21st.dev** | https://21st.dev/community/components | Marketplace ของ community หลายพันตัว ทุกหมวด | ฟรี/Pro |
| **Aceternity UI** | https://ui.aceternity.com | 200+ ตัว animation พรีเมียม — 3D card, beams, aurora bg, globe | ฟรี/Pro |
| **Magic UI** | https://magicui.design | 50+ animated components ต่อยอด shadcn — marquee, shimmer, dock | ฟรี |
| **React Bits** | https://reactbits.dev | 110+ ตัว เน้น text animation, scroll effects, backgrounds | ฟรี |
| **Skiper UI** | https://skiper-ui.com | Expansion pack ของ shadcn เน้น scroll/motion สำหรับ Next.js | ฟรี/Pro |
| **Origin UI** | https://originui.com | 400+ components สไตล์สะอาด สร้างบน shadcn | ฟรี |
| **Cult UI** | https://cult-ui.com | Components แนว design-forward สำหรับ Next.js | ฟรี/Pro |
| **Kokonut UI** | https://kokonutui.com | Components สวยๆ (ที่มาของ shape-landing-hero ที่เคยใช้) | ฟรี |
| **Eldora UI** | https://eldoraui.site | Animated components แนวเดียวกับ Magic UI | ฟรี |
| **Motion Primitives** | https://motion-primitives.com | Animation primitives คุณภาพสูง ใช้ motion (framer-motion) | ฟรี |
| **Tailark** | https://tailark.com | Marketing blocks สำเร็จรูปสำหรับ landing page | ฟรี |

---

## 2️⃣ กลุ่ม Component Library แบบติดตั้ง (npm install)

เหมาะเมื่อต้องการระบบครบชุด มี doc ดี ดูแลระยะยาว

| เว็บ | URL | จุดเด่น | ราคา |
|---|---|---|---|
| **Mantine** | https://mantine.dev | 120+ components + 70+ hooks, DX ดีมาก | ฟรี |
| **MUI (Material UI)** | https://mui.com | ใหญ่สุดในวงการ Material Design เหมาะ enterprise/dashboard | ฟรี/Pro |
| **Ant Design** | https://ant.design | สาย enterprise / ระบบ admin ข้อมูลเยอะ | ฟรี |
| **Chakra UI** | https://chakra-ui.com | เขียนง่าย accessible เหมาะ MVP | ฟรี |
| **HeroUI** (เดิม NextUI) | https://heroui.com | สวยทันสมัย ทำมาเพื่อ Next.js | ฟรี |
| **Radix UI** | https://radix-ui.com | Headless primitives (ฐานของ shadcn) | ฟรี |
| **Headless UI** | https://headlessui.com | Headless จากทีม Tailwind ใช้กับ React/Vue | ฟรี |
| **React Aria** | https://react-spectrum.adobe.com/react-aria | Headless จาก Adobe เน้น accessibility สูงสุด | ฟรี |
| **Base UI** | https://base-ui.com | Headless primitives รุ่นใหม่ (ทางเลือกแทน Radix) | ฟรี |

---

## 3️⃣ กลุ่ม Tailwind CSS ล้วน (ไม่ผูก React — ใช้กับ HTML ธรรมดาได้)

เหมาะกับงานเว็บเล็ก/เร็ว หรือโปรเจกต์ที่ไม่ใช้ React

| เว็บ | URL | จุดเด่น | ราคา |
|---|---|---|---|
| **daisyUI** | https://daisyui.com | Plugin Tailwind, 35 themes, ไม่มี JS — นิยมสุด (19M+ installs) | ฟรี |
| **Flowbite** | https://flowbite.com | รองรับ React/Vue/Svelte/vanilla ครอบคลุมสุด | ฟรี/Pro |
| **Tailwind Plus** (เดิม Tailwind UI) | https://tailwindcss.com/plus | ของทีม Tailwind เอง คุณภาพสูงสุด | จ่ายครั้งเดียว |
| **Preline UI** | https://preline.co | 800+ components ฟรี ครบเครื่อง | ฟรี/Pro |
| **HyperUI** | https://hyperui.dev | Copy-paste HTML+Tailwind ฟรีล้วน | ฟรี |
| **TailGrids** | https://tailgrids.com | 600+ components + templates | ฟรี/Pro |
| **Material Tailwind** | https://material-tailwind.com | Material Design + Tailwind | ฟรี/Pro |
| **Float UI** | https://floatui.com | Marketing sections สวยๆ ฟรี | ฟรี |
| **Tailblocks** | https://tailblocks.cc | Blocks สำเร็จรูป copy ได้เลย | ฟรี |
| **Meraki UI** | https://merakiui.com | Components รองรับ RTL | ฟรี |

---

## 4️⃣ กลุ่มเฉพาะทาง

### 📊 Dashboard / Charts / Data
| เว็บ | URL | จุดเด่น |
|---|---|---|
| **Tremor** | https://tremor.so | Components สำหรับ dashboard + chart โดยเฉพาะ (เหมาะกับงาน IT Ops) |
| **Recharts** | https://recharts.org | Chart library มาตรฐาน React |
| **shadcn/ui Charts** | https://ui.shadcn.com/charts | Charts สำเร็จรูปบน Recharts |

### ✨ Animation / Effects
| เว็บ | URL | จุดเด่น |
|---|---|---|
| **Motion** (framer-motion) | https://motion.dev | Animation engine หลักที่ทุกเว็บข้างบนใช้ |
| **GSAP** | https://gsap.com | Animation ระดับโปร scroll-trigger ขั้นสูง |
| **Uiverse** | https://uiverse.io | Community แชร์ปุ่ม/การ์ด/loader (CSS+HTML) หลายพันตัว |
| **Animata** | https://animata.design | Animated components รวมจากทั่ว internet |
| **Lottie / LottieFiles** | https://lottiefiles.com | Animation ไฟล์ JSON เบาๆ |

### 🧊 3D / WebGL (เข้ากับงาน Three.js ของคุณ)
| เว็บ | URL | จุดเด่น |
|---|---|---|
| **React Three Fiber** | https://r3f.docs.pmnd.rs | Three.js แบบ React |
| **Drei** | https://drei.docs.pmnd.rs | Helper สำเร็จรูปของ R3F |
| **Spline** | https://spline.design | ออกแบบ 3D แล้ว embed ลงเว็บ |

### 🧩 Blocks / Templates เต็มหน้า
| เว็บ | URL | จุดเด่น |
|---|---|---|
| **shadcn/ui Blocks** | https://ui.shadcn.com/blocks | Blocks ทางการของ shadcn (sidebar, login, dashboard) |
| **Shadcnblocks** | https://shadcnblocks.com | 600+ blocks สำหรับ shadcn |
| **Untitled UI React** | https://untitledui.com | Collection ใหญ่ Tailwind v4 + React Aria |
| **Page UI** | https://pageui.dev | Landing page components |

### 🎨 Inspiration / ของตกแต่ง
| เว็บ | URL | จุดเด่น |
|---|---|---|
| **Godly** | https://godly.website | รวมเว็บสวยระดับโลกไว้ดูเป็นไอเดีย |
| **Awwwards** | https://awwwards.com | เว็บรางวัล ดูเทรนด์ดีไซน์ |
| **Mobbin** | https://mobbin.com | Screenshot UI จากแอปจริง |
| **SVGL** | https://svgl.app | โลโก้ SVG แบรนด์ดังๆ |
| **Lucide** | https://lucide.dev | ไอคอนหลักของ ecosystem shadcn |
| **Heroicons** | https://heroicons.com | ไอคอนจากทีม Tailwind |

---

## 🧭 เลือกใช้ตามประเภทงานลูกค้า

### 🍽️ ร้านอาหาร / คาเฟ่ / โรงแรม (แบบ Ruean Chainam)
```
ฐาน:      shadcn/ui
Hero/FX:  Aceternity UI (aurora, beams) + 21st.dev (Shaders)
Gallery:  Magic UI (marquee) + React Bits (image effects)
3D น้ำ:   React Three Fiber + Drei
จอง:      shadcn/ui (Calendar, Date Picker, Form)
```

### 🏢 Corporate Site (แบบ bangkokseafood.co.th)
```
ฐาน:      shadcn/ui หรือ Preline
Blocks:   Tailark / shadcnblocks (hero, features, contact)
ตกแต่ง:   Origin UI + Lucide icons
```

### 📊 Dashboard / Monitoring (แบบ IT Operations Center)
```
ฐาน:      shadcn/ui (Sidebar, Table, Tabs)
Charts:   Tremor หรือ shadcn Charts
สถานะ:    Badge, Alert, Toast จาก shadcn
```

### 🎨 Portfolio
```
ฐาน:      shadcn/ui
Wow:      React Bits (text animation) + Aceternity (hover effects)
แรงบันดาลใจ: Godly / Awwwards
```

---

## 🔧 Setup มาตรฐาน (ใช้ได้กับเว็บ copy-paste เกือบทุกตัว)

```bash
# โปรเจกต์ใหม่
npx create-next-app@latest project --typescript --tailwind --eslint
npx shadcn@latest init

# dependencies ยอดฮิต
npm install framer-motion lucide-react clsx tailwind-merge

# บางตัวต้องเพิ่ม (3D globe, vortex ฯลฯ)
npm install three @types/three
```

**เช็กลิสต์ทุกครั้งที่ copy component:**
- [ ] มี `"use client"` ถ้าใช้ framer-motion (App Router)
- [ ] import path ตรง: `@/lib/utils`, `@/components/ui/...`
- [ ] ติดตั้ง dependencies ครบตามหน้า component
- [ ] ปรับสี/ฟอนต์เข้า brand ลูกค้า (อย่าปล่อย default)
- [ ] เทสมือถือ + เช็ก performance (animation หนักๆ ระวังบนมือถือ)

---

## 📝 ประวัติการใช้งานในโปรเจกต์

| วันที่ | โปรเจกต์ | เว็บต้นทาง | Component | หมายเหตุ |
|---|---|---|---|---|
| 2026-06 | (ตัวอย่าง) | Kokonut UI / 21st.dev | shape-landing-hero | Hero geometric |
| | | | | |
| | | | | |

> 💡 บันทึกทุกครั้งที่ใช้ component ใหม่ → ตามแก้/อัปเดตทีหลังง่าย
