// Download page v2. Store links, invitation mode, and "the day" driven by scrolling on every screen size.
(function () {
  var ua = navigator.userAgent || "";
  var android = /Android/.test(ua);
  var ios = !android && (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  var links = function (name) { return Array.prototype.slice.call(document.querySelectorAll('[data-store="' + name + '"]')); };
  if (ios) links("android").forEach(function (a) { a.hidden = true; });
  if (android) links("ios").forEach(function (a) { a.hidden = true; });
  if (ios || android) document.getElementById("open").hidden = false;

  // "?src=share_card" and the like are passed on to the stores so each source is counted apart.
  var src = ((new URLSearchParams(location.search).get("src") || "web").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 40)) || "web";
  var play = "https://play.google.com/store/apps/details?id=com.veruon.app&referrer=" + encodeURIComponent("utm_source=" + src + "&utm_medium=get_page");
  links("android").forEach(function (a) { a.href = play; });

  // Group invitations show only what is needed to open them.
  var invite = /^#join=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-HJ-NP-Z2-9]{6})$/i.exec(location.hash);
  if (src === "group_invite" || location.hash.indexOf("#join=") === 0) {
    document.body.classList.add("invite");
    document.querySelectorAll(".resting, .day, .contents, .together, .closing").forEach(function (el) { el.hidden = true; });
    document.getElementById("title").textContent = "바이블틈 모임 초대";
    document.querySelector(".intro .lead").textContent = invite
      ? "초대를 열면 코드가 채워져요. 모임에 들어갈지 앱에서 선택할 수 있어요."
      : "초대 링크를 다시 확인하거나 받은 코드를 앱에서 입력해 주세요.";
    var open = document.getElementById("open");
    open.hidden = !invite;
    if (invite) {
      open.href = "veruon://join-group#" + invite[1].toLowerCase() + "." + invite[2].toUpperCase();
      open.textContent = "바이블틈에서 초대 열기";
      var note = document.getElementById("invitation-note");
      note.textContent = "앱이 없다면 설치한 뒤 이 초대 링크를 다시 열어 주세요.";
      note.hidden = false;
    }
    return;
  }

  // Visits are counted without cookies (Cloudflare Web Analytics), except on invitations.
  var beacon = document.createElement("script");
  beacon.defer = true;
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.setAttribute("data-cf-beacon", '{"token":"6319d248d6c640c9a7d83174a56b2648"}');
  document.body.appendChild(beacon);

  var weekDays = document.querySelectorAll(".week li");
  var today = weekDays[new Date().getDay()];
  today.classList.add("today");

  var top = document.querySelector(".top");
  // The day: 0–.2 the apps, .2–.4 the lock, .4–.8 reading (the verses scroll with the page), .8–1 opened again.
  var day = document.querySelector("[data-day]");
  var screens = {};
  day.querySelectorAll(".day-phone .scr").forEach(function (el) { screens[el.getAttribute("data-s")] = el; });
  var beats = day.querySelectorAll(".beat");
  var dots = day.querySelectorAll(".dots b");
  var tile = day.querySelector('[data-tile="피드"]');
  var start = day.querySelector("[data-press]");
  var list = day.querySelector("[data-verses]");
  var box = list.parentElement;
  var seg = day.querySelector("[data-seg]");
  var hint = day.querySelector("[data-rh]");
  var finish = day.querySelector("[data-finish]");
  var current = "";
  var light = document.querySelector(".day-light");

  function show(name, beat) {
    if (current !== name) {
      Object.keys(screens).forEach(function (k) { screens[k].classList.toggle("on", k === name); });
      current = name;
    }
    beats.forEach(function (b, i) { b.classList.toggle("on", i === beat); });
  }

  function update() {
    top.classList.toggle("scrolled", window.scrollY > 8);
    var rect = day.getBoundingClientRect();
    var room = day.offsetHeight - window.innerHeight;
    var p = Math.min(1, Math.max(0, -rect.top / (room || 1)));
    var reading = Math.min(1, Math.max(0, (p - .4) / .38));
    tile.classList.toggle("pressed", p > .14 && p < .2);
    start.classList.toggle("pressed", p > .34 && p < .4);
    if (p < .2) show("home", 0);
    else if (p < .4) show("lock", 1);
    else if (p < .8) show("read", 2);
    else show("done", 3);
    var travel = Math.max(0, list.scrollHeight - box.clientHeight);
    list.style.transform = "translateY(" + (-reading * travel).toFixed(1) + "px)";
    seg.style.width = Math.round(reading * 100) + "%";
    var read = reading > .98;
    finish.classList.toggle("off", !read);
    finish.classList.toggle("pressed", p > .76 && p < .8);
    hint.textContent = read ? "다 읽었어요" : "마지막 절까지 읽어 주세요";
    // The three bars fill with the steps: step 1 over 0–.4, step 2 over .4–.8, step 3 over .8–1.
    var parts = [p / .4, (p - .4) / .4, (p - .8) / .2];
    dots.forEach(function (d, i) { d.style.width = Math.round(Math.min(1, Math.max(0, parts[i])) * 100) + "%"; });
    // The light crosses the page as the day goes on.
    light.style.setProperty("--beam", (22 - p * 44).toFixed(1) + "%");
    if (p >= .8) today.classList.add("filled");
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
