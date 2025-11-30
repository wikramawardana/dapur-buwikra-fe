# Cloudflare Origin Certificate

Folder ini berisi SSL certificate dari Cloudflare.

## File yang diperlukan:

1. `cloudflare-origin.pem` - Origin Certificate (Public Key)
2. `cloudflare-origin.key` - Private Key

## Cara mendapatkan certificate:

1. Login ke Cloudflare Dashboard
2. Pilih domain `wikra.cloud`
3. Pergi ke **SSL/TLS** → **Origin Server**
4. Klik **Create Certificate**
5. Copy dan paste isi certificate ke file-file di atas

## ⚠️ PENTING:

- Jangan commit file `.pem` dan `.key` ke Git!
- File-file tersebut sudah di-ignore di `.gitignore`
- Buat file certificate langsung di server

## Cara buat di server:

```bash
# SSH ke server
ssh root@72.61.210.144
cd /opt/dapur-buwikra-fe

# Buat file certificate
nano nginx/ssl/cloudflare-origin.pem
# Paste isi Origin Certificate, simpan

nano nginx/ssl/cloudflare-origin.key
# Paste isi Private Key, simpan

# Set permission
chmod 600 nginx/ssl/cloudflare-origin.key
chmod 644 nginx/ssl/cloudflare-origin.pem
```
