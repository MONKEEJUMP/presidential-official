"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkflowCorrectionRequest } from "@/lib/sales-workflow";
import styles from "./sales.module.css";

type Customer = { id: number; verified_customer_id: number; dba_name: string; street_address: string; city: string; zip: string };
type Source = { id: number; legal_name: string; dba_name?: string; street_address: string; city: string; state_code?: string; zip?: string; sales_classification_source?: string };
type Review = { customers: Customer[]; excluded: Source[]; candidates?: Source[] };

export function SalesDataReview({ state, onChanged }: { state: string; onChanged: () => void }) {
  const [review, setReview] = useState<Review | null>(null);
  const [requests, setRequests] = useState<WorkflowCorrectionRequest[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<Source[]>([]);
  const [candidate, setCandidate] = useState<Source | null>(null);
  const [evidence, setEvidence] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const id = ++sequence.current;
    try {
      const [sourceResponse, workResponse] = await Promise.all([fetch(`/api/sales?resource=data_review&state=${state}`, { cache: "no-store" }), fetch(`/api/sales/workflow?state=${state}`, { cache: "no-store" })]);
      const data = await sourceResponse.json();
      const work = await workResponse.json();
      if (!sourceResponse.ok || !workResponse.ok) throw new Error(data.error ?? work.error ?? "Data review unavailable.");
      if (id !== sequence.current) return;
      setReview(data); setRequests(work.correctionRequests ?? []);
    } catch (cause) { if (id === sequence.current) setMessage(cause instanceof Error ? cause.message : "Data review unavailable."); }
  }, [state]);
  useEffect(() => {
    const counter = sequence;
    // This effect fetches external data; its state updates happen after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    return () => { ++counter.current; };
  }, [load]);

  async function link() {
    if (!customer || !candidate || !confirmed || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "link_customer_source", customerId: customer.verified_customer_id, doorId: candidate.id, evidence }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The link was not saved.");
      setCustomer(null); setCandidate(null); setCandidates([]); setEvidence(""); setConfirmed(false);
      setMessage("Source records linked. Customer status remains protected; original records were preserved.");
      await load(); onChanged();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "The link was not saved."); }
    finally { setBusy(false); }
  }

  return <section className={styles.dataReviewPanel} aria-label="Paulie's data review">
    <header><h2>Data review</h2><p>Only you can resolve these records. Nothing is matched by a similar name. Verify the business and document your evidence before linking.</p></header>
    {message ? <p role="status">{message}</p> : null}
    <h3>Team correction requests</h3>
    {!requests.length ? <p>No correction requests in this state.</p> : requests.map((request) => <article className={styles.sourceReviewItem} key={request.id}><strong>{request.storeName}</strong><p>{request.reason}</p><small>{request.requestedBy} · {request.status}</small>{request.status === "pending" ? <form onSubmit={async (event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true);
      try { const response = await fetch("/api/sales/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resolve_correction", requestId: request.id, decisionNote: form.get("decision") }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); await load(); setMessage("Correction request closed with your decision. This records your decision; it does not automatically rewrite a store."); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Decision not saved."); } finally { setBusy(false); }
    }}><label>Resolution / next action<input name="decision" required minLength={3} maxLength={1000} /></label><button disabled={busy} type="submit">Record resolution</button></form> : <p>{request.decisionNote}</p>}</article>)}
    <h3>{review?.customers.length ?? "…"} customers needing a source link</h3>
    {customer ? <div className={styles.sourceReviewItem}>
      <strong>Verified customer: {customer.dba_name}</strong><p>{customer.street_address}, {customer.city} {customer.zip}</p>
      <form onSubmit={async (event) => { event.preventDefault(); setBusy(true); try { const response = await fetch(`/api/sales?resource=data_review&state=${state}&search=${encodeURIComponent(search)}`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setCandidates(data.candidates ?? []); setCandidate(null); setConfirmed(false); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Search unavailable."); } finally { setBusy(false); } }}>
        <label>Search market-source records<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Store or legal name" minLength={2} required /></label><button type="submit" disabled={busy}>Find source records</button>
      </form>
      {candidates.map((source) => <label className={styles.sourceReviewItem} key={source.id}><input type="radio" name="source-record" checked={candidate?.id === source.id} onChange={() => { setCandidate(source); setConfirmed(false); }} /><strong>{source.dba_name || source.legal_name}</strong><span>{source.legal_name} · {source.street_address}, {source.city} {source.zip} · Source #{source.id}</span></label>)}
      <label>Evidence URL or explicit owner confirmation<textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} minLength={12} maxLength={500} placeholder="Document how you verified these are the same storefront. Similar spelling alone is not evidence." /></label>
      <label><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I verified that both records identify the same storefront.</label>
      <div className={styles.toolkitActions}><button type="button" disabled={busy || !candidate || !confirmed || evidence.trim().length < 12} onClick={() => void link()}>Link verified records</button><button type="button" disabled={busy} onClick={() => { setCustomer(null); setCandidate(null); setCandidates([]); }}>Cancel</button></div>
    </div> : null}
    {review?.customers.map((item) => <article className={styles.sourceReviewItem} key={item.id}><strong>{item.dba_name}</strong><span>{item.street_address}, {item.city} {item.zip}</span><button type="button" disabled={busy} onClick={() => { setCustomer(item); setSearch(""); setCandidates([]); setCandidate(null); setEvidence(""); setConfirmed(false); }}>Review source link</button></article>)}
    <details className={styles.welcomeHelp}><summary>{review?.excluded.length ?? 0} documented non-retail records excluded from calling</summary>{review?.excluded.map((item) => <article className={styles.sourceReviewItem} key={item.id}><strong>{item.legal_name}</strong><p>{item.street_address}, {item.city}</p><small>{item.sales_classification_source}</small></article>)}</details>
  </section>;
}
