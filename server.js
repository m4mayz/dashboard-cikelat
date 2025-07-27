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

// Session configuration
app.use(
    session({
        secret: "cikelat-admin-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 60 * 60 * 1000, // 1 hour
            secure: false,
        },
    })
);

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Pastikan folder 'uploads' ada
        const uploadPath = "uploads/";
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        // Jika permintaan API, kirim error, jika tidak, redirect.
        if (req.path.startsWith("/api/")) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }
        res.redirect("/login.html");
    }
};

// Data helper functions
const readJsonFile = (filename) => {
    try {
        const filePath = path.join(__dirname, "data", filename);
        if (!fs.existsSync(filePath)) {
            // Jika file tidak ada, buat file kosong dengan struktur dasar
            let basicStructure = {};
            if (filename === "profil.json") {
                basicStructure = {
                    visi: "",
                    misi: "",
                    sejarah: "",
                    organisasi: [],
                };
            }
            // Tambahkan struktur dasar untuk file lain jika perlu
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
    } catch (error) {
        console.error(`Error writing to ${filename}:`, error);
    }
};

// Routes
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

// Login endpoint
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "password123") {
        req.session.authenticated = true;
        req.session.loginTime = Date.now();
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Username atau password salah" });
    }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Check session endpoint
app.get("/api/check-session", (req, res) => {
    if (req.session.authenticated) {
        const currentTime = Date.now();
        const loginTime = req.session.loginTime || currentTime;
        const timeElapsed = currentTime - loginTime;
        const maxAge = 60 * 60 * 1000; // 1 hour

        if (timeElapsed > maxAge) {
            req.session.destroy();
            res.json({ authenticated: false, expired: true });
        } else {
            res.json({
                authenticated: true,
                timeRemaining: maxAge - timeElapsed,
            });
        }
    } else {
        res.json({ authenticated: false });
    }
});

