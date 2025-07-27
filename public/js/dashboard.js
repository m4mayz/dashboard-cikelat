// Global variables
let currentSection = "dashboard";

// Initialize dashboard
document.addEventListener("DOMContentLoaded", function () {
    checkSession();
    updateCurrentTime();
    loadDashboardStats();

    // Update time every minute
    setInterval(updateCurrentTime, 60000);

    // Check session every 30 seconds
    setInterval(checkSession, 30000);
});

// Session management
async function checkSession() {
    try {
        const response = await fetch("/api/check-session");
        const result = await response.json();

        if (!result.authenticated) {
            if (result.expired) {
                alert("Sesi Anda telah berakhir. Silakan login kembali.");
            }
            window.location.href = "/login.html";
        } else {
            // Show session timer when less than 5 minutes remaining
            const timeRemaining = result.timeRemaining;
            if (timeRemaining < 5 * 60 * 1000) {
                // 5 minutes
                showSessionTimer(timeRemaining);
            }
        }
    } catch (error) {
        console.error("Error checking session:", error);
    }
}

function showSessionTimer(timeRemaining) {
    const timer = document.getElementById("sessionTimer");
    const timeDisplay = document.getElementById("timeRemaining");

    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    timeDisplay.textContent = `Sesi berakhir dalam ${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    timer.classList.remove("hidden");
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    document.getElementById("currentTime").textContent = timeString;
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll(".section").forEach((section) => {
        section.classList.add("hidden");
        section.classList.remove("active");
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName + "-section");
    if (targetSection) {
        targetSection.classList.remove("hidden");
        targetSection.classList.add("active");
    }

    // Update navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.remove("active", "bg-primary", "text-white");
        item.classList.add("text-gray-700");
    });

    event.target.classList.add("active", "bg-primary", "text-white");
    event.target.classList.remove("text-gray-700");

    // Update page title
    const titles = {
        dashboard: "Dashboard Utama",
        home: "Data Home",
        profil: "Profil Desa",
        infografis: "Infografis",
        berita: "Kelola Berita",
        pengumuman: "Kelola Pengumuman",
        belanja: "Kelola Belanja",
        import: "Impor Data Penduduk",
    };

    document.getElementById("pageTitle").textContent =
        titles[sectionName] || "Dashboard";
    currentSection = sectionName;

    // Load section content
    loadSectionContent(sectionName);
}

function switchProfileTab(tabName) {
    // Sembunyikan semua konten tab
    document.querySelectorAll(".profile-tab-content").forEach((pane) => {
        pane.classList.add("hidden");
    });

    // Non-aktifkan semua tombol tab
    document.querySelectorAll(".profile-tab-button").forEach((button) => {
        button.classList.remove("bg-primary", "text-white", "shadow-md");
        button.classList.add("bg-gray-200", "text-gray-600");
    });

    // Tampilkan konten tab yang dipilih
    const selectedPane = document.getElementById(tabName + "-pane");
    if (selectedPane) {
        selectedPane.classList.remove("hidden");
    }

    // Aktifkan tombol tab yang dipilih
    const selectedButton = document.querySelector(
        `[onclick="switchProfileTab('${tabName}')"]`
    );
    if (selectedButton) {
        selectedButton.classList.add("bg-primary", "text-white", "shadow-md");
        selectedButton.classList.remove("bg-gray-200", "text-gray-600");
    }
}

function switchInfografisTab(tabName) {
    // Sembunyikan semua konten tab
    document.querySelectorAll(".infografis-tab-content").forEach((pane) => {
        pane.classList.add("hidden");
    });

    // Non-aktifkan semua tombol tab
    document.querySelectorAll(".infografis-tab-button").forEach((button) => {
        button.classList.remove("bg-primary", "text-white", "shadow-md");
        button.classList.add("bg-gray-200", "text-gray-600");
    });

    // Tampilkan konten tab yang dipilih
    const selectedPane = document.getElementById(tabName + "-pane");
    if (selectedPane) {
        selectedPane.classList.remove("hidden");
    }

    // Aktifkan tombol tab yang dipilih
    const selectedButton = document.querySelector(
        `[onclick="switchInfografisTab('${tabName}')"]`
    );
    if (selectedButton) {
        selectedButton.classList.add("bg-primary", "text-white", "shadow-md");
        selectedButton.classList.remove("bg-gray-200", "text-gray-600");
    }
}

// Load section content
async function loadSectionContent(sectionName) {
    const sectionElement = document.getElementById(sectionName + "-section");

    try {
        showLoading();

        switch (sectionName) {
            case "home":
                await loadHomeSection(sectionElement);
                break;
            case "profil":
                await loadProfilSection(sectionElement);
                break;
            case "infografis":
                await loadInfografisSection(sectionElement);
                break;
            case "berita":
                await loadBeritaSection(sectionElement);
                break;
            case "pengumuman":
                await loadPengumumanSection(sectionElement);
                break;
            case "belanja":
                await loadBelanjaSection(sectionElement);
                break;
            case "import":
                await loadImportSection(sectionElement);
                break;
            case "dashboard":
                await loadDashboardStats();
                break;
        }
    } catch (error) {
        console.error("Error loading section:", error);
        sectionElement.innerHTML =
            '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Terjadi kesalahan saat memuat data.</div>';
    } finally {
        hideLoading();
    }
}

// Dashboard statistics
async function loadDashboardStats() {
    try {
        // 1. Ambil semua data yang diperlukan secara paralel
        const [
            homeResponse,
            beritaResponse,
            pengumumanResponse,
            belanjaResponse,
        ] = await Promise.all([
            fetch("/api/home"),
            fetch("/api/berita"),
            fetch("/api/pengumuman"),
            fetch("/api/belanja"),
        ]);

        const homeData = await homeResponse.json();
        const berita = await beritaResponse.json();
        const pengumuman = await pengumumanResponse.json();
        const belanja = await belanjaResponse.json();

        // 2. Siapkan variabel data untuk ditampilkan
        const stats = {
            total_berita: berita.length || 0,
            total_pengumuman: pengumuman.length || 0,
            total_produk: belanja.length || 0,
            total_penduduk: homeData.total_penduduk || 0,
            laki_laki: homeData.laki_laki || 0,
            perempuan: homeData.perempuan || 0,
        };

        const totalGender = stats.laki_laki + stats.perempuan;
        const lakiPercent =
            totalGender > 0
                ? ((stats.laki_laki / totalGender) * 100).toFixed(1)
                : 0;
        const perempuanPercent =
            totalGender > 0
                ? ((stats.perempuan / totalGender) * 100).toFixed(1)
                : 0;

        // 3. Bangun seluruh HTML untuk section dashboard
        const dashboardSection = document.getElementById("dashboard-section");
        if (dashboardSection) {
            dashboardSection.innerHTML = `
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-gray-800">Selamat Datang, Admin!</h2>
                    <p class="text-gray-600">Berikut adalah ringkasan sistem informasi desa Anda saat ini.</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Berita</p>
                            <p id="totalBerita" class="text-3xl font-bold text-gray-800">${stats.total_berita}</p>
                        </div>
                        <div class="text-4xl opacity-70">📰</div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Pengumuman</p>
                            <p id="totalPengumuman" class="text-3xl font-bold text-gray-800">${stats.total_pengumuman}</p>
                        </div>
                        <div class="text-4xl opacity-70">📢</div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Produk Desa</p>
                            <p id="totalProduk" class="text-3xl font-bold text-gray-800">${stats.total_produk}</p>
                        </div>
                         <div class="text-4xl opacity-70">🛒</div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Penduduk</p>
                            <p id="totalPenduduk" class="text-3xl font-bold text-gray-800">${stats.total_penduduk}</p>
                        </div>
                         <div class="text-4xl opacity-70">👥</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-1 space-y-8">
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h4 class="text-lg font-semibold text-gray-800 mb-4">Grafik Populasi</h4>
                            <div class="space-y-4">
                                <div>
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="font-medium text-blue-600">Laki-laki</span>
                                        <span>${stats.laki_laki} <span class="text-gray-500">(${lakiPercent}%)</span></span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-4">
                                        <div class="bg-blue-500 h-4 rounded-full" style="width: ${lakiPercent}%"></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="font-medium text-pink-600">Perempuan</span>
                                        <span>${stats.perempuan} <span class="text-gray-500">(${perempuanPercent}%)</span></span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-4">
                                        <div class="bg-pink-500 h-4 rounded-full" style="width: ${perempuanPercent}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h4 class="text-lg font-semibold text-gray-800 mb-4">Aksi Cepat</h4>
                            <div class="space-y-3">
                                <button onclick="showSection('berita')" class="w-full text-left bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold py-3 px-4 rounded-lg transition-colors">Tambah Berita Baru</button>
                                <button onclick="showSection('pengumuman')" class="w-full text-left bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold py-3 px-4 rounded-lg transition-colors">Tambah Pengumuman</button>
                                <button onclick="showSection('belanja')" class="w-full text-left bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold py-3 px-4 rounded-lg transition-colors">Tambah Produk Desa</button>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                         <h4 class="text-lg font-semibold text-gray-800 mb-2">Aktivitas Terbaru</h4>
                         <div id="recentActivity">
                            </div>
                    </div>
                </div>
            `;
        }

        // 4. Panggil fungsi untuk memuat konten dinamis di dalam dashboard
        loadRecentActivity();
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
        const dashboardSection = document.getElementById("dashboard-section");
        if (dashboardSection) {
            dashboardSection.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Gagal memuat data dashboard.</div>`;
        }
    }
}

