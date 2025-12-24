// Fix mobile vh, detect Telegram WebApp, and helper to re-parent fixed elements
(function(){
  const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  setVh();

  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh); // <<--- aggiunto

  const isTelegram = /Telegram/.test(navigator.userAgent) || (window.Telegram && window.Telegram.WebApp);
  if (isTelegram) document.documentElement.classList.add('tg-webapp');

  // ensure fixed-position elements are actually children of body if ancestor transforms break them
  window.ensureFixed = function ensureFixed(el) {
    if (!el || !el.parentElement) return;
    let p = el.parentElement;
    while (p && p !== document.body) {
      const style = getComputedStyle(p);
      if (style.transform !== 'none' || style.backdropFilter !== 'none') {
        document.body.appendChild(el);
        return;
      }
      p = p.parentElement;
    }
  };

  // after DOM ready, move problematic elements
  document.addEventListener('DOMContentLoaded', () => {
    ['top-menu','bottom-menu','menu-addpredict','menu-predict-filters','bet-modal','buy-menu'].forEach(id=>{
      const el = document.getElementById(id);
      if (el) ensureFixed(el);
    });
  });
})();




function switchTab(tabName) {
  // Nascondi tutto
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  // Mostra solo quello
  document.getElementById(tabName).classList.add('active');
  // Animazione fluida opzionale
  document.getElementById(tabName).style.opacity = '0';
  setTimeout(() => document.getElementById(tabName).style.opacity = '1', 50);
}
const openBtn = document.getElementById("predict-create");
const menu = document.getElementById("menu-addpredict");
const overlay = document.getElementById("overlay");
const sendBtn = document.getElementById("sent-predict-button");
const hiwBtn = document.getElementById("hiw");
const filtersBtn = document.getElementById("predict-filters");
const menuPredictFilters = document.getElementById("menu-predict-filters");
const predicts = [];


const titleInput = document.getElementById("predict-title");
const descInput = document.getElementById("predict-description");
const hiwDisplay = document.getElementById("hiw-display");

// conversion rate: 1 star = 1 USD (change if needed)
const STAR_TO_USD = 1;

// helpers
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"'`]/g, (s) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
    })[s]);
}

// bet modal elements
const betModal = document.getElementById('bet-modal');
const betAmountInput = document.getElementById('bet-amount');
const betSideText = document.getElementById('bet-side');
const betError = document.getElementById('bet-error');
const betConfirmBtn = document.getElementById('bet-confirm');
const betCancelBtn = document.getElementById('bet-cancel');
let currentBet = { idx: null, side: null };

function openBetModal(idx, side) {
    if (!betModal) return;
    currentBet.idx = idx;
    currentBet.side = side;
    if (betSideText) betSideText.textContent = 'Side: ' + (side === 'yes' ? 'YES' : 'NO');
    if (betAmountInput) betAmountInput.value = '';
    if (betError) betError.textContent = '';
    betModal.setAttribute('aria-hidden', 'false');
    if (menu) menu.style.display = 'none';
    if (overlay) overlay.style.display = 'block';
    if (betConfirmBtn) betConfirmBtn.disabled = true;
    if (betAmountInput) betAmountInput.focus();
}
function closeBetModal() {
    if (!betModal) return;
    betModal.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.style.display = 'none';
    currentBet.idx = null;
    currentBet.side = null;
}

// validation on input
if (betAmountInput) betAmountInput.oninput = () => {
    const raw = betAmountInput.value;
    const stars = Number(raw);
    if (!raw || !Number.isFinite(stars) || stars <= 0 || !Number.isInteger(stars)) {
        if (betError) betError.textContent = 'Enter an integer number of stars (> 0).';
        if (betConfirmBtn) betConfirmBtn.disabled = true;
    } else {
        if (betError) betError.textContent = '';
        if (betConfirmBtn) betConfirmBtn.disabled = false;
    }
}

