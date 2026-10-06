"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
  X,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import Brand from "./brand";
import { createClient } from "@/lib/client";
import {
  type Debt,
  type DebtInput,
  type DebtType,
  rupiah,
  validateDebt,
} from "@/lib/debts";
import { groupDebtsByPerson } from "@/lib/debt-groups";

function relative(date: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 86400000),
  );
  return days === 0 ? "Hari ini" : days === 1 ? "Kemarin" : `${days} hari lalu`;
}
const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function Dashboard({ email }: { email: string }) {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [groupByPerson, setGroupByPerson] = useState(true);
  const [modal, setModal] = useState<Debt | "new" | null>(null);
  const [deleting, setDeleting] = useState<Debt | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLElement>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/debts")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (active) setDebts(body.data);
      })
      .catch((error) => {
        if (active)
          setMessage(
            error instanceof Error
              ? error.message
              : "Catatan belum bisa dimuat.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function mutate(
    method: string,
    id?: string,
    payload?: DebtInput | { settled: boolean },
  ) {
    const response = await fetch(`/api/debts${id ? `/${id}` : ""}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const body = await response.json();
    if (!response.ok)
      throw new Error(body.error || "Perubahan belum berhasil disimpan.");
    return body.data as Debt;
  }
  async function save(input: DebtInput) {
    setBusy(true);
    try {
      const existing = modal !== "new" ? modal : null;
      const updated = await mutate(
        existing ? "PATCH" : "POST",
        existing?.id,
        input,
      );
      setDebts((previous) =>
        existing
          ? previous.map((item) => (item.id === existing.id ? updated : item))
          : [updated, ...previous],
      );
      setModal(null);
      setMessage(
        existing
          ? "Catatan berhasil diperbarui."
          : "Kasbon baru berhasil dicatat.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function settle(debt: Debt) {
    setBusy(true);
    try {
      const updated = await mutate("PATCH", debt.id, { settled: true });
      setDebts((previous) =>
        previous.map((item) => (item.id === debt.id ? updated : item)),
      );
      setMessage(`Kasbon ${debt.counterpart_name} sudah lunas. Asik!`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal menandai lunas.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await mutate("DELETE", deleting.id);
      setDebts((previous) =>
        previous.filter((item) => item.id !== deleting.id),
      );
      setDeleting(null);
      setMessage("Catatan berhasil dihapus.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal menghapus catatan.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace("/login");
      router.refresh();
    } catch {
      setMessage("Belum berhasil keluar. Coba lagi, ya.");
      setBusy(false);
    }
  }
  const outstanding = debts.filter((item) => !item.settled_at);
  const owed = outstanding
    .filter((item) => item.type === "owed_to_me")
    .reduce((sum, item) => sum + item.amount, 0);
  const owe = outstanding
    .filter((item) => item.type === "i_owe")
    .reduce((sum, item) => sum + item.amount, 0);
  const settled = debts.length - outstanding.length;
  const filtered = debts.filter(
    (item) =>
      (status === "all" ||
        (status === "settled" ? !!item.settled_at : !item.settled_at)) &&
      (type === "all" || item.type === type) &&
      item.counterpart_name
        .toLocaleLowerCase("id")
        .includes(search.toLocaleLowerCase("id")),
  );
  const dated = (debt: Debt) => Date.parse(debt.due_date ?? debt.created_at);
  const compare = (a: Debt, b: Debt) => {
    const difference = sort.startsWith("amount")
      ? a.amount - b.amount
      : dated(a) - dated(b);
    return (
      (sort.endsWith("desc") ? -difference : difference) ||
      a.id.localeCompare(b.id)
    );
  };
  const ordered = [...filtered].sort(compare);
  const displayedGroups = groupByPerson
    ? groupDebtsByPerson(ordered).sort((a, b) => {
        const amountA = a.debts.reduce((sum, debt) => sum + debt.amount, 0);
        const amountB = b.debts.reduce((sum, debt) => sum + debt.amount, 0);
        const dateA =
          sort === "date-asc"
            ? Math.min(...a.debts.map(dated))
            : Math.max(...a.debts.map(dated));
        const dateB =
          sort === "date-asc"
            ? Math.min(...b.debts.map(dated))
            : Math.max(...b.debts.map(dated));
        const difference = sort.startsWith("amount")
          ? amountA - amountB
          : dateA - dateB;
        return (
          (sort.endsWith("desc") ? -difference : difference) ||
          a.name.localeCompare(b.name, "id")
        );
      })
    : ordered.map((debt) => ({
        key: debt.id,
        name: debt.counterpart_name,
        debts: [debt],
      }));
  const name = email.split("@")[0];
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Link href="/">
          <Brand />
        </Link>
        <div className="sidebar-label">RUANG CATATANMU</div>
        <nav>
          <button
            className="nav-item active"
            onClick={() => {
              setStatus("all");
              setType("all");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <LayoutDashboard size={19} /> Dashboard
            <span className="nav-dot" />
          </button>
          <button
            className="nav-item"
            onClick={() => {
              setStatus("all");
              list.current?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <BookOpen size={19} /> Semua catatan
            <span className="nav-count">{debts.length}</span>
          </button>
          <button
            className="nav-item"
            onClick={() => {
              setStatus("settled");
              list.current?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <CheckCheck size={19} /> Sudah lunas
            <span className="nav-count">{settled}</span>
          </button>
        </nav>
        <div className="sidebar-tip">
          <div className="tip-icon">
            <Sparkles size={22} />
          </div>
          <strong>
            Catat sekarang,
            <br />
            tenang kemudian.
          </strong>
          <p>
            Kasbon kecil juga berarti.
            <br />
            Jangan sampai lupa, ya!
          </p>
          <button onClick={() => setModal("new")}>
            Catat kasbon <ArrowRight size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span>
            <ShieldCheck size={16} /> Catatan aman & pribadi
          </span>
          <button className="nav-item" disabled={busy} onClick={logout}>
            <LogOut size={18} /> Keluar akun
          </button>
          <small>kasbondulu.com · v1.0</small>
        </div>
      </aside>
      <div className="dashboard-body">
        <header className="dashboard-header">
          <div className="desktop-breadcrumb">
            Ruang pribadi <span>/</span>
            <strong>Dashboard</strong>
          </div>
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="header-account">
            <span className="account-avatar">{initials(name)}</span>
            <span className="account-text">
              <strong>{name}</strong>
              <small>Akun pribadi</small>
            </span>
            <button
              className="mobile-logout icon-button"
              onClick={logout}
              aria-label="Keluar akun"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="page-heading">
            <div>
              <span className="eyebrow muted">BIAR CATATAN YANG INGAT</span>
              <h1>
                Halo, {name} <span className="wave">👋</span>
              </h1>
              <p>Ini ringkasan kasbonmu. Lebih rapi, lebih tenang.</p>
            </div>
            <button className="button primary" onClick={() => setModal("new")}>
              <Plus size={19} /> Catat baru
            </button>
          </div>
          <div className="summary-grid">
            <Summary
              label="Total dihutang ke saya"
              amount={owed}
              count={
                outstanding.filter((item) => item.type === "owed_to_me").length
              }
              variant="receive"
            />
            <Summary
              label="Total Saya Hutang"
              amount={owe}
              count={outstanding.filter((item) => item.type === "i_owe").length}
              variant="pay"
            />
            <div
              className={`summary-card net-card ${owed - owe < 0 ? "negative" : ""}`}
            >
              <div className="summary-top">
                <span>
                  Selisih bersih <span className="net-label">NET</span>
                </span>
                <span className="summary-icon">
                  <TrendingUp size={20} />
                </span>
              </div>
              <strong className="summary-amount">{rupiah(owed - owe)}</strong>
              <p>
                <span className="net-status">
                  {owed - owe >= 0 ? "Positif" : "Negatif"}
                </span>
                {owed - owe >= 0
                  ? "Lebih banyak yang kembali ke kamu"
                  : "Yuk, pelan-pelan bereskan kasbonmu"}
              </p>
              <span className="net-decoration" />
            </div>
          </div>
          <div className="gentle-banner">
            <span className="banner-icon">
              <Wallet size={23} />
            </span>
            <div>
              <strong>Uang bisa dicatat. Pertemanan tetap dijaga.</strong>
              <p>Mulai dari catatan kecil, supaya nggak ada yang mengganjal.</p>
            </div>
            <span className="banner-doodle">✦</span>
          </div>
          <section className="records-panel" ref={list}>
            <div className="records-heading">
              <div>
                <h2>
                  Catatan kasbon <span>{debts.length}</span>
                </h2>
                <p>Semua utang piutangmu, di satu tempat.</p>
              </div>
              <span className="records-caption">
                <span className="tiny-dot" /> Selalu dalam kendalimu
              </span>
            </div>
            <div className="records-controls">
              <div className="search-field">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama teman..."
                  aria-label="Cari nama orang"
                />
              </div>
              <div className="filter-group">
                <ListFilter size={17} />
                <label className="select-wrap">
                  <span className="sr-only">Filter status</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="all">Semua status</option>
                    <option value="unsettled">Belum lunas</option>
                    <option value="settled">Lunas</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
                <label className="select-wrap">
                  <span className="sr-only">Filter tipe</span>
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                  >
                    <option value="all">Semua tipe</option>
                    <option value="owed_to_me">Saya dihutang</option>
                    <option value="i_owe">Saya Hutang</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
                <label className="select-wrap">
                  <span className="sr-only">Urutkan catatan</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    <option value="date-desc">Tanggal terbaru</option>
                    <option value="date-asc">Tanggal terlama</option>
                    <option value="amount-desc">Jumlah terbesar</option>
                    <option value="amount-asc">Jumlah terkecil</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
                <label className="group-toggle">
                  <input
                    type="checkbox"
                    checked={groupByPerson}
                    onChange={(event) => setGroupByPerson(event.target.checked)}
                  />{" "}
                  Kelompokkan per orang
                </label>
              </div>
            </div>
            <div className="table-heading">
              <span>NAMA & CATATAN</span>
              <span>TIPE</span>
              <span>JUMLAH</span>
              <span>STATUS</span>
              <span>AKSI</span>
            </div>
            <div className="debt-list">
              {loading ? (
                <div className="empty-state">Memuat catatanmu...</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <Wallet size={34} />
                  <h3>
                    {debts.length
                      ? "Belum ada catatan yang cocok"
                      : "Kasbon pertama, mulai di sini."}
                  </h3>
                  <p>
                    {debts.length
                      ? "Coba ubah pencarian atau filter kamu."
                      : "Catat siapa, berapa, dan untuk apa. Sisanya jadi lebih jelas."}
                  </p>
                  {!debts.length && (
                    <button
                      className="button primary"
                      onClick={() => setModal("new")}
                    >
                      <Plus size={16} /> Catat baru
                    </button>
                  )}
                </div>
              ) : (
                displayedGroups.map((group, groupIndex) => (
                  <div className="person-group" key={group.key}>
                    {groupByPerson && group.debts.length > 1 && (
                      <div className="person-group-heading">
                        <strong>{group.name}</strong>
                        <span>
                          {group.debts.length} catatan · total{" "}
                          {rupiah(
                            group.debts.reduce(
                              (sum, debt) => sum + debt.amount,
                              0,
                            ),
                          )}
                        </span>
                      </div>
                    )}
                    {group.debts.map((debt, index) => (
                      <div
                        className={`debt-row ${debt.settled_at ? "is-settled" : ""}`}
                        key={debt.id}
                      >
                        <div className="person-cell">
                          <span
                            className={`person-avatar avatar-${(groupIndex + index) % 4}`}
                          >
                            {initials(debt.counterpart_name)}
                          </span>
                          <div>
                            <strong>{debt.counterpart_name}</strong>
                            <small>{debt.note || "Tanpa catatan"}</small>
                            <span className="relative-date">
                              {relative(debt.created_at)}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`type-cell ${debt.type === "owed_to_me" ? "green-text" : "orange-text"}`}
                        >
                          {debt.type === "owed_to_me" ? (
                            <ArrowDownLeft size={15} />
                          ) : (
                            <ArrowUpRight size={15} />
                          )}
                          <span>
                            {debt.type === "owed_to_me"
                              ? "Saya dihutang"
                              : "Saya Hutang"}
                          </span>
                        </div>
                        <strong className="amount-cell">
                          {rupiah(debt.amount)}
                        </strong>
                        <span
                          className={`status-badge ${debt.settled_at ? "paid" : "unpaid"}`}
                        >
                          {debt.settled_at ? <Check size={12} /> : <span />}
                          {debt.settled_at ? "Lunas" : "Belum lunas"}
                        </span>
                        <div className="row-actions">
                          {!debt.settled_at && (
                            <button
                              className="settle-button"
                              disabled={busy}
                              onClick={() => settle(debt)}
                            >
                              <Check size={14} />
                              <span>Tandai lunas</span>
                            </button>
                          )}
                          <button
                            className="icon-button"
                            aria-label={`Edit ${debt.counterpart_name}`}
                            onClick={() => setModal(debt)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon-button delete-button"
                            aria-label={`Hapus ${debt.counterpart_name}`}
                            onClick={() => setDeleting(debt)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
            <div className="table-footer">
              <span>
                Menampilkan {filtered.length} dari {debts.length} catatan
              </span>
              <span>
                <ShieldCheck size={14} /> Hanya kamu yang bisa melihat catatan
                ini
              </span>
            </div>
          </section>
          <div className="dashboard-footer">
            <span>
              Pelan-pelan dicatat, satu-satu dibereskan.{" "}
              <span className="green-text">✦</span>
            </span>
            <span>© {new Date().getFullYear()} kasbondulu.com</span>
          </div>
        </main>
      </div>
      <nav className="mobile-nav">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <LayoutDashboard size={20} />
          Dashboard
        </button>
        <button className="mobile-add" onClick={() => setModal("new")}>
          <Plus size={23} />
          Catat baru
        </button>
        <button
          onClick={() => {
            setStatus("settled");
            list.current?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <CheckCheck size={20} />
          Lunas
        </button>
      </nav>
      {message && (
        <div className="toast" role="status">
          <CircleHelp size={18} />
          <span>{message}</span>
          <button
            className="icon-button"
            aria-label="Tutup pesan"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <DebtModal
          debt={modal === "new" ? null : modal}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
      {deleting && (
        <dialog open className="modal-overlay">
          <div className="modal-card delete-modal">
            <span className="delete-illustration">
              <Trash2 size={25} />
            </span>
            <h2>Hapus catatan ini?</h2>
            <p>
              Kasbon {deleting.counterpart_name} sebesar{" "}
              {rupiah(deleting.amount)} akan dihapus. Catatan ini tidak bisa
              dikembalikan.
            </p>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setDeleting(null)}
                disabled={busy}
              >
                Batal
              </button>
              <button
                className="button danger"
                onClick={remove}
                disabled={busy}
              >
                {busy ? "Menghapus..." : "Ya, hapus"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

function Summary({
  label,
  amount,
  count,
  variant,
}: {
  label: string;
  amount: number;
  count: number;
  variant: "receive" | "pay";
}) {
  return (
    <div className={`summary-card ${variant}`}>
      <div className="summary-top">
        <span>{label}</span>
        <span className="summary-icon">
          {variant === "receive" ? (
            <ArrowDownLeft size={21} />
          ) : (
            <ArrowUpRight size={21} />
          )}
        </span>
      </div>
      <strong className="summary-amount">{rupiah(amount)}</strong>
      <p>
        <span className="count-dot" />
        {count} catatan belum lunas
      </p>
    </div>
  );
}

function DebtModal({
  debt,
  busy,
  onClose,
  onSave,
}: {
  debt: Debt | null;
  busy: boolean;
  onClose: () => void;
  onSave: (input: DebtInput) => Promise<void>;
}) {
  const [type, setType] = useState<DebtType>(debt?.type ?? "owed_to_me");
  const [amountDigits, setAmountDigits] = useState(
    debt ? String(debt.amount) : "",
  );
  const [note, setNote] = useState(debt?.note ?? "");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const result = validateDebt({
      type,
      counterpart_name: form.get("name"),
      amount: Number(amountDigits),
      due_date: form.get("date") || null,
      note,
    });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    try {
      await onSave(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Catatan belum berhasil disimpan.",
      );
    }
  }
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return (
    <dialog
      ref={dialog}
      className="debt-dialog"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-heading">
          <div>
            <span className="eyebrow green-text">BIAR NGGAK LUPA</span>
            <h2>{debt ? "Edit catatan kasbon" : "Catat kasbon baru"}</h2>
            <p>Catatan kecil untuk pikiran yang lebih ringan.</p>
          </div>
          <button
            className="icon-button"
            disabled={busy}
            aria-label="Tutup modal"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit}>
          <fieldset className="type-options">
            <legend>Tipe kasbon</legend>
            <label className={type === "owed_to_me" ? "selected" : ""}>
              <input
                type="radio"
                name="type"
                checked={type === "owed_to_me"}
                onChange={() => setType("owed_to_me")}
              />
              <ArrowDownLeft size={22} />
              <strong>Saya dihutang</strong>
              <small>Orang lain hutang ke saya</small>
            </label>
            <label className={type === "i_owe" ? "selected" : ""}>
              <input
                type="radio"
                name="type"
                checked={type === "i_owe"}
                onChange={() => setType("i_owe")}
              />
              <ArrowUpRight size={22} />
              <strong>Saya Hutang</strong>
              <small>Saya Hutang ke orang lain</small>
            </label>
          </fieldset>
          <label htmlFor="debt-name">
            Nama orang <span className="required">*</span>
          </label>
          <input
            className="form-input"
            id="debt-name"
            name="name"
            placeholder="Misalnya, Andi Pratama"
            defaultValue={debt?.counterpart_name}
            required
            maxLength={100}
          />
          <div className="form-two-columns">
            <div>
              <label htmlFor="debt-amount">
                Jumlah (Rupiah) <span className="required">*</span>
              </label>
              <input
                className="form-input"
                id="debt-amount"
                name="amount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Rp 350.000"
                value={amountDigits ? rupiah(Number(amountDigits)) : ""}
                onChange={(event) =>
                  setAmountDigits(
                    event.target.value
                      .replace(/\D/g, "")
                      .replace(/^0+(?=\d)/, ""),
                  )
                }
                required
              />
            </div>
            <div>
              <label htmlFor="debt-date">Tanggal</label>
              <input
                className="form-input"
                id="debt-date"
                name="date"
                type="date"
                defaultValue={debt?.due_date ?? localDate}
              />
            </div>
          </div>
          <label htmlFor="debt-note">
            Catatan <span className="optional">opsional</span>
          </label>
          <textarea
            className="form-input"
            id="debt-note"
            placeholder="Kasbon untuk apa?"
            maxLength={200}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <span className="char-count">{note.length}/200</span>
          {error && (
            <p className="form-message" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              type="button"
              onClick={onClose}
              disabled={busy}
            >
              Batal
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan catatan"}
              <Check size={17} />
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
