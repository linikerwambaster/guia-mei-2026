/* Empresarial Digital: saudação de quem vem do e-mail, checkouts com nome e e-mail preenchidos,
   medição da campanha (só no domínio real), animações, barra de compra e aviso de cookies. */
(function () {
  "use strict";
  // Checkouts. "mentoria" vazio = produto ainda não criado: o botão leva para a oferta da página da mentoria.
  var CHECKOUTS = {
    mentoria: "",
    pdf: "https://pay.cakto.com.br/8p8zxjd"
  };
  var CHAVES = ["nome", "email", "cidade", "abertura", "v", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var pagina = document.body.getAttribute("data-pagina") || "";
  var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- dados do link do e-mail (aceita ?a=b e #a=b); o CNPJ é ignorado de propósito
  var q = new URLSearchParams(location.search);
  if (location.hash.indexOf("=") > 0) new URLSearchParams(location.hash.slice(1)).forEach(function (v, k) { if (!q.has(k)) q.set(k, v); });
  var ctx = {};
  try { ctx = JSON.parse(sessionStorage.getItem("ed_ctx") || "{}") || {}; } catch (e) { ctx = {}; }
  var chegouAgora = false;
  CHAVES.forEach(function (k) { var v = q.get(k); if (v) { ctx[k] = v.slice(0, 160); chegouAgora = true; } });
  try { sessionStorage.setItem("ed_ctx", JSON.stringify(ctx)); } catch (e) {} // só nesta aba, enquanto navega no site

  var MINUS = ["da", "de", "do", "das", "dos", "e"];
  function titulo(s) { return s.toLowerCase().split(" ").map(function (p, i) { return i > 0 && MINUS.indexOf(p) >= 0 ? p : p.charAt(0).toUpperCase() + p.slice(1); }).join(" "); }
  function limpaNome(s) {
    s = (s || "").replace(/[^A-Za-zÀ-ÿ' ]/g, " ").replace(/\s+/g, " ").trim();
    s = s.split(" ").filter(function (p) { return !/^(MEI|ME|EIRELI|LTDA|EPP)$/i.test(p); }).join(" ");
    return s.length >= 2 ? titulo(s).slice(0, 60) : "";
  }
  function limpaCidade(s) {
    s = (s || "").replace(/[^A-Za-zÀ-ÿ' -]/g, "").replace(/\s+/g, " ").trim();
    var m = s.match(/^(.*?)\s*-\s*([A-Za-z]{2})$/);
    if (m && m[1]) return titulo(m[1]) + " - " + m[2].toUpperCase();
    return s.length >= 2 && !/^undefined/i.test(s) ? titulo(s).slice(0, 50) : "";
  }
  function lerData(s) {
    s = (s || "").trim(); var y, mo, d, m;
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
    else if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else return null;
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || y < 2008 || dt > new Date()) return null;
    return dt;
  }
  var nomeCompleto = limpaNome(ctx.nome);
  var primeiro = nomeCompleto.split(" ")[0] || "";
  var cidade = limpaCidade(ctx.cidade);
  var abertura = lerData(ctx.abertura);
  var email = (ctx.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) email = "";

  // ---------- "Parabéns, Fulano." na capa
  var saud = document.getElementById("saudacao");
  if (saud && primeiro.length >= 2) {
    var dd = abertura ? ("0" + abertura.getDate()).slice(-2) + "/" + ("0" + (abertura.getMonth() + 1)).slice(-2) + "/" + abertura.getFullYear() : "";
    var linha = cidade && dd ? "Seu MEI em " + cidade + ", aberto em " + dd : cidade ? "Seu MEI em " + cidade : dd ? "Seu MEI aberto em " + dd : "";
    var box = document.createElement("div"); box.className = "pb-mei";
    var b = document.createElement("b"); b.textContent = "Parabéns, " + primeiro + "."; box.appendChild(b);
    if (linha) { var sm = document.createElement("small"); sm.textContent = linha; box.appendChild(sm); }
    var p = document.createElement("p"); p.textContent = "Agora começa a rotina: DAS todo mês, nota fiscal, declaração anual. Dá para fazer sozinho nos sites oficiais, ou com alguém do seu lado nos primeiros 30 dias."; box.appendChild(p);
    saud.appendChild(box);
  }

  // ---------- links de compra: UTMs + nome e e-mail preenchidos (o CNPJ nunca vai)
  function montaUrl(base) {
    var url = new URL(base, location.href);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "v"].forEach(function (k) { if (ctx[k]) url.searchParams.set(k === "v" ? "utm_content" : k, ctx[k]); });
    if (nomeCompleto) url.searchParams.set("name", nomeCompleto);
    if (email) { url.searchParams.set("email", email); url.searchParams.set("confirmEmail", email); }
    return url.toString();
  }
  Array.prototype.forEach.call(document.querySelectorAll('a[href^="#checkout-"]'), function (a) {
    var prod = a.getAttribute("href").slice(10);
    a.setAttribute("data-produto", prod);
    if (CHECKOUTS[prod]) { a.href = montaUrl(CHECKOUTS[prod]); a.rel = "noreferrer"; }
    else if (prod === "mentoria") {
      // enquanto o checkout da mentoria não existe, o botão abre um e-mail pronto para a gente
      a.href = "mailto:contato@empresarialdigitallk.org?subject=" + encodeURIComponent("Quero a Mentoria MEI 30 dias") +
        "&body=" + encodeURIComponent("Olá! Quero contratar a Mentoria MEI 30 dias (R$ 97)." + (nomeCompleto ? "\nMeu nome: " + nomeCompleto : ""));
    }
    else a.href = pagina === prod ? "#oferta" : "/" + prod + "#oferta";
  });

  // tira os dados pessoais da barra de endereço (mantém só as UTMs)
  if (chegouAgora && history.replaceState) {
    var keep = new URLSearchParams();
    ["v", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) { if (q.get(k)) keep.set(k, q.get(k)); });
    var resto = keep.toString();
    history.replaceState(null, "", location.pathname + (resto ? "?" + resto : "") + (location.hash.indexOf("=") > 0 ? "" : location.hash));
  }

  // ---------- medição da campanha (painel do n8n): só no domínio real, 1 visita por sessão
  var mede = /(^|\.)noticiasdobrazil\.com$/.test(location.hostname);
  var TRACK = "https://webhook.linikerwambaster.com.br/webhook/mei-t";
  function h53(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < str.length; i++) { var ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  var vid = "";
  try { vid = localStorage.getItem("mei_vid") || ""; if (!vid) { vid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem("mei_vid", vid); } }
  catch (e) { vid = Math.random().toString(36).slice(2, 12); }
  var rcp = email ? h53(email.toLowerCase()) : "";
  var vv = String(ctx.v || ctx.utm_content || "direto").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 20);
  function marca(t, prod) {
    if (!mede) return;
    var u = TRACK + "?t=" + t + "&v=" + encodeURIComponent(vv) + "&id=" + encodeURIComponent(vid) + (rcp ? "&r=" + rcp : "") + (prod ? "&p=" + prod : "");
    try { if (window.fetch) fetch(u, { mode: "no-cors", keepalive: true }); else new Image().src = u; } catch (e) {}
  }
  var jaContou = false;
  try { jaContou = sessionStorage.getItem("ed_visita") === "1"; sessionStorage.setItem("ed_visita", "1"); } catch (e) {}
  if (!jaContou) marca("visita");
  Array.prototype.forEach.call(document.querySelectorAll("a[data-produto]"), function (a) {
    a.addEventListener("click", function () { var pr = a.getAttribute("data-produto"); if (CHECKOUTS[pr]) marca("checkout", pr); });
  });

  // ---------- topo com linha ao rolar
  var topo = document.getElementById("topo");
  function ajustaTopo() { if (topo) topo.classList.toggle("rolou", window.scrollY > 10); }
  ajustaTopo(); addEventListener("scroll", ajustaTopo, { passive: true });

  // ---------- conversas do WhatsApp: as mensagens aparecem uma por uma
  function rodaChat(cel) {
    var msgs = cel.querySelectorAll(".zm");
    if (reduz) { Array.prototype.forEach.call(msgs, function (m) { m.classList.add("ver"); }); return; }
    Array.prototype.forEach.call(msgs, function (m, i) { setTimeout(function () { m.classList.add("ver"); }, 250 + i * 650); });
  }

  // ---------- aparecer ao rolar + linha do passo a passo
  var alvos = document.querySelectorAll(".sobe, .anima, .caminho");
  if (!("IntersectionObserver" in window) || reduz) {
    Array.prototype.forEach.call(alvos, function (el) { el.classList.add("dentro"); if (el.classList.contains("anima")) rodaChat(el); });
  } else {
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (!it.isIntersecting) return;
        it.target.classList.add("dentro");
        if (it.target.classList.contains("anima")) rodaChat(it.target);
        io.unobserve(it.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(alvos, function (el) { io.observe(el); });
  }

  // ---------- barra fixa de compra: aparece depois da capa e some quando a oferta está na tela
  var barra = document.getElementById("barra");
  if (barra) {
    var ba = barra.querySelector("a");
    var oferta = document.getElementById("oferta") || document.getElementById("planos");
    var final = document.querySelector(".final");
    var pedido = false;
    var vendo = function (el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.top < innerHeight * 0.9 && r.bottom > 0; };
    var atualiza = function () {
      pedido = false;
      var on = window.scrollY > innerHeight * 0.75 && !vendo(oferta) && !vendo(final);
      barra.classList.toggle("on", on); barra.setAttribute("aria-hidden", on ? "false" : "true"); if (ba) ba.tabIndex = on ? 0 : -1;
    };
    var pede = function () { if (!pedido) { pedido = true; requestAnimationFrame(atualiza); } };
    addEventListener("scroll", pede, { passive: true }); addEventListener("resize", pede); atualiza();
  }

  // ---------- aviso de cookies (só os essenciais)
  var ck = document.getElementById("cookies");
  if (ck) {
    var visto = false;
    try { visto = localStorage.getItem("cookies_ok") === "1"; } catch (e) {}
    var alt = function () { document.documentElement.style.setProperty("--cookie-h", ck.hidden ? "0px" : ck.offsetHeight + "px"); };
    if (!visto) { ck.hidden = false; alt(); addEventListener("resize", alt); }
    var ok = document.getElementById("cookies-ok");
    if (ok) ok.addEventListener("click", function () { try { localStorage.setItem("cookies_ok", "1"); } catch (e) {} ck.hidden = true; alt(); });
  }
})();