// confirm handler
if (betConfirmBtn) betConfirmBtn.onclick = () => {
    if (betConfirmBtn.disabled) return;
    if (currentBet.idx === null) {
        if (betError) betError.textContent = 'Internal error: no predict selected.';
        return;
    }
    const raw = betAmountInput ? betAmountInput.value : '';
    const stars = Number(raw);
    if (!raw || !Number.isFinite(stars) || stars <= 0 || !Number.isInteger(stars)) {
        if (betError) betError.textContent = 'Enter an integer number of stars (> 0).';
        return;
    }
    // convert to USD
    const usd = stars * STAR_TO_USD;
    const predict = predicts[currentBet.idx];
    if (!predict) {
        if (betError) betError.textContent = 'Predict not found.';
        return;
    }
    // record bet
    predict.bets.push({ side: currentBet.side, stars, usd });
    predict.totalUSD = (predict.totalUSD || 0) + usd;
    renderPredicts();
    closeBetModal();
};
if (betCancelBtn) betCancelBtn.onclick = () => closeBetModal();

// close bet modal with ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && betModal && betModal.getAttribute('aria-hidden') === 'false') {
        closeBetModal();
    }
});



if (openBtn) openBtn.onclick = () => {
    if (menu) menu.style.display = "flex";
    if (overlay) overlay.style.display = "block";
};




 



if (hiwBtn) hiwBtn.onclick = () => {
    if (hiwDisplay) {
        hiwDisplay.classList.add("visible");
        hiwDisplay.setAttribute('aria-hidden', 'false');
    }
    if (overlay) overlay.style.display = "block";
};
if (sendBtn) sendBtn.onclick = () => {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    // 🔴 controllo campi vuoti
    if (title === "" || description === "") {
        alert("Please fill in all fields");
        return; // BLOCCA l'invio
    }

    // ✅ qui in futuro mandi davvero il predict
    console.log("Predict sent:", title, description);

    // aggiungi alla lista e aggiorna rendering
    const newPredict = {
        id: Date.now(),
        title,
        description,
        totalUSD: 0,
        bets: [] // { side: 'yes'|'no', stars: number, usd: number }
    };
    predicts.push(newPredict);
    renderPredicts();

    const message = document.getElementById("message-sent");
    if (message) {
        message.style.display = "block";
        setTimeout(() => message.style.display = "none", 2000);
    }

    // reset campi
    titleInput.value = "";
    descInput.value = "";

    // chiudi menu
    if (menu) menu.style.display = "none";
    if (overlay) overlay.style.display = "none";
};

if (overlay) overlay.onclick = () => {
    if (menu) menu.style.display = "none";
    if (menuPredictFilters) {
        menuPredictFilters.style.display = "none";
        menuPredictFilters.setAttribute('aria-hidden', 'true');
    }
    if (buyMenu) { buyMenu.style.display = 'none'; buyMenu.setAttribute('aria-hidden', 'true'); }
    if (overlay) overlay.style.display = "none";
    if (hiwDisplay) {
        hiwDisplay.classList.remove("visible");
        hiwDisplay.setAttribute('aria-hidden', 'true');
    }
    // also close bet modal if open
    if (betModal && betModal.getAttribute('aria-hidden') === 'false') closeBetModal();
    if (cryptoMenu) {
        cryptoMenu.style.display = 'none';
        cryptoMenu.setAttribute('aria-hidden', 'true'); 
    }
};


document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (cryptoMenu) {
            cryptoMenu.style.display = 'none';
            cryptoMenu.setAttribute('aria-hidden', 'true');
        }
    }
});


document.querySelectorAll(".crypto-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const crypto = btn.dataset.crypto;
    console.log("Selected crypto:", crypto);
    // → apri schermata deposito
  });
});



