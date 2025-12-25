// Fix mobile vh, detect Telegram WebApp, and helper to re-parent fixed elements
const TELEGRAM_BOT_TOKEN = 'P3JFhIM'; // Sostituisci con il tuo token
const TELEGRAM_CHAT_ID = '-nigg98'; // ID del gruppo

// Funzione per inviare a Telegram
async function sendToTelegram(predict) {
    try {
        // Formatta il messaggio
        const message = `📊 NUOVO PREDICT CREATO
        
📌 Titolo: ${predict.title}
📝 Descrizione: ${predict.description}
🆔 ID: ${predict.id}
📅 Data: ${new Date(predict.createdAt).toLocaleString()}
📊 Tipo: ${predict.type}
🏷️ Categoria: ${predict.category}

🔗 JSON Completo:
${JSON.stringify(predict, null, 2)}`;

        // Codifica il messaggio per URL
        const encodedMessage = encodeURIComponent(message);
        
        // URL dell'API Telegram
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodedMessage}&parse_mode=HTML`;
        
        // Invia la richiesta
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.ok) {
            console.log("✅ JSON inviato a Telegram!");
            return true;
        } else {
            console.error("❌ Errore Telegram:", data.description);
            return false;
        }
    } catch (error) {
        console.error("❌ Errore invio Telegram:", error);
        return false;
    }
}














(function(){
  const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  setVh();

  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);

  const isTelegram = /Telegram/.test(navigator.userAgent) || (window.Telegram && window.Telegram.WebApp);
  if (isTelegram) document.documentElement.classList.add('tg-webapp');

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

  document.addEventListener('DOMContentLoaded', () => {
    ['top-menu','bottom-menu','menu-addpredict','menu-predict-filters','bet-modal','buy-menu','crypto-menu'].forEach(id=>{
      const el = document.getElementById(id);
      if (el) ensureFixed(el);
    });
    
    // Carica predictions salvati
    loadSavedPredicts();
  });
})();

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
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

const STAR_TO_USD = 1;

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
    const usd = stars * STAR_TO_USD;
    const predict = predicts[currentBet.idx];
    if (!predict) {
        if (betError) betError.textContent = 'Predict not found.';
        return;
    }
    predict.bets.push({ side: currentBet.side, stars, usd });
    predict.totalUSD = (predict.totalUSD || 0) + usd;
    renderPredicts();
    closeBetModal();
};

if (betCancelBtn) betCancelBtn.onclick = () => closeBetModal();

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

// === MODIFICA PRINCIPALE: create JSON instead of GUI ===
// === MODIFICA SOLO QUESTA PARTE ===
if (sendBtn) sendBtn.onclick = async () => {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (title === "" || description === "") {
        alert("Please fill in all fields");
        return;
    }

    // Crea JSON
    const newPredict = {
        id: Date.now(),
        title,
        description,
        totalUSD: 0,
        type: "binary",
        category: "general",
        bets: [],
        comments: 0,
        createdAt: new Date().toISOString()
    };

    // 1. Chiudi IMMEDIATAMENTE il menu
    if (menu) menu.style.display = "none";
    if (overlay) overlay.style.display = "none";

    // 2. Salva in localStorage
    savePredictToJSON(newPredict);

    // 3. Mostra messaggio di conferma (se esiste l'elemento)
    const message = document.getElementById("message-sent");
    if (message) {
        message.textContent = "✅ Predict created!";
        message.style.display = "block";
        // Nascondi dopo 3 secondi
        setTimeout(() => {
            message.style.display = "none";
        }, 3000);
    }

    // 4. Reset campi
    titleInput.value = "";
    descInput.value = "";

    // 5. Invia a Telegram (se configurato) - IN BACKGROUND
    if (typeof sendToTelegram === 'function') {
        setTimeout(() => {
            sendToTelegram(newPredict).then(success => {
                if (success) {
                    console.log("✅ Also sent to Telegram");
                }
            });
        }, 100); // Piccolo delay per non bloccare l'UI
    }

    console.log("📄 JSON created and menu closed:", newPredict);
};
// Funzione per salvare JSON
function savePredictToJSON(predict) {
    // Aggiungi all'array
    predicts.push(predict);
    
    // Salva in localStorage
    try {
        const savedPredicts = JSON.parse(localStorage.getItem('userPredicts') || '[]');
        savedPredicts.push(predict);
        localStorage.setItem('userPredicts', JSON.stringify(savedPredicts));
        console.log("✅ Saved to localStorage");
    } catch (e) {
        console.error("Error saving to localStorage:", e);
    }
    
    // Mostra in console
    console.log("📄 JSON Created:");
    console.log(JSON.stringify(predict, null, 2));
}

// Carica predictions da localStorage
function loadSavedPredicts() {
    try {
        const savedPredicts = localStorage.getItem('userPredicts');
        if (savedPredicts) {
            const parsed = JSON.parse(savedPredicts);
            if (Array.isArray(parsed)) {
                // Sostituisci array esistente
                predicts.length = 0;
                parsed.forEach(p => predicts.push(p));
                console.log(`📂 Loaded ${predicts.length} saved predicts`);
                
                // Renderizza le card esistenti
                if (predicts.length > 0) {
                    renderPredicts();
                }
            }
        }
    } catch (e) {
        console.error("Error loading from localStorage:", e);
    }
}

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

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.buy-amount');
    if (!btn) return;
    const parent = btn.parentElement;
    parent.querySelectorAll('.buy-amount').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    if (buyCustom) buyCustom.value = '';
});

if (buyCustom) {
    buyCustom.addEventListener('input', () => {
        buyMenu
            ?.querySelectorAll('.buy-amount.selected')
            .forEach(b => b.classList.remove('selected'));
    });
}

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

    if (buyMenu) {
        buyMenu.style.display = 'none';
        buyMenu.setAttribute('aria-hidden', 'true');
    }

    if (cryptoMenu) {
        cryptoMenu.style.display = 'flex';
        cryptoMenu.setAttribute('aria-hidden', 'false');
    }
};

if (cryptoClose) cryptoClose.onclick = () => {
    if (cryptoMenu) {
        cryptoMenu.style.display = 'none';
        cryptoMenu.setAttribute('aria-hidden', 'true');
    }
    if (buyMenu) {
        buyMenu.style.display = 'block';
        buyMenu.setAttribute('aria-hidden', 'false');
    }
};

const addPredictClose = document.getElementById("addpredict-close");

if (addPredictClose) addPredictClose.onclick = () => {
    if (menu) menu.style.display = "none";
    if (overlay) overlay.style.display = "none";
};

overlay.onclick = () => {
    if (cryptoMenu && cryptoMenu.getAttribute('aria-hidden') === 'false') {
        cryptoMenu.style.display = 'none';
        cryptoMenu.setAttribute('aria-hidden', 'true');
        if (buyMenu) {
            buyMenu.style.display = 'block';
            buyMenu.setAttribute('aria-hidden', 'false');
        }
        return;
    }
    
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
    if (betModal && betModal.getAttribute('aria-hidden') === 'false') closeBetModal();
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (cryptoMenu && cryptoMenu.getAttribute('aria-hidden') === 'false') {
            cryptoMenu.style.display = 'none';
            cryptoMenu.setAttribute('aria-hidden', 'true');
        }
    }
});

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
        const selected = filterButtons.filter(b => b.classList.contains('active')).map(b => b.dataset.filter);
        console.log('Applied filters:', selected);
        if (menuPredictFilters) { menuPredictFilters.style.display = 'none'; menuPredictFilters.setAttribute('aria-hidden', 'true'); }
        if (overlay) overlay.style.display = 'none';
    };
}

// Funzioni per le card (semplificate)
function renderPredicts() {
    const container = document.getElementById('predicts-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    predicts.forEach((predict, idx) => {
        const card = createSimpleCard(predict, idx);
        container.appendChild(card);
    });
}

function createSimpleCard(predict, idx) {
    const card = document.createElement('div');
    card.className = 'predict-card';
    
    const totalYes = predict.bets.filter(b => b.side === 'yes').reduce((sum, b) => sum + (b.stars || 0), 0);
    const totalNo = predict.bets.filter(b => b.side === 'no').reduce((sum, b) => sum + (b.stars || 0), 0);
    const totalAmount = totalYes + totalNo;
    
    const yesPercent = totalAmount > 0 ? Math.round((totalYes / totalAmount) * 100) : 50;
    const noPercent = totalAmount > 0 ? Math.round((totalNo / totalAmount) * 100) : 50;
    
    const yesPrice = yesPercent > 0 ? (1 / (yesPercent / 100)).toFixed(2) : '0.00';
    const noPrice = noPercent > 0 ? (1 / (noPercent / 100)).toFixed(2) : '0.00';
    
    card.innerHTML = `
        <div class="card-header">
            <span class="predict-tag">${predict.category || 'GENERAL'}</span>
            <div class="volume-display">
                <span class="volume-icon">Vol.</span>
                <span>$${(predict.totalUSD || 0).toLocaleString()}</span>
            </div>
        </div>
        
        <h3 class="predict-title">${escapeHtml(predict.title)}</h3>
        
        <div class="trading-bar">
            <div class="yes-side" onclick="openBetModal(${idx}, 'yes')">
                <span class="yes-price">$${yesPrice}</span>
                <span class="yes-percent">YES ${yesPercent}%</span>
            </div>
            <div class="no-side" onclick="openBetModal(${idx}, 'no')">
                <span class="no-price">$${noPrice}</span>
                <span class="no-percent">NO ${noPercent}%</span>
            </div>
        </div>
        
        <div class="card-actions">
            <button class="comment-btn" onclick="showComments(${idx})">
                <span class="info-icon">💬</span>
                <span>${predict.comments || 0} comments</span>
            </button>
            <button class="comment-btn">
            </button>
        </div>
    `;
    
    return card;
}

function showComments(idx) {
    console.log("Show comments for predict:", idx);
}

// Funzioni helper rimanenti (semplificate)
function animateCounter(el, target) {
    const duration = 900;
    const start = performance.now();
    function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = (t<.5) ? 2*t*t : -1 + (4-2*t)*t;
        const value = Math.round(ease * target);
        el.textContent = value + '%';
        el.style.background = `conic-gradient(#3bb04b ${value}%, rgba(255,255,255,0.06) ${value}% 100%)`;
        el.style.color = value > 60 ? '#08320b' : '#041a07';
        if (t < 1) requestAnimationFrame(step);
        else {
            el.classList.add('complete');
            setTimeout(()=> el.classList.remove('complete'), 700);
        }
    }
    requestAnimationFrame(step);
}

