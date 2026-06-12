/**
 * DATABASE PROYEK
 * Ubah data di sini, dan tampilan di Home akan otomatis berubah.
 */
const projectsData = [
    {
        id: "torch-prestachill",
        featured: false,
        category: "Video Production · Video Editing",
        title: "Torch — Prestachill",
        role: "Videographer & Video Editor",
        image: "assets/images/project/torch-prestachill/torch-prestachill-model.webp", 
        link: "#",
        stats: [],
        description: "Organic short-form video for Torch's PrestaChill campaign. Built to feel real, not like an ad.",
        challenge: "",
        solution: "",
        gallery: [],
        ongoing: true
    },
    {
        id: "studio-berka",
        featured: false,
        category: "Web Design · UX Strategy",
        title: "Studio Berka",
        role: "Web Solutions & Support",
        image: "assets/images/project/berka/cover-web-berka.webp",
        link: "#",
        stats: [],
        description: "Web design and UX strategy for an architecture studio. Built to earn trust and make pricing feel transparent.",
        challenge: "",
        solution: "",
        gallery: [],
        ongoing: true
    },
    {
        id: "torch-x-gundam",
        featured: false,
        category: "Video Production · Video Editing",
        title: "Torch × Gundam",
        role: "Brand Film",
        image: "assets/images/project/torch/torch-model-backpack.webp",
        link: "/portfolio/torch-x-gundam",
        stats: [],
        description: "Cinematic video production and visual execution for Torch's biggest IP collaboration, collectively driving over 1.82M organic views.",
        challenge: "",
        solution: "",
        gallery: []
    },
    {
        id: "latest-work",
        featured: true, // Set true jika ingin ini muncul di Home sebagai "Latest Work"
        category: "Social Media · Digital Marketing",
        title: "Tsukamie Noodle Bar",
        role: "Monthly Retainer & Content Systems",
        image: "assets/images/project/tsukamie/tsukamie1.webp",
        link: "/project-detail?id=latest-work",
        stats: [
            "+10,896% Impressions",
            "162.3K Peak Views"
        ],
        description: "Social media content and digital marketing that grew an F&B brand's reach by +10,896%.",
        challenge: "Inconsistent engagement and declining content performance due to inactive posting and a lack of structured visual direction.",
        solution: "Built a modular visual content system focused on cinematic storytelling, relatability, and cohesive brand aesthetics.",
        gallery: [
            "assets/images/portfolio/tsukamie/tsukamie-1.webp",
            "assets/images/home/dimas-profile-2.webp"
        ]
    }
];
// ==================================================================================
// JANGAN UBAH BAGIAN DI BAWAH INI KECUALI ANDA TAHU APA YANG ANDA LAKUKAN
// ==================================================================================
// export default projectsData;