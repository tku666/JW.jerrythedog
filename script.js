let poopSignalActive = false; 

const statusValues = {
  hunger: 3,
  clean: 3,
  fur: 3,
  fun: 3,
  love: 3
};

const goodMessages = [
  "오늘 하루도 즐겁잔아! (｡>ᴥ<｡)",
  "놀아줘서 고마워~ ( ᴗ͈ˬᴗ͈)ഒ",
  "산책 가자! 산책~ ( ᴗ͈ˬᴗ͈)ഒ",
  "이 집 너무 좋아! ⌯ꈍ𖥦ꈍ⌯ಣ",
  "행복해! ദ്ദി ˉ͈̀꒳ˉ͈́ )✧"
];

const TYPE_SPEED = 40; // 타이핑 속도 (작을수록 빠름)

let isTyping = false;
let typingTimer = null;
let fullText = "";
let typingIndex = 0;

let messageQueue = [];     
let queuePos = 0;
let onQueueDone = null;    

function clearTypingTimer() {
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
}

function ensurePrompt() {
  const el = document.getElementById("jerryMessage");
  if (!el) return;

  if (!el.querySelector(".nextPrompt")) {
    const span = document.createElement("span");
    span.className = "nextPrompt";
    span.textContent = " >"; // 살짝 띄워서 버튼 느낌
    el.appendChild(span);
  }
}

function typeMessage(text) {
  const el = document.getElementById("jerryMessage");
  if (!el) return;

  clearTypingTimer();

  isTyping = true;
  fullText = text;
  typingIndex = 0;
  el.textContent = "";

  typingTimer = setInterval(() => {
    if (typingIndex < fullText.length) {
      el.textContent += fullText[typingIndex];
      typingIndex++;
    } else {
      clearTypingTimer();
      isTyping = false;
      ensurePrompt();
    }
  }, TYPE_SPEED);
}

// 여러 줄을 순서대로 보여주고, 끝나면 onDone 실행
function showLines(lines, onDone) {
  messageQueue = Array.isArray(lines) ? lines : [String(lines)];
  queuePos = 0;
  onQueueDone = typeof onDone === "function" ? onDone : null;
  typeMessage(messageQueue[queuePos]);
}

// 메시지 박스 클릭 동작:
// - 타이핑 중: 즉시 끝까지 출력 + >
// - 타이핑 끝: 다음 줄로 / 마지막이면 onQueueDone 실행
function handleMessageClick() {
  const el = document.getElementById("jerryMessage");
  if (!el) return;

  if (isTyping) {
    clearTypingTimer();
    isTyping = false;
    el.textContent = fullText;
    ensurePrompt();
    return;
  }

  if (messageQueue.length > 0) {
    if (queuePos < messageQueue.length - 1) {
      queuePos++;
      typeMessage(messageQueue[queuePos]);
      return;
    }

    messageQueue = [];
    queuePos = 0;

    if (onQueueDone) {
      const fn = onQueueDone;
      onQueueDone = null;
      fn();
      return;
    }

    updateJerryImage();
  } else {
    updateJerryImage();
  }
}

/* =====================
   Helpers
===================== */
function clamp01to5(v) {
  return Math.max(0, Math.min(5, v));
}

function updateStatusDisplay(statusKey) {
  const container = document.getElementById(`${statusKey}Status`);
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const heartImage = document.createElement("img");
    heartImage.src = i < statusValues[statusKey]
      ? "images/fullheart.png"
      : "images/emptyheart.png";
    heartImage.width = 24;
    heartImage.height = 24;
    container.appendChild(heartImage);
  }
}

function updateAllStatus() {
  for (let k in statusValues) updateStatusDisplay(k);
}

function fadeToImage(src) {
  const img = document.getElementById("jerryImage");
  if (!img) return;
  img.style.opacity = 0;
  setTimeout(() => {
    img.src = src;
    img.style.opacity = 1;
  }, 300);
}

/* =====================
   Poop Event
===================== */
function checkPoopEvent() {
  const poopBox = document.getElementById("poopAlertBox");
  if (!poopBox) return;

  // 이미 급똥이면 또 굴릴 필요 없음 (연출 유지)
  if (poopSignalActive) return;

  if (statusValues.hunger >= 3 && Math.random() < 0.3) {
    poopBox.textContent = "（> – < ）՞ ՞  제리의 급똥!!!";
    poopBox.classList.add("poopAlertActive");
    poopSignalActive = true;
    document.body.classList.add("screenShake");
  } else {
    poopBox.textContent = "";
    poopBox.classList.remove("poopAlertActive");
    poopSignalActive = false;
    document.body.classList.remove("screenShake"); // ✅ 평소엔 흔들림 없음
  }
}

