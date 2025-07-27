const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(
    "/templates",
    express.static(path.join(__dirname, "public", "templates"))
);

// Session configuration
app.use(
    session({
        secret: "cikelat-admin-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 60 * 60 * 1000, // 1 hour
            secure: false, // Set true if using HTTPS
        },
    })
);

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = "uploads/";
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// Helper functions
const logActivity = (type, action, detail = "") => {
    const logFilePath = path.join(__dirname, "data", "aktivitas.json");
    let logs = [];
    try {
        if (fs.existsSync(logFilePath)) {
            logs = JSON.parse(fs.readFileSync(logFilePath, "utf8"));
        }
    } catch (e) {
        console.error("Error reading activity log:", e);
        logs = [];
    }

    const newLog = {
        type,
        action,
        detail,
        timestamp: new Date().toISOString(),
    };

    // Tambahkan log baru di urutan pertama
    logs.unshift(newLog);

    // Batasi jumlah log agar file tidak terlalu besar
    const slicedLogs = logs.slice(0, 5); // Diubah dari 50 menjadi 5

    fs.writeFileSync(logFilePath, JSON.stringify(slicedLogs, null, 2));
};

const readJsonFile = (filename) => {
    try {
        const filePath = path.join(__dirname, "data", filename);
        if (!fs.existsSync(filePath)) {
            let basicStructure = {};
            if (filename === "profil.json") {
                basicStructure = {
                    visi: "",
                    misi: "",
                    sejarah: "",
                    organisasi: [],
                };
            }
            writeJsonFile(filename, basicStructure);
            return basicStructure;
        }
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading or parsing ${filename}:`, error);
        return {};
    }
};

const writeJsonFile = (filename, data) => {
    try {
        const filePath = path.join(__dirname, "data", filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true; // Kembalikan true jika berhasil
    } catch (error) {
        console.error(`Error writing to ${filename}:`, error);
        return false; // Kembalikan false jika gagal
    }
};

const deleteFile = (filePath) => {
    if (filePath) {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch (err) {
            console.error(`Gagal menghapus file: ${filePath}`, err);
        }
    }
};

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        if (req.path.startsWith("/api/")) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }
        res.redirect("/login.html");
    }
};

// Routes
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

// Login & Session
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    // Ganti dengan username dan password yang lebih aman
    if (username === "admin" && password === "admin123") {
        req.session.authenticated = true;
        req.session.loginTime = Date.now();
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Username atau password salah" });
    }
});

app.post("/api/logout", (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get("/api/check-session", (req, res) => {
    if (req.session.authenticated) {
        const timeRemaining = req.session.cookie.expires.getTime() - Date.now();
        res.json({ authenticated: true, timeRemaining });
    } else {
        res.json({ authenticated: false });
    }
});

// Protected dashboard route
app.get("/dashboard.html", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ===================================================================
// API Endpoints for Data Management
// ===================================================================

// Home
app.get("/api/home", requireAuth, (req, res) => {
    const homeData = readJsonFile("home.json");
    const infografisData = readJsonFile("infografis.json");
    res.json({
        ...homeData,
        ...infografisData.statistik_penduduk,
    });
});

app.post("/api/home", requireAuth, upload.single("foto"), (req, res) => {
    const homeData = readJsonFile("home.json");
    const infografisData = readJsonFile("infografis.json");

    if (req.file) {
        deleteFile(homeData.foto); // Hapus foto lama
        homeData.foto = "/uploads/" + req.file.filename;
    }

    if (req.body.nama_kepala_desa !== undefined)
        homeData.nama_kepala_desa = req.body.nama_kepala_desa;
    if (req.body.sambutan !== undefined) homeData.sambutan = req.body.sambutan;

    if (!infografisData.statistik_penduduk)
        infografisData.statistik_penduduk = {};
    if (req.body.total_penduduk !== undefined)
        infografisData.statistik_penduduk.total_penduduk = parseInt(
            req.body.total_penduduk
        );
    if (req.body.total_kk !== undefined)
        infografisData.statistik_penduduk.total_kk = parseInt(
            req.body.total_kk
        );
    if (req.body.laki_laki !== undefined)
        infografisData.statistik_penduduk.laki_laki = parseInt(
            req.body.laki_laki
        );
    if (req.body.perempuan !== undefined)
        infografisData.statistik_penduduk.perempuan = parseInt(
            req.body.perempuan
        );

    writeJsonFile("home.json", homeData);
    writeJsonFile("infografis.json", infografisData);
    logActivity("Home", "diperbarui", "Data halaman utama");
    res.json({ success: true });
});

// Profil Desa (Visi, Misi, Sejarah)
app.get("/api/profil", requireAuth, (req, res) => {
    const data = readJsonFile("profil.json");
    res.json(data);
});

app.post("/api/profil", requireAuth, (req, res) => {
    const data = readJsonFile("profil.json");
    if (req.body.visi !== undefined) data.visi = req.body.visi;
    if (req.body.misi !== undefined) data.misi = req.body.misi;
    if (req.body.sejarah !== undefined) data.sejarah = req.body.sejarah;

    logActivity("Profil Desa", "diperbarui", "Visi, Misi, atau Sejarah");
    writeJsonFile("profil.json", data);
    res.json({ success: true });
});

// Profil Desa (Organisasi CRUD)
app.post(
    "/api/organisasi",
    requireAuth,
    upload.single("gambar_struktur"),
    (req, res) => {
        const data = readJsonFile("profil.json");
        const newOrganisasi = {
            id: Date.now(),
            nama: req.body.nama,
            periode: req.body.periode,
            gambar_struktur: req.file ? "/uploads/" + req.file.filename : null,
        };
        if (!Array.isArray(data.organisasi)) data.organisasi = [];
        data.organisasi.push(newOrganisasi);
        logActivity("Struktur Organisasi", "ditambahkan", newOrganisasi.nama);
        writeJsonFile("profil.json", data);
        res.json({ success: true });
    }
);

app.post(
    "/api/organisasi/:id",
    requireAuth,
    upload.single("gambar_struktur"),
    (req, res) => {
        const data = readJsonFile("profil.json");
        const orgId = parseInt(req.params.id);
        const orgIndex = data.organisasi.findIndex((o) => o.id === orgId);

        if (orgIndex === -1)
            return res.status(404).json({
                success: false,
                message: "Organisasi tidak ditemukan.",
            });

        const orgToUpdate = data.organisasi[orgIndex];
        if (req.file) {
            deleteFile(orgToUpdate.gambar_struktur); // Hapus file lama
            orgToUpdate.gambar_struktur = "/uploads/" + req.file.filename;
        }
        orgToUpdate.nama = req.body.nama || orgToUpdate.nama;
        orgToUpdate.periode = req.body.periode || orgToUpdate.periode;

        logActivity("Struktur Organisasi", "diperbarui", orgToUpdate.nama);
        writeJsonFile("profil.json", data);
        res.json({ success: true });
    }
);

app.delete("/api/organisasi/:id", requireAuth, (req, res) => {
    const data = readJsonFile("profil.json");
    const orgId = parseInt(req.params.id);
    const orgToDelete = data.organisasi.find((o) => o.id === orgId);

    if (!orgToDelete)
        return res
            .status(404)
            .json({ success: false, message: "Organisasi tidak ditemukan." });

    data.organisasi = data.organisasi.filter((o) => o.id !== orgId);
    deleteFile(orgToDelete.gambar_struktur); // Hapus file terkait
    logActivity("Struktur Organisasi", "dihapus", orgToDelete.nama);
    writeJsonFile("profil.json", data);
    res.json({ success: true });
});

// Infografis
app.get("/api/infografis", requireAuth, (req, res) => {
    const data = readJsonFile("infografis.json");
    res.json(data);
});

app.post("/api/infografis", requireAuth, (req, res) => {
    const data = readJsonFile("infografis.json");

    // Handle semua pembaruan terkait Statistik Penduduk dalam satu blok
    if (req.body.total_penduduk !== undefined) {
        if (!data.statistik_penduduk) data.statistik_penduduk = {};
        data.statistik_penduduk.total_penduduk =
            parseInt(req.body.total_penduduk) || 0;
        data.statistik_penduduk.total_kk = parseInt(req.body.total_kk) || 0;
        data.statistik_penduduk.laki_laki = parseInt(req.body.laki_laki) || 0;
        data.statistik_penduduk.perempuan = parseInt(req.body.perempuan) || 0;

        // Helper untuk memproses grup data dinamis
        const processGroup = (category) => {
            const keys = req.body[`${category}_keys`];
            const values = req.body[`${category}_values`];
            const dataKey = `berdasarkan_${category}`;

            // Selalu reset objek untuk kategori ini
            data[dataKey] = {};

            // Jika ada data baru yang dikirim, isi kembali objeknya
            if (keys && Array.isArray(keys)) {
                keys.forEach((key, index) => {
                    if (key) {
                        // Hanya proses jika nama kategori tidak kosong
                        data[dataKey][key] = parseInt(values[index]) || 0;
                    }
                });
            }
        };

        // Proses setiap grup data agregat
        processGroup("dusun");
        processGroup("pendidikan");
        processGroup("pekerjaan");
    }

    // Handle APB Desa (logika ini tetap sama)
    if (req.body.apbdesa_update) {
        if (!data.apbdesa) data.apbdesa = { pendapatan: [], belanja: [] };
        data.apbdesa.pendapatan = [];
        if (req.body.pendapatan_jenis) {
            req.body.pendapatan_jenis.forEach((jenis, i) => {
                if (jenis)
                    data.apbdesa.pendapatan.push({
                        jenis,
                        nominal: parseInt(req.body.pendapatan_nominal[i]) || 0,
                        uraian: req.body.pendapatan_uraian[i] || "",
                    });
            });
        }
        data.apbdesa.belanja = [];
        if (req.body.belanja_jenis) {
            req.body.belanja_jenis.forEach((jenis, i) => {
                if (jenis)
                    data.apbdesa.belanja.push({
                        jenis,
                        nominal: parseInt(req.body.belanja_nominal[i]) || 0,
                        uraian: req.body.belanja_uraian[i] || "",
                    });
            });
        }
    }

    // Handle Bantuan Sosial (logika ini tetap sama)
    if (req.body.bansos_update) {
        data.bantuan_sosial = {};
        if (req.body.bansos_jenis) {
            req.body.bansos_jenis.forEach((jenis, i) => {
                if (jenis)
                    data.bantuan_sosial[jenis] =
                        parseInt(req.body.bansos_jumlah[i]) || 0;
            });
        }
    }

    logActivity("Infografis", "diperbarui", "Data infografis desa");
    writeJsonFile("infografis.json", data);
    res.json({ success: true });
});

// Berita
app.get("/api/berita", requireAuth, (req, res) =>
    res.json(readJsonFile("berita.json").berita || [])
);

app.post("/api/berita", requireAuth, upload.single("thumbnail"), (req, res) => {
    const data = readJsonFile("berita.json");
    if (!data.berita) data.berita = [];
    const newItem = {
        id: Date.now(),
        judul: req.body.judul,
        isi: req.body.isi,
        waktu_rilis: req.body.waktu_rilis || new Date().toISOString(),
        thumbnail: req.file ? "/uploads/" + req.file.filename : null,
    };
    data.berita.unshift(newItem);
    logActivity("Berita", "ditambahkan", newItem.judul);
    writeJsonFile("berita.json", data);
    res.json({ success: true });
});

app.put(
    "/api/berita/:id",
    requireAuth,
    upload.single("thumbnail"),
    (req, res) => {
        const data = readJsonFile("berita.json");
        const itemIndex = data.berita.findIndex((b) => b.id == req.params.id);
        if (itemIndex === -1)
            return res
                .status(404)
                .json({ success: false, message: "Berita tidak ditemukan" });

        const itemToUpdate = data.berita[itemIndex];
        if (req.file) {
            deleteFile(itemToUpdate.thumbnail);
            itemToUpdate.thumbnail = "/uploads/" + req.file.filename;
        }
        itemToUpdate.judul = req.body.judul;
        itemToUpdate.isi = req.body.isi;
        itemToUpdate.waktu_rilis = req.body.waktu_rilis;

        logActivity("Berita", "diperbarui", itemToUpdate.judul);
        writeJsonFile("berita.json", data);
        res.json({ success: true });
    }
);

app.delete("/api/berita/:id", requireAuth, (req, res) => {
    const data = readJsonFile("berita.json");
    const itemToDelete = data.berita.find((b) => b.id == req.params.id);
    if (!itemToDelete)
        return res
            .status(404)
            .json({ success: false, message: "Berita tidak ditemukan" });

    data.berita = data.berita.filter((b) => b.id != req.params.id);
    deleteFile(itemToDelete.thumbnail);
    logActivity("Berita", "dihapus", itemToDelete.judul);
    writeJsonFile("berita.json", data);
    res.json({ success: true });
});

// Pengumuman
app.get("/api/pengumuman", requireAuth, (req, res) =>
    res.json(readJsonFile("pengumuman.json").pengumuman || [])
);

app.post("/api/pengumuman", requireAuth, (req, res) => {
    const data = readJsonFile("pengumuman.json");
    if (!data.pengumuman) data.pengumuman = [];
    const newItem = {
        id: Date.now(),
        judul: req.body.judul,
        isi: req.body.isi,
        waktu_rilis: req.body.waktu_rilis || new Date().toISOString(),
    };
    data.pengumuman.unshift(newItem);
    logActivity("Pengumuman", "ditambahkan", newItem.judul);
    writeJsonFile("pengumuman.json", data);
    res.json({ success: true });
});

app.put("/api/pengumuman/:id", requireAuth, (req, res) => {
    const data = readJsonFile("pengumuman.json");
    const itemIndex = data.pengumuman.findIndex((p) => p.id == req.params.id);
    if (itemIndex === -1)
        return res
            .status(404)
            .json({ success: false, message: "Pengumuman tidak ditemukan" });

    const itemToUpdate = data.pengumuman[itemIndex];
    itemToUpdate.judul = req.body.judul;
    itemToUpdate.isi = req.body.isi;
    itemToUpdate.waktu_rilis = req.body.waktu_rilis;

    logActivity("Pengumuman", "diperbarui", itemToUpdate.judul);
    writeJsonFile("pengumuman.json", data);
    res.json({ success: true });
});

app.delete("/api/pengumuman/:id", requireAuth, (req, res) => {
    const data = readJsonFile("pengumuman.json");
    const itemToDelete = data.pengumuman.find((p) => p.id == req.params.id);
    if (!itemToDelete)
        return res
            .status(404)
            .json({ success: false, message: "Pengumuman tidak ditemukan" });

    data.pengumuman = data.pengumuman.filter((p) => p.id != req.params.id);
    logActivity("Pengumuman", "dihapus", itemToDelete.judul);
    writeJsonFile("pengumuman.json", data);
    res.json({ success: true });
});

// Belanja
app.get("/api/belanja", requireAuth, (req, res) =>
    res.json(readJsonFile("belanja.json").produk || [])
);

app.post("/api/belanja", requireAuth, upload.single("gambar"), (req, res) => {
    const data = readJsonFile("belanja.json");
    if (!data.produk) data.produk = [];
    const newItem = {
        id: Date.now(),
        nama: req.body.nama,
        harga: req.body.harga,
        no_whatsapp: req.body.no_whatsapp,
        gambar: req.file ? "/uploads/" + req.file.filename : null,
    };
    data.produk.unshift(newItem);
    logActivity("Produk Belanja", "ditambahkan", newItem.nama);
    writeJsonFile("belanja.json", data);
    res.json({ success: true });
});

app.put(
    "/api/belanja/:id",
    requireAuth,
    upload.single("gambar"),
    (req, res) => {
        const data = readJsonFile("belanja.json");
        const itemIndex = data.produk.findIndex((p) => p.id == req.params.id);
        if (itemIndex === -1)
            return res
                .status(404)
                .json({ success: false, message: "Produk tidak ditemukan" });

        const itemToUpdate = data.produk[itemIndex];
        if (req.file) {
            deleteFile(itemToUpdate.gambar);
            itemToUpdate.gambar = "/uploads/" + req.file.filename;
        }
        itemToUpdate.nama = req.body.nama;
        itemToUpdate.harga = req.body.harga;
        itemToUpdate.no_whatsapp = req.body.no_whatsapp;

        logActivity("Produk Belanja", "diperbarui", itemToUpdate.nama);
        writeJsonFile("belanja.json", data);
        res.json({ success: true });
    }
);

app.delete("/api/belanja/:id", requireAuth, (req, res) => {
    const data = readJsonFile("belanja.json");
    const itemToDelete = data.produk.find((p) => p.id == req.params.id);
    if (!itemToDelete)
        return res
            .status(404)
            .json({ success: false, message: "Produk tidak ditemukan" });

    data.produk = data.produk.filter((p) => p.id != req.params.id);
    deleteFile(itemToDelete.gambar);
    logActivity("Produk Belanja", "dihapus", itemToDelete.nama);
    writeJsonFile("belanja.json", data);
    res.json({ success: true });
});

// Aktivitas
app.get("/api/aktivitas", requireAuth, (req, res) =>
    res.json(readJsonFile("aktivitas.json") || [])
);

// Impor Excel
app.post(
    "/api/import-excel",
    requireAuth,
    upload.single("excel"),
    (req, res) => {
        try {
            if (!req.file)
                return res
                    .status(400)
                    .json({ success: false, message: "File Excel diperlukan" });

            const workbook = xlsx.readFile(req.file.path);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = xlsx.utils.sheet_to_json(worksheet, {
                raw: false,
            });

            deleteFile(req.file.path); // Hapus file setelah dibaca

            const processedData = {
                total_penduduk: 0,
                total_kk: 0,
                laki_laki: 0,
                perempuan: 0,
                berdasarkan_dusun: {},
                berdasarkan_pendidikan: {},
                berdasarkan_pekerjaan: {},
                bantuan_sosial: {},
            };
            const kkSet = new Set();
            const getColumnValue = (row, keys) => {
                for (const key of keys) {
                    const rowKey = Object.keys(row).find(
                        (rk) => rk.toLowerCase().trim() === key
                    );
                    if (rowKey) return row[rowKey];
                }
                return null;
            };

            jsonData.forEach((row) => {
                processedData.total_penduduk++;
                const jenisKelamin = getColumnValue(row, [
                    "jenis kelamin",
                    "gender",
                ]);
                if (jenisKelamin) {
                    if (String(jenisKelamin).toLowerCase().startsWith("l"))
                        processedData.laki_laki++;
                    else if (String(jenisKelamin).toLowerCase().startsWith("p"))
                        processedData.perempuan++;
                }
                const noKk = getColumnValue(row, [
                    "no. kartu keluarga",
                    "no kk",
                ]);
                if (noKk) kkSet.add(noKk);

                [
                    "dusun",
                    "pendidikan",
                    "pekerjaan",
                    "penerima bantuan sosial",
                ].forEach((category) => {
                    const value = getColumnValue(row, [
                        category.replace(/ /g, ""),
                        category,
                    ]);
                    if (
                        value &&
                        !["tidak", "bukan", "-"].includes(
                            String(value).toLowerCase().trim()
                        )
                    ) {
                        const targetObj =
                            category === "penerima bantuan sosial"
                                ? processedData.bantuan_sosial
                                : processedData[`berdasarkan_${category}`];
                        targetObj[value] = (targetObj[value] || 0) + 1;
                    }
                });
            });
            processedData.total_kk = kkSet.size;

            res.json({ success: true, data: processedData });
        } catch (error) {
            console.error("Error processing Excel file:", error);
            res.status(500).json({
                success: false,
                message: "Gagal memproses file Excel.",
            });
        }
    }
);

app.post("/api/apply-import", requireAuth, (req, res) => {
    const importedData = req.body;
    const currentData = readJsonFile("infografis.json");
    Object.assign(currentData, importedData);

    // Panggil fungsi tulis file dan tangkap statusnya
    const isSuccess = writeJsonFile("infografis.json", currentData);

    if (isSuccess) {
        logActivity("Data Penduduk", "diimpor", "via file Excel");
        res.json({ success: true });
    } else {
        // Kirim status error 500 jika gagal menulis file
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan di server saat menyimpan file.",
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
