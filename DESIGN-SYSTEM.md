# Design System — acuan sebelum ubah section manapun

Aturan ini disusun dari yang SUDAH ada & konsisten di style.css. Tujuannya: setiap
keputusan visual baru dicek ke sini dulu, bukan dirasa-rasa ulang tiap section.

## 1. Spacing — selalu pakai scale, jangan angka bebas
```
--space-1: 4px   --space-8: 32px
--space-2: 8px   --space-12: 48px
--space-3: 12px  --space-16: 64px
--space-4: 16px  --space-20: 80px
--space-6: 24px  --space-32: 128px
```
Kalau butuh angka di luar ini (misal 100px, 120px yang saya pakai beberapa kali sesi
ini) — itu tanda perlu mikir ulang, bukan nambah nilai baru. Section-to-section
default: `--space-32` (128px, sudah dipakai `.section-margin`). Jangan tambah
padding-top/bottom manual di atas itu kecuali section itu sungguh butuh napas ekstra
— dan kalau iya, pakai `--space-20` sebagai tambahan, bukan angka custom.

## 2. Easing — satu kurva untuk semua transisi non-linear
```
--ease-smooth: cubic-bezier(0.19, 1, 0.22, 1)
```
Semua `transition`/`animation` yang bukan tracking real-time (progress bar, timeline)
pakai `var(--ease-smooth)`. Durasi standar: **0.3s** untuk hover/micro-interaction,
**0.5s** untuk reveal/masuk-keluar elemen besar. Jangan pakai `linear` kecuali
benar-benar melacak nilai real-time (scroll position, audio playback).

## 3. Radius — dua pilihan saja
- **14-16px** — card, image, video player (squircle utama situs)
- **999px / pill** — HANYA untuk badge/tag kecil sekali (bukan tombol besar, bukan
  label hover). Kalau ragu, pakai squircle.

## 4. Shadow — satu resep, dua state
```css
/* rest */
box-shadow: 0 30px 60px -20px rgba(0,0,0,0.25), 0 10px 24px -12px rgba(0,0,0,0.15);
/* hover */
box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3), 0 14px 28px -12px rgba(0,0,0,0.2);
```
Dipakai di `.about-intro-player` — jadikan ini resep default untuk semua elevated
card, jangan racik shadow baru per elemen.

## 5. Line-height — dua nilai untuk teks, titik
- **Heading/lead text: 1.2** (`.about-lead-text` — ini baseline situs)
- **Body paragraph: 1.5–1.6** (`.about-paragraph`, `.services-acc-row__desc`)
Kalau nemu heading dengan line-height 1.3+ atau body di bawah 1.4 — itu penyimpangan,
bukan variasi yang disengaja.

## 6. Interaksi hover — maksimal SATU efek fisik per elemen
Bukan "boleh cuma 1 efek di seluruh section" — tapi 1 elemen (1 card, 1 button, 1
label) jangan ditumpuk lebih dari satu jenis physicality sekaligus. Pilih salah satu:
- **Magnetic pull** (elemen bergeser ke arah cursor) — untuk tombol kecil
- **3D tilt** (rotateX/Y berdasar posisi cursor) — untuk card besar (video, image)
- **Cursor-follow label** (teks/elemen kecil mengejar posisi cursor) — untuk CTA di
  dalam card besar
Jangan gabung ketiganya di satu kartu (ini yang terjadi di showreel sesi ini — 3D
tilt + cursor-follow label + physics tilt/scale di label itu sendiri, sekaligus).
Kalau kartu punya CTA di dalamnya, kartu boleh tilt DAN label boleh follow — tapi
label TIDAK perlu physics tilt/scale sendiri di atas itu. Itu satu lapis fisika
kebanyakan.

## 7. Warna teks — tiga tingkat, bukan skala abu bebas
- `#111` — teks utama/heading
- `#555` — body paragraph sekunder
- `#999` — meta/label/caption kecil
Jangan pakai `rgba(17,17,17,0.3)` atau opacity custom lain kecuali untuk state
transisi (misal closed-accordion dari 1.0 ke full — itu boleh, tapi restingnya tetap
salah satu dari 3 nilai di atas, bukan angka opacity baru).

## 8. Cache-busting — naikkan versi SETIAP edit script.js
`script.js?v=N` — lupa naikkan ini = perubahan tidak ke-load browser, seperti yang
terjadi beberapa kali sesi ini. Checklist tiap edit script.js: naikkan v, sebutkan ke
user kalau perlu hard refresh.

---

**Cara pakai**: sebelum menjawab "gap-nya berapa / shadow-nya gimana / animasinya
seberapa", cek dulu ke 8 poin ini. Kalau permintaan user mau sesuatu di luar sistem
ini (misal shadow baru, radius baru), tanya dulu apakah itu pengecualian yang
disengaja atau cuma belum kepikiran pakai yang sudah ada.