// Protected routes
app.get("/dashboard.html", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// API endpoints for data management

// Home data (Tidak ada perubahan)
app.get("/api/home", requireAuth, (req, res) => {
    const homeData = readJsonFile("home.json");
    const infografisData = readJsonFile("infografis.json");
    const responseData = {
        nama_kepala_desa: homeData.nama_kepala_desa || "",
        sambutan: homeData.sambutan || "",
        foto: homeData.foto || "",
        pengumuman_terbaru: homeData.pengumuman_terbaru || "",
        total_penduduk: infografisData.statistik_penduduk?.total_penduduk || 0,
        total_kk: infografisData.statistik_penduduk?.total_kk || 0,
        laki_laki: infografisData.statistik_penduduk?.laki_laki || 0,
        perempuan: infografisData.statistik_penduduk?.perempuan || 0,
    };
    res.json(responseData);
});

app.post("/api/home", requireAuth, upload.single("foto"), (req, res) => {
    const homeData = readJsonFile("home.json");
    const infografisData = readJsonFile("infografis.json");

    if (req.body.nama_kepala_desa)
        homeData.nama_kepala_desa = req.body.nama_kepala_desa;
    if (req.body.sambutan) homeData.sambutan = req.body.sambutan;
    if (req.body.pengumuman_terbaru)
        homeData.pengumuman_terbaru = req.body.pengumuman_terbaru;
    if (req.file) homeData.foto = "/uploads/" + req.file.filename;

    if (!infografisData.statistik_penduduk)
        infografisData.statistik_penduduk = {};
    if (req.body.total_penduduk)
        infografisData.statistik_penduduk.total_penduduk = parseInt(
            req.body.total_penduduk
        );
    if (req.body.total_kk)
        infografisData.statistik_penduduk.total_kk = parseInt(
            req.body.total_kk
        );
    if (req.body.laki_laki)
        infografisData.statistik_penduduk.laki_laki = parseInt(
            req.body.laki_laki
        );
    if (req.body.perempuan)
        infografisData.statistik_penduduk.perempuan = parseInt(
            req.body.perempuan
        );

    writeJsonFile("home.json", homeData);
    writeJsonFile("infografis.json", infografisData);
    res.json({ success: true });
});

//===================================================================
// PERUBAHAN UTAMA DIMULAI DARI SINI
//===================================================================

// Profile data
app.get("/api/profil", requireAuth, (req, res) => {
    const data = readJsonFile("profil.json");
    // Pastikan struktur data benar, terutama 'organisasi' harus array
    if (!Array.isArray(data.organisasi)) {
        data.organisasi = [];
    }
    res.json(data);
});

// Endpoint ini HANYA untuk update Visi, Misi, Sejarah. TIDAK lagi menangani organisasi.
app.post("/api/profil", requireAuth, (req, res) => {
    const data = readJsonFile("profil.json");

    // Update hanya field yang relevan
    if (req.body.visi) data.visi = req.body.visi;
    if (req.body.misi) data.misi = req.body.misi;
    if (req.body.sejarah) data.sejarah = req.body.sejarah;

    writeJsonFile("profil.json", data);
    res.json({ success: true });
});

// ENDPOINT BARU UNTUK MANAJEMEN ORGANISASI (CRUD)

// 1. CREATE: Menambah organisasi baru
app.post(
    "/api/organisasi",
    requireAuth,
    upload.single("gambar_struktur"),
    (req, res) => {
        const data = readJsonFile("profil.json");
        if (!Array.isArray(data.organisasi)) {
            data.organisasi = [];
        }

        const newOrganisasi = {
            id: Date.now(), // ID unik berdasarkan timestamp
            nama: req.body.nama,
            periode: req.body.periode,
            gambar_struktur: req.file ? "/uploads/" + req.file.filename : null,
        };

        data.organisasi.push(newOrganisasi);
        writeJsonFile("profil.json", data);
        res.json({
            success: true,
            message: "Organisasi berhasil ditambahkan.",
        });
    }
);

// 2. UPDATE: Mengubah organisasi yang ada berdasarkan ID
// Menggunakan POST agar konsisten dengan frontend yang mengirim file
app.post(
    "/api/organisasi/:id",
    requireAuth,
    upload.single("gambar_struktur"),
    (req, res) => {
        const data = readJsonFile("profil.json");
        const orgId = parseInt(req.params.id);
        const orgIndex = data.organisasi.findIndex((o) => o.id === orgId);

        if (orgIndex === -1) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Organisasi tidak ditemukan.",
                });
        }

        // Update data
        const orgToUpdate = data.organisasi[orgIndex];
        orgToUpdate.nama = req.body.nama || orgToUpdate.nama;
        orgToUpdate.periode = req.body.periode || orgToUpdate.periode;
        if (req.file) {
            // Hapus file lama jika ada untuk menghemat ruang (opsional)
            if (orgToUpdate.gambar_struktur) {
                const oldImagePath = path.join(
                    __dirname,
                    orgToUpdate.gambar_struktur
                );
                if (fs.existsSync(oldImagePath)) {
                    // fs.unlinkSync(oldImagePath);
                }
            }
            orgToUpdate.gambar_struktur = "/uploads/" + req.file.filename;
        }

        data.organisasi[orgIndex] = orgToUpdate;
        writeJsonFile("profil.json", data);
        res.json({ success: true, message: "Organisasi berhasil diperbarui." });
    }
);

// 3. DELETE: Menghapus organisasi berdasarkan ID
app.delete("/api/organisasi/:id", requireAuth, (req, res) => {
    const data = readJsonFile("profil.json");
    const orgId = parseInt(req.params.id);

    const initialLength = data.organisasi.length;
    data.organisasi = data.organisasi.filter((o) => o.id !== orgId);

    if (data.organisasi.length === initialLength) {
        return res
            .status(404)
            .json({ success: false, message: "Organisasi tidak ditemukan." });
    }

    writeJsonFile("profil.json", data);
    res.json({ success: true, message: "Organisasi berhasil dihapus." });
});

//===================================================================
// AKHIR DARI PERUBAHAN UTAMA
//===================================================================

