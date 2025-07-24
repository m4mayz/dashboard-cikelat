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
        cb(null, "uploads/");
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
        res.redirect("/login.html");
    }
};

// Data helper functions
const readJsonFile = (filename) => {
    try {
        const data = fs.readFileSync(
            path.join(__dirname, "data", filename),
            "utf8"
        );
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

const writeJsonFile = (filename, data) => {
    fs.writeFileSync(
        path.join(__dirname, "data", filename),
        JSON.stringify(data, null, 2)
    );
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

        if (timeElapsed > 60 * 60 * 1000) {
            // 1 hour
            req.session.destroy();
            res.json({ authenticated: false, expired: true });
        } else {
            res.json({
                authenticated: true,
                timeRemaining: 60 * 60 * 1000 - timeElapsed,
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

// Home data
app.get("/api/home", requireAuth, (req, res) => {
    const homeData = readJsonFile("home.json");
    const infografisData = readJsonFile("infografis.json");

    // Combine home data with statistik penduduk from infografis
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

    // Update home-specific fields in home.json
    if (req.body.nama_kepala_desa)
        homeData.nama_kepala_desa = req.body.nama_kepala_desa;
    if (req.body.sambutan) homeData.sambutan = req.body.sambutan;
    if (req.body.pengumuman_terbaru)
        homeData.pengumuman_terbaru = req.body.pengumuman_terbaru;

    if (req.file) {
        homeData.foto = "/uploads/" + req.file.filename;
    }

    // Update statistik penduduk in infografis.json
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

// Profile data
app.get("/api/profil", requireAuth, (req, res) => {
    const data = readJsonFile("profil.json");
    res.json(data);
});

app.post(
    "/api/profil",
    requireAuth,
    upload.single("gambar_struktur"),
    (req, res) => {
        const data = readJsonFile("profil.json");
        const updateData = { ...req.body };

        if (req.file) {
            updateData.gambar_struktur = "/uploads/" + req.file.filename;
        }

        Object.assign(data, updateData);
        writeJsonFile("profil.json", data);
        res.json({ success: true });
    }
);

// Infografis data
app.get("/api/infografis", requireAuth, (req, res) => {
    const data = readJsonFile("infografis.json");
    res.json(data);
});

app.post("/api/infografis", requireAuth, (req, res) => {
    console.log("Infografis POST request body:", req.body);
    const data = readJsonFile("infografis.json");

    // Handle statistik penduduk
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

    // Handle APB Desa
    if (req.body.pendapatan_jenis || req.body.belanja_jenis) {
        if (!data.apbdesa) data.apbdesa = { pendapatan: [], belanja: [] };

        // Process pendapatan
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

        // Process belanja
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

    // Handle bantuan sosial
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
        if (!data.berita) data.berita = [];

        const beritaIndex = data.berita.findIndex((b) => b.id == req.params.id);
        if (beritaIndex !== -1) {
            data.berita[beritaIndex] = {
                ...data.berita[beritaIndex],
                judul: req.body.judul,
                isi: req.body.isi,
                waktu_rilis: req.body.waktu_rilis,
            };

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
    if (!data.berita) data.berita = [];

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
    console.log("Pengumuman POST request body:", req.body);
    const data = readJsonFile("pengumuman.json");
    if (!data.pengumuman) data.pengumuman = [];

    const pengumuman = {
        id: Date.now(),
        judul: req.body.judul,
        isi: req.body.isi,
        waktu_rilis: req.body.waktu_rilis || new Date().toISOString(),
    };

    console.log("Pengumuman object to save:", pengumuman);
    data.pengumuman.push(pengumuman);
    writeJsonFile("pengumuman.json", data);
    res.json({ success: true });
});

app.put("/api/pengumuman/:id", requireAuth, (req, res) => {
    const data = readJsonFile("pengumuman.json");
    if (!data.pengumuman) data.pengumuman = [];

    const pengumumanIndex = data.pengumuman.findIndex(
        (p) => p.id == req.params.id
    );
    if (pengumumanIndex !== -1) {
        data.pengumuman[pengumumanIndex] = {
            ...data.pengumuman[pengumumanIndex],
            judul: req.body.judul,
            isi: req.body.isi,
            waktu_rilis: req.body.waktu_rilis,
        };

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
    if (!data.pengumuman) data.pengumuman = [];

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
        if (!data.produk) data.produk = [];

        const produkIndex = data.produk.findIndex((p) => p.id == req.params.id);
        if (produkIndex !== -1) {
            data.produk[produkIndex] = {
                ...data.produk[produkIndex],
                nama: req.body.nama,
                harga: req.body.harga,
                no_whatsapp: req.body.no_whatsapp,
            };

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
    if (!data.produk) data.produk = [];

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

            // Process and structure data
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

            // Parse data from Excel (this is a basic example)
            jsonData.forEach((row) => {
                // Process each row based on your Excel structure
                // This is just an example structure
                if (row["Total Penduduk"])
                    processedData.total_penduduk = row["Total Penduduk"];
                if (row["Total KK"]) processedData.total_kk = row["Total KK"];
                if (row["Laki-laki"])
                    processedData.laki_laki = row["Laki-laki"];
                if (row["Perempuan"])
                    processedData.perempuan = row["Perempuan"];
            });

            // Delete uploaded file
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

    // Merge imported data with current data
    Object.assign(currentData, importedData);
    writeJsonFile("infografis.json", currentData);

    res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