async function loadRecentActivity() {
    try {
        const response = await fetch("/api/aktivitas");
        const activities = await response.json();
        const activityContainer = document.getElementById("recentActivity");

        if (!activityContainer) return;

        if (activities.length === 0) {
            activityContainer.innerHTML = `<div class="text-center py-4 text-sm text-gray-500">Belum ada aktivitas terbaru.</div>`;
            return;
        }

        // Helper untuk memformat waktu relatif
        const timeAgo = (date) => {
            const seconds = Math.floor((new Date() - new Date(date)) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " tahun lalu";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " bulan lalu";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + " hari lalu";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + " jam lalu";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + " menit lalu";
            return "Baru saja";
        };

        // Ikon untuk setiap tipe aktivitas
        const icons = {
            Berita: "📰",
            Pengumuman: "📢",
            "Produk Belanja": "🛒",
            "Struktur Organisasi": "👥",
            "Profil Desa": "🏛️",
            "Data Penduduk": "📊",
            default: "⚙️",
        };

        const activityHtml = activities
            .slice(0, 6) // Batasi 6 aktivitas terbaru
            .map((activity) => {
                const icon = icons[activity.type] || icons["default"];
                const detailText = activity.detail
                    ? `<span class="text-gray-800 font-semibold">${activity.detail}</span>`
                    : "";

                return `
                <div class="flex items-start py-3 border-b border-gray-100 last:border-b-0">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg mr-4">${icon}</div>
                    <div class="flex-grow">
                        <p class="text-sm text-gray-600">
                            <strong>${
                                activity.type
                            }</strong> ${detailText} telah ${activity.action}.
                        </p>
                        <p class="text-xs text-gray-400 mt-1">${timeAgo(
                            activity.timestamp
                        )}</p>
                    </div>
                </div>
            `;
            })
            .join("");

        activityContainer.innerHTML = activityHtml;
    } catch (error) {
        console.error("Error loading recent activity:", error);
        document.getElementById(
            "recentActivity"
        ).innerHTML = `<div class="text-center py-4 text-sm text-red-500">Gagal memuat aktivitas.</div>`;
    }
}

// Home section
async function loadHomeSection(element) {
    const response = await fetch("/api/home");
    const data = await response.json();
    window.homeData = data; // Menyimpan data untuk digunakan oleh fungsi 'editHome()'

    element.innerHTML = `
        <div class="space-y-8">
            <div class="flex justify-between items-center pb-4 border-b border-gray-200">
                 <h3 class="text-xl font-bold text-gray-800">Informasi Halaman Utama</h3>
                 <button onclick="editHome()" class="bg-primary text-white px-5 py-2 rounded-lg hover:bg-teal-700 font-semibold shadow-md transition-transform transform hover:scale-105">
                    Edit Data
                 </button>
            </div>

            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 bg-gray-50/50">
                    <div class="flex-shrink-0">
                        <img class="h-36 w-36 rounded-full object-cover shadow-xl border-4 border-white" src="${
                            data.foto || "https://via.placeholder.com/150"
                        }" alt="Foto Kepala Desa">
                    </div>
                    <div class="text-center sm:text-left">
                        <p class="text-sm font-medium text-primary mb-1">Sambutan dari</p>
                        <h4 class="text-2xl font-bold text-gray-800">${
                            data.nama_kepala_desa || "Nama Belum Diisi"
                        }</h4>
                        <p class="text-md font-medium text-gray-500 mb-4">Kepala Desa</p>
                        <blockquote class="text-gray-600 italic border-l-4 border-primary/50 pl-4 py-2">
                            <p>"${
                                data.sambutan ||
                                "Sambutan dari kepala desa belum diisi. Silakan edit data untuk menambahkannya."
                            }"</p>
                        </blockquote>
                    </div>
                </div>
            </div>

            <div>
                <h4 class="text-lg font-semibold text-gray-700 mb-4">Ringkasan Statistik Kependudukan</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-4 flex flex-col items-center justify-center text-center transform hover:-translate-y-1 transition-transform">
                        <span class="text-4xl">👥</span>
                        <p class="text-3xl font-bold mt-2">${
                            data.total_penduduk || 0
                        }</p>
                        <p class="text-sm font-medium opacity-90">Total Penduduk</p>
                    </div>
                     <div class="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl shadow-lg p-4 flex flex-col items-center justify-center text-center transform hover:-translate-y-1 transition-transform">
                        <span class="text-4xl">📇</span>
                        <p class="text-3xl font-bold mt-2">${
                            data.total_kk || 0
                        }</p>
                        <p class="text-sm font-medium opacity-90">Total KK</p>
                    </div>
                     <div class="bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl shadow-lg p-4 flex flex-col items-center justify-center text-center transform hover:-translate-y-1 transition-transform">
                        <span class="text-4xl">👨</span>
                        <p class="text-3xl font-bold mt-2">${
                            data.laki_laki || 0
                        }</p>
                        <p class="text-sm font-medium opacity-90">Laki-laki</p>
                    </div>
                     <div class="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl shadow-lg p-4 flex flex-col items-center justify-center text-center transform hover:-translate-y-1 transition-transform">
                        <span class="text-4xl">👩</span>
                        <p class="text-3xl font-bold mt-2">${
                            data.perempuan || 0
                        }</p>
                        <p class="text-sm font-medium opacity-90">Perempuan</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function editHome() {
    // Create and show edit popup
    showFullscreenPopup("Edit Data Home", createHomeEditForm());
    // Populate form with existing data
    populateHomeForm();
}

function createHomeEditForm() {
    return `
        <form id="homeEditForm" enctype="multipart/form-data">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nama Kepala Desa</label>
                    <input type="text" name="nama_kepala_desa" id="home_nama_kepala_desa" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Total Penduduk</label>
                    <input type="number" name="total_penduduk" id="home_total_penduduk" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Total KK</label>
                    <input type="number" name="total_kk" id="home_total_kk" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Laki-laki</label>
                    <input type="number" name="laki_laki" id="home_laki_laki" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Perempuan</label>
                    <input type="number" name="perempuan" id="home_perempuan" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Foto Kepala Desa</label>
                    <div class="flex items-center gap-3 mb-2">
                        <div id="current_foto_preview" class="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            <img id="current_foto_img" src="" class="w-full h-full object-cover hidden" alt="Preview">
                            <span id="no_foto_text" class="text-xs text-gray-500">Tidak ada foto</span>
                        </div>
                        <div class="text-sm text-gray-500">Foto saat ini</div>
                    </div>
                    <input type="file" name="foto" id="home_foto" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                    <p class="text-xs text-gray-500 mt-1">Biarkan kosong jika tidak ingin mengubah foto</p>
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Sambutan</label>
                    <textarea name="sambutan" id="home_sambutan" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                </div>
            </div>
        </form>
    `;
}

// Populate home form with existing data
function populateHomeForm() {
    if (!window.homeData) return;

    const data = window.homeData;

    // Set values in form
    document.getElementById("home_nama_kepala_desa").value =
        data.nama_kepala_desa || "";
    document.getElementById("home_total_penduduk").value =
        data.total_penduduk || "";
    document.getElementById("home_total_kk").value = data.total_kk || "";
    document.getElementById("home_laki_laki").value = data.laki_laki || "";
    document.getElementById("home_perempuan").value = data.perempuan || "";
    document.getElementById("home_sambutan").value = data.sambutan || "";

    // Handle foto preview
    if (data.foto) {
        document.getElementById("current_foto_img").src = data.foto;
        document.getElementById("current_foto_img").classList.remove("hidden");
        document.getElementById("no_foto_text").classList.add("hidden");
    } else {
        document.getElementById("current_foto_img").classList.add("hidden");
        document.getElementById("no_foto_text").classList.remove("hidden");
    }

    // Preview uploaded image
    document
        .getElementById("home_foto")
        .addEventListener("change", function (e) {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    document.getElementById("current_foto_img").src =
                        event.target.result;
                    document
                        .getElementById("current_foto_img")
                        .classList.remove("hidden");
                    document
                        .getElementById("no_foto_text")
                        .classList.add("hidden");
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
}

// Utility functions
// Utility functions
function showLoading() {
    document.getElementById("loadingOverlay").classList.remove("hidden");
}

function hideLoading() {
    document.getElementById("loadingOverlay").classList.add("hidden");
}

function showFullscreenPopup(title, content) {
    const popup = document.createElement("div");
    popup.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    popup.innerHTML = `
        <div class="bg-white rounded-lg w-full h-full max-w-4xl max-h-screen overflow-auto m-4">
            <div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h3 class="text-xl font-semibold text-gray-800">${title}</h3>
                <div class="flex space-x-2">
                    <button onclick="closePopup()" class="px-4 py-2 text-gray-600 hover:text-gray-800">Batal</button>
                    <button onclick="submitForm()" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-teal-700">Apply</button>
                </div>
            </div>
            <div class="p-6">
                ${content}
            </div>
        </div>
    `;

    document.body.appendChild(popup);
    window.currentPopup = popup;
}

function closePopup() {
    if (window.currentPopup) {
        document.body.removeChild(window.currentPopup);
        window.currentPopup = null;
    }
}

async function submitForm() {
    const form = document.querySelector(
        "#homeEditForm, #profilEditForm, #beritaEditForm, #pengumumanEditForm, #belanjaEditForm, #infografisEditForm"
    );
    if (!form) return;

    try {
        showLoading();

        let endpoint = getEndpointForCurrentSection();
        let method = "POST";

        // Check if this is an edit operation
        const editId = form.getAttribute("data-edit-id");
        if (editId) {
            endpoint += `/${editId}`;
            method = "PUT";
        }

        let requestBody;
        let headers = {};

        // Handle different form types
        if (
            // TAMBAHKAN 'profilEditForm' PADA KONDISI INI
            form.id === "pengumumanEditForm" ||
            form.id === "infografisEditForm" ||
            form.id === "profilEditForm"
        ) {
            // Untuk pengumuman, infografis, dan profil (visi/misi/sejarah), gunakan JSON
            const formData = new FormData(form);
            const jsonData = {};
            for (let [key, value] of formData.entries()) {
                if (key.includes("[]")) {
                    // Handle array fields
                    const keyName = key.replace("[]", "");
                    if (!jsonData[keyName]) jsonData[keyName] = [];
                    jsonData[keyName].push(value);
                } else {
                    jsonData[key] = value;
                }
            }
            requestBody = JSON.stringify(jsonData);
            headers["Content-Type"] = "application/json";
            console.log(`Sending ${form.id} data as JSON:`, jsonData);
        } else {
            // Untuk form lain yang mungkin punya file upload, gunakan FormData
            requestBody = new FormData(form);
        }

        const response = await fetch(endpoint, {
            method: method,
            headers: headers,
            body: requestBody,
        });

        // Pada server.js, method PUT untuk berita/belanja tidak ada,
        // jadi kita tangani ini sebagai POST ke endpoint spesifik jika ada editId.
        // Ini adalah asumsi dari kode frontend yang ada. Jika backend Anda mendukung PUT,
        // baris ini bisa disesuaikan.
        if (
            editId &&
            (form.id === "beritaEditForm" || form.id === "belanjaEditForm")
        ) {
            // Logika ini mungkin perlu disesuaikan jika server Anda mendukung PUT dengan FormData
            // Namun berdasarkan struktur server.js, update dilakukan via POST ke /api/..:id
        }

        const result = await response.json();

        if (result.success) {
            closePopup();
            loadSectionContent(currentSection);
            showNotification("Data berhasil disimpan", "success");
        } else {
            showNotification(result.message || "Gagal menyimpan data", "error");
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        showNotification("Terjadi kesalahan", "error");
    } finally {
        hideLoading();
    }
}

function getEndpointForCurrentSection() {
    const endpoints = {
        home: "/api/home",
        profil: "/api/profil",
        berita: "/api/berita",
        pengumuman: "/api/pengumuman",
        belanja: "/api/belanja",
        infografis: "/api/infografis",
    };
    return endpoints[currentSection] || "/api/home";
}

function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
        type === "success"
            ? "bg-green-500"
            : type === "error"
            ? "bg-red-500"
            : "bg-blue-500"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// Logout function
async function logout() {
    if (confirm("Apakah Anda yakin ingin logout?")) {
        try {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/login.html";
        } catch (error) {
            console.error("Error logging out:", error);
            window.location.href = "/login.html";
        }
    }
}

// Load other sections (placeholder functions)
async function loadProfilSection(element) {
    const response = await fetch("/api/profil");
    const data = await response.json();
    window.profilData = data;

    element.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div class="mb-6">
                <div class="flex border-b border-gray-200">
                    <button onclick="switchProfileTab('visiMisi')" class="profile-tab-button px-4 py-3 font-semibold rounded-t-lg -mb-px">
                        Visi & Misi
                    </button>
                    <button onclick="switchProfileTab('sejarah')" class="profile-tab-button px-4 py-3 font-semibold rounded-t-lg -mb-px">
                        Sejarah Desa
                    </button>
                    <button onclick="switchProfileTab('organisasi')" class="profile-tab-button px-4 py-3 font-semibold rounded-t-lg -mb-px">
                        Struktur Organisasi
                    </button>
                </div>
            </div>

            <div>
                <div id="visiMisi-pane" class="profile-tab-content">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-gray-800">Visi & Misi Desa</h3>
                        <button onclick="editVisiMisi()" class="bg-primary text-white px-5 py-2 rounded-lg hover:bg-teal-700 font-semibold shadow-md transition-transform transform hover:scale-105">Edit Visi & Misi</button>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                            <h4 class="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                                <span class="text-2xl mr-3">🎯</span> Visi
                            </h4>
                            <p class="text-gray-700">${
                                data.visi || "Visi belum diisi."
                            }</p>
                        </div>
                        <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                            <h4 class="text-lg font-semibold text-green-800 mb-2 flex items-center">
                                <span class="text-2xl mr-3">🗺️</span> Misi
                            </h4>
                            <p class="text-gray-700 whitespace-pre-line">${
                                data.misi || "Misi belum diisi."
                            }</p>
                        </div>
                    </div>
                </div>

                <div id="sejarah-pane" class="profile-tab-content hidden">
                     <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-gray-800">Sejarah Desa</h3>
                        <button onclick="editSejarah()" class="bg-primary text-white px-5 py-2 rounded-lg hover:bg-teal-700 font-semibold shadow-md transition-transform transform hover:scale-105">Edit Sejarah</button>
                    </div>
                    <div class="prose max-w-none text-gray-700">
                        <p>${data.sejarah || "Sejarah desa belum diisi."}</p>
                    </div>
                </div>

                <div id="organisasi-pane" class="profile-tab-content hidden">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-gray-800">Daftar Struktur Organisasi</h3>
                        <button onclick="addOrganisasi()" class="bg-primary text-white px-5 py-2 rounded-lg hover:bg-teal-700 font-semibold shadow-md transition-transform transform hover:scale-105">+ Tambah Organisasi</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-6 py-3 text-left w-10"><input type="checkbox" id="selectAllOrganisasi" onchange="selectAllOrganisasi(this)"></th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Gambar</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nama Organisasi</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Periode</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${(data.organisasi || [])
                                    .map(
                                        (item) => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4"><input type="checkbox" name="organisasiCheck" value="${
                                            item.id
                                        }" onchange="updateDeleteOrganisasiButton()"></td>
                                        <td class="px-6 py-4"><img src="${
                                            item.gambar_struktur ||
                                            "https://via.placeholder.com/100"
                                        }" class="w-16 h-16 object-cover rounded-md" alt="Struktur ${
                                            item.nama
                                        }"></td>
                                        <td class="px-6 py-4 font-medium text-gray-900">${
                                            item.nama || "N/A"
                                        }</td>
                                        <td class="px-6 py-4 text-sm text-gray-700">${
                                            item.periode || "N/A"
                                        }</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="editOrganisasi(${
                                                item.id
                                            })" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                            <button onclick="deleteOrganisasi(${
                                                item.id
                                            })" class="text-red-600 hover:text-red-900">Hapus</button>
                                        </td>
                                    </tr>`
                                    )
                                    .join("")}
                            </tbody>
                        </table>
                        ${
                            (data.organisasi || []).length === 0
                                ? '<div class="text-center py-8 text-gray-500">Belum ada data organisasi</div>'
                                : ""
                        }
                    </div>
                    <div class="mt-4">
                        <button onclick="deleteSelectedOrganisasi()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50" disabled id="deleteSelectedOrganisasiBtn">Hapus Terpilih</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Secara otomatis aktifkan tab pertama saat halaman dimuat
    setTimeout(() => switchProfileTab("visiMisi"), 0);
}
async function loadInfografisSection(element) {
    const response = await fetch("/api/infografis");
    const data = await response.json();
    window.infografisData = data;

    const totalPendapatan = (data.apbdesa?.pendapatan || []).reduce(
        (sum, item) => sum + (item.nominal || 0),
        0
    );
    const totalBelanja = (data.apbdesa?.belanja || []).reduce(
        (sum, item) => sum + (item.nominal || 0),
        0
    );

    const createStatList = (title, dataObject) => {
        if (!dataObject || Object.keys(dataObject).length === 0) {
            return `<div><h5 class="font-semibold text-gray-700 mb-2">${title}</h5><p class="text-sm text-gray-500">Belum ada data.</p></div>`;
        }
        return `
            <div>
                <h5 class="font-semibold text-gray-700 mb-2">${title}</h5>
                <ul class="space-y-1 text-sm text-gray-600 list-disc list-inside">
                    ${Object.entries(dataObject)
                        .map(
                            ([key, value]) =>
                                `<li><strong>${value}</strong> jiwa - ${key}</li>`
                        )
                        .join("")}
                </ul>
            </div>
        `;
    };

    element.innerHTML = `
         <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div class="mb-6">
                <div class="flex border-b border-gray-200">
                    <button onclick="switchInfografisTab('statistik')" class="infografis-tab-button px-4 py-3 font-semibold rounded-t-lg -mb-px">Statistik Penduduk</button>
                    <button onclick="switchInfografisTab('apbdesa')" class="infografis-tab-button px-4 py-3 font-semibold rounded-t-lg -mb-px">APB Desa</button>
                    <button onclick="switchInfografisTab('bansos')" class="infografis-tab-button px-4 py-3 font-semibold rounded-t-lg -mb-px">Bantuan Sosial</button>
                </div>
            </div>
            <div>
                <div id="statistik-pane" class="infografis-tab-content">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-gray-800">Statistik Penduduk</h3>
                        <button onclick="editStatistikPenduduk()" class="bg-primary text-white px-5 py-2 rounded-lg hover:bg-teal-700 font-semibold shadow-md">Edit Data</button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${[
                            {
                                label: "Total Penduduk",
                                value:
                                    data.statistik_penduduk?.total_penduduk ||
                                    0,
                                icon: "👥",
                                color: "blue",
                            },
                            {
                                label: "Total KK",
                                value: data.statistik_penduduk?.total_kk || 0,
                                icon: "📇",
                                color: "teal",
                            },
                            {
                                label: "Laki-laki",
                                value: data.statistik_penduduk?.laki_laki || 0,
                                icon: "👨",
                                color: "sky",
                            },
                            {
                                label: "Perempuan",
                                value: data.statistik_penduduk?.perempuan || 0,
                                icon: "👩",
                                color: "pink",
                            },
                        ]
                            .map(
                                (stat) => `
                            <div class="bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200 border border-${stat.color}-200 text-${stat.color}-800 rounded-xl shadow-lg p-4 flex flex-col items-center justify-center text-center">
                                <span class="text-4xl">${stat.icon}</span>
                                <p class="text-3xl font-bold mt-2">${stat.value}</p>
                                <p class="text-sm font-medium">${stat.label}</p>
                            </div>`
                            )
                            .join("")}
                    </div>
                    <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6">
                        ${createStatList(
                            "Berdasarkan Dusun",
                            data.berdasarkan_dusun
                        )}
                        ${createStatList(
                            "Berdasarkan Pendidikan",
                            data.berdasarkan_pendidikan
                        )}
                        ${createStatList(
                            "Berdasarkan Pekerjaan",
                            data.berdasarkan_pekerjaan
                        )}
                    </div>
                </div>

                <div id="apbdesa-pane" class="infografis-tab-content hidden">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-gray-800">Anggaran Pendapatan & Belanja Desa</h3>
                        <button onclick="editAPBDesa()" class="bg-primary text-white px-5 py-2 rounded-lg hover:bg-teal-700 font-semibold shadow-md">Edit Data</button>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div class="space-y-4">
                            <h4 class="text-lg font-semibold text-gray-700">Pendapatan</h4>
                            <div class="bg-gray-50 p-4 rounded-lg space-y-3">
                                ${
                                    (data.apbdesa?.pendapatan || [])
                                        .map((item) => {
                                            const percentage =
                                                totalPendapatan > 0
                                                    ? (
                                                          ((item.nominal || 0) /
                                                              totalPendapatan) *
                                                          100
                                                      ).toFixed(1)
                                                    : 0;
                                            return `
                                        <div>
                                            <div class="flex justify-between text-sm mb-1">
                                                <span class="font-medium text-gray-800">${
                                                    item.jenis
                                                }</span>
                                                <span class="text-gray-600">Rp ${(
                                                    item.nominal || 0
                                                ).toLocaleString(
                                                    "id-ID"
                                                )}</span>
                                            </div>
                                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                                <div class="bg-green-500 h-2.5 rounded-full" style="width: ${percentage}%"></div>
                                            </div>
                                        </div>
                                    `;
                                        })
                                        .join("") ||
                                    '<p class="text-sm text-gray-500">Belum ada data pendapatan.</p>'
                                }
                            </div>
                            <div class="text-right font-bold text-lg text-gray-800">Total: Rp ${totalPendapatan.toLocaleString(
                                "id-ID"
                            )}</div>
                        </div>
                        <div class="space-y-4">
                            <h4 class="text-lg font-semibold text-gray-700">Belanja</h4>
                            <div class="bg-gray-50 p-4 rounded-lg space-y-3">
                                ${
                                    (data.apbdesa?.belanja || [])
                                        .map((item) => {
                                            const percentage =
                                                totalBelanja > 0
                                                    ? (
                                                          ((item.nominal || 0) /
                                                              totalBelanja) *
                                                          100
                                                      ).toFixed(1)
                                                    : 0;
                                            return `
                                        <div>
                                            <div class="flex justify-between text-sm mb-1">
                                                <span class="font-medium text-gray-800">${
                                                    item.jenis
                                                }</span>
                                                <span class="text-gray-600">Rp ${(
                                                    item.nominal || 0
                                                ).toLocaleString(
                                                    "id-ID"
                                                )}</span>
                                            </div>
                                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                                <div class="bg-red-500 h-2.5 rounded-full" style="width: ${percentage}%"></div>
                                            </div>
                                        </div>
                                    `;
                                        })
                                        .join("") ||
                                    '<p class="text-sm text-gray-500">Belum ada data belanja.</p>'
                                }
                            </div>
                            <div class="text-right font-bold text-lg text-gray-800">Total: Rp ${totalBelanja.toLocaleString(
                                "id-ID"
                            )}</div>
                        </div>
                    </div>
                </div>

                <div id="bansos-pane" class="infografis-tab-content hidden">
                     <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-gray-800">Penerima Bantuan Sosial</h3>
                        <button onclick="editBantuanSosial()" class="bg-primary text-white px-5 py-2 rounded-lg hover:bg-teal-700 font-semibold shadow-md">Edit Data</button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        ${
                            Object.entries(data.bantuan_sosial || {}).length > 0
                                ? Object.entries(data.bantuan_sosial || {})
                                      .map(
                                          ([jenis, jumlah]) => `
                                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center transform hover:-translate-y-1 transition-transform">
                                    <p class="text-3xl font-bold text-yellow-800">${jumlah}</p>
                                    <p class="text-sm font-medium text-yellow-700 mt-1">${jenis}</p>
                                </div>
                            `
                                      )
                                      .join("")
                                : '<p class="col-span-full text-center text-gray-500">Belum ada data bantuan sosial.</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => switchInfografisTab("statistik"), 0);
}

async function loadBeritaSection(element) {
    const response = await fetch("/api/berita");
    const berita = await response.json();

    element.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-semibold text-gray-800">Kelola Berita</h3>
                <button onclick="addBerita()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                    Tambah Berita
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input type="checkbox" id="selectAllBerita" onchange="selectAllBerita(this)">
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thumbnail</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Rilis</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${berita
                            .map(
                                (item) => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <input type="checkbox" name="beritaCheck" value="${
                                        item.id
                                    }">
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    ${
                                        item.thumbnail
                                            ? `<img src="${item.thumbnail}" class="w-16 h-16 object-cover rounded-lg" alt="Thumbnail">`
                                            : '<div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">No Image</div>'
                                    }
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm font-medium text-gray-900">${
                                        item.judul || "Tanpa Judul"
                                    }</div>
                                    <div class="text-sm text-gray-500">${(
                                        item.isi || ""
                                    ).substring(0, 100)}...</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${new Date(
                                        item.waktu_rilis
                                    ).toLocaleDateString("id-ID")}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="editBerita(${
                                        item.id
                                    })" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                    <button onclick="deleteBerita(${
                                        item.id
                                    })" class="text-red-600 hover:text-red-900">Hapus</button>
                                </td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
                
                ${
                    berita.length === 0
                        ? '<div class="text-center py-8 text-gray-500">Belum ada berita</div>'
                        : ""
                }
            </div>
            
            <div class="mt-4 flex justify-between items-center">
                <button onclick="deleteSelectedBerita()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50" disabled id="deleteSelectedBtn">
                    Hapus Terpilih
                </button>
                <p class="text-sm text-gray-600">Total: ${
                    berita.length
                } berita</p>
            </div>
        </div>
    `;

    // Add event listeners for checkboxes
    setTimeout(() => {
        const checkboxes = document.querySelectorAll(
            'input[name="beritaCheck"]'
        );
        checkboxes.forEach((cb) => {
            cb.addEventListener("change", updateDeleteButton);
        });
    }, 100);
}