// Infografis data (Tidak ada perubahan)
app.get("/api/infografis", requireAuth, (req, res) => {
    const data = readJsonFile("infografis.json");
    res.json(data);
});
app.post("/api/infografis", requireAuth, (req, res) => {
    const data = readJsonFile("infografis.json");
    if (
        req.body.total_penduduk ||
        req.body.total_kk ||
        req.body.laki_laki ||
        req.body.perempuan
    ) {
        if (!data.statistik_penduduk) data.statistik_penduduk = {};
        if (req.body.total_penduduk)
            data.statistik_penduduk.total_penduduk = parseInt(
                req.body.total_penduduk
            );
        if (req.body.total_kk)
            data.statistik_penduduk.total_kk = parseInt(req.body.total_kk);
        if (req.body.laki_laki)
            data.statistik_penduduk.laki_laki = parseInt(req.body.laki_laki);
        if (req.body.perempuan)
            data.statistik_penduduk.perempuan = parseInt(req.body.perempuan);
    }
    if (req.body.pendapatan_jenis || req.body.belanja_jenis) {
        if (!data.apbdesa) data.apbdesa = { pendapatan: [], belanja: [] };
        if (req.body.pendapatan_jenis) {
            data.apbdesa.pendapatan = [];
            const jenisArray = Array.isArray(req.body.pendapatan_jenis)
                ? req.body.pendapatan_jenis
                : [req.body.pendapatan_jenis];
            const nominalArray = Array.isArray(req.body.pendapatan_nominal)
                ? req.body.pendapatan_nominal
                : [req.body.pendapatan_nominal];
            const uraianArray = Array.isArray(req.body.pendapatan_uraian)
                ? req.body.pendapatan_uraian
                : [req.body.pendapatan_uraian];
            for (let i = 0; i < jenisArray.length; i++) {
                if (jenisArray[i]) {
                    data.apbdesa.pendapatan.push({
                        jenis: jenisArray[i],
                        nominal: parseInt(nominalArray[i]) || 0,
                        uraian: uraianArray[i] || "",
                    });
                }
            }
        }
        if (req.body.belanja_jenis) {
            data.apbdesa.belanja = [];
            const jenisArray = Array.isArray(req.body.belanja_jenis)
                ? req.body.belanja_jenis
                : [req.body.belanja_jenis];
            const nominalArray = Array.isArray(req.body.belanja_nominal)
                ? req.body.belanja_nominal
                : [req.body.belanja_nominal];
            const uraianArray = Array.isArray(req.body.belanja_uraian)
                ? req.body.belanja_uraian
                : [req.body.belanja_uraian];
            for (let i = 0; i < jenisArray.length; i++) {
                if (jenisArray[i]) {
                    data.apbdesa.belanja.push({
                        jenis: jenisArray[i],
                        nominal: parseInt(nominalArray[i]) || 0,
                        uraian: uraianArray[i] || "",
                    });
                }
            }
        }
    }
    if (req.body.bansos_jenis) {
        data.bantuan_sosial = {};
        const jenisArray = Array.isArray(req.body.bansos_jenis)
            ? req.body.bansos_jenis
            : [req.body.bansos_jenis];
        const jumlahArray = Array.isArray(req.body.bansos_jumlah)
            ? req.body.bansos_jumlah
            : [req.body.bansos_jumlah];
        for (let i = 0; i < jenisArray.length; i++) {
            if (jenisArray[i]) {
                data.bantuan_sosial[jenisArray[i]] =
                    parseInt(jumlahArray[i]) || 0;
            }
        }
    }
    writeJsonFile("infografis.json", data);
    res.json({ success: true });
});

// Sisa endpoint (Berita, Pengumuman, Belanja, Excel) tidak ada perubahan
// Berita
app.get("/api/berita", requireAuth, (req, res) => {
    const data = readJsonFile("berita.json");
    res.json(data.berita || []);
});
app.post("/api/berita", requireAuth, upload.single("thumbnail"), (req, res) => {
    const data = readJsonFile("berita.json");
    if (!data.berita) data.berita = [];
    const berita = {
        id: Date.now(),
        judul: req.body.judul,
        isi: req.body.isi,
        waktu_rilis: req.body.waktu_rilis || new Date().toISOString(),
        thumbnail: req.file ? "/uploads/" + req.file.filename : null,
    };
    data.berita.push(berita);
    writeJsonFile("berita.json", data);
    res.json({ success: true });
});
app.put(
    "/api/berita/:id",
    requireAuth,
    upload.single("thumbnail"),
    (req, res) => {
        const data = readJsonFile("berita.json");
        const beritaIndex = data.berita.findIndex((b) => b.id == req.params.id);
        if (beritaIndex !== -1) {
            data.berita[beritaIndex].judul = req.body.judul;
            data.berita[beritaIndex].isi = req.body.isi;
            data.berita[beritaIndex].waktu_rilis = req.body.waktu_rilis;
            if (req.file) {
                data.berita[beritaIndex].thumbnail =
                    "/uploads/" + req.file.filename;
            }
            writeJsonFile("berita.json", data);
            res.json({ success: true });
        } else {
            res.status(404).json({
                success: false,
                message: "Berita tidak ditemukan",
            });
        }
    }
);
app.delete("/api/berita/:id", requireAuth, (req, res) => {
    const data = readJsonFile("berita.json");
    data.berita = data.berita.filter((b) => b.id != req.params.id);
    writeJsonFile("berita.json", data);
    res.json({ success: true });
});

