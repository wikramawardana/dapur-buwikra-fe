"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  KeyRound,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Store,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/format";
import type { ShopeeSummaryStats, ShopeeTransactionRow } from "@/lib/shopee-db";
import {
  fetchShopeeTokenStatus,
  fetchShopeeTransactions,
  linkShopeeTransactionToOrder,
  syncShopeeMutations,
  updateShopeeTokenSetting,
} from "@/services/shopee.service";

export default function ShopeePayPartnerPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();

  // Data state
  const [transactions, setTransactions] = React.useState<
    ShopeeTransactionRow[]
  >([]);
  const [summary, setSummary] = React.useState<ShopeeSummaryStats>({
    totalGross: 0,
    totalCount: 0,
    claimedCount: 0,
    unclaimedCount: 0,
    unclaimedAmount: 0,
  });
  const [pagination, setPagination] = React.useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Token status
  const [tokenStatus, setTokenStatus] = React.useState<{
    configured: boolean;
    maskedToken: string;
    isValid: boolean;
    error?: string;
  }>({
    configured: false,
    maskedToken: "",
    isValid: false,
  });

  // Filter state
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "claimed" | "unclaimed"
  >("all");
  const [datePreset, setDatePreset] = React.useState<
    "today" | "7d" | "30d" | "all"
  >("7d");

  // Loading states
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isCheckingToken, setIsCheckingToken] = React.useState(false);

  // Modal dialog states
  const [isTokenDialogOpen, setIsTokenDialogOpen] = React.useState(false);
  const [newTokenInput, setNewTokenInput] = React.useState("");
  const [isSavingToken, setIsSavingToken] = React.useState(false);

  const [detailItem, setDetailItem] =
    React.useState<ShopeeTransactionRow | null>(null);
  const [linkModalItem, setLinkModalItem] =
    React.useState<ShopeeTransactionRow | null>(null);
  const [linkOrderId, setLinkOrderId] = React.useState("");
  const [linkCustomerName, setLinkCustomerName] = React.useState("");
  const [markOrderPaid, setMarkOrderPaid] = React.useState(true);
  const [isLinking, setIsLinking] = React.useState(false);

  // Check auth
  React.useEffect(() => {
    if (
      !isSessionLoading &&
      (!session?.user || session.user.role !== "admin")
    ) {
      router.replace("/unauthorized");
    }
  }, [session, isSessionLoading, router]);

  // Compute start/end dates from preset
  const getDateRange = React.useCallback(() => {
    const now = new Date();
    if (datePreset === "today") {
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString();
      return { startDate: start, endDate: now.toISOString() };
    }
    if (datePreset === "7d") {
      const start = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      return { startDate: start, endDate: now.toISOString() };
    }
    if (datePreset === "30d") {
      const start = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      return { startDate: start, endDate: now.toISOString() };
    }
    return { startDate: undefined, endDate: undefined };
  }, [datePreset]);

  // Load transactions
  const loadData = React.useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      try {
        const { startDate, endDate } = getDateRange();
        const res = await fetchShopeeTransactions({
          page: pageToLoad,
          limit: pagination.limit,
          search: search.trim() || undefined,
          status: statusFilter,
          startDate,
          endDate,
        });

        setTransactions(res.data);
        setSummary(res.summary);
        setPagination(res.pagination);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Gagal memuat transaksi",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [getDateRange, pagination.limit, search, statusFilter],
  );

  // Check token status
  const checkToken = React.useCallback(async () => {
    setIsCheckingToken(true);
    try {
      const res = await fetchShopeeTokenStatus();
      setTokenStatus(res);
    } catch {
      // ignore
    } finally {
      setIsCheckingToken(false);
    }
  }, []);

  React.useEffect(() => {
    if (session?.user?.role === "admin") {
      loadData(1);
      checkToken();
    }
  }, [session, loadData, checkToken]);

  // Trigger sync from ShopeePay API
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const days = datePreset === "today" ? 1 : datePreset === "30d" ? 30 : 7;
      const res = await syncShopeeMutations(days);

      if (res.tokenExpired) {
        toast.error(
          "Sesi ShopeePay telah berakhir. Silakan perbarui session token!",
        );
        setIsTokenDialogOpen(true);
      } else {
        toast.success(res.message);
        loadData(1);
        checkToken();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal sinkronisasi");
    } finally {
      setIsSyncing(false);
    }
  };

  // Save new session token
  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenInput.trim()) {
      toast.error("Token tidak boleh kosong");
      return;
    }

    setIsSavingToken(true);
    try {
      const res = await updateShopeeTokenSetting(newTokenInput.trim());
      toast.success(res.message);
      setIsTokenDialogOpen(false);
      setNewTokenInput("");
      checkToken();
      handleSync();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan token");
    } finally {
      setIsSavingToken(false);
    }
  };

  // Link transaction to order
  const handleLinkTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModalItem || !linkOrderId.trim()) {
      toast.error("ID Pesanan wajib diisi");
      return;
    }

    setIsLinking(true);
    try {
      const res = await linkShopeeTransactionToOrder({
        transactionId: linkModalItem.id,
        orderId: linkOrderId.trim(),
        customerName: linkCustomerName.trim() || undefined,
        markOrderPaid,
      });

      toast.success(res.message);
      setLinkModalItem(null);
      setLinkOrderId("");
      setLinkCustomerName("");
      loadData(pagination.page);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghubungkan transaksi",
      );
    } finally {
      setIsLinking(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  const formatTxDate = (dateStr: string | number) => {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-6 rounded-2xl border border-orange-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
              <Smartphone className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                ShopeePay Partner
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium dark:bg-orange-950 dark:text-orange-300">
                  Merchant Portal
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Mutasi Pembayaran QRIS & Rekonsiliasi Otomatis Dapur Bu Wikra
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-orange-500" />
              Toko: <strong className="text-foreground">DapurBuWikra</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-orange-500" />
              Merchant ID: <strong className="text-foreground">20463602</strong>
            </span>
            <span>•</span>
            <span>
              Store ID: <strong className="text-foreground">23091772</strong>
            </span>
            <span>•</span>
            <span>
              Terminal: <strong className="text-foreground">A01</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Token Status Badge */}
          <button
            type="button"
            onClick={() => setIsTokenDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-background hover:bg-muted text-xs transition-colors cursor-pointer"
          >
            {isCheckingToken ? (
              <Spinner className="w-3.5 h-3.5" />
            ) : tokenStatus.isValid ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Sesi Aktif
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {tokenStatus.configured ? "Sesi Berakhir" : "Belum Ada Token"}
                </span>
              </>
            )}
            <KeyRound className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTokenDialogOpen(true)}
            className="text-xs h-9"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5" />
            Kelola Sesi
          </Button>

          <Button
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="text-xs h-9 bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Menyinkronkan...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Tarik Mutasi Baru
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Settlement */}
        <Card className="shadow-xs border-orange-500/20 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Pemasukan (Settled)
            </CardTitle>
            <span className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Wallet className="w-4 h-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totalGross)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari <strong>{summary.totalCount}</strong> transaksi berhasil
            </p>
          </CardContent>
        </Card>

        {/* Claimed to Orders */}
        <Card className="shadow-xs border-emerald-500/20 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Terhubung ke Pesanan
            </CardTitle>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.claimedCount} Transaksi
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Otomatis & manual dicocokkan
            </p>
          </CardContent>
        </Card>

        {/* Unclaimed / Walk-in */}
        <Card className="shadow-xs border-amber-500/20 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Belum Terhubung
            </CardTitle>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.unclaimedCount} Transaksi
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nominal:{" "}
              <strong>{formatCurrency(summary.unclaimedAmount)}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card className="shadow-xs border-primary/20 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Penyimpanan Lokal
            </CardTitle>
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">PostgreSQL</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tersimpan aman di DB Dapur Bu Wikra
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari ID transaksi, referensi, order ID, nama, atau nominal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadData(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadData(1)}
              className="h-9 text-xs px-3"
            >
              Cari
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val: "all" | "claimed" | "unclaimed") => {
                setStatusFilter(val);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue placeholder="Status Pesanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="claimed">Terhubung</SelectItem>
                <SelectItem value="unclaimed">Belum Terhubung</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Preset */}
            <Select
              value={datePreset}
              onValueChange={(val: "today" | "7d" | "30d" | "all") => {
                setDatePreset(val);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue placeholder="Rentang Waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="7d">7 Hari Terakhir</SelectItem>
                <SelectItem value="30d">30 Hari Terakhir</SelectItem>
                <SelectItem value="all">Semua Data</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(pagination.page)}
              disabled={isLoading}
              className="h-9 text-xs px-2.5"
              title="Refresh tabel"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table Card */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Daftar Mutasi Pembayaran Masuk
              </CardTitle>
              <CardDescription className="text-xs">
                Data transaksi QRIS tersimpan di database lokal dapur_auth
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Total {pagination.total} transaksi
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs font-semibold py-3">
                    Waktu (WIB)
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    ID Transaksi Shopee
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Metode / Bank
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Nominal
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-center">
                    Status Shopee
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Koneksi Pesanan
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Spinner className="w-5 h-5" />
                        <span className="text-xs">
                          Memuat mutasi ShopeePay...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                        <Wallet className="w-8 h-8 opacity-30" />
                        <span className="text-sm font-medium">
                          Belum ada data transaksi
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Klik &quot;Tarik Mutasi Baru&quot; di kanan atas untuk
                          menyinkronkan data langsung dari ShopeePay.
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Time */}
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {formatTxDate(
                          tx.transaction_date || tx.transaction_time,
                        )}
                      </TableCell>

                      {/* Transaction ID */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-foreground font-medium truncate max-w-[160px]">
                            {tx.id}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(tx.id, "ID Transaksi")
                            }
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                            title="Salin ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </TableCell>

                      {/* Issuer */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium py-0 px-2 bg-muted/40 border-muted"
                        >
                          <CreditCard className="w-2.5 h-2.5 mr-1 opacity-70" />
                          {tx.issuer_name || "QRIS ShopeePay"}
                        </Badge>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-right font-semibold text-foreground text-xs whitespace-nowrap">
                        {formatCurrency(tx.amount)}
                      </TableCell>

                      {/* Shopee Status */}
                      <TableCell className="text-center">
                        {tx.status === 3 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-500/20 text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Berhasil
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[11px]">
                            <Clock className="w-3 h-3 mr-1" />
                            {tx.status_name || "Menunggu"}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Order Connection */}
                      <TableCell>
                        {tx.order_id ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Order #{tx.order_id.replace(/^order:/, "")}
                            </span>
                            {tx.order_customer_name && (
                              <span className="text-[11px] text-muted-foreground">
                                {tx.order_customer_name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-normal text-amber-600 border-amber-500/30 bg-amber-500/5 dark:text-amber-400"
                          >
                            Belum Terhubung
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailItem(tx)}
                            className="h-7 px-2 text-xs"
                          >
                            Detail
                          </Button>
                          {!tx.order_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLinkModalItem(tx);
                                setLinkOrderId("");
                                setLinkCustomerName("");
                              }}
                              className="h-7 px-2 text-xs text-orange-600 border-orange-500/30 hover:bg-orange-500/10"
                            >
                              <Link2 className="w-3 h-3 mr-1" />
                              Hubungkan
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => loadData(pagination.page - 1)}
                  className="h-8 text-xs"
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    pagination.page >= pagination.totalPages || isLoading
                  }
                  onClick={() => loadData(pagination.page + 1)}
                  className="h-8 text-xs"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL: Update Session Token */}
      <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveToken}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-orange-500" />
                Session Token ShopeePay Partner
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                Token sesi digunakan oleh server Dapur Bu Wikra untuk memanggil
                API ShopeePay Merchant Portal guna verifikasi mutasi QRIS
                otomatis.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="token-input" className="text-xs font-semibold">
                  Session Token Baru (B:...)
                </Label>
                <Input
                  id="token-input"
                  placeholder="B:eyJhbGciOi..."
                  value={newTokenInput}
                  onChange={(e) => setNewTokenInput(e.target.value)}
                  className="font-mono text-xs h-10"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Token akan langsung diuji dengan memanggil ShopeePay sebelum
                  disimpan ke database PostgreSQL.
                </p>
              </div>

              {tokenStatus.configured && (
                <div className="p-3 rounded-xl bg-muted/60 border text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Token Saat Ini:
                    </span>
                    <Badge
                      variant={tokenStatus.isValid ? "default" : "destructive"}
                      className="text-[10px] py-0"
                    >
                      {tokenStatus.isValid ? "Valid" : "Kadaluarsa"}
                    </Badge>
                  </div>
                  <div className="font-mono text-[11px] truncate text-foreground">
                    {tokenStatus.maskedToken}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTokenDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSavingToken || !newTokenInput.trim()}
                className="text-xs bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isSavingToken ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Verifikasi & Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Transaction Details */}
      <Dialog
        open={Boolean(detailItem)}
        onOpenChange={(open) => !open && setDetailItem(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-500" />
              Detail Transaksi ShopeePay
            </DialogTitle>
            <DialogDescription className="text-xs">
              ID Transaksi:{" "}
              <strong className="font-mono">{detailItem?.id}</strong>
            </DialogDescription>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Nominal Transaksi
                  </span>
                  <span className="font-bold text-base text-foreground">
                    {formatCurrency(detailItem.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Status
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] mt-0.5">
                    {detailItem.status_name || "Berhasil"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-xl border bg-card text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Waktu Transaksi</span>
                  <span className="font-mono text-foreground">
                    {formatTxDate(detailItem.transaction_date)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">
                    Metode / Bank Issuer
                  </span>
                  <span className="font-medium text-foreground">
                    {detailItem.issuer_name || "QRIS ShopeePay"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">
                    Merchant ID / Store ID
                  </span>
                  <span className="font-mono text-foreground">
                    {detailItem.merchant_id || "20463602"} /{" "}
                    {detailItem.store_id || "23091772"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Terminal ID</span>
                  <span className="font-mono text-foreground">
                    {detailItem.terminal_id || "A01"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">
                    Referensi Shopee
                  </span>
                  <span className="font-mono text-foreground truncate max-w-[200px]">
                    {detailItem.reference_id || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">
                    Status Order Terkait
                  </span>
                  <span className="font-medium text-foreground">
                    {detailItem.order_id ? (
                      <span className="text-emerald-600 font-semibold">
                        Order #{detailItem.order_id}
                      </span>
                    ) : (
                      <span className="text-amber-600">Belum Terhubung</span>
                    )}
                  </span>
                </div>
              </div>

              {detailItem.raw_data && (
                <details className="text-[11px] text-muted-foreground border rounded-lg p-2 bg-muted/20">
                  <summary className="cursor-pointer font-medium hover:text-foreground">
                    Lihat Payload Mentah ShopeePay (JSON)
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-[10px] font-mono max-h-40">
                    {JSON.stringify(detailItem.raw_data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailItem(null)}
              className="text-xs"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Link Transaction to Order */}
      <Dialog
        open={Boolean(linkModalItem)}
        onOpenChange={(open) => !open && setLinkModalItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleLinkTransaction}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-orange-500" />
                Hubungkan ke Pesanan
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                Kaitkan pembayaran ShopeePay ini sebesar{" "}
                <strong className="text-foreground">
                  {formatCurrency(linkModalItem?.amount ?? 0)}
                </strong>{" "}
                ke ID pesanan yang sesuai di Dapur Bu Wikra.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="order-id-input"
                  className="text-xs font-semibold"
                >
                  ID Pesanan Dapur Bu Wikra *
                </Label>
                <Input
                  id="order-id-input"
                  placeholder="Contoh: 12, atau order:12"
                  value={linkOrderId}
                  onChange={(e) => setLinkOrderId(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="customer-name-input"
                  className="text-xs font-semibold"
                >
                  Nama Pelanggan (Opsional)
                </Label>
                <Input
                  id="customer-name-input"
                  placeholder="Contoh: Ibu Rina"
                  value={linkCustomerName}
                  onChange={(e) => setLinkCustomerName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mark-paid-checkbox"
                  checked={markOrderPaid}
                  onChange={(e) => setMarkOrderPaid(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <Label
                  htmlFor="mark-paid-checkbox"
                  className="text-xs cursor-pointer font-normal"
                >
                  Otomatis tandai pesanan sebagai{" "}
                  <strong>&quot;Lunas (Paid)&quot;</strong>
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLinkModalItem(null)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLinking || !linkOrderId.trim()}
                className="text-xs bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Hubungkan Transaksi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