async function loadPengumumanSection(element) {
    const response = await fetch("/api/pengumuman");
    const pengumuman = await response.json();

    element.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-semibold text-gray-800">Kelola Pengumuman</h3>
                <button onclick="addPengumuman()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                    Tambah Pengumuman
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input type="checkbox" id="selectAllPengumuman" onchange="selectAllPengumuman(this)">
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Rilis</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${pengumuman
                            .map(
                                (item) => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <input type="checkbox" name="pengumumanCheck" value="${
                                        item.id
                                    }">
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm font-medium text-gray-900">${
                                        item.judul || "Tanpa Judul"
                                    }</div>
                                    <div class="text-sm text-gray-500">${(
                                        item.isi || ""
                                    ).substring(0, 100)}...</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${new Date(
                                        item.waktu_rilis
                                    ).toLocaleDateString("id-ID")}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="editPengumuman(${
                                        item.id
                                    })" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                    <button onclick="deletePengumuman(${
                                        item.id
                                    })" class="text-red-600 hover:text-red-900">Hapus</button>
                                </td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
                
                ${
                    pengumuman.length === 0
                        ? '<div class="text-center py-8 text-gray-500">Belum ada pengumuman</div>'
                        : ""
                }
            </div>
            
            <div class="mt-4 flex justify-between items-center">
                <button onclick="deleteSelectedPengumuman()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50" disabled id="deleteSelectedPengumumanBtn">
                    Hapus Terpilih
                </button>
                <p class="text-sm text-gray-600">Total: ${
                    pengumuman.length
                } pengumuman</p>
            </div>
        </div>
    `;

    // Add event listeners for checkboxes
    setTimeout(() => {
        const checkboxes = document.querySelectorAll(
            'input[name="pengumumanCheck"]'
        );
        checkboxes.forEach((cb) => {
            cb.addEventListener("change", updateDeletePengumumanButton);
        });
    }, 100);
}

async function loadBelanjaSection(element) {
    const response = await fetch("/api/belanja");
    const produk = await response.json();

    element.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-semibold text-gray-800">Kelola Produk Belanja</h3>
                <button onclick="addProduk()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                    Tambah Produk
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input type="checkbox" id="selectAllProduk" onchange="selectAllProduk(this)">
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gambar</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. WhatsApp</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${produk
                            .map(
                                (item) => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <input type="checkbox" name="produkCheck" value="${
                                        item.id
                                    }">
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    ${
                                        item.gambar
                                            ? `<img src="${item.gambar}" class="w-16 h-16 object-cover rounded-lg" alt="Produk">`
                                            : '<div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">No Image</div>'
                                    }
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm font-medium text-gray-900">${
                                        item.nama
                                    }</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    Rp ${parseInt(item.harga).toLocaleString(
                                        "id-ID"
                                    )}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${item.no_whatsapp}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="editProduk(${
                                        item.id
                                    })" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                    <button onclick="deleteProduk(${
                                        item.id
                                    })" class="text-red-600 hover:text-red-900">Hapus</button>
                                </td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
                
                ${
                    produk.length === 0
                        ? '<div class="text-center py-8 text-gray-500">Belum ada produk</div>'
                        : ""
                }
            </div>
            
            <div class="mt-4 flex justify-between items-center">
                <button onclick="deleteSelectedProduk()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50" disabled id="deleteSelectedProdukBtn">
                    Hapus Terpilih
                </button>
                <p class="text-sm text-gray-600">Total: ${
                    produk.length
                } produk</p>
            </div>
        </div>
    `;

    // Add event listeners for checkboxes
    setTimeout(() => {
        const checkboxes = document.querySelectorAll(
            'input[name="produkCheck"]'
        );
        checkboxes.forEach((cb) => {
            cb.addEventListener("change", updateDeleteProdukButton);
        });
    }, 100);
}