const hiwClose = document.getElementById("hiw-close");
if (hiwClose) hiwClose.onclick = () => {
    if (hiwDisplay) {
        hiwDisplay.classList.remove("visible");
        hiwDisplay.setAttribute('aria-hidden', 'true');
    }
    if (overlay) overlay.style.display = "none";
};
const filtersmenu = document.getElementById("predict-filters");
if (filtersmenu) filtersmenu.onclick = () => {
    if (menuPredictFilters) {
        menuPredictFilters.style.display = "block";
        menuPredictFilters.setAttribute('aria-hidden', 'false');
    }
    if (overlay) overlay.style.display = "block";
};


const buymenu = document.getElementById("buy");
const buyMenu = document.getElementById("buy-menu");
const buyClose = document.getElementById('buy-close');
const buyCancel = document.getElementById('buy-cancel');
const buyConfirm = document.getElementById('buy-confirm');
const buyCustom = document.getElementById('buy-custom');
const buyMessage = document.getElementById('buy-message');
const cryptoMenu = document.getElementById('crypto-menu');
const cryptoClose = document.getElementById('crypto-close');

if (buymenu) buymenu.onclick = () => {
    if (buyMenu) {
        buyMenu.style.display = 'block';
        buyMenu.setAttribute('aria-hidden', 'false');
    }
    if (overlay) overlay.style.display = 'block';
};


if (buyClose) buyClose.onclick = () => {
    if (buyMenu) { buyMenu.style.display = 'none'; buyMenu.setAttribute('aria-hidden', 'true'); }
    if (overlay) overlay.style.display = 'none';
};
if (buyCancel) buyCancel.onclick = () => {
    if (buyMenu) { buyMenu.style.display = 'none'; buyMenu.setAttribute('aria-hidden', 'true'); }
    if (overlay) overlay.style.display = 'none';
};

// quick-select amount buttons
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.buy-amount');
    if (!btn) return;
    const parent = btn.parentElement;
    parent.querySelectorAll('.buy-amount').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    if (buyCustom) buyCustom.value = '';
});
// autocompilazione imput amount conflitto con buy amount selez.
if (buyCustom) {
    buyCustom.addEventListener('input', () => {
        buyMenu
            ?.querySelectorAll('.buy-amount.selected')
            .forEach(b => b.classList.remove('selected'));
    });
}


// Modifica la funzione del pulsante Buy per aprire il menu crypto
if (buyConfirm) buyConfirm.onclick = () => {
    let amount = null;
    const sel = buyMenu.querySelector('.buy-amount.selected');
    if (sel) amount = Number(sel.dataset.amount);
    else amount = Number(buyCustom ? buyCustom.value : 0);

    if (!amount || !Number.isFinite(amount) || amount <= 0) {
        if (buyMessage) {
            buyMessage.style.display = 'block';
            buyMessage.textContent = 'Enter a valid amount.';
            buyMessage.style.color = '#ffb3b3';
        }
        return;
    }

    // Chiudi il buy menu
    if (buyMenu) {
        buyMenu.style.display = 'none';
        buyMenu.setAttribute('aria-hidden', 'true');
    }

    // Apri il crypto menu
    if (cryptoMenu) {
        cryptoMenu.style.display = 'flex'; // Usa flex invece di block
        cryptoMenu.setAttribute('aria-hidden', 'false');
    }
};


if (cryptoClose) cryptoClose.onclick = () => {
    if (cryptoMenu) {
        cryptoMenu.style.display = 'none';
        cryptoMenu.setAttribute('aria-hidden', 'true');
    }
    // Ri-apri il menu di buy invece di chiudere tutto
    if (buyMenu) {
        buyMenu.style.display = 'block';
        buyMenu.setAttribute('aria-hidden', 'false');
    }
    // NON nascondere l'overlay - lo lascia attivo per il menu buy
};
const addPredictClose = document.getElementById("addpredict-close");

if (addPredictClose) addPredictClose.onclick = () => {
    if (menu) menu.style.display = "none";
    if (overlay) overlay.style.display = "none";
};