// 급똥 중인데 poopButton 말고 누르면 공통 패널티/문구 처리
function poopBlockIfNeeded() {
  if (!poopSignalActive) return false;

  const e = (typeof event !== "undefined" && event) ? event : window.event;
  const targetId = e && e.target ? e.target.id : "";

  if (targetId !== "poopButton") {
    fadeToImage("images/jerry_poopblocked.png");
    statusValues.love = clamp01to5(statusValues.love - 1);
    updateStatusDisplay("love");

    showLines(
      ["[제리는 응가가 마렵대요...]", "> (다른 거 누르면 삐져서 교감지수가 내려가요…)"],
      () => updateJerryImage()
    );
    return true;
  }

  return false;
}

/* =====================
   Idle screen (status-based image + message)
===================== */
function updateJerryImage() {
  // 큐/타이핑 정리
  messageQueue = [];
  queuePos = 0;
  onQueueDone = null;
  clearTypingTimer();
  isTyping = false;

  const img = document.getElementById("jerryImage");
  if (!img) return;

  img.style.opacity = 0;

  setTimeout(() => {
    let text = "";
    let src = "";

    // ✅ 급똥이 최우선
    if (poopSignalActive) {
      src = "images/jerry_poopblocked.png";
      text = "나 급똥이야... 지금은 응가부터... ૮ ྀི◞ _ ◟ ྀིა";
    } else if (statusValues.love <= 2) {
      src = "images/jerry_sad.png";
      text = "나 너무 외로워...૮ ྀི◞ _ ◟ ྀིა";
    } else if (statusValues.hunger <= 2) {
      src = "images/jerry_hungry.png";
      text = "배가 너무 고파... ₍ 𑁤>‸< ₎ 𑁤";
    } else if (statusValues.clean <= 2) {
      src = "images/jerry_dirty.png";
      text = "너무 더러워졌어! (U ･ꎴ･)";
    } else if (statusValues.fur <= 2) {
      src = "images/jerry_tangled.png";
      text = "엉켜서 간지러워! ૮₍๑ㅠᯅㅠ๑₎ა";
    } else if (statusValues.fun <= 2) {
      src = "images/jerry_mad.png";
      text = "심심해서 화나! ૮ ྀི◞ _ ◟ ྀིა";
    } else {
      src = "images/jerrypfp.png";
      text = goodMessages[Math.floor(Math.random() * goodMessages.length)];
    }

    img.src = src;
    img.style.opacity = 1;

    showLines([text], null);
  }, 300);
}

/* =====================
   Actions (활동 끝난 뒤에만 급똥 판정)
   ✅ 모든 액션: showLines의 onDone 안에서 checkPoopEvent() 실행
===================== */
function feedJerry() {
  if (poopBlockIfNeeded()) return;

  if (statusValues.hunger >= 4) {
    showLines(["[제리는 이미 많이 먹었어요!]]"], () => updateJerryImage());
    return;
  }

  fadeToImage("images/jerry_feed.png");

  setTimeout(() => {
    const lines = ["[제리에게 사료를 줄게요!]"];

    const randHunger = Math.random();
    let hungerChange = 0;

    if (randHunger < 0.6) {
      hungerChange = 3;
      lines.push("> 떵개해버렸다...");
    } else if (randHunger < 0.85) {
      hungerChange = 1;
      lines.push("> 챱챱!");
    } else {
      hungerChange = 0;
      lines.push("> 오늘 입맛이 없어요...");
    }

    statusValues.hunger = clamp01to5(statusValues.hunger + hungerChange);
    updateStatusDisplay("hunger");

    const randFun = Math.random();
    if (randFun < 0.4) {
      statusValues.fun = clamp01to5(statusValues.fun + 1);
      updateStatusDisplay("fun");
      lines.push("> 맛있어서 기분 좋아");
    }

    showLines(lines, () => {
      checkPoopEvent();   // ✅ 활동 끝난 뒤 판정
      updateJerryImage();
    });
  }, 350);
}