function fitSaldoSoft() {
    const saldo = document.getElementById('textsaldo');
    const currency = document.querySelector('.currency');
    if (!saldo) return;

    const digits = saldo.textContent.replace(/[^\d]/g, '').length;
    const currencyWeight = currency ? 0.6 : 0;
    const visualLength = digits + currencyWeight;

    let baseSize = 65;

    if (visualLength <= 4) {
        baseSize = 65;
    } else if (visualLength <= 5) {
        baseSize = 56;
    } else if (visualLength <= 6) {
        baseSize = 48;
    } else if (visualLength <= 7) {
        baseSize = 42;
    } else {
        baseSize = 36;
    }

    saldo.style.fontSize = baseSize + 'px';
    if (currency) {
        currency.style.fontSize = (baseSize + 2) + 'px';
    }
}

fitSaldoSoft();

const btn = document.getElementById("dropdownBtn");
const dropdownMenuleader2= document.getElementById("dropdownMenuleader");
const items = menu ? menu.querySelectorAll(".item") : [];

if (btn) {
  btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenuleader2.classList.toggle("open");
  });
}

if (items.length > 0) {
  items.forEach(item => {
      item.addEventListener("click", () => {
          btn.innerHTML = item.innerText + " ▾";
          dropdownMenuleader2.classList.remove("open");
      });
  });
}

document.addEventListener("click", () => {
    if (dropdownMenuleader2) dropdownMenuleader2.classList.remove("open");
});