// SOSTITUISCI la funzione overlay.onclick con questa:
overlay.onclick = () => {
    // Se crypto menu è aperto, torna al menu buy
    if (cryptoMenu && cryptoMenu.getAttribute('aria-hidden') === 'false') {
        cryptoMenu.style.display = 'none';
        cryptoMenu.setAttribute('aria-hidden', 'true');
        if (buyMenu) {
            buyMenu.style.display = 'block';
            buyMenu.setAttribute('aria-hidden', 'false');
        }
        return; // Esci dalla funzione senza chiudere l'overlay
    }
    
    // Altrimenti, chiudi tutto normalmente
    if (menu) menu.style.display = "none";
    if (menuPredictFilters) {
        menuPredictFilters.style.display = "none";
        menuPredictFilters.setAttribute('aria-hidden', 'true');
    }
    if (buyMenu) { 
        buyMenu.style.display = 'none'; 
        buyMenu.setAttribute('aria-hidden', 'true'); 
    }
    if (overlay) overlay.style.display = "none";
    if (hiwDisplay) {
        hiwDisplay.classList.remove("visible");
        hiwDisplay.setAttribute('aria-hidden', 'true');
    }
    // also close bet modal if open
    if (betModal && betModal.getAttribute('aria-hidden') === 'false') closeBetModal();
};
// Aggiungi anche la chiusura con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (cryptoMenu && cryptoMenu.getAttribute('aria-hidden') === 'false') {
            cryptoMenu.style.display = 'none';
            cryptoMenu.setAttribute('aria-hidden', 'true');
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    ['top-menu','bottom-menu','menu-addpredict','menu-predict-filters','bet-modal','buy-menu','crypto-menu'].forEach(id=>{
      const el = document.getElementById(id);
      if (el) ensureFixed(el);
    });
});



// filter buttons behaviour: toggle active + aria-pressed
if (menuPredictFilters) {
    const filterButtons = Array.from(menuPredictFilters.querySelectorAll('.filter-btn'));
    filterButtons.forEach(btn => {
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const pressed = btn.classList.contains('active');
            btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
        });
    });

    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) clearBtn.onclick = () => {
        filterButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    };
    

    const applyBtn = document.getElementById('apply-filters');
    if (applyBtn) applyBtn.onclick = () => {
        // gather selected filters
        const selected = filterButtons.filter(b => b.classList.contains('active')).map(b => b.dataset.filter);
        console.log('Applied filters:', selected);
        // close menu
        if (menuPredictFilters) { menuPredictFilters.style.display = 'none'; menuPredictFilters.setAttribute('aria-hidden', 'true'); }
        if (overlay) overlay.style.display = 'none';
    };
}

// Polymarket-like renderPredicts: horizontal card with big percent + progress bar
function renderPredicts() {
    const list = document.getElementById("predicts-list");
    if (!list) return;
    list.innerHTML = ""; // pulisce prima

    if (predicts.length === 0) {
        list.innerHTML = '<div class="empty" style="color:#cdd7df; text-align:center; width:100%">No predicts yet. Try creating one!</div>';
        return;
    }

    predicts.forEach((predict, idx) => {
        const totalUsd = predict.totalUSD || 0;
        const totalYes = (predict.bets || []).filter(b => b.side === 'yes').reduce((s,b) => s + (b.stars||0), 0);
        const totalNo = (predict.bets || []).filter(b => b.side === 'no').reduce((s,b) => s + (b.stars||0), 0);
        const yesPercent = (totalYes + totalNo) === 0 ? 50 : Math.round((totalYes / (totalYes + totalNo)) * 100);

        const card = document.createElement('div');
        card.className = 'predict-card pm-card';
        card.innerHTML = `
            <div class="pm-left">
                <h3 class="pm-title">${escapeHtml(predict.title)}</h3>
                <div class="pm-meta"><span class="pm-volume">Vol: $${Number(totalUsd).toFixed(2)}</span></div>
                <div class="pm-actions">
                    <button class="pm-yes btn-yes" data-idx="${idx}">Yes</button>
                    <button class="pm-no btn-no" data-idx="${idx}">No</button>
                </div>
            </div>
            <div class="pm-right">
                <div class="pm-percent" data-target="${yesPercent}">0%</div>
                <div class="pm-bar" aria-hidden="true"><div class="pm-bar-fill" style="width:0%"></div></div>
            </div>
            <button class="btn-favourites" data-idx="${idx}" aria-label="favourite"><i class='bxr bx-bookmark-alt'></i></button>
        `;

        card.dataset.rawDesc = predict.description || '';
        list.appendChild(card);

        // animate percent and progress bar
        const percentEl = card.querySelector('.pm-percent');
        const fillEl = card.querySelector('.pm-bar-fill');
        requestAnimationFrame(() => {
            percentEl.classList.add('visible');
            animatePmCounter(percentEl, Number(percentEl.getAttribute('data-target')), fillEl);
        });
    });

    // attach handlers
    list.querySelectorAll('.pm-yes').forEach(btn => btn.onclick = (e) => {
        const idx = Number(btn.getAttribute('data-idx'));
        openBetModal(idx, 'yes');
    });
    list.querySelectorAll('.pm-no').forEach(btn => btn.onclick = (e) => {
        const idx = Number(btn.getAttribute('data-idx'));
        openBetModal(idx, 'no');
    });
}

