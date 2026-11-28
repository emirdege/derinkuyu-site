(function () {
  'use strict';
  var API = (window.API || '').replace(/\/+$/, '');
  var CANLI = API && API.indexOf('ORNEK') < 0;
  var IG = 'https://www.instagram.com/' + (window.INSTAGRAM || 'derinkuyu100bin') + '/';
  var KATLAR = ['Ahırlar', 'Şarap mahzeni', 'Mutfak', 'Yatakhaneler', 'Okul', 'Şapel', 'Kuyu', 'Mezar odası'];
  var DERIN = ['-8 m', '-17 m', '-27 m', '-38 m', '-48 m', '-58 m', '-68 m', '-85 m'];
  var KAPASITE = 12500;
  var $ = function (id) { return document.getElementById(id); };
  var sayi = function (n) { return Number(n || 0).toLocaleString('tr-TR'); };
  var odaYazi = sayi;
  var temiz = function (k) { return String(k || '').trim().replace(/^@/, '').toLowerCase(); };
  var durum = null, secKat = 0, sayacGosterilen = 0;

  function sakla(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function al(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function kimlik() {
    var k = al('dk_kimlik');
    if (!k) {
      var a = new Uint8Array(12);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (var i = 0; i < 12; i++) a[i] = Math.random() * 256;
      k = Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      sakla('dk_kimlik', k);
    }
    return k;
  }
  function istek(yol, veri) {
    var o = veri ? {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(veri)} : {};
    return fetch(API + yol, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j._durum = r.status; return j; });
    });
  }
  function noOku(v) { var n = Number(String(v || '').replace(/[^0-9]/g, '')); return n >= 1 && n <= 100000 ? n : 0; }
  function katOf(no) { return Math.min(8, Math.ceil(no / KAPASITE)); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  ['ig-git'].forEach(function (id) { $(id).href = IG; });
  var kayitli = al('dk_kullanici');
  if (kayitli) { $('bul-q').value = kayitli; $('kod-kullanici').value = kayitli; }

  // ---------- sayaç ----------
  function say(hedef) {
    var bas = sayacGosterilen, t0 = performance.now(), sure = 1200;
    function adim(t) {
      var p = Math.min(1, (t - t0) / sure), v = Math.round(bas + (hedef - bas) * (1 - Math.pow(1 - p, 3)));
      $('toplam').textContent = sayi(v);
      if (p < 1) requestAnimationFrame(adim); else sayacGosterilen = hedef;
    }
    requestAnimationFrame(adim);
  }

  // ---------- harita ----------
  function ciz(oz) {
    durum = oz;
    var toplam = oz.toplam || 0, kalan = oz.kalan != null ? oz.kalan : toplam;
    say(toplam);
    $('dolum').style.width = (toplam > 0 ? Math.max(1.5, 100 * Math.log10(Math.max(1, toplam)) / 5) : 0) + '%';
    $('kalan').textContent = sayi(kalan);
    $('karanlik').textContent = sayi(Math.max(0, toplam - kalan));
    $('bos').textContent = sayi(100000 - toplam);
    var kap = $('katlar'); kap.innerHTML = '';
    KATLAR.forEach(function (ad, i) {
      var k = i + 1, n = (oz.katlar || [])[i] || 0;
      var d = el('div', 'kat' + (secKat === k ? ' sec' : ''));
      var dolu = el('div', 'dolu'); d.appendChild(dolu);
      var a = el('div', 'kat-ad'); a.appendChild(el('small', null, k + '. KAT · ' + DERIN[i])); a.appendChild(document.createTextNode(ad.toLocaleUpperCase('tr-TR')));
      d.appendChild(a);
      d.appendChild(el('div', 'kat-ar', sayi(i * KAPASITE + 1) + '–' + sayi(k * KAPASITE)));
      d.appendChild(el('div', 'kat-n', n ? sayi(n) + ' sakin · ' + sayi(KAPASITE - n) + ' boş oda' : 'Henüz kimse yok · 12.500 boş oda'));
      d.addEventListener('click', function () { $('no').value = String(i * KAPASITE + 1 + Math.floor(Math.random() * KAPASITE)); $('no-form').requestSubmit ? $('no-form').requestSubmit() : noBak(); $('kontrol').scrollIntoView({behavior: 'smooth', block: 'center'}); });
      kap.appendChild(d);
      requestAnimationFrame(function () { dolu.style.width = (n > 0 ? Math.max(2, 100 * n / KAPASITE) : 0) + '%'; });
    });
    var k9 = el('div', 'kat k9');
    var a9 = el('div', 'kat-ad'); a9.appendChild(el('small', null, '9. KAT · -?? m')); a9.appendChild(document.createTextNode('MÜHÜRLÜ KAT'));
    k9.appendChild(a9); k9.appendChild(el('div', 'kat-ar', 'DOKUNMA')); kap.appendChild(k9);
    var mh = oz.muhurler || [];
    $('muhurler').classList.toggle('gizli', !mh.length);
    if (mh.length) $('muhurler').textContent = 'Kararan odalar: ' + mh.join(' · ');
    $('son-gelenler').textContent = (oz.son || []).slice(0, 8).map(function (x) { return '@' + x.kullanici + ' (' + odaYazi(x.no) + ')'; }).join(', ') || 'henüz kimse yok';
    oyCiz(oz.oy);
  }
  function yenile() {
    if (!CANLI) { ciz({toplam: 0, kalan: 0, katlar: [0, 0, 0, 0, 0, 0, 0, 0], son: [], oy: null, muhurler: []}); return; }
    istek('/ozet').then(ciz).catch(function () {});
  }

  // ---------- sayın boş mu ----------
  function noBak() {
    var no = noOku($('no').value), s = $('no-sonuc');
    s.className = 'sonuc'; s.innerHTML = '';
    if (!no) { s.appendChild(el('div', 'buyuk', '1 ile 100.000 arası bir sayı yaz.')); return; }
    var k = katOf(no); secKat = k; if (durum) ciz(durum);
    var bilgi = el('p', 'soluk', 'Oda ' + odaYazi(no) + ' → ' + k + '. kat · ' + KATLAR[k - 1] + ' (' + DERIN[k - 1] + ')' + (k === 8 ? ' · 9. kata en yakın kat' : ''));
    if (!CANLI) { s.classList.add('bos'); s.appendChild(el('div', 'buyuk', 'Oda ' + odaYazi(no))); s.appendChild(bilgi); return; }
    s.appendChild(el('div', 'buyuk', '…'));
    istek('/oda?no=' + no).then(function (j) {
      s.innerHTML = '';
      if (j.bos && j.muhurlu) { s.classList.add('kara'); s.appendChild(el('div', 'buyuk', 'Oda ' + odaYazi(no) + ' karardı.')); s.appendChild(bilgi); s.appendChild(el('p', null, '9. kat bu odayı mühürledi. Artık kimse alamaz. Başka bir sayı dene.')); return; }
      if (j.bos) {
        s.classList.add('bos'); s.appendChild(el('div', 'buyuk', 'Oda ' + odaYazi(no) + ' boş.')); s.appendChild(bilgi);
        s.appendChild(el('p', null, 'Almak için son bölümün altına yorum olarak bu sayıyı yaz. Senden önce yazan olursa oda onun olur.'));
        var b = el('a', 'dugme yesil kopyala', odaYazi(no) + ' yaz ve Instagram\'a git'); b.href = IG; b.target = '_blank'; b.rel = 'noopener';
        b.addEventListener('click', function () { try { navigator.clipboard.writeText(String(no)); } catch (e) {} });
        s.appendChild(b); return;
      }
      s.classList.add(j.elendi ? 'kara' : 'dolu');
      s.appendChild(el('div', 'buyuk', 'Oda ' + odaYazi(no) + ' dolu.')); s.appendChild(bilgi);
      s.appendChild(el('p', null, '@' + j.kullanici + (j.elendi ? ' burada yaşıyordu, ' + j.elendi + '. bölümde karardı.' : ' burada yaşıyor.') + ' Başka bir sayı dene.'));
    }).catch(function () { s.innerHTML = ''; s.appendChild(el('div', 'buyuk', 'Şehre ulaşılamadı.')); });
  }
  $('no-form').addEventListener('submit', function (e) { e.preventDefault(); noBak(); });

  // ---------- hayatta mısın ----------
  $('bul-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var k = temiz($('bul-q').value), s = $('bul-sonuc');
    s.className = 'sonuc'; s.innerHTML = ''; $('kapi-kutu').classList.add('gizli');
    if (!/^[a-z0-9._]{1,30}$/.test(k)) { s.appendChild(el('div', 'buyuk', 'Kullanıcı adını yaz.')); return; }
    if (!CANLI) return;
    s.appendChild(el('div', 'buyuk', '…'));
    istek('/oda?k=' + encodeURIComponent(k)).then(function (j) {
      s.innerHTML = '';
      if (!j.kullanici) {
        s.appendChild(el('div', 'buyuk', '@' + k + ' şehirde değil.'));
        s.appendChild(el('p', null, 'Henüz odan yok. Son bölümün altına 1 ile 100.000 arası bir sayı yaz. Yorumunu yeni yazdıysan bir sonraki bölümde kapına adın yazılır.'));
        return;
      }
      sakla('dk_kullanici', k); $('kod-kullanici').value = k;
      s.classList.add(j.elendi ? 'kara' : 'bos');
      s.appendChild(el('div', 'buyuk', j.elendi ? 'Odan karardı.' : 'Hayattasın.'));
      s.appendChild(el('p', null, '@' + j.kullanici + ' · oda ' + odaYazi(j.no) + ' · ' + j.kat + '. kat (' + KATLAR[j.kat - 1] + ')' + (j.elendi ? ' · ' + j.elendi + '. bölümde' : '')));
      var kom = (j.komsular || []).map(function (x) { return '@' + x.kullanici + ' (' + odaYazi(x.no) + ')'; });
      s.appendChild(el('p', 'soluk', kom.length ? 'Komşuların: ' + kom.join(' ve ') : 'Yan odalar boş.'));
      if (!j.elendi) { kapiCiz(j); $('kapi-kutu').classList.remove('gizli'); }
      secKat = j.kat; if (durum) ciz(durum);
    }).catch(function () { s.innerHTML = ''; s.appendChild(el('div', 'buyuk', 'Şehre ulaşılamadı.')); });
  });

  // ---------- oylama ----------
  function oyCiz(oy) {
    if (!oy || !oy.bolum || !oy.secenekler || oy.secenekler.length < 2) { $('oylama').classList.add('gizli'); return; }
    $('oylama').classList.remove('gizli');
    $('soru').textContent = 'Bölüm ' + oy.bolum + ': ' + oy.soru;
    var verdi = al('dk_oy_' + oy.bolum);
    var top = (oy.sayim[0] || 0) + (oy.sayim[1] || 0);
    var kap = $('secenekler'); kap.innerHTML = '';
    oy.secenekler.forEach(function (t, i) {
      var b = document.createElement('button'); b.type = 'button';
      var y = document.createElement('div'); y.className = 'yuzde';
      var s = document.createElement('span');
      var yz = top ? Math.round(100 * oy.sayim[i] / top) : 0;
      s.textContent = t + (verdi !== null ? '  · %' + yz : '');
      b.appendChild(y); b.appendChild(s);
      if (verdi !== null) { y.style.width = yz + '%'; b.disabled = true; if (String(i) === verdi) b.classList.add('secili'); }
      b.addEventListener('click', function () { oyVer(oy.bolum, i); });
      kap.appendChild(b);
    });
    $('oy-durum').textContent = verdi !== null ? 'Oyun sayıldı. Toplam ' + sayi(top) + ' oy. Sonuç bir sonraki bölümde.' : 'Bir kişi bir oy. Yorumlardaki seçimler de sayılıyor.';
  }

  function oyVer(bolum, secim) {
    Array.prototype.forEach.call($('secenekler').children, function (b) { b.disabled = true; });
    istek('/oy', {bolum: bolum, secim: secim, kimlik: kimlik(), kullanici: al('dk_kullanici') || ''}).then(function (j) {
      if (j.tamam) { sakla('dk_oy_' + bolum, String(secim)); oyCiz(j.oy); }
      else { $('oy-durum').textContent = j.hata || 'Oy verilemedi.'; yenile(); }
    }).catch(function () { $('oy-durum').textContent = 'Bağlantı hatası, tekrar dene.'; yenile(); });
  }

  // ---------- oda kapısı görseli ----------
  function kemer(c, x, y, w, h) {
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath();
  }
  function kapiCiz(o) {
    var cv = $('kapi'), c = cv.getContext('2d');
    c.fillStyle = '#8c7052'; c.fillRect(0, 0, 1080, 1920);
    for (var i = 0; i < 260; i++) {
      c.fillStyle = i % 2 ? 'rgba(107,84,64,.35)' : 'rgba(26,18,13,.25)';
      var x = (i * 397) % 1080, y = (i * 733) % 1920;
      c.beginPath(); c.ellipse(x, y, 6 + (i % 7) * 3, 3 + (i % 4) * 2, 0, 0, 7); c.fill();
    }
    c.fillStyle = '#0d0907'; kemer(c, 190, 430, 700, 1050); c.fill();
    c.fillStyle = '#ffb257'; kemer(c, 230, 480, 620, 1000); c.fill();
    c.save(); c.translate(230, 0); c.scale(0.86, 1);
    c.fillStyle = '#5a3a22'; kemer(c, 0, 480, 620, 1000); c.fill();
    c.fillStyle = '#3a2414'; for (i = 0; i < 5; i++) c.fillRect(20 + i * 120, 600, 8, 860);
    c.fillStyle = '#c9a24e'; c.fillRect(70, 760, 480, 130);
    c.strokeStyle = '#7a5b22'; c.lineWidth = 6; c.strokeRect(70, 760, 480, 130);
    c.fillStyle = '#2b1a0e'; c.textAlign = 'center'; c.textBaseline = 'middle';
    var ad = '@' + o.kullanici, fs = ad.length > 16 ? 40 : ad.length > 11 ? 52 : 64;
    c.font = '900 ' + fs + 'px system-ui, sans-serif'; c.fillText(ad, 310, 826);
    c.restore();
    c.textAlign = 'center'; c.fillStyle = '#f4e7d1';
    c.font = '800 34px system-ui, sans-serif'; c.fillText('DERİNKUYU · ' + o.kat + '. KAT · ' + KATLAR[o.kat - 1].toLocaleUpperCase('tr-TR'), 540, 230);
    c.font = '900 130px system-ui, sans-serif'; c.fillStyle = '#ffb257'; c.fillText('ODA ' + odaYazi(o.no), 540, 345);
    c.fillStyle = 'rgba(13,9,7,.82)'; c.fillRect(0, 1540, 1080, 250);
    c.fillStyle = '#f4e7d1'; c.font = '800 44px system-ui, sans-serif'; c.fillText('Sayımı seçtim. Sona ben kalacağım.', 540, 1600);
    c.fillStyle = '#86ff6b'; c.font = '700 34px system-ui, sans-serif'; c.fillText('Seninki kaç? Yoruma 1-100.000 arası yaz.', 540, 1660);
    c.font = '700 34px system-ui, sans-serif'; c.globalAlpha = 0.7; c.fillText('@' + (window.INSTAGRAM || 'derinkuyu100bin'), 540, 1740); c.globalAlpha = 1;
    try { $('indir').href = cv.toDataURL('image/png'); } catch (e) {}
  }

  // ---------- gizli kapı ----------
  $('kod-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var k = temiz($('kod-kullanici').value), kod = $('kod').value.replace(/\D/g, ''), s = $('kod-sonuc');
    s.className = ''; s.textContent = '…';
    istek('/kod', {kullanici: k, kod: kod}).then(function (j) {
      if (j.hata) { s.textContent = j.hata; return; }
      if (j.dogru) { s.className = 'dogru'; s.textContent = 'Kapı açıldı. Bu bölümde kapıyı açan ' + j.sira + '. kişisin.'; }
      else s.textContent = 'Taş kımıldamadı. ' + (j.kalan > 0 ? j.kalan + ' hakkın kaldı.' : 'Hakkın bitti.');
    }).catch(function () { s.textContent = 'Bağlantı hatası.'; });
  });

  // ---------- bölümler ----------
  fetch('bolumler.json', {cache: 'no-store'}).then(function (r) { return r.ok ? r.json() : []; }).then(function (l) {
    if (!l || !l.length) return;
    $('son-bolum').classList.remove('gizli');
    $('bolum-etiket').textContent = 'BÖLÜM ' + l[0].bolum;
    $('video').src = l[0].video_url; $('kanca').textContent = l[0].kanca;
    if (l.length > 1) {
      $('arsiv').classList.remove('gizli');
      l.slice(1).forEach(function (b) {
        var li = el('li'); li.value = b.bolum;
        var a = el('a', null, b.kanca); a.href = b.video_url; li.appendChild(a);
        if (b.secim) li.appendChild(el('div', 'soluk', 'Karar: ' + b.secim + (b.yuzde ? ' (%' + b.yuzde + ')' : '')));
        $('bolumler').appendChild(li);
      });
    }
  }).catch(function () {});

  yenile();
  if (kayitli && CANLI) $('bul-form').requestSubmit && $('bul-form').requestSubmit();
  setInterval(function () { if (!document.hidden) yenile(); }, 30000);
})();
