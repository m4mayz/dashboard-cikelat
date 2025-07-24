# Dashboard Admin - Pemerintah Desa Cikelat

Dashboard admin untuk mengelola konten website Pemerintah Desa Cikelat dengan fungsionalitas CRUD lengkap menggunakan Node.js, HTML, dan Tailwind CSS.

## 🚀 Fitur Utama

### Autentikasi

-   Login dengan username: `admin` dan password: `password123`
-   Sesi aktif selama 1 jam dengan auto-logout
-   Monitoring waktu sesi real-time

### Menu Navigasi

1. **Dashboard Utama** - Statistik dan overview
2. **Home** - Kelola data beranda (Kepala Desa, sambutan, statistik)
3. **Profil Desa** - Visi/Misi, Sejarah, Struktur Organisasi
4. **Infografis** - Statistik penduduk, APBDesa, Bantuan Sosial
5. **Berita** - CRUD berita dengan thumbnail
6. **Pengumuman** - CRUD pengumuman
7. **Belanja** - Katalog produk dengan WhatsApp integration
8. **Impor Data Penduduk** - Upload Excel untuk update statistik

### Teknologi

-   **Backend**: Node.js + Express
-   **Frontend**: HTML + Tailwind CSS (no framework frontend)
-   **Storage**: JSON files untuk data, folder lokal untuk gambar
-   **Upload**: Multer dengan limit 5MB
-   **Excel Processing**: XLSX library

## 📁 Struktur Proyek

```
dashboard-cikelat/
├── server.js              # Server Express utama
├── package.json           # Dependencies dan scripts
├── public/                # Static files
│   ├── login.html         # Halaman login
│   ├── dashboard.html     # Dashboard utama
│   └── js/
│       └── dashboard.js   # JavaScript frontend
├── data/                  # JSON data files
│   ├── home.json         # Data home
│   ├── profil.json       # Data profil desa
│   ├── infografis.json   # Data statistik
│   ├── berita.json       # Data berita
│   ├── pengumuman.json   # Data pengumuman
│   └── belanja.json      # Data produk
└── uploads/              # Folder upload gambar
```

## 🛠️ Instalasi dan Menjalankan

1. **Install Dependencies**:

    ```bash
    npm install
    ```

2. **Menjalankan Server**:

    ```bash
    npm start
    ```

3. **Akses Dashboard**:
    - Buka browser: `http://localhost:3000`
    - Login dengan username: `admin`, password: `password123`

## 📝 API Endpoints

### Autentikasi

-   `POST /api/login` - Login
-   `POST /api/logout` - Logout
-   `GET /api/check-session` - Check session status

### Data Management

-   `GET|POST /api/home` - Home data
-   `GET|POST /api/profil` - Profile data
-   `GET|POST /api/infografis` - Infographic data
-   `GET|POST|PUT|DELETE /api/berita` - News management
-   `GET|POST|PUT|DELETE /api/pengumuman` - Announcements
-   `GET|POST|PUT|DELETE /api/belanja` - Products

### File Upload

-   `POST /api/import-excel` - Import Excel data
-   `POST /api/apply-import` - Apply imported data

## 🎨 UI/UX Features

-   **Responsive Design** dengan Tailwind CSS
-   **Modern Interface** dengan warna utama #3f9891 (Teal)
-   **Fullscreen Popup Forms** untuk editing
-   **Mass Delete** dengan checkbox selection
-   **Real-time Session Timer**
-   **Loading States** dan notifications
-   **Logo SVG** dengan pattern grid background

## 📊 Data Structure

### Home Data

```json
{
  "nama_kepala_desa": "string",
  "sambutan": "string",
  "foto": "string",
  "total_penduduk": number,
  "total_kk": number,
  "laki_laki": number,
  "perempuan": number
}
```

### Berita Data

```json
{
  "id": number,
  "judul": "string",
  "isi": "string",
  "thumbnail": "string",
  "waktu_rilis": "ISO string"
}
```

### Belanja Data

```json
{
  "id": number,
  "nama": "string",
  "gambar": "string",
  "harga": number,
  "no_whatsapp": "string"
}
```

## 🔒 Keamanan

-   Session-based authentication
-   File upload restrictions (5MB, image only)
-   Input validation dan sanitization
-   CORS protection
-   Auto session timeout (1 hour)

## 📱 Responsive Design

Dashboard fully responsive dengan breakpoints:

-   Mobile: < 768px
-   Tablet: 768px - 1024px
-   Desktop: > 1024px

## 🚨 Error Handling

-   Comprehensive error messages
-   Network error handling
-   File upload error handling
-   Session expiry notifications
-   Form validation errors

## 📈 Future Enhancements

-   Database integration (PostgreSQL/MySQL)
-   User roles dan permissions
-   Data export features
-   Advanced analytics
-   Email notifications
-   Multi-language support

## 📞 Support

Untuk bantuan atau pertanyaan terkait dashboard ini, silakan hubungi administrator sistem.

---

**© 2025 Pemerintah Desa Cikelat. All rights reserved.**
