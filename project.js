/**
 * DATABASE PROYEK
 * Ubah data di sini, dan tampilan di Home akan otomatis berubah.
 */
const projectsData = [
    {
        id: "torch-prestachill",
        featured: false,
        category: "Video Production · Video Editing",
        title: "Torch Prestachill",
        role: "Videographer & Video Editor",
        image: "assets/images/project/torch-prestachill/torch-prestachill-model.webp",
        link: "#",
        stats: [],
        description: "Organic short-form video for Torch's PrestaChill campaign. A reminder to students to celebrate their small wins.",
        challenge: "",
        solution: "",
        gallery: [],
        ongoing: false,
        accentColor: "#007291" // Torch Fjord Blue
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
        gallery: [],
        accentColor: "#007291" // Torch Fjord Blue
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
        ],
        accentColor: "#c0392b" // Tsukamie brand red
    }
];
// ==================================================================================
// JANGAN UBAH BAGIAN DI BAWAH INI KECUALI ANDA TAHU APA YANG ANDA LAKUKAN
// ==================================================================================
// export default projectsData;