async function loadImportSection(element) {
    element.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <div class="mb-6 border-b border-gray-200 pb-4">
                <h3 class="text-xl font-bold text-gray-800">Impor Data Penduduk dari Excel</h3>
                <p class="text-sm text-gray-600 mt-1">Perbarui statistik kependudukan secara massal dari file Excel.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div class="lg:col-span-3">
                    <h4 class="text-lg font-semibold text-gray-700 mb-4">Panduan Impor 📝</h4>
                    <div class="space-y-4 text-sm text-gray-700">
                        <div class="flex items-start">
                            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow">1</div>
                            <div class="ml-4">
                                <p class="font-medium text-gray-900">Unduh Template</p>
                                <p>Gunakan template yang kami sediakan untuk memastikan format kolom sesuai dan proses impor berjalan lancar.</p>
                            </div>
                        </div>
                        <div class="flex items-start">
                             <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow">2</div>
                            <div class="ml-4">
                                <p class="font-medium text-gray-900">Isi Data Penduduk</p>
                                <p>Isi data setiap penduduk per baris. Pastikan nama kolom pada template tidak diubah.</p>
                            </div>
                        </div>
                         <div class="flex items-start">
                             <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow">3</div>
                            <div class="ml-4">
                                <p class="font-medium text-gray-900">Unggah & Proses</p>
                                <p>Pilih file yang sudah diisi pada form di samping, lalu sistem akan menghitung statistiknya untuk Anda review.</p>
                            </div>
                        </div>
                    </div>

                    <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p class="font-semibold text-blue-800 mb-2">Kolom yang Diperlukan pada Template:</p>
                        <ul class="list-disc list-inside text-sm text-blue-700 space-y-1">
                            <li><strong>nama</strong> (Nama lengkap penduduk)</li>
                            <li><strong>No. Kartu Keluarga</strong> (Untuk menghitung jumlah KK unik)</li>
                            <li><strong>jenis kelamin</strong> (Isi dengan "Laki-laki" atau "Perempuan")</li>
                            <li><strong>dusun</strong> (Nama dusun tempat tinggal)</li>
                            <li><strong>pendidikan</strong> (Pendidikan terakhir)</li>
                            <li><strong>pekerjaan</strong> (Pekerjaan saat ini)</li>
                            <li><strong>penerima bantuan sosial</strong> (Contoh: "PKH", "BPNT". Kosongkan jika tidak ada)</li>
                        </ul>
                    </div>
                     <div class="mt-6">
                        <a href="/templates/template_penduduk.xlsx" download class="inline-flex items-center bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-semibold shadow transition-transform transform hover:scale-105">
                           <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
                           Unduh Template Excel
                        </a>
                    </div>
                </div>

                <div class="lg:col-span-2">
                     <h4 class="text-lg font-semibold text-gray-700 mb-4">Area Unggah 📤</h4>
                     <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50 flex flex-col justify-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <form id="importForm" enctype="multipart/form-data" class="mt-4 space-y-4">
                            <div>
                                <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-teal-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary p-2">
                                    <span>Pilih file Excel</span>
                                    <input id="file-upload" name="excel" type="file" class="sr-only" accept=".xlsx,.xls" required>
                                </label>
                                <p id="file-name-display" class="text-xs text-gray-500 mt-2 truncate">Belum ada file dipilih</p>
                            </div>
                            <button type="submit" class="w-full bg-primary text-white px-6 py-2 rounded-lg hover:bg-teal-700 font-semibold shadow">
                                Upload dan Proses
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Tambahkan event listener untuk form dan untuk menampilkan nama file yang dipilih
    setTimeout(() => {
        const importForm = document.getElementById("importForm");
        const fileInput = document.getElementById("file-upload");
        const fileNameDisplay = document.getElementById("file-name-display");

        if (importForm) {
            importForm.addEventListener("submit", handleImport);
        }
        if (fileInput && fileNameDisplay) {
            fileInput.addEventListener("change", () => {
                fileNameDisplay.textContent =
                    fileInput.files.length > 0
                        ? fileInput.files[0].name
                        : "Belum ada file dipilih";
            });
        }
    }, 100);
}

