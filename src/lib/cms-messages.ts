/** Keep upstream English diagnostics out of the Indonesian CMS interface. */
export function cmsErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "status" in error) {
    if (error.status === 401)
      return "Sesi Anda berakhir. Silakan masuk kembali.";
    if (error.status === 403)
      return "Anda tidak memiliki izin untuk tindakan ini.";
  }
  const message = error instanceof Error ? error.message : "";
  if (
    /^(Gagal|Tidak|Pilih|Masukkan|Silakan|Belum|Isi)\b/.test(message) ||
    /\b(wajib|tidak|harus|kosong|boleh|berakhir|kedaluwarsa|ditemukan|melebihi|belum|sudah)\b/i.test(
      message,
    )
  ) {
    return message;
  }
  return fallback;
}
