/**
 * DATABASE PROYEK
 * Ubah data di sini, dan tampilan di Home akan otomatis berubah.
 */
const projectsData = [
    {
        id: "latest-work",
        featured: true, // Set true jika ingin ini muncul di Home sebagai "Latest Work"
        category: "Marketing", // Kategori: Marketing, Design, atau Photography
        title: "Tsukamie Noodle Bar",
        role: "Video Content & Editing", // Role (bisa ditampilkan jika mau)
        image: "assets/images/portfolio/tsukamie/tsukamie-1.webp", // Ganti dengan nama file gambar Anda di folder pictures/
        link: "project-detail?id=latest-work", // Link dinamis ke halaman detail
        stats: [
            "+148K New Audience",
            "+237K Impressions"
        ],
        // Data Tambahan untuk Halaman Detail
        description: "Tsukamie Noodle Bar adalah restoran mie Jepang otentik yang ingin meningkatkan brand awareness dan penjualan melalui media sosial. Proyek ini berfokus pada pembuatan konten visual yang menggugah selera dan strategi interaksi audiens.",
        challenge: "Tantangan utama adalah persaingan ketat di industri F&B Bandung dan algoritma media sosial yang terus berubah. Kami perlu menciptakan identitas visual yang unik agar menonjol.",
        solution: "Kami menerapkan strategi 'Visual Storytelling' dengan fotografi high-contrast dan video pendek (Reels/TikTok) yang menonjolkan tekstur makanan. Kami juga mengadakan kampanye giveaway untuk memicu viralitas.",
        gallery: [
            "assets/images/portfolio/tsukamie/tsukamie-1.webp",
            "assets/images/home/dimas-profile-2.webp" // Ganti dengan foto proyek lainnya
        ]
    },
    {
        id: "project-2",
        featured: false,
        category: "Design",
        title: "Neon Brand Identity",
        role: "Visual & Brand Design",
        image: "assets/images/home/dimas-profile-2.webp", // Pastikan file gambar ada
        link: "project-detail?id=project-2",
        stats: [],
        description: "Sebuah eksplorasi identitas visual untuk brand fashion futuristik.",
        challenge: "Menciptakan logo yang terlihat modern namun tetap terbaca di berbagai media.",
        solution: "Menggunakan tipografi kustom dengan efek neon glow yang konsisten.",
        gallery: []
    }
];
// ==================================================================================
// JANGAN UBAH BAGIAN DI BAWAH INI KECUALI ANDA TAHU APA YANG ANDA LAKUKAN
// ==================================================================================
// export default projectsData;