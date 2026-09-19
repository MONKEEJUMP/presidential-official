"use client";

import { useEffect, useRef, useState } from "react";

const AGE_GATE_STORAGE_KEY = "presidential-age-gate-v2-approved";

export function AgeGate({ children, siteName }: Readonly<{ children: React.ReactNode; siteName: string }>) {
  const [approved, setApproved] = useState(false);
  const [declined, setDeclined] = useState(false);
  const enterRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { try { setApproved(window.localStorage.getItem(AGE_GATE_STORAGE_KEY) === "approved"); } catch {} }, []);
  useEffect(() => { if (approved) return; const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previousOverflow; }; }, [approved]);
  useEffect(() => { if (!approved && !declined) enterRef.current?.focus(); }, [approved, declined]);
  const enter = () => { try { window.localStorage.setItem(AGE_GATE_STORAGE_KEY, "approved"); } catch {} setApproved(true); };
  return <>{children}{!approved ? <div aria-labelledby="age-gate-title" aria-modal="true" role="dialog" className="fixed inset-0 z-[10000] grid place-items-center bg-[#020908]/[0.98] p-6 text-[#f7f8f7]"><section className="w-full max-w-[34rem] border border-[#58c3b6]/70 bg-[#06100f] p-8 text-center shadow-[0_28px_80px_rgba(0,0,0,0.5)] sm:p-16"><p className="m-0 font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#58c3b6]">{siteName}</p><h2 id="age-gate-title" className="m-0 mt-5 font-sans text-[clamp(2.25rem,8vw,4.5rem)] font-bold uppercase leading-[0.9] tracking-[0.015em]">Are you 21 or older?</h2><p aria-live="polite" className="mx-auto mt-6 max-w-[31rem] text-base leading-relaxed text-[#c9d8d3]">{declined ? "You must be 21 or older to enter this website." : "This website contains cannabis-related information intended for adults 21+ where legal."}</p>{!declined ? <div className="mt-8 grid grid-cols-2 gap-3"><button onClick={enter} ref={enterRef} className="min-h-[54px] border border-[#58c3b6] bg-[#58c3b6] px-3 font-sans text-[0.82rem] font-bold uppercase tracking-[0.07em] text-[#06100f] transition-colors hover:bg-[#78ddcf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f8f7]" type="button">Yes, enter</button><button onClick={() => setDeclined(true)} className="min-h-[54px] border border-[#f7f8f7]/50 bg-transparent px-3 font-sans text-[0.82rem] font-bold uppercase tracking-[0.07em] text-[#f7f8f7] transition-colors hover:border-[#58c3b6] hover:text-[#58c3b6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#58c3b6]" type="button">No, I am not</button></div> : <button onClick={() => setDeclined(false)} className="mt-8 min-h-12 border border-[#58c3b6] bg-transparent px-6 font-sans text-xs font-bold uppercase tracking-[0.07em] text-[#58c3b6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f8f7]" type="button">Go back</button>}</section></div> : null}</>;
}
