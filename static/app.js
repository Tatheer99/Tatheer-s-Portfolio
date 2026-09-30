document.querySelectorAll('[data-zoom]').forEach(button=>{
  button.addEventListener('click',()=>{
    const dialog=document.querySelector('#image-viewer');
    const original=button.querySelector('img');
    if(!dialog||!original)return;
    const image=dialog.querySelector('img');
    image.src=original.src;image.alt=original.alt;
    dialog.showModal();
  });
});
const viewer=document.querySelector('#image-viewer');
if(viewer){
  viewer.querySelector('[data-close]').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('click',event=>{if(event.target===viewer)viewer.close()});
}


// Hero card + marquee motion. These are intentionally always enabled so the
// portfolio animation works even if earlier CSS rules are present.
document.addEventListener('DOMContentLoaded', () => {
  const card = document.querySelector('.hero-hanging');
  const rig = document.querySelector('.hero-hanging .hanging-rig');
  const track = document.querySelector('.marquee-track');

  if (card) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => card.classList.add('is-entering'));
    });
  }



  // Subtle physical interaction: press/hold the card to pause its swing and
  // gently drag it around. Releasing lets it settle back and resume swinging.
  if (card && rig && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let held = false, startX = 0, startY = 0, pointerId = null;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    card.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      held = true; pointerId = event.pointerId;
      startX = event.clientX; startY = event.clientY;
      card.classList.add('is-held');
      rig.style.animationPlayState = 'paused';
      card.setPointerCapture(pointerId);
      event.preventDefault();
    });

    card.addEventListener('pointermove', event => {
      if (!held || event.pointerId !== pointerId) return;
      const dx = clamp(event.clientX - startX, -42, 42);
      const dy = clamp(event.clientY - startY, -22, 22);
      const angle = clamp(dx * 0.075, -4.5, 4.5);
      card.style.transform = `translateX(calc(-50% + ${dx}px)) translateY(${dy}px) rotate(${angle}deg)`;
    });

    const release = event => {
      if (!held || (event && event.pointerId !== pointerId)) return;
      held = false; card.classList.remove('is-held');
      card.style.transform = 'translateX(-50%) rotate(-1.1deg)';
      if (event && card.hasPointerCapture?.(event.pointerId)) card.releasePointerCapture(event.pointerId);
      pointerId = null;
      window.setTimeout(() => { card.style.transform = ''; rig.style.animationPlayState = ''; }, 360);
    };
    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);
    card.addEventListener('lostpointercapture', () => { if (held) release(); });
  }

  // JS fallback for the marquee: guarantees a continuous right-moving loop.
  if (track) {
    let x = -50;
    let last = performance.now();
    const speed = 5.2; // percent of track width per second
    const tick = now => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      x += speed * dt;
      if (x >= 0) x = -50;
      track.style.transform = `translate3d(${x}%,0,0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
});


// Mobile navigation
const menuToggle = document.querySelector('.menu-toggle');
const siteMenu = document.querySelector('.nav-links');
if (menuToggle && siteMenu) {
  menuToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('mobile-menu-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  siteMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      document.body.classList.remove('mobile-menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    });
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 800) {
      document.body.classList.remove('mobile-menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    }
  });
}

/* Cursor eyes + personality comments — 500+ local comments, section-aware */
(() => {
  if (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (document.querySelector('.tatheer-eyes')) return;

  const face = document.createElement('div');
  face.className = 'tatheer-eyes';
  face.setAttribute('aria-hidden', 'true');
  face.innerHTML = `
    <div class="tatheer-eyebrows"><span></span><span></span></div>
    <div class="tatheer-eye"><span class="tatheer-pupil"></span><i></i></div>
    <div class="tatheer-eye"><span class="tatheer-pupil"></span><i></i></div>
    <div class="tatheer-bubble"></div>`;
  document.body.appendChild(face);

  const eyes = [...face.querySelectorAll('.tatheer-eye')];
  const pupils = [...face.querySelectorAll('.tatheer-pupil')];
  const bubble = face.querySelector('.tatheer-bubble');
  const state = {
    x: innerWidth / 2, y: innerHeight / 2,
    tx: innerWidth / 2, ty: innerHeight / 2,
    hover: null, hoverType: null, lastMove: performance.now(), moving: false,
    targetCounts: new WeakMap(), targetLast: new WeakMap(),
    lastComment: '', bubbleTimer: null, blinkTimer: null, blinkBusy: false, lastCommentAt: 0, emotion: 'neutral'
  };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const sameTarget = (a,b) => a === b;
  const pick = (arr, key) => {
    if (!arr || !arr.length) return '';
    const last = key && typeof key === 'object' ? state.targetLast.get(key) : null;
    let choices = arr.filter(v => v !== last && v !== state.lastComment);
    if (!choices.length) choices = arr.filter(v => v !== last);
    if (!choices.length) choices = arr;
    const value = choices[Math.floor(Math.random() * choices.length)];
    if (key && typeof key === 'object') {
      state.targetCounts.set(key, (state.targetCounts.get(key) || 0) + 1);
      state.targetLast.set(key, value);
    }
    state.lastComment = value;
    return value;
  };

  const sectionPools = {
  "header": [
    "starting with the menu? you waste no time.",
    "you found the navigation. now commit.",
    "the buttons are pretending to be innocent.",
    "checking the exits already?",
    "yes, the top bar works.",
    "you are hovering like there's a secret here.",
    "navigation first. chaos later.",
    "looking for somewhere to go? fair.",
    "the nav survived another inspection.",
    "you could click it, you know.",
    "menu detected. confidence detected too.",
    "you came for directions. respectable.",
    "nothing suspicious up here. probably.",
    "the header is doing its tiny little job.",
    "that button has your full attention.",
    "checking every option before committing? relatable.",
    "very serious navigation business happening here.",
    "you found the boring useful bit.",
    "the top bar says hello.",
    "the menu is not hiding anything. today.",
    "you are browsing with intent. dangerous.",
    "that link has been waiting for you.",
    "okay captain navigation, choose your destination.",
    "no secret menu. i checked."
  ],
  "hero": [
    "so you came to play 😑",
    "seriously bro, do your work 🙄",
    "you touched the card. of course you did.",
    "again? you have work to do.",
    "bro discovered gravity.",
    "please don't break my little card.",
    "it swings. that's the whole trick.",
    "you found the weird part first. respect.",
    "the card is just hanging out. literally.",
    "you are absolutely going to touch it again.",
    "this is why i can't have nice props.",
    "okay, that was a confident grab.",
    "the card has entered the conversation.",
    "you really came here to test the physics.",
    "one tiny card. apparently irresistible.",
    "hands off the prop. respectfully.",
    "you found the personality before the portfolio.",
    "the hero is not a fidget spinner.",
    "that little swing was intentional, promise.",
    "you are negotiating with a piece of paper.",
    "the card says hi. don't encourage it.",
    "okay, you've had your fun.",
    "the hero noticed you before i did.",
    "classic first move: touch everything."
  ],
  "work": [
    "ah. you want the receipts.",
    "okay, now we're talking.",
    "this is where the pixels defend themselves.",
    "you came for the work. good.",
    "here's the part i can't fake.",
    "welcome to the evidence room.",
    "these are actual things i made, promise.",
    "time to judge some pixels.",
    "the work is ready. i'm slightly nervous.",
    "pick a rabbit hole.",
    "this section did not build itself.",
    "you found the good drawer.",
    "the thumbnails are doing their sales pitch.",
    "some of these took embarrassingly long.",
    "portfolio inspection begins now.",
    "you want proof? scroll two inches.",
    "the work can speak for itself. mostly.",
    "this is the part clients actually care about.",
    "you made it to the receipts.",
    "choose a project and pretend you're not judging me.",
    "the pixels have stories. unfortunately, many of them.",
    "look around. no pressure. tiny pressure.",
    "the work is lined up. behave.",
    "finally, something worth clicking.",
    "okay, let's see what you've got."
  ],
  "project": [
    "you picked one. bold move.",
    "okay, this one has lore.",
    "that thumbnail got you, didn't it?",
    "good eye. now look closer.",
    "this one survived several questionable revisions.",
    "there's more behind that thumbnail.",
    "you found one of the fun ones.",
    "open it. i dare you.",
    "this project has receipts.",
    "yes, that detail was intentional.",
    "you are officially in the rabbit hole.",
    "this one made me rethink things.",
    "the screenshot is only the beginning.",
    "you picked a project. commitment unlocked.",
    "don't judge it before seeing the case study.",
    "this one has a story behind it.",
    "okay detective, investigate.",
    "you found a little piece of my brain.",
    "the project remembers the deadlines. i don't.",
    "this layout fought back. i won. mostly.",
    "there's context hiding behind that card.",
    "this one deserves more than a two-second glance.",
    "you clicked with confidence. i respect it.",
    "the thumbnail did its job. your turn."
  ],
  "thinking": [
    "you want to know how i think? brave.",
    "welcome to the overthinking department.",
    "yes, there is a reason for that button.",
    "this is where pretty pixels get interrogated.",
    "the screen comes after the question.",
    "okay, brain mode on.",
    "design starts before the first rectangle.",
    "this is the part nobody sees.",
    "strategy first. shiny stuff later.",
    "you found the messy middle.",
    "there's method behind the madness. annoyingly.",
    "i don't just move boxes around. promise.",
    "the why usually comes before the how.",
    "good design starts with noticing things.",
    "this is where constraints become useful.",
    "welcome behind the interface.",
    "yes, i actually think about this stuff.",
    "the final screen hides a lot of decisions.",
    "less guessing. more questions.",
    "you wanted the process. here comes the nerdy bit.",
    "the pixels are innocent. the decisions are not.",
    "this section is basically my brain notes.",
    "not everything needs another animation.",
    "okay, enough philosophy. back to work."
  ],
  "more": [
    "you thought that was everything? cute.",
    "there's more. apparently i have a problem.",
    "bonus round.",
    "still scrolling? respect.",
    "you found the second drawer.",
    "the side quests live here.",
    "yes, these projects count too.",
    "the archive is feeling exposed.",
    "you asked for more. here we are.",
    "the portfolio refuses to end gracefully.",
    "another project escaped the main row.",
    "these didn't make the first shelf. rude, honestly.",
    "welcome to the extended edition.",
    "you are committed to the tour now.",
    "more work, fewer excuses.",
    "the extras have entered the chat.",
    "one more rabbit hole won't hurt.",
    "you found the bonus shelf.",
    "the project pile is still alive.",
    "no, seriously, there is more.",
    "the archive says hi.",
    "your curiosity has consequences: more scrolling.",
    "these deserve attention too.",
    "okay, this is officially the deep end."
  ],
  "about": [
    "ah, the human behind the pixels.",
    "you want the backstory? okay.",
    "personal section unlocked.",
    "so this is where i explain myself.",
    "you made it past the work. impressive.",
    "yes, there is a person behind this.",
    "here comes the mildly awkward biography.",
    "you want the lore.",
    "okay, introductions then.",
    "this is the less polished part. literally.",
    "the pixels have a human attached to them.",
    "you found the person section.",
    "professional origin story incoming.",
    "i promise the résumé isn't the whole story.",
    "so you're curious about me. noted.",
    "welcome to the human layer.",
    "this is where the portfolio stops pretending.",
    "yes, that's actually me.",
    "the work tells one story. this tells another.",
    "you've entered biography territory. brave.",
    "okay, enough about screens. hi.",
    "the designer has been located.",
    "you wanted context. here's some.",
    "nice to meet you, internet stranger."
  ],
  "contact": [
    "oh. you're actually considering it.",
    "okay, now you've got my attention.",
    "yeah, that's what i want.",
    "OH. you found the important button.",
    "this is usually where the fun starts.",
    "you want to work together? say less.",
    "finally, a productive click.",
    "okay bro, let's talk.",
    "you made it to the business end.",
    "this button has consequences. good ones.",
    "so... project?",
    "you came all this way to actually talk.",
    "now we're getting somewhere.",
    "i was wondering when you'd get here.",
    "okay, tell me what you're building.",
    "this is my favorite section, obviously.",
    "a message would be nice. just saying.",
    "you found the inbox door.",
    "less browsing. more building.",
    "alright, pitch me the problem.",
    "this is where the portfolio becomes a conversation.",
    "you clicked contact. i'm listening.",
    "okay, let's make something worth showing."
  ],
  "footer": [
    "you made it to the bottom. somehow.",
    "the footer. the final boss.",
    "still here? i respect the commitment.",
    "that's basically the tour.",
    "you survived the portfolio.",
    "the website can stop talking now.",
    "no secret message down here. sorry.",
    "you actually scrolled all the way.",
    "okay, detective. case closed.",
    "the pixels are tired. you?",
    "you reached the basement.",
    "this is where websites go to rest.",
    "the footer has seen enough.",
    "congratulations, you found the bottom.",
    "one last look before you leave?",
    "the end credits are rolling.",
    "you really inspected the whole thing.",
    "alright bro, that's enough scrolling.",
    "the tour is officially over.",
    "you can go now. i promise."
  ],
  "generic": [
    "interesting choice.",
    "you really clicked that.",
    "okay, that happened.",
    "i saw that.",
    "curious. very curious.",
    "you found something.",
    "bold interaction.",
    "that was intentional. mostly.",
    "you're poking the website again.",
    "okay, i'm watching you.",
    "carry on, detective.",
    "the website noticed.",
    "you have my attention.",
    "another interaction for the archive.",
    "that was suspiciously confident.",
    "you seem committed.",
    "fair enough. keep going.",
    "i respect the curiosity.",
    "well, now i'm curious too.",
    "okay, what are you looking for?",
    "you found the personality layer.",
    "noted.",
    "that was a choice.",
    "the site has opinions."
  ]
};  const interactionPools = {
  "seeWork": [
    "OK fine, go ahead 🫡",
    "alright, let’s see what you found.",
    "you clicked it. commitment issues later.",
    "fine, showtime.",
    "okay, lets see the work.",
    "you asked for receipts. here they are.",
    "go on then.",
    "you really wanna see it?",
    "alright bro, work mode.",
    "okay, portfolio time."
  ],
  "video": [
    "yeah bro thats me 🫣",
    "please pretend this is natural.",
    "yes, that is my face. unfortunately.",
    "thats me. dont make it weird.",
    "you found the face reveal.",
    "okay yes, thats actually me.",
    "caught on camera. tragic.",
    "yes bro, thats the video.",
    "you are staring at the screen now.",
    "thats enough eye contact."
  ],
  "image": [
    "zooming in? naturally.",
    "you needed to see that closer?",
    "yes, the pixels are still there.",
    "inspect away, detective.",
    "okay, lets look closer.",
    "you are definitely checking the details.",
    "pixel inspection activated.",
    "nothing hidden. probably.",
    "you found the zoom button.",
    "respect the attention to detail."
  ],
  "text": [
    "wow. literacy. 🙄",
    "oh, you are actually reading.",
    "taking notes? suspicious.",
    "look at you selecting things.",
    "you highlighted it. fascinating.",
    "reading the fine print?",
    "okay scholar.",
    "you are really studying this.",
    "text has been acquired.",
    "nice selection."
  ],
  "resume": [
    "doing your homework? 🧐",
    "checking the receipts?",
    "ah yes, background checks.",
    "you came prepared.",
    "reading the resume? bold.",
    "checking credentials, i see.",
    "professional investigation underway.",
    "you want the lore.",
    "okay, due diligence.",
    "the PDF is ready."
  ],
  "heroCard": [
    "so you came to play 😑",
    "seriously bro, do your work 🙄",
    "you touched the card. of course you did.",
    "again? you have work to do.",
    "bro discovered the hanging card.",
    "please dont break my little card.",
    "the card is not a fidget toy.",
    "yes, it moves. happy now?",
    "you are absolutely clicking it again.",
    "okay, enough card abuse."
  ]
};

  const classify = el => {
    if (!el || !(el instanceof Element)) return { type: null, key: null };

    // High-priority object interactions.
    if (el.closest('.hero-hanging-card, .hero-hanging, .hanging-rig')) return { type: 'heroCard', key: el.closest('.hero-hanging-card, .hero-hanging, .hanging-rig') };
    if (el.closest('.hero-video, .case-video, [href*="drive.google.com"]')) return { type: 'video', key: el.closest('.hero-video, .case-video, [href*="drive.google.com"]') };
    if (el.closest('.nav-contact, a[href^="mailto:"]')) return { type: 'contact', key: el.closest('.nav-contact, a[href^="mailto:"]') };
    if (el.closest('.nav-resume, a[href*="CV.pdf"]')) return { type: 'resume', key: el.closest('.nav-resume, a[href*="CV.pdf"]') };
    if (el.closest('[data-zoom], .image-button, .project-frame, .project-image, .case-cover')) return { type: 'image', key: el.closest('[data-zoom], .image-button, .project-frame, .project-image, .case-cover') };

    const a = el.closest('a, button');
    const text = (a?.innerText || el.innerText || '').trim().toLowerCase();
    if (text.includes('see the work') || text.includes('selected work')) return { type: 'seeWork', key: a || el };
    if (text.includes('more work') || text.includes('more projects')) return { type: 'more', key: a || el };
    if (text.includes('how i think') || el.closest('#thinking, .play-card, .principle')) return { type: 'thinking', key: el.closest('#thinking, .play-card, .principle') || a || el };
    if (el.closest('.project, .work-row, .next-project')) return { type: 'project', key: el.closest('.project, .work-row, .next-project') };

    // Every main site section gets its own local comment pool.
    const section = el.closest('header, main > section, footer');
    if (section) {
      const id = (section.id || '').toLowerCase();
      const cls = (section.className || '').toString().toLowerCase();
      let type = 'generic';
      if (section.tagName === 'HEADER') type = 'header';
      else if (section.tagName === 'FOOTER') type = 'footer';
      else if (id === 'work' || cls.includes('section')) type = 'work';
      if (id === 'thinking') type = 'thinking';
      if (id === 'more-work' || cls.includes('more')) type = 'more';
      if (id === 'about' || cls.includes('about')) type = 'about';
      if (id === 'contact' || cls.includes('contact')) type = 'contact';
      if (cls.includes('hero')) type = 'hero';
      return { type, key: section };
    }

    return a ? { type: 'generic', key: a } : { type: null, key: null };
  };

  const getPool = type => {
    if (interactionPools[type]) return interactionPools[type];
    return sectionPools[type] || sectionPools.generic;
  };

  // Small emotional reactions make the cursor character feel alive without
  // changing the existing comment system.
  const setEmotion = type => {
    let emotion = 'neutral';
    if (type === 'contact' || type === 'seeWork') emotion = 'happy';
    else if (type === 'heroCard') emotion = 'annoyed';
    else if (type === 'project' || type === 'work') emotion = 'proud';
    else if (type === 'thinking') emotion = 'curious';
    else if (type === 'resume') emotion = 'nervous';
    else if (type === 'about') emotion = 'shy';
    else if (type === 'footer' || type === 'more') emotion = 'sad';
    else if (type === 'image' || type === 'video') emotion = 'surprised';
    else if (type === 'text') emotion = 'sleepy';

    if (state.emotion !== emotion) {
      state.emotion = emotion;
      face.dataset.emotion = emotion;
    }
  };

  const showComment = (type, key, duration = 2300, force = false) => {
    // Keep the personality as an easter egg: comments appear selectively rather than constantly.
    const now = performance.now();
    const cooldown = force ? 3200 : 6500;
    if (!force && now - state.lastCommentAt < cooldown) return;
    if (force && now - state.lastCommentAt < 1200) return;

    const text = pick(getPool(type), key || face);
    if (!text) return;
    state.lastCommentAt = now;
    bubble.textContent = text;
    bubble.classList.remove('show');
    void bubble.offsetWidth;
    bubble.classList.add('show');
    clearTimeout(state.bubbleTimer);
    state.bubbleTimer = setTimeout(() => bubble.classList.remove('show'), duration);
  };

  const scheduleBlink = (min = 1800, max = 6200) => {
    clearTimeout(state.blinkTimer);
    state.blinkTimer = setTimeout(() => {
      if (!state.blinkBusy) {
        state.blinkBusy = true;
        face.classList.add('blinking');
        setTimeout(() => {
          face.classList.remove('blinking');
          state.blinkBusy = false;
          if (Math.random() < 0.18) {
            setTimeout(() => {
              face.classList.add('blinking');
              setTimeout(() => face.classList.remove('blinking'), 95);
            }, 130);
          }
        }, 105);
      }
      scheduleBlink(1700, 6800);
    }, min + Math.random() * (max - min));
  };
  scheduleBlink();

  const react = (el, click = false) => {
    const result = classify(el);
    if (!result.type || !result.key) return;
    const changed = !sameTarget(result.key, state.hover) || result.type !== state.hoverType;
    state.hover = result.key;
    state.hoverType = result.type;
    setEmotion(result.type);
    if (click || changed) {
      const duration = click ? 2700 : (result.type === 'heroCard' ? 2400 : 2250);
      showComment(result.type, result.key, duration, click);
    }
  };

  window.addEventListener('mousemove', e => {
    state.tx = e.clientX;
    state.ty = e.clientY;
    state.lastMove = performance.now();
    state.moving = true;
    react(document.elementFromPoint(e.clientX, e.clientY));
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    state.hover = null;
    state.hoverType = null;
    setEmotion('generic');
  });

  document.addEventListener('click', e => {
    const el = e.target instanceof Element ? e.target : null;
    react(el, true);
  });

  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 3) {
      setEmotion('text');
      showComment('text', face, 1900);
    }
  });

  const tick = () => {
    const now = performance.now();
    if (now - state.lastMove > 240) state.moving = false;
    state.x += (state.tx - state.x) * 0.52;
    state.y += (state.ty - state.y) * 0.52;
    const faceX = state.x + 28;
    const faceY = state.y - 34;
    face.style.transform = `translate3d(${faceX}px, ${faceY}px, 0)`;

    let lookX = state.x, lookY = state.y;
    const hovered = state.hover;
    if (!hovered && !state.moving) {
      lookX = innerWidth / 2;
      lookY = innerHeight * 0.43;
    } else if (hovered && hovered !== face && document.contains(hovered)) {
      const r = hovered.getBoundingClientRect();
      lookX = r.left + r.width / 2;
      lookY = r.top + Math.min(r.height / 2, 90);
    }
    eyes.forEach((eye, i) => {
      const r = eye.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = lookX - cx, dy = lookY - cy;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const max = 7.2;
      const px = clamp(dx / dist * Math.min(max, dist / 14), -max, max);
      const py = clamp(dy / dist * Math.min(max, dist / 14), -max, max);
      pupils[i].style.transform = `translate(${px}px, ${py}px)`;
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