// Pengumuman
app.get("/api/pengumuman", requireAuth, (req, res) => {
    const data = readJsonFile("pengumuman.json");
    res.json(data.pengumuman || []);
});
app.post("/api/pengumuman", requireAuth, (req, res) => {
    const data = readJsonFile("pengumuman.json");
    if (!data.pengumuman) data.pengumuman = [];
    const pengumuman = {
        id: Date.now(),
        judul: req.body.judul,
        isi: req.body.isi,
        waktu_rilis: req.body.waktu_rilis || new Date().toISOString(),
    };
    data.pengumuman.push(pengumuman);
    writeJsonFile("pengumuman.json", data);
    res.json({ success: true });
});
app.put("/api/pengumuman/:id", requireAuth, (req, res) => {
    const data = readJsonFile("pengumuman.json");
    const pengumumanIndex = data.pengumuman.findIndex(
        (p) => p.id == req.params.id
    );
    if (pengumumanIndex !== -1) {
        data.pengumuman[pengumumanIndex].judul = req.body.judul;
        data.pengumuman[pengumumanIndex].isi = req.body.isi;
        data.pengumuman[pengumumanIndex].waktu_rilis = req.body.waktu_rilis;
        writeJsonFile("pengumuman.json", data);
        res.json({ success: true });
    } else {
        res.status(404).json({
            success: false,
            message: "Pengumuman tidak ditemukan",
        });
    }
});
app.delete("/api/pengumuman/:id", requireAuth, (req, res) => {
    const data = readJsonFile("pengumuman.json");
    data.pengumuman = data.pengumuman.filter((p) => p.id != req.params.id);
    writeJsonFile("pengumuman.json", data);
    res.json({ success: true });
});

// Belanja
app.get("/api/belanja", requireAuth, (req, res) => {
    const data = readJsonFile("belanja.json");
    res.json(data.produk || []);
});
app.post("/api/belanja", requireAuth, upload.single("gambar"), (req, res) => {
    const data = readJsonFile("belanja.json");
    if (!data.produk) data.produk = [];
    const produk = {
        id: Date.now(),
        nama: req.body.nama,
        harga: req.body.harga,
        no_whatsapp: req.body.no_whatsapp,
        gambar: req.file ? "/uploads/" + req.file.filename : null,
    };
    data.produk.push(produk);
    writeJsonFile("belanja.json", data);
    res.json({ success: true });
});
app.put(
    "/api/belanja/:id",
    requireAuth,
    upload.single("gambar"),
    (req, res) => {
        const data = readJsonFile("belanja.json");
        const produkIndex = data.produk.findIndex((p) => p.id == req.params.id);
        if (produkIndex !== -1) {
            data.produk[produkIndex].nama = req.body.nama;
            data.produk[produkIndex].harga = req.body.harga;
            data.produk[produkIndex].no_whatsapp = req.body.no_whatsapp;
            if (req.file) {
                data.produk[produkIndex].gambar =
                    "/uploads/" + req.file.filename;
            }
            writeJsonFile("belanja.json", data);
            res.json({ success: true });
        } else {
            res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan",
            });
        }
    }
);
app.delete("/api/belanja/:id", requireAuth, (req, res) => {
    const data = readJsonFile("belanja.json");
    data.produk = data.produk.filter((p) => p.id != req.params.id);
    writeJsonFile("belanja.json", data);
    res.json({ success: true });
});

// Excel import
app.post(
    "/api/import-excel",
    requireAuth,
    upload.single("excel"),
    (req, res) => {
        try {
            if (!req.file) {
                return res
                    .status(400)
                    .json({ success: false, message: "File Excel diperlukan" });
            }
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet);
            const processedData = {
                total_penduduk: 0,
                total_kk: 0,
                laki_laki: 0,
                perempuan: 0,
                berdasarkan_dusun: {},
                berdasarkan_pendidikan: {},
                berdasarkan_pekerjaan: {},
                bansos: {},
            };
            jsonData.forEach((row) => {
                if (row["Total Penduduk"])
                    processedData.total_penduduk = row["Total Penduduk"];
                if (row["Total KK"]) processedData.total_kk = row["Total KK"];
                if (row["Laki-laki"])
                    processedData.laki_laki = row["Laki-laki"];
                if (row["Perempuan"])
                    processedData.perempuan = row["Perempuan"];
            });
            fs.unlinkSync(req.file.path);
            res.json({ success: true, data: processedData });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error processing Excel file: " + error.message,
            });
        }
    }
);
app.post("/api/apply-import", requireAuth, (req, res) => {
    const importedData = req.body;
    const currentData = readJsonFile("infografis.json");
    Object.assign(currentData, importedData);
    writeJsonFile("infografis.json", currentData);
    res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
