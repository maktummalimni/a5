/* Flyback Bronze — site behaviour and watch tools.
   Paste a form-handling URL (e.g. Formspree, Getform, Basin) into FB_CONFIG.formEndpoint to receive
   messages by email automatically. While it's empty, the visitor's email app opens with the message filled in. */
window.FB_CONFIG = { formEndpoint: "", email: "hello@flybackbronze.com" };

(function(){
  "use strict";
  const $ = (s,c=document)=>c.querySelector(s), $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));
  const CFG = window.FB_CONFIG;
  const store = { get(k,d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
  const bad = (el,b) => { const f = el.closest(".fld"); if (f) f.classList.toggle("bad", b); return b; };
  const say = (box,t,k="err",after=false) => { let m = $(".msg", box); if (!m){ m = document.createElement("div"); after ? box.appendChild(m) : box.prepend(m); } m.className = "msg msg-"+k; m.setAttribute("role", k==="err"?"alert":"status"); m.innerHTML = t; };
  const send = async d => { if (!CFG.formEndpoint) return false; try{ const r = await fetch(CFG.formEndpoint,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(d)}); return r.ok; }catch(e){ return false; } };

  /* nav */
  const burger = $(".burger"), nav = $(".nav");
  burger?.addEventListener("click", () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  document.addEventListener("keydown", e => { if (e.key === "Escape"){ nav?.classList.remove("open"); burger?.setAttribute("aria-expanded", false); } });
  $$("[data-year]").forEach(e => e.textContent = new Date().getFullYear());

  /* cookie consent — Google Consent Mode v2 */
  const ck = $(".cookie"), choice = store.get("fb_consent", null);
  const apply = ok => { if (typeof gtag === "function") gtag("consent","update",{analytics_storage:ok?"granted":"denied",ad_storage:ok?"granted":"denied",ad_user_data:ok?"granted":"denied",ad_personalization:ok?"granted":"denied"}); };
  const st = $("#consent-status"), show = c => { if (st) st.textContent = c==="all" ? "Analytics and advertising cookies are allowed." : c==="essential" ? "Only essential storage is active." : "You haven't made a choice yet."; };
  if (choice) apply(choice==="all"); else ck?.classList.add("show"); show(choice);
  $$("[data-consent]").forEach(b => b.addEventListener("click", () => { store.set("fb_consent", b.dataset.consent); apply(b.dataset.consent==="all"); ck?.classList.remove("show"); show(b.dataset.consent); }));
  $$("[data-cookie-settings]").forEach(b => b.addEventListener("click", () => ck?.classList.add("show")));

  /* tabs */
  $$("[role=tablist]").forEach(tl => { const tabs = $$("[role=tab]", tl);
    tabs.forEach((t,i) => { t.addEventListener("click", () => tabs.forEach(x => { const on = x===t; x.setAttribute("aria-selected", on); x.tabIndex = on?0:-1; $("#"+x.getAttribute("aria-controls")).hidden = !on; }));
      t.addEventListener("keydown", e => { if (e.key==="ArrowRight"||e.key==="ArrowLeft"){ const n = tabs[(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length]; n.focus(); n.click(); } }); }); });

  /* flyback chronograph demo */
  const ch = $("#chrono");
  if (ch){
    const read = $(".read", ch), state = $(".state", ch), laps = $(".laps", ch);
    const bStart = $("[data-c=start]", ch), bReset = $("[data-c=reset]", ch), bFly = $("[data-c=fly]", ch);
    let running = false, t0 = 0, acc = 0, raf = 0, n = 0;
    const fmt = ms => { const m = Math.floor(ms/60000), s = Math.floor(ms/1000)%60, c = Math.floor(ms/10)%100; return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(c).padStart(2,"0")}`; };
    const now = () => acc + (running ? performance.now() - t0 : 0);
    const tick = () => { read.textContent = fmt(now()); if (running) raf = requestAnimationFrame(tick); };
    const ui = () => { bStart.textContent = running ? "Stop" : (acc ? "Resume" : "Start"); bReset.disabled = running || !acc; bFly.disabled = !running;
      state.textContent = running ? "Running" : (acc ? "Stopped" : "Ready"); };
    bStart.addEventListener("click", () => { if (running){ acc = now(); running = false; cancelAnimationFrame(raf); } else { t0 = performance.now(); running = true; tick(); } ui(); read.textContent = fmt(now()); });
    bReset.addEventListener("click", () => { acc = 0; read.textContent = fmt(0); laps.innerHTML = ""; n = 0; ui(); });
    bFly.addEventListener("click", () => { if (!running) return; n++; laps.insertAdjacentHTML("afterbegin", `<li><span>Leg ${n}</span><span>${fmt(now())}</span></li>`); acc = 0; t0 = performance.now(); });
    ui();
  }

  /* wrist fit guide */
  const wf = $("#wristfit");
  if (wf){
    let unit = "in"; const inp = $("#wf-size");
    const run = () => {
      const v = parseFloat(inp.value); const mm = unit === "in" ? v*25.4 : v*10;
      if (!v || mm < 120 || mm > 260){ $("#wf-out").textContent = "—"; $("#wf-note").textContent = unit==="in" ? "Enter a wrist size between about 5 and 10 inches." : "Enter a wrist size between about 13 and 25 cm."; return; }
      const bands = [[152,"34–37 mm"],[165,"36–39 mm"],[178,"38–41 mm"],[190,"40–43 mm"],[203,"42–45 mm"],[999,"44–47 mm"]];
      const band = bands.find(b => mm < b[0])[1]; const l2l = Math.round(mm * 0.28);
      $("#wf-out").textContent = band;
      $("#wf-note").textContent = `For a ${unit==="in"?v+" in":v+" cm"} wrist (about ${Math.round(mm)} mm), a case around ${band} usually looks balanced. Try to keep lug-to-lug length under roughly ${l2l} mm so the lugs don't overhang the top of your wrist.`;
    };
    $$(".unit button", wf).forEach(b => b.addEventListener("click", () => { const was = unit; unit = b.dataset.u; $$(".unit button", wf).forEach(x => x.setAttribute("aria-pressed", x===b));
      if (was !== unit && inp.value){ inp.value = unit==="cm" ? (parseFloat(inp.value)*2.54).toFixed(1) : (parseFloat(inp.value)/2.54).toFixed(2); }
      $("#wf-u").textContent = unit; run(); }));
    inp.addEventListener("input", run); run();
  }

  /* water resistance decoder */
  const WR = {
    "30":{t:"30 m / 3 bar",ok:["Rain and splashes","Washing your hands"],no:["Showering","Swimming","Diving"],n:"Despite the number, a 30 m rating is for everyday splashes only — the test is done in static laboratory conditions."},
    "50":{t:"50 m / 5 bar",ok:["Rain and splashes","Washing your hands","Brief, gentle swimming in shallow water"],no:["Hot showers or saunas","Snorkeling","Diving"],n:"Suitable for occasional light water contact. Keep the crown pushed in (or screwed down) at all times."},
    "100":{t:"100 m / 10 bar",ok:["Swimming","Snorkeling","Water sports at the surface"],no:["Scuba diving","Hot tubs and saunas"],n:"A good all-round rating for swimming. Rinse in fresh water after the sea or a chlorinated pool."},
    "200":{t:"200 m / 20 bar",ok:["Swimming and snorkeling","Recreational scuba diving (if the watch meets dive-watch standards)"],no:["Saturation diving","Pressing pushers underwater (unless specified)"],n:"True dive watches are tested to ISO 6425. Check your manual, and have seals tested before diving."},
    "300":{t:"300 m+ / 30 bar+",ok:["Swimming and snorkeling","Recreational and technical scuba diving"],no:["Operating the crown underwater","Skipping seal checks"],n:"Built for serious diving, but gaskets still age. Have water resistance tested every year or two if you dive."}
  };
  const wr = $("#wr-sel");
  if (wr){
    const run = () => { const d = WR[wr.value]; $("#wr-title").textContent = d.t;
      $("#wr-list").innerHTML = d.ok.map(x=>`<div><span class="ok" aria-hidden="true">✓</span><span><span class="sr-only">Suitable: </span>${x}</span></div>`).join("") + d.no.map(x=>`<div><span class="no" aria-hidden="true">✕</span><span><span class="sr-only">Not suitable: </span>${x}</span></div>`).join("");
      $("#wr-note").textContent = d.n; };
    wr.addEventListener("change", run); run();
  }

  /* glossary */
  const gi = $("#g-q");
  if (gi){ const terms = $$(".term"), c = $("#g-count");
    const run = () => { const q = gi.value.trim().toLowerCase(); let n = 0; terms.forEach(t => { const on = !q || t.textContent.toLowerCase().includes(q); t.hidden = !on; if (on) n++; }); c.textContent = `${n} ${n===1?"term":"terms"}`; };
    gi.addEventListener("input", run); run(); }

  /* newsletter */
  $$(".newsletter").forEach(f => f.addEventListener("submit", async e => {
    e.preventDefault(); const em = $("input[type=email]", f).value.trim(), box = f.parentElement;
    if (!validEmail(em)) return say(box, "Please enter a valid email address.", "err", true);
    if (await send({_subject:"Newsletter sign-up", email:em})){ say(box, "Thank you — you're subscribed to the Bench Notes letter.", "ok", true); f.reset(); }
    else say(box, `Almost done — <a href="mailto:${CFG.email}?subject=${encodeURIComponent("Newsletter sign-up")}&body=${encodeURIComponent("Please add "+em+" to the Bench Notes letter.")}" style="color:inherit;font-weight:700">send us a quick email</a> to confirm.`, "info", true);
  }));

  /* contact & enquiry forms */
  $$("form[data-form]").forEach(cf => cf.addEventListener("submit", async e => {
    e.preventDefault(); $(".msg", cf)?.remove(); let ok = true; const g = n => $(`[name="${n}"]`, cf);
    if (bad(g("name"), g("name").value.trim().length < 2)) ok = false;
    if (bad(g("email"), !validEmail(g("email").value))) ok = false;
    if (g("topic") && bad(g("topic"), !g("topic").value)) ok = false;
    if (bad(g("message"), g("message").value.trim().length < 15)) ok = false;
    if (bad(g("agree"), !g("agree").checked)) ok = false;
    if (!ok) return say(cf, "Please check the highlighted fields.");
    const d = {}; $$("input,select,textarea", cf).forEach(el => { if (el.name && el.type !== "checkbox") d[el.name] = el.value.trim(); });
    const label = cf.dataset.form === "enquiry" ? "Service enquiry" : "Website message";
    if (await send({_subject:`${label}: ${d.topic||""}`, ...d})){ cf.reset(); say(cf, "Thank you — your message is with us. We reply within two business days.", "ok"); }
    else { say(cf, "Opening your email app so you can send this message to us…", "info");
      location.href = `mailto:${CFG.email}?subject=${encodeURIComponent(label+": "+(d.topic||""))}&body=${encodeURIComponent(Object.entries(d).map(([k,v])=>k[0].toUpperCase()+k.slice(1)+": "+v).join("\n"))}`; }
  }));
})();