function snackJerry() {
  if (poopBlockIfNeeded()) return;

  fadeToImage("images/jerry_snack.png");

  setTimeout(() => {
    const lines = ["[제리에게 간식을 줄게요!]"];

    const randHunger = Math.random();
    let hungerChange = 0;

    if (randHunger < 0.2) {
      hungerChange = 3;
      lines.push("> [제리가 엄청난 양을 먹었어요!]");
    } else if (randHunger < 0.6) {
      hungerChange = 2;
      lines.push("> 챱챱");
    } else {
      hungerChange = 1;
      lines.push("> 안녕하새요. 떵 개 애오");
    }

    statusValues.hunger = clamp01to5(statusValues.hunger + hungerChange);
    updateStatusDisplay("hunger");

    const randClean = Math.random();
    if (randClean < 0.15) {
      statusValues.clean = clamp01to5(statusValues.clean - 2);
      updateStatusDisplay("clean");
      lines.push("> [으악! 누가 이렇게 묻히면서 먹으래!]");
    } else if (randClean < 0.35) {
      statusValues.clean = clamp01to5(statusValues.clean - 1);
      updateStatusDisplay("clean");
      lines.push("> 입에 다 묻었어 누나");
    }

    const randFur = Math.random();
    if (randFur < 0.1) {
      statusValues.fur = clamp01to5(statusValues.fur + 1);
      updateStatusDisplay("fur");
      lines.push("> 털이 비단결이 됐다...");
    }

    const randLove = Math.random();
    if (randLove < 0.05) {
      statusValues.love = clamp01to5(statusValues.love + 3);
      updateStatusDisplay("love");
      lines.push("> 누나 사랑해");
    } else if (randLove < 0.25) {
      statusValues.love = clamp01to5(statusValues.love + 2);
      updateStatusDisplay("love");
      lines.push("> 누나 간식 고마워");
    } else if (randLove < 0.55) {
      statusValues.love = clamp01to5(statusValues.love + 1);
      updateStatusDisplay("love");
      lines.push("> 누나 간식 또 줘");
    }

    showLines(lines, () => {
      checkPoopEvent();
      updateJerryImage();
    });
  }, 350);
}

function walkJerry() {
  if (poopBlockIfNeeded()) return;

  if (statusValues.hunger <= 2) {
    showLines(["[지금은 너무 배고파서 움직일 수 없어...]"], () => updateJerryImage());
    return;
  }

  fadeToImage("images/jerry_walk.png");

  setTimeout(() => {
    const lines = ["[제리와 산책을 가요!]"];

    const randHunger = Math.random();
    if (randHunger < 0.3) {
      statusValues.hunger = clamp01to5(statusValues.hunger - 2);
      lines.push("> 엄청난 산책이었잔아!");
    } else {
      statusValues.hunger = clamp01to5(statusValues.hunger - 1);
      lines.push("> 개운한 산책이야!");
    }
    updateStatusDisplay("hunger");

    const randClean = Math.random();
    if (randClean < 0.4) {
      statusValues.clean = clamp01to5(statusValues.clean - 2);
      lines.push("> [이런, 제리가 잔디밭에서 굴렀어요.]");
    } else {
      statusValues.clean = clamp01to5(statusValues.clean - 1);
      lines.push("> [제리 발바닥에 흙이 잔뜩이네요!]");
    }
    updateStatusDisplay("clean");

    const randFur = Math.random();
    if (randFur < 0.2) {
      statusValues.fur = clamp01to5(statusValues.fur - 2);
      lines.push("> [털에 흙이 잔뜨윽...윽!]");
    } else {
      statusValues.fur = clamp01to5(statusValues.fur - 1);
    }
    updateStatusDisplay("fur");

    const randFun = Math.random();
    if (randFun < 0.01) {
      statusValues.fun = clamp01to5(statusValues.fun - 1);
      lines.push("> [오래 걸은 탓에 제리가 힘들어 보인다..]");
    } else if (randFun < 0.2) {
      statusValues.fun = clamp01to5(statusValues.fun + 2);
      lines.push("> 오늘 특히 재밌었어!");
    } else if (randFun < 0.5) {
      statusValues.fun = clamp01to5(statusValues.fun + 1);
      lines.push("> 상쾌한 산책!");
    }
    updateStatusDisplay("fun");

    const randLove = Math.random();
    if (randLove < 0.1) {
      statusValues.love = clamp01to5(statusValues.love + 1);
      updateStatusDisplay("love");
      lines.push("> 산책 너무 너무 즐거웠잔아");
    }

    showLines(lines, () => {
      checkPoopEvent();
      updateJerryImage();
    });
  }, 350);
}

