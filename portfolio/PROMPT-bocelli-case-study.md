# Prompt: Isi Case Study Andrea Bocelli — Romanza World Tour Indonesia

Gunakan prompt di bawah ini (copy-paste utuh) untuk minta case study Bocelli diisi lengkap. File kerja: `portfolio/andrea-bocelli-romanza-indonesia.html` (draft sudah ada, tinggal isi placeholder `{{...}}`), mengikuti struktur `portfolio/_template-case-study.html`.

---

## PROMPT

Isi semua placeholder `{{...}}` di `portfolio/andrea-bocelli-romanza-indonesia.html` dengan konten case study lengkap untuk project Andrea Bocelli — Romanza 30th Anniversary World Tour, dua show di Indonesia (Borobudur dan Jakarta). Ikuti struktur section yang sudah ada di file itu (jangan tambah/hapus section kecuali diminta), gaya bahasa harus sama plain/matter-of-fact seperti case study lain di portfolio ini (Torch Prestachill, Torch x Gundam) — tidak pakai bahasa hype-reel/marketing berlebihan.

### Koreksi struktur Credits (PENTING — beda dari draft saat ini)

Draft sekarang punya comment yang melarang mengkredit Shoemaker Live dan menyebut Panen Maya Digital sebagai Client. **Itu salah, tolong perbaiki:**

- **Shoemaker Live adalah promotor/event organizer utama konser Bocelli di Indonesia** — ini klien project sebenarnya, harus dicantumkan di Credits sebagai "Client" atau "Promoter/Event Organizer".
- Hapus comment lama yang melarang mengkredit Shoemaker Live (baris ~675-680 di file saat ini).
- Panen Maya Digital dan Observisual tetap relevan, Panen Maya Digital sebagai AGENSI DIGITAL MARKETING yang menghubungkan ke Observisual, Observisual sebagai agency tempat Dimas bekerja YG EKSEKUSI ASET CREATIVE DAN VISUAL CAMPAIGN DAN COLLATERAL KONSER) — pertahankan strukturnya kalau memang masih akurat, tapi Shoemaker Live WAJIB masuk sebagai credit klien/promotor.
- Kalau saya (user) tidak kasih tahu detail hubungan kerja pastinya, susun draft credits paling masuk akal dengan asumsi: **Shoemaker Live (Client/Promoter)** → **Observisual (Agency/Production Partner)** → **M. Dimas K. G. (Photographer & Videographer, Video Editor, Motion Designer)**, dan tandai di komentar HTML bagian mana yang masih perlu saya konfirmasi/koreksi.

### Yang perlu diisi (ikuti placeholder yang sudah ada di file, section demi section)

1. **Meta tags** (title, description, OG/Twitter) — deskripsi singkat: dua show Romanza 30th Anniversary Indonesia (Borobudur + JIEXPO), scope Dimas sebagai Photographer & Videographer, Video Editor, Motion Designer.
2. **JSON-LD structured data** — `{{CLIENT_BRAND_NAME}}` dst mengacu ke Shoemaker Live (bukan Panen Maya Digital), `{{ACCENT_HEX}}` warna yang cocok dengan brand Romanza (draft sebelumnya sempat menyarankan warm gold).
3. **Hero** — judul, tagline, tahun.
4. **Overview** — dua paragraf: (1) apa project-nya secara umum, dua show, kenapa unik (Borobudur heritage site + Jakarta arena), (2) scope spesifik Dimas — Photographer & Videographer, Video Editor, Motion Designer, bukan overclaim ke tahap yang tidak dikerjakan.
5. **Campaign Essence quote** — satu kalimat gaya sama seperti case study lain
6. **The Challenge** — headline + body: KONSER INI SKALANYA BESAR SATU2 SATUNYA LOKASI WORLD TOUR BOCELLIDI ASIA TENGGARA, JADI HIGH RISK BANYAK STAKEHOLDER/SPONSOR DAN GUIDELINE NYA KETAT SEKALI, MULTILAYER REVISI, WAKTU MEPET BANGET, BUAT TIM KITA INI FIRST TIME
7. **The Approach** — GUA HARUS KERJA CEPAT TAPI PRESISI DAN COMPLY DGN GUIDE, VISUAL LANGUAGE/TONE NYA ELEGAN, LUXURY KARNA EMG MAHAL DAN BRANDING NYA PREMIUM. HARUS BISA MENGKOMUNIKASIKAN ASFEK NOSTALGIA, MALAM YG MEGAH YG AKAN DIRASAKAN AUDIENCE NANTI MAKANYA TAGLINE NYA THE NIGHT YOU'LL TELL FOR YEARS. GUA HANDLE KOLATERAL DARI PRESSCON SAMPE AFTER CONCERT, JUGA ASET VIDEO DNA MOTION UNTUK PROMOSI DIGITAL MARKETING DI SOSIAL MEDIA @SHOEMAKERLIVE, ASET OOH DI BERBAGAI LOKASI Total Terkonfirmasi (YES): 8 Layar (4 Unit di Puri Indah Mall 2 + 4 Titik di JIExpo Gedung Pusat Niaga) **Jangan** klaim kontak langsung dengan kru tur internasional.
8. **Selected Outputs** — 3 item bento grid (Hero film 16:9, 3 REELS) — caption, title, description; social link diisi kalau memang sudah publish, kalau belum tandai placeholder jelas.
9. **The Impact** — putuskan dulu apakah "impact" di sini artinya reach (views/engagement konten yang sudah publish) DAN scale (jumlah deliverable, turnaround time, ). BTW 2 KONSER INI TOTAL SEATNYA 7000
10. **Process & Craft** — 8 foto BTS (setup Borobudur, rig Jakarta, dll) dengan alt text deskriptif.
11. **Testimonial** — kutipan dari kontak di Shoemaker Live atau Observisual kalau ada; kalau belum ada testimonial nyata, **hapus section ini** (sesuai instruksi template: "only include once you actually have a quote").
12. **Key Insights** — 3 insight: (1)  (2)  (3) pelajaran kerja  tur skala internasional DAN MEWAH.
13. **Credits** — TEAM PANEN MAYA DIGITAL (SHOUT OUT TO THEM! ATAU UCAPAN THANK YOU) TEAM OBSERVISUAL:WIDI ADITYA CRETIVE DIRECTOR, DEVI PROJECT MANAGER, DIMAS, RAIHAN DAN TSAMARA GRAPHIC DESIGNER, RAIHANI COPYWRITER DAN SOCMED SPECIALIST
14. **Soft CTA** — headline & subline sesuai pola case study lain.
15. **Next Project** — link & judul project berikutnya (cek urutan portfolio yang ada, mis. link ke `torch-x-gundam` atau project lain yang logis).