// Berita functions
function addBerita() {
    showFullscreenPopup("Tambah Berita", createBeritaEditForm());
}

async function editBerita(id) {
    const response = await fetch("/api/berita");
    const berita = await response.json();
    const item = berita.find((b) => b.id == id);

    if (item) {
        const form = createBeritaEditForm(item);
        showFullscreenPopup("Edit Berita", form);

        // Populate form
        setTimeout(() => {
            document.querySelector('input[name="judul"]').value = item.judul;
            document.querySelector('textarea[name="isi"]').value = item.isi;
            document.querySelector('input[name="waktu_rilis"]').value =
                item.waktu_rilis.substring(0, 16);
            document.querySelector("form").setAttribute("data-edit-id", id);
        }, 100);
    }
}

async function deleteBerita(id) {
    if (confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
        try {
            const response = await fetch(`/api/berita/${id}`, {
                method: "DELETE",
            });
            const result = await response.json();

            if (result.success) {
                loadSectionContent("berita");
                showNotification("Berita berhasil dihapus", "success");
            } else {
                showNotification("Gagal menghapus berita", "error");
            }
        } catch (error) {
            showNotification("Terjadi kesalahan", "error");
        }
    }
}

function selectAllBerita(checkbox) {
    const checkboxes = document.querySelectorAll('input[name="beritaCheck"]');
    checkboxes.forEach((cb) => (cb.checked = checkbox.checked));
    updateDeleteButton();
}

function updateDeleteButton() {
    const checkedBoxes = document.querySelectorAll(
        'input[name="beritaCheck"]:checked'
    );
    const deleteBtn = document.getElementById("deleteSelectedBtn");
    if (deleteBtn) deleteBtn.disabled = checkedBoxes.length === 0;
}

async function deleteSelectedBerita() {
    const checkedBoxes = document.querySelectorAll(
        'input[name="beritaCheck"]:checked'
    );
    if (checkedBoxes.length === 0) return;

    if (
        confirm(
            `Apakah Anda yakin ingin menghapus ${checkedBoxes.length} berita?`
        )
    ) {
        try {
            const promises = Array.from(checkedBoxes).map((cb) =>
                fetch(`/api/berita/${cb.value}`, { method: "DELETE" })
            );

            await Promise.all(promises);
            loadSectionContent("berita");
            showNotification("Berita berhasil dihapus", "success");
        } catch (error) {
            showNotification("Terjadi kesalahan", "error");
        }
    }
}

function createBeritaEditForm(item = null) {
    return `
        <form id="beritaEditForm" enctype="multipart/form-data">
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Judul Berita</label>
                    <input type="text" name="judul" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
                    <input type="file" name="thumbnail" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                    ${
                        item && item.thumbnail
                            ? `<div class="mt-2"><img src="${item.thumbnail}" class="w-32 h-32 object-cover rounded-lg" alt="Current thumbnail"></div>`
                            : ""
                    }
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Isi Berita</label>
                    <textarea name="isi" rows="10" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Waktu Rilis</label>
                    <input type="datetime-local" name="waktu_rilis" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
            </div>
        </form>
    `;
}

// Pengumuman functions
function addPengumuman() {
    showFullscreenPopup("Tambah Pengumuman", createPengumumanEditForm());
}

async function editPengumuman(id) {
    const response = await fetch("/api/pengumuman");
    const pengumuman = await response.json();
    const item = pengumuman.find((p) => p.id == id);

    if (item) {
        const form = createPengumumanEditForm(item);
        showFullscreenPopup("Edit Pengumuman", form);

        // Populate form
        setTimeout(() => {
            document.querySelector('input[name="judul"]').value = item.judul;
            document.querySelector('textarea[name="isi"]').value = item.isi;
            document.querySelector('input[name="waktu_rilis"]').value =
                item.waktu_rilis.substring(0, 16);
            document.querySelector("form").setAttribute("data-edit-id", id);
        }, 100);
    }
}

async function deletePengumuman(id) {
    if (confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
        try {
            const response = await fetch(`/api/pengumuman/${id}`, {
                method: "DELETE",
            });
            const result = await response.json();

            if (result.success) {
                loadSectionContent("pengumuman");
                showNotification("Pengumuman berhasil dihapus", "success");
            } else {
                showNotification("Gagal menghapus pengumuman", "error");
            }
        } catch (error) {
            showNotification("Terjadi kesalahan", "error");
        }
    }
}

function selectAllPengumuman(checkbox) {
    const checkboxes = document.querySelectorAll(
        'input[name="pengumumanCheck"]'
    );
    checkboxes.forEach((cb) => (cb.checked = checkbox.checked));
    updateDeletePengumumanButton();
}

function updateDeletePengumumanButton() {
    const checkedBoxes = document.querySelectorAll(
        'input[name="pengumumanCheck"]:checked'
    );
    const deleteBtn = document.getElementById("deleteSelectedPengumumanBtn");
    if (deleteBtn) deleteBtn.disabled = checkedBoxes.length === 0;
}

async function deleteSelectedPengumuman() {
    const checkedBoxes = document.querySelectorAll(
        'input[name="pengumumanCheck"]:checked'
    );
    if (checkedBoxes.length === 0) return;

    if (
        confirm(
            `Apakah Anda yakin ingin menghapus ${checkedBoxes.length} pengumuman?`
        )
    ) {
        try {
            const promises = Array.from(checkedBoxes).map((cb) =>
                fetch(`/api/pengumuman/${cb.value}`, { method: "DELETE" })
            );

            await Promise.all(promises);
            loadSectionContent("pengumuman");
            showNotification("Pengumuman berhasil dihapus", "success");
        } catch (error) {
            showNotification("Terjadi kesalahan", "error");
        }
    }
}