function playJerry() {
  if (poopBlockIfNeeded()) return;

  fadeToImage("images/jerry_play.png");

  setTimeout(() => {
    const lines = ["[제리에게 장난감을 줄게요!]"];

    const randHunger = Math.random();
    if (randHunger < 0.3) {
      statusValues.hunger = clamp01to5(statusValues.hunger - 2);
      lines.push("> 배고파졌어!!!");
    } else {
      statusValues.hunger = clamp01to5(statusValues.hunger - 1);
      lines.push("> 출출해졌잔아");
    }
    updateStatusDisplay("hunger");

    const randFur = Math.random();
    if (randFur < 0.4) {
      statusValues.fur = clamp01to5(statusValues.fur - 1);
      updateStatusDisplay("fur");
      lines.push("> [이런! 놀다가 털이 엉켰네요~]");
    }

    const randFun = Math.random();
    if (randFun < 0.2) {
      statusValues.fun = clamp01to5(statusValues.fun + 3);
      lines.push("> 좋은 장난감이잔아");
    } else if (randFun < 0.35) {
      statusValues.fun = clamp01to5(statusValues.fun - 1);
      lines.push("> 뭔가 재미없어...");
    } else {
      statusValues.fun = clamp01to5(statusValues.fun + 2);
      lines.push("> 신나!");
    }
    updateStatusDisplay("fun");

    const randLove = Math.random();
    if (randLove < 0.4) {
      statusValues.love = clamp01to5(statusValues.love + 1);
      updateStatusDisplay("love");
      lines.push("> 놀아주니까 좋다!");
    }

    showLines(lines, () => {
      checkPoopEvent();
      updateJerryImage();
    });
  }, 350);
}

function cutJerry() {
  if (poopBlockIfNeeded()) return;

  fadeToImage("images/jerry_cut.png");

  setTimeout(() => {
    const lines = ["[제리 미용 시간이에요!]"];

    statusValues.clean = clamp01to5(statusValues.clean + 1);
    updateStatusDisplay("clean");

    const randFur = Math.random();
    if (randFur < 0.2) {
      statusValues.fur = clamp01to5(statusValues.fur + 2);
      lines.push("> [미용이 완벽한데요?૮꒰⸝⸝> ·̫ <⸝⸝꒱ა]");
    } else {
      statusValues.fur = clamp01to5(statusValues.fur + 1);
      lines.push("> [제리도 마음에 드는 눈치네요!]");
    }
    updateStatusDisplay("fur");

    const randFun = Math.random();
    if (randFun < 0.5 && randFun >= 0.2) {
      statusValues.fun = clamp01to5(statusValues.fun - 2);
      lines.push("> [하지만 제리가 지쳐보여요 (ꐦ · ₋ · )]");
    } else if (randFun >= 0.5) {
      statusValues.fun = clamp01to5(statusValues.fun - 1);
      lines.push("> 힘 들 었 어");
    }
    updateStatusDisplay("fun");

    const randLove = Math.random();
    if (randLove < 0.2) {
      statusValues.love = clamp01to5(statusValues.love - 1);
      lines.push("> 잉 짜증나...");
    } else if (randLove < 0.4) {
      statusValues.love = clamp01to5(statusValues.love - 2);
      lines.push("> 지대 짱나");
    }
    updateStatusDisplay("love");

    showLines(lines, () => {
      checkPoopEvent();
      updateJerryImage();
    });
  }, 350);
}

function bathJerry() {
  if (poopBlockIfNeeded()) return;

  if (statusValues.clean >= 4) {
    showLines(["[벌써 목욕할 순 없어요]"], () => updateJerryImage());
    return;
  }

  fadeToImage("images/jerry_bath.png");

  setTimeout(() => {
    const lines = ["[제리 목욕 시간이에요!]"];

    const randHunger = Math.random();
    if (randHunger < 0.1) {
      statusValues.hunger = clamp01to5(statusValues.hunger - 2);
      lines.push("> 노곤노곤 해서 배고파졌어!!");
    } else if (randHunger < 0.4) {
      statusValues.hunger = clamp01to5(statusValues.hunger - 1);
      lines.push("> 출출해졌어~");
    }
    updateStatusDisplay("hunger");

    statusValues.clean = clamp01to5(statusValues.clean + 2);
    updateStatusDisplay("clean");

    const randFur = Math.random();
    if (randFur < 0.5) {
      statusValues.fur = clamp01to5(statusValues.fur + 1);
      updateStatusDisplay("fur");
      lines.push("> [털까지 윤기가~]");
    }

    const randFun = Math.random();
    if (randFun < 0.5 && randFun >= 0.2) {
      statusValues.fun = clamp01to5(statusValues.fun - 2);
      lines.push("> 축축해...");
    } else if (randFun >= 0.5) {
      statusValues.fun = clamp01to5(statusValues.fun - 1);
      lines.push("> 끄응...!");
    }
    updateStatusDisplay("fun");

    const randLove = Math.random();
    if (randLove < 0.1) {
      statusValues.love = clamp01to5(statusValues.love - 2);
      lines.push("> 씻기 싫다 했는데!!");
    } else if (randLove < 0.4) {
      statusValues.love = clamp01to5(statusValues.love - 1);
      lines.push("> 왜 괴롭혀!");
    }
    updateStatusDisplay("love");

    showLines(lines, () => {
      checkPoopEvent();
      updateJerryImage();
    });
  }, 350);
}

