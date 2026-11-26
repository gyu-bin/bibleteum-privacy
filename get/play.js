// The day, played. Screens: home -> lock -> read -> done. Taps drive it; in B, scrolling past each step does too.
(function () {
  var root = document.querySelector("[data-play]");
  if (!root) return;
  var scrollMode = root.getAttribute("data-play") === "scroll";
  var screens = {};
  root.querySelectorAll(".screen").forEach(function (el) { screens[el.getAttribute("data-screen")] = el; });
  var steps = root.querySelectorAll(".play-steps li");
  var live = root.querySelector(".play-live");
  var verses = root.querySelector(".verses");
  var bar = root.querySelector(".screen-read .bar i");
  var finish = root.querySelector("[data-finish]");
  var readHint = root.querySelector(".read-hint");
  var breakBtn = root.querySelector("[data-break]");
  var note = root.querySelector(".lock-note");
  var appName = root.querySelector("[data-app-name]");
  var today = document.querySelector(".week li.today");
  var current = "home";
  steps[0].classList.add("is-current");
  var breaks = 2;
  var chosen = "피드";
  // Which step each screen belongs to, and what a screen reader hears when it opens.
  var stepOf = { home: 1, lock: 1, read: 2, done: 3 };
  var spoken = {
    home: "잠가 둔 앱 네 개가 있어요. 하나를 눌러 보세요.",
    lock: "앱이 잠겼어요. 말씀 시작하기를 눌러 보세요.",
    read: "창세기 1장이에요. 마지막 절까지 내려 읽어 주세요.",
    done: "1장 읽기를 마쳤어요. 앱이 다시 열렸어요."
  };

  function setScreen(name, moveFocus) {
    if (name === current) return;
    current = name;
    Object.keys(screens).forEach(function (key) {
      var on = key === name;
      screens[key].classList.toggle("is-on", on);
      screens[key].setAttribute("aria-hidden", on ? "false" : "true");
      if ("inert" in screens[key]) screens[key].inert = !on;
    });
    var step = stepOf[name];
    steps.forEach(function (li, i) {
      var n = i + 1;
      li.classList.toggle("is-current", n === step && name !== "done");
      li.classList.toggle("is-done", n < step || name === "done");
    });
    if (live) live.textContent = spoken[name];
    if (name === "read") updateProgress();
    if (name === "done" && today) today.classList.add("filled");
    if (moveFocus) {
      var target = screens[name].querySelector("button:not([disabled])");
      if (target) target.focus({ preventScroll: true });
    }
  }

  function updateProgress() {
    var room = verses.scrollHeight - verses.clientHeight;
    var progress = room <= 2 ? 1 : Math.min(1, verses.scrollTop / room);
    bar.style.width = Math.round(progress * 100) + "%";
    var done = progress > 0.97;
    finish.disabled = !done;
    readHint.textContent = done ? "다 읽었어요" : "마지막 절까지 읽어 주세요";
  }

  root.querySelectorAll(".tile").forEach(function (tile) {
    tile.addEventListener("click", function () {
      chosen = tile.getAttribute("data-app");
      appName.textContent = chosen;
      var last = chosen.charCodeAt(chosen.length - 1) - 0xac00;
      var particle = last >= 0 && last % 28 !== 0 ? "이" : "가";
      root.querySelector("[data-done-body]").textContent = chosen + particle + " 다시 열렸어요. 읽은 말씀은 기록에 남았어요.";
      setScreen("lock", true);
    });
  });
  root.querySelector("[data-start]").addEventListener("click", function () {
    verses.scrollTop = 0;
    setScreen("read", true);
  });
  breakBtn.addEventListener("click", function () {
    breaks -= 1;
    if (breaks > 0) {
      breakBtn.textContent = "일시 해제 · " + breaks + "회";
      note.textContent = "급할 땐 15분 동안 열 수 있어요. 여기서는 말씀부터 읽어 볼게요.";
    } else {
      breakBtn.hidden = true;
      note.textContent = "오늘 일시 해제는 다 썼어요. 오전 4시에 다시 생겨요.";
    }
  });
  verses.addEventListener("scroll", updateProgress, { passive: true });
  finish.addEventListener("click", function () { setScreen("done", true); });
  root.querySelector("[data-again]").addEventListener("click", function () {
    breaks = 2;
    breakBtn.hidden = false;
    breakBtn.textContent = "일시 해제 · 2회";
    note.textContent = "";
    setScreen("home", true);
  });
  root.querySelector("[data-week]").addEventListener("click", function () {
    document.getElementById("get").scrollIntoView({ behavior: "smooth" });
  });

  // B: on wide screens, the step in the middle of the window picks the screen, and step 2 reads along with the page.
  if (scrollMode && window.matchMedia("(min-width: 860px)").matches && "IntersectionObserver" in window) {
    var order = ["lock", "read", "done"];
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var name = order[Array.prototype.indexOf.call(steps, entry.target)];
        if (name === "lock" && current === "home") return; // the first step waits for a tap or a little more scroll
        setScreen(name, false);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (li) { observer.observe(li); });
    var readStep = steps[1];
    window.addEventListener("scroll", function () {
      var box = steps[0].getBoundingClientRect();
      if (current === "home" && box.top < window.innerHeight * 0.3) setScreen("lock", false);
      if (current !== "read") return;
      var r = readStep.getBoundingClientRect();
      var through = Math.min(1, Math.max(0, (window.innerHeight * 0.5 - r.top) / r.height));
      verses.scrollTop = through * (verses.scrollHeight - verses.clientHeight);
    }, { passive: true });
  }
})();