function createPengumumanEditForm(item = null) {
    return `
        <form id="pengumumanEditForm">
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Judul Pengumuman</label>
                    <input type="text" name="judul" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Isi Pengumuman</label>
                    <textarea name="isi" rows="10" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Waktu Rilis</label>
                    <input type="datetime-local" name="waktu_rilis" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
            </div>
        </form>
    `;
}

// Belanja functions
function addProduk() {
    showFullscreenPopup("Tambah Produk", createProdukEditForm());
}

async function editProduk(id) {
    const response = await fetch("/api/belanja");
    const produk = await response.json();
    const item = produk.find((p) => p.id == id);

    if (item) {
        const form = createProdukEditForm(item);
        showFullscreenPopup("Edit Produk", form);

        // Populate form
        setTimeout(() => {
            document.querySelector('input[name="nama"]').value = item.nama;
            document.querySelector('input[name="harga"]').value = item.harga;
            document.querySelector('input[name="no_whatsapp"]').value =
                item.no_whatsapp;
            document.querySelector("form").setAttribute("data-edit-id", id);
        }, 100);
    }
}

async function deleteProduk(id) {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
        try {
            const response = await fetch(`/api/belanja/${id}`, {
                method: "DELETE",
            });
            const result = await response.json();

            if (result.success) {
                loadSectionContent("belanja");
                showNotification("Produk berhasil dihapus", "success");
            } else {
                showNotification("Gagal menghapus produk", "error");
            }
        } catch (error) {
            showNotification("Terjadi kesalahan", "error");
        }
    }
}

function selectAllProduk(checkbox) {
    const checkboxes = document.querySelectorAll('input[name="produkCheck"]');
    checkboxes.forEach((cb) => (cb.checked = checkbox.checked));
    updateDeleteProdukButton();
}

function updateDeleteProdukButton() {
    const checkedBoxes = document.querySelectorAll(
        'input[name="produkCheck"]:checked'
    );
    const deleteBtn = document.getElementById("deleteSelectedProdukBtn");
    if (deleteBtn) deleteBtn.disabled = checkedBoxes.length === 0;
}

async function deleteSelectedProduk() {
    const checkedBoxes = document.querySelectorAll(
        'input[name="produkCheck"]:checked'
    );
    if (checkedBoxes.length === 0) return;

    if (
        confirm(
            `Apakah Anda yakin ingin menghapus ${checkedBoxes.length} produk?`
        )
    ) {
        try {
            const promises = Array.from(checkedBoxes).map((cb) =>
                fetch(`/api/belanja/${cb.value}`, { method: "DELETE" })
            );

            await Promise.all(promises);
            loadSectionContent("belanja");
            showNotification("Produk berhasil dihapus", "success");
        } catch (error) {
            showNotification("Terjadi kesalahan", "error");
        }
    }
}

function createProdukEditForm(item = null) {
    return `
        <form id="belanjaEditForm" enctype="multipart/form-data">
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nama Produk</label>
                    <input type="text" name="nama" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Gambar Produk</label>
                    <input type="file" name="gambar" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                    ${
                        item && item.gambar
                            ? `<div class="mt-2"><img src="${item.gambar}" class="w-32 h-32 object-cover rounded-lg" alt="Current image"></div>`
                            : ""
                    }
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Harga</label>
                    <input type="number" name="harga" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">No. WhatsApp Penjual</label>
                    <input type="text" name="no_whatsapp" required placeholder="Contoh: 628123456789" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
            </div>
        </form>
    `;
}

// Import functions
function setupImportPopupButtons() {
    const popup = window.currentPopup;
    if (!popup) return;

    const buttonContainer = popup.querySelector(".flex.space-x-2");
    buttonContainer.innerHTML = `
        <button onclick="cancelImportAndClosePopup()" class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg">Batal</button>
        <button onclick="applyImport()" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Terapkan Perubahan</button>
    `;
}

function cancelImportAndClosePopup() {
    closePopup();
    cancelImport(); // Memanggil fungsi cancelImport yang sudah ada
}

let importData = null;

async function handleImport(e) {
    e.preventDefault();

    try {
        showLoading();

        const formData = new FormData(e.target);
        const response = await fetch("/api/import-excel", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            importData = result.data;
            showPreview(result.data);
            showNotification("File berhasil diproses", "success");
        } else {
            showNotification(result.message || "Gagal memproses file", "error");
        }
    } catch (error) {
        console.error("Error importing file:", error);
        showNotification("Terjadi kesalahan saat memproses file", "error");
    } finally {
        hideLoading();
    }
}

function showPreview(data) {
    // Helper function untuk membuat bagian form yang bisa diedit
    const createEditableGroup = (title, dataObject, namePrefix) => {
        let html = `<h5 class="font-medium text-gray-700 mb-2 mt-4">${title}</h5>`;
        if (Object.keys(dataObject).length === 0) {
            html += `<p class="text-sm text-gray-500">Tidak ada data terdeteksi.</p>`;
        } else {
            html += Object.entries(dataObject)
                .map(
                    ([key, value]) => `
                <div class="grid grid-cols-2 gap-x-4 gap-y-2 items-center mb-2">
                    <input type="text" name="${namePrefix}_keys[]" value="${key}" class="w-full px-3 py-1 border border-gray-200 bg-gray-50 rounded-md text-sm">
                    <input type="number" name="${namePrefix}_values[]" value="${value}" class="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
            `
                )
                .join("");
        }
        return html;
    };

    const formHTML = `
        <form id="previewForm">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                    <h5 class="font-medium text-gray-700 mb-2">Statistik Dasar</h5>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <label class="text-sm text-gray-600">Total Penduduk</label>
                            <input type="number" name="total_penduduk" value="${
                                data.total_penduduk || 0
                            }" class="w-1/3 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        </div>
                         <div class="flex items-center justify-between">
                            <label class="text-sm text-gray-600">Total Kartu Keluarga (KK)</label>
                            <input type="number" name="total_kk" value="${
                                data.total_kk || 0
                            }" class="w-1/3 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        </div>
                        <div class="flex items-center justify-between">
                            <label class="text-sm text-gray-600">Laki-laki</label>
                            <input type="number" name="laki_laki" value="${
                                data.laki_laki || 0
                            }" class="w-1/3 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        </div>
                        <div class="flex items-center justify-between">
                            <label class="text-sm text-gray-600">Perempuan</label>
                            <input type="number" name="perempuan" value="${
                                data.perempuan || 0
                            }" class="w-1/3 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        </div>
                    </div>
                     ${createEditableGroup(
                         "Data Bantuan Sosial",
                         data.bantuan_sosial,
                         "bansos"
                     )}
                </div>

                <div>
                    ${createEditableGroup(
                        "Data Berdasarkan Dusun",
                        data.berdasarkan_dusun,
                        "dusun"
                    )}
                    ${createEditableGroup(
                        "Data Berdasarkan Pendidikan",
                        data.berdasarkan_pendidikan,
                        "pendidikan"
                    )}
                    ${createEditableGroup(
                        "Data Berdasarkan Pekerjaan",
                        data.berdasarkan_pekerjaan,
                        "pekerjaan"
                    )}
                </div>
            </div>
        </form>
    `;

    // Tampilkan form di dalam popup
    showFullscreenPopup("Preview & Edit Hasil Perhitungan", formHTML);
    // Atur tombol khusus untuk popup ini
    setupImportPopupButtons();
}

async function applyImport() {
    const form = document.getElementById("previewForm");
    if (!form) return;

    try {
        showLoading();
        const formData = new FormData(form);
        const dataToApply = {
            statistik_penduduk: {
                total_penduduk: parseInt(formData.get("total_penduduk")),
                total_kk: parseInt(formData.get("total_kk")),
                laki_laki: parseInt(formData.get("laki_laki")),
                perempuan: parseInt(formData.get("perempuan")),
            },
            berdasarkan_dusun: {},
            berdasarkan_pendidikan: {},
            berdasarkan_pekerjaan: {},
            bantuan_sosial: {},
        };

        const buildObjectFromForm = (prefix) => {
            const obj = {};
            const keys = formData.getAll(`${prefix}_keys[]`);
            const values = formData.getAll(`${prefix}_values[]`);
            keys.forEach((key, index) => {
                if (key) {
                    obj[key] = parseInt(values[index]) || 0;
                }
            });
            return obj;
        };

        dataToApply.berdasarkan_dusun = buildObjectFromForm("dusun");
        dataToApply.berdasarkan_pendidikan = buildObjectFromForm("pendidikan");
        dataToApply.berdasarkan_pekerjaan = buildObjectFromForm("pekerjaan");
        dataToApply.bantuan_sosial = buildObjectFromForm("bansos");

        const response = await fetch("/api/apply-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToApply),
        });

        const result = await response.json();

        if (result.success) {
            closePopup(); // <-- Tutup popup setelah berhasil
            cancelImport(); // <-- Reset form upload & data
            showNotification("Data berhasil diimpor dan diterapkan", "success");
            loadDashboardStats(); // Muat ulang statistik di dashboard utama
        } else {
            showNotification("Gagal menerapkan data impor", "error");
        }
    } catch (error) {
        console.error("Error applying import:", error);
        showNotification("Terjadi kesalahan saat menerapkan data", "error");
    } finally {
        hideLoading();
    }
}

function cancelImport() {
    // Cari form upload utama di halaman
    const importForm = document.getElementById("importForm");
    if (importForm) {
        importForm.reset(); // Reset pilihan file pada form

        // Kembalikan juga teks nama file ke default
        const fileNameDisplay = document.getElementById("file-name-display");
        if (fileNameDisplay) {
            fileNameDisplay.textContent = "Belum ada file dipilih";
        }
    }
    // Hapus data impor yang tersimpan sementara
    importData = null;
}

