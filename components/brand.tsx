import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
export default function Brand({ light = false }: { light?: boolean }) {
  return <span className={`brand ${light ? "brand-light" : ""}`}><span className="brand-symbol"><ArrowDownLeft size={19} /><ArrowUpRight size={19} /></span><span>kasbon<span className="brand-dulu">dulu</span><span className="brand-dot">.</span></span></span>;
}
