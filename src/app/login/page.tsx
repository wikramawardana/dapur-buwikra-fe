"use client";

import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  ClipboardList,
  LoaderCircle,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, Suspense, useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { LoginIllustration } from "@/components/login-illustration";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";
import { safeLoginRedirect } from "@/lib/login-redirect";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="cms-login">
      <header className="login-header">
        <Link
          href="/"
          className="login-brand"
          aria-label="Dapur Bu Wikra — halaman utama"
        >
          <BrandMark className="size-10 shrink-0" />
          <span className="leading-tight">
            <span className="block text-xs font-semibold text-muted-foreground">
              Dapur
            </span>
            <span className="block text-lg font-black tracking-tight">
              Bu Wikra<span className="text-primary">.</span>
            </span>
          </span>
        </Link>
        <Link href="/" className="login-back">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Halaman utama</span>
        </Link>
      </header>

      <main className="login-main">
        <div className="login-panel">
          <section className="login-story" aria-labelledby="login-story-title">
            <span className="login-eyebrow">DARI DAPUR, DENGAN HATI</span>
            <h2 id="login-story-title">
              Dapur tertata.
              <br /> <span className="text-primary">Pesanan terjaga.</span>
            </h2>
            <p className="login-story-copy">
              Satu tempat untuk mengelola menu, memantau pesanan, dan menyiapkan
              hari yang lebih lancar.
            </p>
            <div className="login-illustration">
              <LoginIllustration />
            </div>
            <div className="login-features">
              <span>
                <UtensilsCrossed size={18} aria-hidden="true" />
                Menu mingguan
              </span>
              <span>
                <ClipboardList size={18} aria-hidden="true" />
                Pesanan terpantau
              </span>
            </div>
          </section>

          <section className="login-form" aria-labelledby="login-title">
            <div className="login-form-content">
              <span className="login-eyebrow text-primary">DAPUR BU WIKRA</span>
              <h1 id="login-title">Selamat datang.</h1>
              <p className="login-form-description">
                Masuk untuk melanjutkan ke ruang kerja Anda.
              </p>
              {children}
              <div className="login-access-note">
                <ShieldCheck size={20} aria-hidden="true" />
                <p>
                  Akses sesuai peran.
                  <br />
                  <span>Menu yang tersedia mengikuti izin akun Anda.</span>
                </p>
              </div>
            </div>
            <p className="login-form-footer">
              Masakan rumahan, pengelolaan yang rapi.
            </p>
          </section>
        </div>
      </main>
      <footer className="login-footer">
        Dapur Bu Wikra · Sistem pengelolaan katering
      </footer>
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const callbackUrl = safeLoginRedirect(searchParams.get("callbackUrl"));
  const callbackError = searchParams.has("error");
  const errorMessage =
    signInError ||
    (callbackError
      ? "Proses masuk belum selesai. Silakan coba kembali."
      : null);

  useEffect(() => {
    if (isPending || !session) return;
    const controller = new AbortController();
    fetch("/api/auth/get-session", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user && !controller.signal.aborted) {
          window.location.replace(callbackUrl);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [session, isPending, callbackUrl]);

  const handleSignIn = async () => {
    setSignInError(null);
    setIsLoading(true);
    try {
      const result = await authClient.signIn.oauth2({
        providerId: "auth",
        callbackURL: callbackUrl,
        errorCallbackURL: `/login?error=signin&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      });
      if (result.error) throw new Error("Sign in failed");
    } catch {
      setSignInError(
        "Belum bisa masuk. Periksa koneksi Anda, lalu coba kembali.",
      );
      setIsLoading(false);
    }
  };

  return (
    <LoginLayout>
      {errorMessage && (
        <div className="login-error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      )}
      <Button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading || isPending}
        aria-busy={isLoading || isPending}
        className="login-submit"
      >
        {isLoading || isPending ? (
          <>
            <LoaderCircle
              className="size-5 motion-safe:animate-spin"
              aria-hidden="true"
            />
            <span>{isLoading ? "Mengalihkan…" : "Memeriksa sesi…"}</span>
          </>
        ) : (
          <>
            <span className="login-google">
              <GoogleIcon className="size-5" />
            </span>
            <span>Lanjutkan dengan Google</span>
            <ArrowRight className="ml-auto size-4" aria-hidden="true" />
          </>
        )}
      </Button>
      <p className="login-signin-hint" role="status">
        {isLoading
          ? "Membuka halaman masuk. Tunggu sebentar."
          : "Anda akan diarahkan ke halaman masuk untuk melanjutkan."}
      </p>
    </LoginLayout>
  );
}

function LoginLoading() {
  return (
    <LoginLayout>
      <Button disabled aria-busy="true" className="login-submit">
        <LoaderCircle
          className="size-5 motion-safe:animate-spin"
          aria-hidden="true"
        />
        Memeriksa sesi…
      </Button>
      <p className="login-signin-hint" role="status">
        Menyiapkan halaman masuk.
      </p>
    </LoginLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