// Infografis functions
let currentInfografisEditType = null;

function editStatistikPenduduk() {
    currentInfografisEditType = "statistik";
    showFullscreenPopup(
        "Edit Statistik Penduduk",
        createStatistikPendudukForm()
    );
    populateInfografisForms();
}

function createStatistikPendudukForm() {
    return `
        <form id="infografisEditForm">
            <div class="space-y-8">
                <div>
                    <h4 class="font-medium text-gray-800 mb-3">Statistik Utama</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Total Penduduk</label>
                            <input type="number" name="total_penduduk" id="infografis_total_penduduk" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Total KK</label>
                            <input type="number" name="total_kk" id="infografis_total_kk" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Laki-laki</label>
                            <input type="number" name="laki_laki" id="infografis_laki_laki" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Perempuan</label>
                            <input type="number" name="perempuan" id="infografis_perempuan" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        </div>
                    </div>
                </div>

                <div class="border-t pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div>
                        <h4 class="font-medium text-gray-800 mb-3">Berdasarkan Dusun</h4>
                        <div id="dusunContainer" class="space-y-2"></div>
                        <button type="button" onclick="addDusunRow()" class="mt-3 text-sm text-primary hover:text-teal-700 font-semibold">+ Tambah Dusun</button>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-800 mb-3">Berdasarkan Pendidikan</h4>
                        <div id="pendidikanContainer" class="space-y-2"></div>
                        <button type="button" onclick="addPendidikanRow()" class="mt-3 text-sm text-primary hover:text-teal-700 font-semibold">+ Tambah Pendidikan</button>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-800 mb-3">Berdasarkan Pekerjaan</h4>
                        <div id="pekerjaanContainer" class="space-y-2"></div>
                        <button type="button" onclick="addPekerjaanRow()" class="mt-3 text-sm text-primary hover:text-teal-700 font-semibold">+ Tambah Pekerjaan</button>
                    </div>
                </div>
            </div>
        </form>
    `;
}

function editAPBDesa() {
    currentInfografisEditType = "apbdesa";
    showFullscreenPopup("Edit APB Desa", createAPBDesaForm());
    populateInfografisForms();
}

function createAPBDesaForm() {
    return `
        <form id="infografisEditForm">
            <input type="hidden" name="apbdesa_update" value="true">

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h4 class="font-medium text-gray-800 mb-3">Pendapatan</h4>
                    <div id="pendapatanContainer" class="space-y-2"></div>
                    <button type="button" onclick="addPendapatanRow()" class="mt-3 text-sm text-primary hover:text-teal-700 font-semibold">+ Tambah Baris Pendapatan</button>
                </div>
                <div>
                    <h4 class="font-medium text-gray-800 mb-3">Belanja</h4>
                    <div id="belanjaContainer" class="space-y-2"></div>
                    <button type="button" onclick="addBelanjaRow()" class="mt-3 text-sm text-primary hover:text-teal-700 font-semibold">+ Tambah Baris Belanja</button>
                </div>
            </div>
        </form>
    `;
}

function addPendapatanRow(item = { jenis: "", nominal: "", uraian: "" }) {
    const container = document.getElementById("pendapatanContainer");
    const newRow = document.createElement("div");
    newRow.className = "pendapatan-item grid grid-cols-12 gap-2";
    newRow.innerHTML = `
        <input type="text" name="pendapatan_jenis[]" placeholder="Jenis Pendapatan" class="col-span-4 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.jenis || ""
        }">
        <input type="number" name="pendapatan_nominal[]" placeholder="Nominal" class="col-span-4 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.nominal || ""
        }">
        <textarea name="pendapatan_uraian[]" placeholder="Uraian" rows="1" class="col-span-3 px-3 py-2 border border-gray-300 rounded-md">${
            item.uraian || ""
        }</textarea>
        <button type="button" onclick="this.parentElement.remove()" class="col-span-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center justify-center font-bold">X</button>
    `;
    container.appendChild(newRow);
}

function addBelanjaRow(item = { jenis: "", nominal: "", uraian: "" }) {
    const container = document.getElementById("belanjaContainer");
    const newRow = document.createElement("div");
    newRow.className = "belanja-item grid grid-cols-12 gap-2";
    newRow.innerHTML = `
        <input type="text" name="belanja_jenis[]" placeholder="Jenis Belanja" class="col-span-4 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.jenis || ""
        }">
        <input type="number" name="belanja_nominal[]" placeholder="Nominal" class="col-span-4 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.nominal || ""
        }">
        <textarea name="belanja_uraian[]" placeholder="Uraian" rows="1" class="col-span-3 px-3 py-2 border border-gray-300 rounded-md">${
            item.uraian || ""
        }</textarea>
        <button type="button" onclick="this.parentElement.remove()" class="col-span-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center justify-center font-bold">X</button>
    `;
    container.appendChild(newRow);
}

function editBantuanSosial() {
    currentInfografisEditType = "bansos";
    showFullscreenPopup("Edit Bantuan Sosial", createBantuanSosialForm());
    populateInfografisForms();
}

function createBantuanSosialForm() {
    return `
        <form id="infografisEditForm">
            <input type="hidden" name="bansos_update" value="true">

            <div>
                <h4 class="font-medium text-gray-800 mb-3">Jenis Bantuan dan Jumlah Penerima</h4>
                <div id="bansosContainer" class="space-y-2"></div>
                <button type="button" onclick="addBansosRow()" class="mt-3 text-sm text-primary hover:text-teal-700 font-semibold">+ Tambah Baris Bantuan</button>
            </div>
        </form>
    `;
}

function addBansosRow(item = { jenis: "", jumlah: "" }) {
    const container = document.getElementById("bansosContainer");
    const newRow = document.createElement("div");
    newRow.className = "bansos-item grid grid-cols-12 gap-2";
    newRow.innerHTML = `
        <input type="text" name="bansos_jenis[]" placeholder="Jenis Bantuan Sosial" class="col-span-6 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.jenis || ""
        }">
        <input type="number" name="bansos_jumlah[]" placeholder="Jumlah Penerima" class="col-span-5 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.jumlah || ""
        }">
        <button type="button" onclick="this.parentElement.remove()" class="col-span-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center justify-center font-bold">X</button>
    `;
    container.appendChild(newRow);
}

function populateInfografisForms() {
    if (!window.infografisData) return;
    const data = window.infografisData;

    if (currentInfografisEditType === "statistik") {
        const stats = data.statistik_penduduk || {};
        document.getElementById("infografis_total_penduduk").value =
            stats.total_penduduk || "";
        document.getElementById("infografis_total_kk").value =
            stats.total_kk || "";
        document.getElementById("infografis_laki_laki").value =
            stats.laki_laki || "";
        document.getElementById("infografis_perempuan").value =
            stats.perempuan || "";

        // Helper untuk mengisi grup data dinamis (Dusun, Pendidikan, Pekerjaan)
        const populateGroup = (dataObject, containerId, addRowFunction) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = "";
            const dataArray = Object.entries(dataObject || {}).map(
                ([key, value]) => ({ key, value })
            );

            if (dataArray.length > 0) {
                dataArray.forEach((item) => addRowFunction(item));
            } else {
                addRowFunction(); // Tambah satu baris kosong jika tidak ada data
            }
        };

        populateGroup(data.berdasarkan_dusun, "dusunContainer", addDusunRow);
        populateGroup(
            data.berdasarkan_pendidikan,
            "pendidikanContainer",
            addPendidikanRow
        );
        populateGroup(
            data.berdasarkan_pekerjaan,
            "pekerjaanContainer",
            addPekerjaanRow
        );
    } else if (currentInfografisEditType === "apbdesa") {
        const apb = data.apbdesa || {};
        document.getElementById("pendapatanContainer").innerHTML = "";
        document.getElementById("belanjaContainer").innerHTML = "";

        (apb.pendapatan || []).forEach((item) => addPendapatanRow(item));
        if ((apb.pendapatan || []).length === 0) addPendapatanRow();

        (apb.belanja || []).forEach((item) => addBelanjaRow(item));
        if ((apb.belanja || []).length === 0) addBelanjaRow();
    } else if (currentInfografisEditType === "bansos") {
        const bansos = data.bantuan_sosial || {};
        document.getElementById("bansosContainer").innerHTML = "";
        const bansosArray = Object.entries(bansos).map(([jenis, jumlah]) => ({
            jenis,
            jumlah,
        }));

        if (bansosArray.length > 0) {
            bansosArray.forEach((item) => addBansosRow(item));
        } else {
            addBansosRow(); // Tambah satu baris kosong jika tidak ada data
        }
    }
}

let currentProfilEditType = null;

function editVisiMisi() {
    currentProfilEditType = "visiMisi";
    const formContent = `
        <form id="profilEditForm">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Visi</label>
                    <textarea name="visi" id="profil_visi" rows="5" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Misi</label>
                    <textarea name="misi" id="profil_misi" rows="5" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary"></textarea>
                </div>
            </div>
        </form>
    `;
    showFullscreenPopup("Edit Visi & Misi", formContent);
    populateProfilForms();
}

function editSejarah() {
    currentProfilEditType = "sejarah";
    const formContent = `
        <form id="profilEditForm">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Sejarah Desa</label>
                    <textarea name="sejarah" id="profil_sejarah" rows="10" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary"></textarea>
                </div>
            </div>
        </form>
    `;
    showFullscreenPopup("Edit Sejarah Desa", formContent);
    populateProfilForms();
}

