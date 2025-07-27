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
        const [
            beritaResponse,
            pengumumanResponse,
            belanjaResponse,
            infografisResponse,
        ] = await Promise.all([
            fetch("/api/berita"),
            fetch("/api/pengumuman"),
            fetch("/api/belanja"),
            fetch("/api/infografis"),
        ]);

        const berita = await beritaResponse.json();
        const pengumuman = await pengumumanResponse.json();
        const belanja = await belanjaResponse.json();
        const infografis = await infografisResponse.json();

        document.getElementById("totalBerita").textContent = berita.length || 0;
        document.getElementById("totalPengumuman").textContent =
            pengumuman.length || 0;
        document.getElementById("totalProduk").textContent =
            belanja.length || 0;
        document.getElementById("totalPenduduk").textContent =
            infografis.statistik_penduduk?.total_penduduk || 0;

        // Load recent activity
        loadRecentActivity();
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
    }
}

function loadRecentActivity() {
    const activities = [
        { type: "Berita", action: "ditambahkan", time: "2 jam yang lalu" },
        { type: "Pengumuman", action: "diperbarui", time: "1 hari yang lalu" },
        { type: "Produk", action: "ditambahkan", time: "3 hari yang lalu" },
    ];

    const activityHtml = activities
        .map(
            (activity) => `
        <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div>
                <p class="text-sm font-medium text-gray-800">${activity.type} ${activity.action}</p>
            </div>
            <p class="text-xs text-gray-500">${activity.time}</p>
        </div>
    `
        )
        .join("");

    document.getElementById("recentActivity").innerHTML = activityHtml;
}