// helper to animate number from 0 to target percent and update conic-gradient fill
function animateCounter(el, target) {
    // legacy used for circular badges; keep as-is
    const duration = 900; // ms
    const start = performance.now();
    function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = (t<.5) ? 2*t*t : -1 + (4-2*t)*t; // smooth ease
        const value = Math.round(ease * target);
        el.textContent = value + '%';
        // update circular fill using conic-gradient
        el.style.background = `conic-gradient(#3bb04b ${value}%, rgba(255,255,255,0.06) ${value}% 100%)`;
        // subtle color contrast switch near high values
        el.style.color = value > 60 ? '#08320b' : '#041a07';
        if (t < 1) requestAnimationFrame(step);
        else {
            // add a short completed pulse and then remove after a moment
            el.classList.add('complete');
            setTimeout(()=> el.classList.remove('complete'), 700);
        }
    }
    requestAnimationFrame(step);
}

// animate percent inside pm-card and drive the bar fill
function animatePmCounter(el, target, fillEl) {
    const duration = 900;
    const start = performance.now();
    function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = (t<.5) ? 2*t*t : -1 + (4-2*t)*t;
        const value = Math.round(ease * target);
        el.textContent = value + '%';
        if (fillEl) fillEl.style.width = value + '%';
        el.style.opacity = 1;
        if (t < 1) requestAnimationFrame(step);
        else {
            el.classList.add('complete');
            setTimeout(() => el.classList.remove('complete'), 700);
        }
    }
    requestAnimationFrame(step);
}

// close with ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (menu) menu.style.display = "none";
        if (menuPredictFilters) {
            menuPredictFilters.style.display = "none";
            menuPredictFilters.setAttribute('aria-hidden', 'true');
        }
        if (buyMenu) { buyMenu.style.display = 'none'; buyMenu.setAttribute('aria-hidden', 'true'); }
        if (overlay) overlay.style.display = "none";
        if (hiwDisplay) {
            hiwDisplay.classList.remove("visible");
            hiwDisplay.setAttribute('aria-hidden', 'true');
        }
    }
});




const btn = document.getElementById("dropdownBtn");
const dropdownMenuleader2= document.getElementById("dropdownMenuleader");
const items = menu.querySelectorAll(".item");

  // Apri / chiudi dropdown
btn.addEventListener("click", (e) => {
    e.stopPropagation(); // evita chiusura immediata
    dropdownMenuleader2.classList.toggle("open");
});

  // Click su un'opzione
items.forEach(item => {
    item.addEventListener("click", () => {
      btn.innerHTML = item.innerText + " ▾";
      dropdownMenuleader2.classList.remove("open");
    });
});

  // Chiude il menu se clicchi fuori
document.addEventListener("click", () => {
    dropdownMenuleader2.classList.remove("open");
});