function takeshitJerry() {
  fadeToImage("images/jerry_takeshit.png");

  setTimeout(() => {
    const lines = ["[제리가 화징실을 가네요!]"];

    const randHunger = Math.random();
    if (randHunger < 0.3) {
      statusValues.hunger = clamp01to5(statusValues.hunger - 2);
      lines.push("> 이제 밥 먹을 시간이야!!");
    } else {
      statusValues.hunger = clamp01to5(statusValues.hunger - 1);
      lines.push("> 쾌 변.");
    }
    updateStatusDisplay("hunger");

    const randClean = Math.random();
    if (randClean < 0.2) {
      statusValues.clean = clamp01to5(statusValues.clean - 1);
      updateStatusDisplay("clean");
      lines.push("> .. 웁-스.");
    }

    const randFun = Math.random();
    if (randFun < 0.1) {
      statusValues.fun = clamp01to5(statusValues.fun - 1);
      updateStatusDisplay("fun");
      lines.push("> 배가 좀 아팠어. . .");
    } else if (randFun < 0.2) {
      statusValues.fun = clamp01to5(statusValues.fun + 1);
      updateStatusDisplay("fun");
      lines.push("> 개 운 하 잔 아!");
    }

    // ✅ 응가하면 급똥 신호 해제 + 연출 완전 종료
    poopSignalActive = false;
    const poopBox = document.getElementById("poopAlertBox");
    if (poopBox) {
      poopBox.textContent = "";
      poopBox.classList.remove("poopAlertActive");
    }
    document.body.classList.remove("screenShake");

    showLines(lines, () => {
      // 응가 끝났으니 "바로 다시 급똥 굴리기"는 하지 않음 (원하면 여기서 checkPoopEvent() 넣어도 됨)
      updateJerryImage();
    });
  }, 350);
}

function petJerry() {
  if (poopBlockIfNeeded()) return;

  if (statusValues.fur <= 2 || statusValues.hunger <= 2 || statusValues.clean <= 2) {
    showLines(["[제리가 손길을 피해요..]"], () => updateJerryImage());
    return;
  }

  fadeToImage("images/jerry_pet.png");

  setTimeout(() => {
    const lines = ["[제리를 영원히 쓰다듬고파]"];

    const randFur = Math.random();
    if (randFur < 0.2) {
      statusValues.fur = clamp01to5(statusValues.fur + 1);
      updateStatusDisplay("fur");
      lines.push("> [털이 너무 부드러워~]");
    } else if (randFur < 0.4) {
      statusValues.fur = clamp01to5(statusValues.fur - 1);
      updateStatusDisplay("fur");
      lines.push("> [헉, 너무 많이 쓰다듬었더니 털이...]");
    }

    const randFun = Math.random();
    if (randFun < 0.1) {
      statusValues.fun = clamp01to5(statusValues.fun + 2);
      updateStatusDisplay("fun");
      lines.push("> 부 힛!");
    } else if (randFun < 0.4) {
      statusValues.fun = clamp01to5(statusValues.fun + 1);
      updateStatusDisplay("fun");
      lines.push("> 더 해 줘!");
    }

    const randLove = Math.random();
    if (randLove < 0.2) {
      statusValues.love = clamp01to5(statusValues.love + 2);
      updateStatusDisplay("love");
      lines.push("> 사랑해 눈아");
    } else if (randLove < 0.5) {
      statusValues.love = clamp01to5(statusValues.love + 1);
      updateStatusDisplay("love");
      lines.push("> 좋 아 좋 아");
    }

    showLines(lines, () => {
      checkPoopEvent();
      updateJerryImage();
    });
  }, 350);
}

/* =====================
   Init
===================== */
updateAllStatus();
document.getElementById("jerryMessage").addEventListener("click", handleMessageClick);
updateJerryImage();
