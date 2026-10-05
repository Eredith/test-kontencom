"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, ArrowDownLeft, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import Brand from "./brand";
import { createClient } from "@/lib/client";

export default function Login({ initialMessage = "" }: { initialMessage?: string }) {
  const [signup, setSignup] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const router = useRouter();
  function switchTab(value: boolean) { setSignup(value); setMessage(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const credentials = { email: String(form.get("email")).trim(), password: String(form.get("password")) };
    try {
      const client = createClient();
      const result = signup ? await client.auth.signUp(credentials) : await client.auth.signInWithPassword(credentials);
      if (result.error) setMessage(result.error.code === "invalid_credentials" ? "Email atau kata sandi belum cocok. Coba lagi, ya." : result.error.code === "email_not_confirmed" ? "Konfirmasi email kamu dulu sebelum masuk." : "Belum berhasil. Periksa data kamu atau coba lagi sebentar.");
      else if (result.data.session) { router.replace("/"); router.refresh(); }
      else setMessage("Akun berhasil dibuat! Cek email kamu untuk konfirmasi, lalu masuk.");
    } catch { setMessage("Koneksi terputus. Coba lagi sebentar, ya."); }
    finally { setBusy(false); }
  }
  return <main className="login-shell"><section className="login-story"><Link href="/login" aria-label="Kasbondulu"><Brand light /></Link><div className="story-content"><span className="eyebrow story-pill"><Sparkles size={14}/> CATAT RAPI, HATI HAPPY</span><h1>Urusan kasbon,<br/>nggak perlu<br/><span>jadi beban.</span></h1><p>Teman tetap dekat. Catatan tetap jelas.<br/>Utang piutang jadi lebih tenang.</p><div className="wallet-scene" aria-label="Ilustrasi catatan kasbon"><div className="scene-orbit"/><div className="floating-receipt receipt-one"><span className="receipt-icon green"><ArrowDownLeft size={19}/></span><div><small>Utang Orang Lain ke kamu</small><strong>Rp 350.000</strong></div><span className="tiny-dot"/></div><div className="wallet-art"><span className="wallet-line"/><Wallet size={46}/><span className="wallet-button"/></div><div className="floating-receipt receipt-two"><span className="receipt-icon green"><Check size={19}/></span><div><strong>Asik, sudah lunas!</strong><small>Satu beban berkurang ✨</small></div></div><span className="scene-spark spark-one">✦</span><span className="scene-spark spark-two">✦</span><div className="scene-coin">Rp</div></div><div className="story-benefits"><span><Check size={15}/> Gratis & simpel</span><span><Check size={15}/> Catatan pribadi</span><span><Check size={15}/> Akses di mana saja</span></div></div><span className="story-footer">Sedikit dicatat, banyak tenangnya.</span></section><section className="login-panel"><div className="login-top">Baru di sini? <button onClick={() => switchTab(!signup)}>{signup ? "Masuk akun" : "Buat akun"}<ArrowUpRight size={15}/></button></div><div className="auth-form"><div className="auth-welcome"><Wallet size={25}/></div><span className="eyebrow muted">SELAMAT DATANG DI KASBONDULU</span><h2>{signup ? "Mulai catatan barumu." : "Halo, ketemu lagi!"} <span className="wave">👋</span></h2><p>{signup ? "Bikin akun gratis, lalu catat kasbon pertamamu." : "Masuk dulu, yuk. Catatan kasbonmu sudah menunggu."}</p><div className="auth-tabs"><button className={!signup ? "active" : ""} onClick={() => switchTab(false)}>Masuk</button><button className={signup ? "active" : ""} onClick={() => switchTab(true)}>Daftar akun</button></div><form method="post" action="/auth/submit" onSubmit={submit}><input type="hidden" name="mode" value={signup ? "signup" : "login"}/><label htmlFor="email">Alamat email</label><div className="input-icon"><Mail size={18}/><input id="email" name="email" type="email" autoComplete="email" placeholder="nama@email.com" required maxLength={254}/></div><label htmlFor="password">Kata sandi</label><div className="input-icon"><LockKeyhole size={18}/><input id="password" name="password" type={visible ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "Minimal 8 karakter" : "Masukkan kata sandimu"} minLength={signup ? 8 : 1} required maxLength={128}/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div><div className="auth-note"><ShieldCheck size={14}/> Data kamu hanya bisa diakses oleh kamu.</div>{message && <p className="form-message" role="status">{message}</p>}<button className="button primary auth-submit" disabled={busy}>{busy ? "Sebentar, ya..." : signup ? "Buat akun gratis" : "Masuk ke dashboard"}<ArrowRight size={18}/></button></form><div className="divider"><span>mau lihat-lihat dulu?</span></div><Link href="/preview" className="button preview-button">Jelajahi demo dashboard <ArrowUpRight size={17}/></Link><p className="auth-legal">Dengan melanjutkan, kamu setuju menjaga catatan<br/>kasbonmu tetap jujur dan bertanggung jawab.</p></div><footer className="login-footer"><span>© {new Date().getFullYear()} kasbondulu.com</span><span>Dibuat untuk hidup yang lebih ringan <span className="green-text">✦</span></span></footer></section></main>;
}