### Aset yang dibutuhkan (isi filename asli, saya yang siapkan filenya)

- Hero image: `{{HERO_IMAGE_FILENAME}}` — folder `assets/images/project/andrea-bocelli-romanza-indonesia/`
- Showreel video + poster: `{{SHOWREEL_FILENAME}}`, `{{SHOWREEL_POSTER_FILENAME}}` — folder `assets/videos/project/andrea-bocelli-romanza-indonesia/`
- 2 video approach section: `{{APPROACH_1_VIDEO_FILENAME}}` (Borobudur), `{{APPROACH_2_VIDEO_FILENAME}}` (Jakarta)
- 3 video output bento: `{{OUTPUT_1/2/3_VIDEO_FILENAME}}`
- 3 foto BTS: `bts-1.webp`, `bts-2.webp`, `bts-3.webp`
- Testimonial avatar (kalau ada testimonial): `{{TESTIMONIAL_AVATAR_FILENAME}}`
- Logo Shoemaker Live untuk `cs-testimonial-brand-badge` (kalau testimonial dipakai)

### Yang TIDAK boleh dilakukan

- Jangan karang metrik/angka yang tidak ada datanya — tandai placeholder kalau saya belum kasih datanya.
- Jangan overclaim scope kerja Dimas di luar Photographer & Video Editor kecuali saya bilang lain.
- Jangan hapus struktur navigasi sticky-dot (`.cs-sticky-nav`) — sesuaikan section link-nya kalau ada section yang saya minta dihapus (mis. testimonial belum ada).

Kalau gue tarik semua info yang kita punya, **inti case study-nya harus begini**: bukan “gue ikut konser Andrea Bocelli sebagai dokumentasi”, tapi **gue menjadi bagian dari creative production team yang membangun visual communication campaign konser tersebut di berbagai touchpoint.**

Draft utamanya:

## Overview

Andrea Bocelli — Romanza 30th Anniversary World Tour Indonesia is an international concert experience celebrating 30 years of *Romanza*, brought to Indonesia through two landmark performances.

I was part of the creative production team responsible for producing visual assets to support the concert’s promotional campaign across digital, OOH, offline media, and press conference collateral, primarily for Shoemaker Live as the promoter’s main digital communication channel.

Rather than event documentation, my role focused on creating promotional and campaign-ready content — from photography and videography to editing, color, and motion design — translating the scale and prestige of the event into visual communication across multiple formats and platforms.

## My Role

Photography
Videography
Editing
Color Grading
Motion Design

## Creative Production

The production covered a range of assets designed for different stages and touchpoints of the campaign, including social media content, promotional videos, digital advertising, OOH and offline materials, as well as visual collateral for the official press conference.

Working across different formats meant maintaining a consistent visual language while adapting the same event identity for different audiences, platforms, and screen environments.

The work was developed around the positioning of Andrea Bocelli’s 30th anniversary *Romanza* celebration while connecting the international concert with its Indonesian setting, cultural identity, and large-scale live experience.

## Campaign Touchpoints

Digital Campaign
Social Media
OOH & Offline
Press Conference
Promotional Collateral

## Distribution

A significant portion of the creative output was developed for Shoemaker Live’s digital ecosystem, where the assets supported the promotion and communication of the concert across Instagram and other campaign touchpoints.

The production therefore extended beyond creating individual pieces of content — it was about building a flexible visual system that could work consistently across campaign formats, from short-form digital content to large-scale LED and offline applications.

Menurut gue, **ini sudah menangkap positioning lo dengan tepat**. Yang paling penting ada tiga kalimat:

> **“Rather than event documentation…”**

Itu secara halus langsung membedakan lo dari tim dokumentasi.

Lalu:

> **“producing visual assets to support the concert’s promotional campaign across digital, OOH, offline media, and press conference collateral”**

Ini menjelaskan **kenapa lo ada di project tersebut**.

Dan:

> **“from photography and videography to editing, color, and motion design”**

Ini memperlihatkan **range skill lo tanpa terdengar seperti sekadar daftar software/jobdesc**.

Kalau nanti kita bikin versi final portfolio, gue malah akan bikin **lebih editorial dan premium**, lebih pendek dari ini. Karena case study lo sebaiknya terasa seperti **creative production case study**, bukan laporan proyek.