function editOrganisasi() {
    currentProfilEditType = "organisasi";
    const formContent = `
        <form id="profilEditForm" enctype="multipart/form-data">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nama Organisasi</label>
                    <input type="text" name="organisasi_nama" id="profil_organisasi_nama" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Periode</label>
                    <input type="text" name="organisasi_periode" id="profil_organisasi_periode" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Gambar Struktur</label>
                    <div id="profil_organisasi_preview_container" class="mb-2"></div>
                    <input type="file" name="organisasi_gambar" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary">
                    <p class="text-xs text-gray-500 mt-1">Biarkan kosong jika tidak ingin mengubah gambar.</p>
                </div>
            </div>
        </form>
    `;
    showFullscreenPopup("Edit Struktur Organisasi", formContent);
    populateProfilForms();
}

function populateProfilForms() {
    if (!window.profilData) return;
    const data = window.profilData;

    if (currentProfilEditType === "visiMisi") {
        document.getElementById("profil_visi").value = data.visi || "";
        document.getElementById("profil_misi").value = data.misi || "";
    } else if (currentProfilEditType === "sejarah") {
        document.getElementById("profil_sejarah").value = data.sejarah || "";
    } else if (currentProfilEditType === "organisasi") {
        document.getElementById("profil_organisasi_nama").value =
            data.organisasi?.nama || "";
        document.getElementById("profil_organisasi_periode").value =
            data.organisasi?.periode || "";
        if (data.organisasi?.gambar_struktur) {
            document.getElementById(
                "profil_organisasi_preview_container"
            ).innerHTML = `
                <p class="text-sm text-gray-600 mb-1">Gambar saat ini:</p>
                <img src="${data.organisasi.gambar_struktur}" class="w-48 h-auto rounded-lg" alt="Current image">
            `;
        }
    }
}
//==================================================
// FUNGSI-FUNGSI BARU UNTUK MANAJEMEN ORGANISASI
//==================================================

/**
 * Membuka popup dengan form kosong untuk menambah organisasi baru.
 */
function addOrganisasi() {
    // Gunakan fungsi yang sama untuk membuat form, tetapi tanpa data awal
    showFullscreenPopup("Tambah Struktur Organisasi", createOrganisasiForm());
    // Ganti tombol 'Apply' bawaan dengan tombol yang memanggil submitOrganisasiForm
    setupOrganisasiPopupButtons();
}

/**
 * Mengambil data organisasi berdasarkan ID dan menampilkan form edit yang sudah terisi.
 */
async function editOrganisasi(id) {
    if (!window.profilData || !window.profilData.organisasi) return;
    const item = window.profilData.organisasi.find((org) => org.id == id);

    if (item) {
        showFullscreenPopup(
            "Edit Struktur Organisasi",
            createOrganisasiForm(item)
        );
        setupOrganisasiPopupButtons(id); // Kirim id untuk mode edit
    }
}

/**
 * Menghapus satu organisasi berdasarkan ID setelah konfirmasi.
 */
async function deleteOrganisasi(id) {
    if (confirm("Apakah Anda yakin ingin menghapus struktur organisasi ini?")) {
        try {
            // DIASUMSIKAN endpoint baru untuk organisasi adalah /api/organisasi/:id
            const response = await fetch(`/api/organisasi/${id}`, {
                method: "DELETE",
            });
            const result = await response.json();

            if (result.success) {
                showNotification("Organisasi berhasil dihapus", "success");
                loadSectionContent("profil"); // Muat ulang bagian profil
            } else {
                showNotification("Gagal menghapus organisasi", "error");
            }
        } catch (error) {
            showNotification("Terjadi kesalahan", "error");
        }
    }
}

/**
 * Menghapus semua organisasi yang dipilih dari checkbox.
 */
async function deleteSelectedOrganisasi() {
    const checkedBoxes = document.querySelectorAll(
        'input[name="organisasiCheck"]:checked'
    );
    if (checkedBoxes.length === 0) return;

    if (
        confirm(
            `Apakah Anda yakin ingin menghapus ${checkedBoxes.length} organisasi terpilih?`
        )
    ) {
        try {
            const promises = Array.from(checkedBoxes).map((cb) =>
                fetch(`/api/organisasi/${cb.value}`, { method: "DELETE" })
            );

            await Promise.all(promises);
            showNotification("Organisasi terpilih berhasil dihapus", "success");
            loadSectionContent("profil");
        } catch (error) {
            showNotification("Terjadi kesalahan saat menghapus", "error");
        }
    }
}

function createOrganisasiForm(item = null) {
    return `
        <form id="organisasiEditForm" enctype="multipart/form-data">
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nama Organisasi</label>
                    <input type="text" name="nama" value="${
                        item?.nama || ""
                    }" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Periode</label>
                    <input type="text" name="periode" value="${
                        item?.periode || ""
                    }" placeholder="Contoh: 2025-2030" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Gambar Struktur Organisasi</label>
                    ${
                        item?.gambar_struktur
                            ? `
                        <div class="mb-2">
                            <p class="text-xs text-gray-500">Gambar saat ini:</p>
                            <img src="${item.gambar_struktur}" class="w-48 h-auto rounded-lg border border-gray-200">
                        </div>
                    `
                            : ""
                    }
                    <input type="file" name="gambar_struktur" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                    <p class="text-xs text-gray-500 mt-1">${
                        item
                            ? "Biarkan kosong jika tidak ingin mengubah gambar."
                            : ""
                    }</p>
                </div>
            </div>
        </form>
    `;
}

/**
 * Mengatur tombol pada popup agar memanggil fungsi submit yang benar.
 */
function setupOrganisasiPopupButtons(editId = null) {
    // Hapus tombol 'Apply' lama dan ganti dengan yang baru
    const popup = window.currentPopup;
    if (!popup) return;

    const buttonContainer = popup.querySelector(".flex.space-x-2");
    buttonContainer.innerHTML = `
        <button onclick="closePopup()" class="px-4 py-2 text-gray-600 hover:text-gray-800">Batal</button>
        <button onclick="submitOrganisasiForm(${editId})" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-teal-700">Simpan</button>
    `;
}

/**
 * Mengirim data form organisasi (tambah/edit) ke server.
 */
async function submitOrganisasiForm(editId) {
    const form = document.getElementById("organisasiEditForm");
    if (!form) return;

    try {
        showLoading();

        let endpoint = "/api/organisasi"; // Endpoint baru untuk organisasi
        let method = "POST";

        if (editId) {
            endpoint += `/${editId}`;
            // Backend mungkin mengharapkan metode POST dengan _method=PUT untuk form-data
            // atau langsung PUT. Kita akan coba POST dulu karena lebih umum untuk file upload.
            // Jika backend mendukung PUT dengan FormData, bisa diganti.
            method = "POST"; // Umumnya form dengan file menggunakan POST.
            // Backend dapat menangani ini sebagai update.
        }

        const response = await fetch(endpoint, {
            method: method,
            body: new FormData(form),
        });

        const result = await response.json();

        if (result.success) {
            closePopup();
            loadSectionContent("profil");
            showNotification("Data organisasi berhasil disimpan", "success");
        } else {
            showNotification(result.message || "Gagal menyimpan data", "error");
        }
    } catch (error) {
        console.error("Error submitting organisasi form:", error);
        showNotification("Terjadi kesalahan", "error");
    } finally {
        hideLoading();
    }
}

/**
 * Logika untuk checkbox 'select all'.
 */
function selectAllOrganisasi(checkbox) {
    const checkboxes = document.querySelectorAll(
        'input[name="organisasiCheck"]'
    );
    checkboxes.forEach((cb) => (cb.checked = checkbox.checked));
    updateDeleteOrganisasiButton();
}

/**
 * Mengaktifkan/menonaktifkan tombol hapus terpilih.
 */
function updateDeleteOrganisasiButton() {
    const checkedBoxes = document.querySelectorAll(
        'input[name="organisasiCheck"]:checked'
    );
    const deleteBtn = document.getElementById("deleteSelectedOrganisasiBtn");
    if (deleteBtn) deleteBtn.disabled = checkedBoxes.length === 0;
}

function addDusunRow(item = { key: "", value: "" }) {
    const container = document.getElementById("dusunContainer");
    const newRow = document.createElement("div");
    newRow.className = "grid grid-cols-12 gap-2";
    newRow.innerHTML = `
        <input type="text" name="dusun_keys[]" placeholder="Nama Dusun" class="col-span-6 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.key || ""
        }">
        <input type="number" name="dusun_values[]" placeholder="Jumlah Penduduk" class="col-span-5 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.value || ""
        }">
        <button type="button" onclick="this.parentElement.remove()" class="col-span-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center justify-center font-bold">X</button>
    `;
    container.appendChild(newRow);
}

function addPendidikanRow(item = { key: "", value: "" }) {
    const container = document.getElementById("pendidikanContainer");
    const newRow = document.createElement("div");
    newRow.className = "grid grid-cols-12 gap-2";
    newRow.innerHTML = `
        <input type="text" name="pendidikan_keys[]" placeholder="Tingkat Pendidikan" class="col-span-6 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.key || ""
        }">
        <input type="number" name="pendidikan_values[]" placeholder="Jumlah" class="col-span-5 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.value || ""
        }">
        <button type="button" onclick="this.parentElement.remove()" class="col-span-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center justify-center font-bold">X</button>
    `;
    container.appendChild(newRow);
}

function addPekerjaanRow(item = { key: "", value: "" }) {
    const container = document.getElementById("pekerjaanContainer");
    const newRow = document.createElement("div");
    newRow.className = "grid grid-cols-12 gap-2";
    newRow.innerHTML = `
        <input type="text" name="pekerjaan_keys[]" placeholder="Jenis Pekerjaan" class="col-span-6 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.key || ""
        }">
        <input type="number" name="pekerjaan_values[]" placeholder="Jumlah" class="col-span-5 px-3 py-2 border border-gray-300 rounded-md" value="${
            item.value || ""
        }">
        <button type="button" onclick="this.parentElement.remove()" class="col-span-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center justify-center font-bold">X</button>
    `;
    container.appendChild(newRow);
}
