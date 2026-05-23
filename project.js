/**
 * DATABASE PROYEK
 * Ubah data di sini, dan tampilan di Home akan otomatis berubah.
 */
const projectsData = [
    {
        id: "latest-work",
        featured: true, // Set true jika ingin ini muncul di Home sebagai "Latest Work"
        category: "Content Strategy & Execution", // Kategori: Visuals, Design, atau Photography
        title: "Tsukamie Noodle Bar",
        role: "Visual Execution & Analytics", // Role (bisa ditampilkan jika mau)
        image: "assets/images/project/tsukamie/tsukamie1.webp", // Ganti dengan nama file gambar Anda di folder pictures/
        link: "/project-detail?id=latest-work", // Link dinamis ke halaman detail
        stats: [
            "+10,896% Impressions",
            "162.3K Peak Views"
        ],
        // Data Tambahan untuk Halaman Detail
        description: "Content strategy, visual design, and social media execution that drove +10,896% impressions growth for an F&B lifestyle brand.",
        challenge: "Inconsistent engagement and declining content performance due to inactive posting and lack of structured content direction.",
        solution: "Built a modular content system focused on culture, relatability, and educational storytelling alongside influencer collaborations.",
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