// Home section
async function loadHomeSection(element) {
    const response = await fetch("/api/home");
    const data = await response.json();
    window.homeData = data; // Stocker les données pour les utiliser lors de l'édition

    element.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-semibold text-gray-800">Data Home</h3>
                <div class="flex gap-2">
                    <button onclick="editHome()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                        Edit Data
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Kepala Desa</h4>
                    <p class="text-gray-600">${
                        data.nama_kepala_desa || "Belum diisi"
                    }</p>
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Total Penduduk</h4>
                    <p class="text-gray-600">${data.total_penduduk || "0"}</p>
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Total KK</h4>
                    <p class="text-gray-600">${data.total_kk || "0"}</p>
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Laki-laki</h4>
                    <p class="text-gray-600">${data.laki_laki || "0"}</p>
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Perempuan</h4>
                    <p class="text-gray-600">${data.perempuan || "0"}</p>
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Foto Kepala Desa</h4>
                    ${
                        data.foto
                            ? `<img src="${data.foto}" class="w-24 h-24 object-cover rounded-lg" alt="Foto Kepala Desa">`
                            : '<p class="text-gray-500">Belum ada foto</p>'
                    }
                </div>
                
                <div class="md:col-span-2">
                    <h4 class="font-medium text-gray-700 mb-2">Sambutan</h4>
                    <p class="text-gray-600">${
                        data.sambutan || "Belum diisi"
                    }</p>
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
            form.id === "pengumumanEditForm" ||
            form.id === "infografisEditForm"
        ) {
            // For pengumuman and infografis, use JSON since no file upload
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
            console.log(`Sending ${form.id} data:`, jsonData);
        } else {
            // For other forms, use FormData (for file uploads)
            requestBody = new FormData(form);
        }

        const response = await fetch(endpoint, {
            method: method,
            headers: headers,
            body: requestBody,
        });

        const result = await response.json();

        if (result.success) {
            closePopup();
            loadSectionContent(currentSection);
            showNotification("Data berhasil disimpan", "success");
        } else {
            showNotification("Gagal menyimpan data", "error");
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
    // Simpan data ke variabel global agar bisa diakses oleh fungsi edit
    window.profilData = data;

    element.innerHTML = `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Visi & Misi</h3>
                    <button onclick="editVisiMisi()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                        Edit
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Visi</h4>
                        <p class="text-gray-600">${
                            data.visi || "Belum diisi"
                        }</p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Misi</h4>
                        <p class="text-gray-600">${
                            data.misi || "Belum diisi"
                        }</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Sejarah Desa</h3>
                    <button onclick="editSejarah()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                        Edit
                    </button>
                </div>
                
                <div>
                    <p class="text-gray-600">${
                        data.sejarah || "Belum diisi"
                    }</p>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-semibold text-gray-800">Struktur Organisasi Desa</h3>
                    <button onclick="addOrganisasi()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                        + Tambah Organisasi
                    </button>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left">
                                    <input type="checkbox" id="selectAllOrganisasi" onchange="selectAllOrganisasi(this)">
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gambar Struktur</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Organisasi</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${
                                // DIASUMSIKAN data.organisasi sekarang adalah array: [{id, nama, periode, gambar_struktur}, ...]
                                (data.organisasi || [])
                                    .map(
                                        (item) => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <input type="checkbox" name="organisasiCheck" value="${
                                            item.id
                                        }" onchange="updateDeleteOrganisasiButton()">
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <img src="${
                                            item.gambar_struktur ||
                                            "https://via.placeholder.com/100"
                                        }" class="w-16 h-16 object-cover rounded-lg" alt="Struktur ${
                                            item.nama
                                        }">
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm font-medium text-gray-900">${
                                            item.nama || "N/A"
                                        }</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${item.periode || "N/A"}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onclick="editOrganisasi(${
                                            item.id
                                        })" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                        <button onclick="deleteOrganisasi(${
                                            item.id
                                        })" class="text-red-600 hover:text-red-900">Hapus</button>
                                    </td>
                                </tr>
                                `
                                    )
                                    .join("")
                            }
                        </tbody>
                    </table>
                     ${
                         (data.organisasi || []).length === 0
                             ? '<div class="text-center py-8 text-gray-500">Belum ada data organisasi</div>'
                             : ""
                     }
                </div>

                <div class="mt-4 flex justify-between items-center">
                    <button onclick="deleteSelectedOrganisasi()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50" disabled id="deleteSelectedOrganisasiBtn">
                        Hapus Terpilih
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function loadInfografisSection(element) {
    const response = await fetch("/api/infografis");
    const data = await response.json();
    window.infografisData = data; // Simpan data untuk digunakan saat edit

    element.innerHTML = `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-semibold text-gray-800">Statistik Penduduk</h3>
                    <button onclick="editStatistikPenduduk()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                        Edit
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">${
                            data.statistik_penduduk?.total_penduduk || 0
                        }</div>
                        <div class="text-sm text-gray-600">Total Penduduk</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">${
                            data.statistik_penduduk?.total_kk || 0
                        }</div>
                        <div class="text-sm text-gray-600">Total KK</div>
                    </div>
                    <div class="text-center p-4 bg-purple-50 rounded-lg">
                        <div class="text-2xl font-bold text-purple-600">${
                            data.statistik_penduduk?.laki_laki || 0
                        }</div>
                        <div class="text-sm text-gray-600">Laki-laki</div>
                    </div>
                    <div class="text-center p-4 bg-pink-50 rounded-lg">
                        <div class="text-2xl font-bold text-pink-600">${
                            data.statistik_penduduk?.perempuan || 0
                        }</div>
                        <div class="text-sm text-gray-600">Perempuan</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-semibold text-gray-800">APB Desa</h3>
                    <button onclick="editAPBDesa()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                        Edit
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-700 mb-3">Pendapatan</h4>
                        <div class="space-y-2">
                            ${
                                (data.apbdesa?.pendapatan || [])
                                    .map(
                                        (item) => `
                                <div class="flex justify-between text-sm">
                                    <span>${item.jenis || "-"}</span>
                                    <span class="font-medium">Rp ${(
                                        item.nominal || 0
                                    ).toLocaleString("id-ID")}</span>
                                </div>
                            `
                                    )
                                    .join("") ||
                                '<div class="text-gray-500 text-sm">Belum ada data</div>'
                            }
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 mb-3">Belanja</h4>
                        <div class="space-y-2">
                            ${
                                (data.apbdesa?.belanja || [])
                                    .map(
                                        (item) => `
                                <div class="flex justify-between text-sm">
                                    <span>${item.jenis || "-"}</span>
                                    <span class="font-medium">Rp ${(
                                        item.nominal || 0
                                    ).toLocaleString("id-ID")}</span>
                                </div>
                            `
                                    )
                                    .join("") ||
                                '<div class="text-gray-500 text-sm">Belum ada data</div>'
                            }
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-semibold text-gray-800">Bantuan Sosial</h3>
                    <button onclick="editBantuanSosial()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                        Edit
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${
                        Object.entries(data.bantuan_sosial || {})
                            .map(
                                ([jenis, jumlah]) => `
                        <div class="text-center p-4 bg-yellow-50 rounded-lg">
                            <div class="text-xl font-bold text-yellow-600">${jumlah}</div>
                            <div class="text-sm text-gray-600">${jenis}</div>
                        </div>
                    `
                            )
                            .join("") ||
                        '<div class="col-span-3 text-center text-gray-500">Belum ada data bantuan sosial</div>'
                    }
                </div>
            </div>
        </div>
    `;
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
        <div class="bg-white rounded-lg shadow p-6">
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Impor Data Penduduk dari Excel</h3>
                <p class="text-sm text-gray-600">Upload file Excel yang berisi data penduduk untuk otomatis memperbarui statistik.</p>
            </div>
            
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div class="mb-4">
                    <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                
                <form id="importForm" enctype="multipart/form-data" class="space-y-4">
                    <div>
                        <input type="file" name="excel" accept=".xlsx,.xls" required 
                               class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-teal-700">
                    </div>
                    
                    <button type="submit" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-teal-700">
                        Upload dan Proses
                    </button>
                </form>
            </div>
            
            <div id="previewData" class="mt-6 hidden">
                <h4 class="text-md font-semibold text-gray-800 mb-4">Preview Data yang akan Diimpor</h4>
                <div id="previewContent" class="bg-gray-50 rounded-lg p-4"></div>
                
                <div class="mt-4 flex justify-end space-x-2">
                    <button onclick="cancelImport()" class="px-4 py-2 text-gray-600 hover:text-gray-800">Batal</button>
                    <button onclick="applyImport()" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Apply Import</button>
                </div>
            </div>
            
            <div class="mt-6">
                <h4 class="text-md font-semibold text-gray-800 mb-2">Format File Excel yang Diharapkan</h4>
                <div class="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                    <p class="mb-2"><strong>Kolom yang diperlukan:</strong></p>
                    <ul class="list-disc list-inside space-y-1">
                        <li>Total Penduduk</li>
                        <li>Total KK</li>
                        <li>Laki-laki</li>
                        <li>Perempuan</li>
                        <li>Data berdasarkan Dusun, Pendidikan, Pekerjaan</li>
                        <li>Data Bantuan Sosial</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    // Add form submit handler
    setTimeout(() => {
        document
            .getElementById("importForm")
            .addEventListener("submit", handleImport);
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
    const previewSection = document.getElementById("previewData");
    const previewContent = document.getElementById("previewContent");

    previewContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h5 class="font-medium text-gray-700 mb-2">Statistik Dasar</h5>
                <ul class="space-y-1 text-sm">
                    <li>Total Penduduk: <span class="font-medium">${
                        data.total_penduduk || 0
                    }</span></li>
                    <li>Total KK: <span class="font-medium">${
                        data.total_kk || 0
                    }</span></li>
                    <li>Laki-laki: <span class="font-medium">${
                        data.laki_laki || 0
                    }</span></li>
                    <li>Perempuan: <span class="font-medium">${
                        data.perempuan || 0
                    }</span></li>
                </ul>
            </div>
            
            <div>
                <h5 class="font-medium text-gray-700 mb-2">Data Tambahan</h5>
                <ul class="space-y-1 text-sm">
                    <li>Data Dusun: <span class="font-medium">${
                        Object.keys(data.berdasarkan_dusun || {}).length
                    } item</span></li>
                    <li>Data Pendidikan: <span class="font-medium">${
                        Object.keys(data.berdasarkan_pendidikan || {}).length
                    } item</span></li>
                    <li>Data Pekerjaan: <span class="font-medium">${
                        Object.keys(data.berdasarkan_pekerjaan || {}).length
                    } item</span></li>
                    <li>Data Bansos: <span class="font-medium">${
                        Object.keys(data.bansos || {}).length
                    } item</span></li>
                </ul>
            </div>
        </div>
    `;

    previewSection.classList.remove("hidden");
}

function cancelImport() {
    document.getElementById("previewData").classList.add("hidden");
    document.getElementById("importForm").reset();
    importData = null;
}

async function applyImport() {
    if (!importData) return;

    try {
        showLoading();

        const response = await fetch("/api/apply-import", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(importData),
        });

        const result = await response.json();

        if (result.success) {
            showNotification("Data berhasil diimpor", "success");
            cancelImport();
            // Refresh dashboard stats
            loadDashboardStats();
        } else {
            showNotification("Gagal mengimpor data", "error");
        }
    } catch (error) {
        console.error("Error applying import:", error);
        showNotification("Terjadi kesalahan", "error");
    } finally {
        hideLoading();
    }
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
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Total Penduduk</label>
                    <input type="number" name="total_penduduk" id="infografis_total_penduduk" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Total KK</label>
                    <input type="number" name="total_kk" id="infografis_total_kk" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Laki-laki</label>
                    <input type="number" name="laki_laki" id="infografis_laki_laki" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Perempuan</label>
                    <input type="number" name="perempuan" id="infografis_perempuan" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
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
            <div class="space-y-6">
                <div>
                    <h4 class="font-medium text-gray-700 mb-3">Pendapatan</h4>
                    <div id="pendapatanContainer"></div>
                    <button type="button" onclick="addPendapatanRow()" class="mt-2 text-sm text-primary hover:text-teal-700">+ Tambah Baris Pendapatan</button>
                </div>
                <div>
                    <h4 class="font-medium text-gray-700 mb-3">Belanja</h4>
                    <div id="belanjaContainer"></div>
                    <button type="button" onclick="addBelanjaRow()" class="mt-2 text-sm text-primary hover:text-teal-700">+ Tambah Baris Belanja</button>
                </div>
            </div>
        </form>
    `;
}

function addPendapatanRow(item = { jenis: "", nominal: "" }) {
    const container = document.getElementById("pendapatanContainer");
    const newRow = document.createElement("div");
    newRow.className = "pendapatan-item grid grid-cols-11 gap-2 mb-2";
    newRow.innerHTML = `
        <input type="text" name="pendapatan_jenis[]" placeholder="Jenis Pendapatan" class="col-span-5 px-3 py-2 border border-gray-300 rounded-md" value="${item.jenis}">
        <input type="number" name="pendapatan_nominal[]" placeholder="Nominal" class="col-span-5 px-3 py-2 border border-gray-300 rounded-md" value="${item.nominal}">
        <button type="button" onclick="this.parentElement.remove()" class="col-span-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center">X</button>
    `;
    container.appendChild(newRow);
}

function addBelanjaRow(item = { jenis: "", nominal: "" }) {
    const container = document.getElementById("belanjaContainer");
    const newRow = document.createElement("div");
    newRow.className = "belanja-item grid grid-cols-11 gap-2 mb-2";
    newRow.innerHTML = `
        <input type="text" name="belanja_jenis[]" placeholder="Jenis Belanja" class="col-span-5 px-3 py-2 border border-gray-300 rounded-md" value="${item.jenis}">
        <input type="number" name="belanja_nominal[]" placeholder="Nominal" class="col-span-5 px-3 py-2 border border-gray-300 rounded-md" value="${item.nominal}">
        <button type="button" onclick="this.parentElement.remove()" class="col-span-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center">X</button>
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
            <div class="space-y-4">
                <h4 class="font-medium text-gray-700 mb-3">Jenis Bantuan dan Jumlah Penerima</h4>
                <div id="bansosContainer"></div>
                <button type="button" onclick="addBansosRow()" class="mt-2 text-sm text-primary hover:text-teal-700">+ Tambah Baris Bantuan</button>
            </div>
        </form>
    `;
}

function addBansosRow(item = { jenis: "", jumlah: "" }) {
    const container = document.getElementById("bansosContainer");
    const newRow = document.createElement("div");
    newRow.className = "bansos-item grid grid-cols-11 gap-2 mb-2";
    newRow.innerHTML = `
        <input type="text" name="bansos_jenis[]" placeholder="Jenis Bantuan Sosial" class="col-span-5 px-3 py-2 border border-gray-300 rounded-md" value="${item.jenis}">
        <input type="number" name="bansos_jumlah[]" placeholder="Jumlah Penerima" class="col-span-5 px-3 py-2 border border-gray-300 rounded-md" value="${item.jumlah}">
        <button type="button" onclick="this.parentElement.remove()" class="col-span-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center">X</button>
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
            addBansosRow();
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

/**
 * Membuat HTML untuk form tambah/edit organisasi.
 */
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
