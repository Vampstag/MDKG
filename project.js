/**
 * DATABASE PROYEK
 * Ubah data di sini, dan tampilan di Home akan otomatis berubah.
 */
const projectsData = [
    {
        id: "latest-work",
        featured: true, // Set true jika ingin ini muncul di Home sebagai "Latest Work"
        category: "Visuals", // Kategori: Visuals, Design, atau Photography
        title: "Tsukamie Noodle Bar",
        role: "Video Content & Editing", // Role (bisa ditampilkan jika mau)
        image: "assets/images/portfolio/tsukamie/tsukamie-1.webp", // Ganti dengan nama file gambar Anda di folder pictures/
        link: "/project-detail?id=latest-work", // Link dinamis ke halaman detail
        stats: [
            "+148K New Audience",
            "+237K Impressions"
        ],
        // Data Tambahan untuk Halaman Detail
        description: "High-impact social video and design strategy driving +148K new audience reach.",
        challenge: "Fierce F&B competition and shifting algorithms demanded a unique, scroll-stopping visual identity.",
        solution: "Executed a 'Visual Storytelling' strategy using high-contrast photography and dynamic short-form videos to highlight textures, paired with viral campaigns.",
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
        link: "/project-detail?id=project-2",
        stats: [],
        description: "A futuristic brand identity exploration for a modern fashion label.",
        challenge: "Designing a sleek, recognizable logo that scales flawlessly across digital and physical mediums.",
        solution: "Developed a custom typographic system featuring a consistent, premium neon-glow aesthetic.",
        gallery: []
    }
];
// ==================================================================================
// JANGAN UBAH BAGIAN DI BAWAH INI KECUALI ANDA TAHU APA YANG ANDA LAKUKAN
// ==================================================================================
// export default projectsData;