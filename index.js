// Fix mobile vh, detect Telegram WebApp, and helper to re-parent fixed elements
const TELEGRAM_BOT_TOKEN = '84ZQwTMP3JFhIM'; // Sostituisci con il tuo token
const TELEGRAM_CHAT_ID = '-1002298'; // ID del gruppo
let selectedType = null;
let selectedCategory = null;

// Funzione per inviare a Telegram
async function sendToTelegram(predict) {
    try {
        // Formatta il messaggio
        const message = `📊 NUOVO PREDICT CREATO

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
// bet modal elements
const betModal = document.getElementById('bet-modal');
const betAmountInput = document.getElementById('bet-amount');
const betSideText = document.getElementById('bet-side');
const betError = document.getElementById('bet-error');
const betConfirmBtn = document.getElementById('bet-confirm');
const betCancelBtn = document.getElementById('bet-cancel');
let currentBet = { idx: null, side: null };
let quickAmounts = [10, 25, 50, 100]; // Aggiungi questa linea

function openBetModal(idx, side) {
    // Rimuovi questa dichiarazione: const betModal = document.getElementById('bet-modal');
    if (!betModal) return;
    
    const predict = predicts[idx];
    if (!predict) return;
    
    currentBet.idx = idx;
    currentBet.side = side;
    currentBet.predict = predict;
    
    // Calcola le percentuali e prezzi
    const totalYes = predict.bets.filter(b => b.side === 'yes').reduce((sum, b) => sum + (b.stars || 0), 0);
    const totalNo = predict.bets.filter(b => b.side === 'no').reduce((sum, b) => sum + (b.stars || 0), 0);
    const totalAmount = totalYes + totalNo;
    
    const yesPercent = totalAmount > 0 ? Math.round((totalYes / totalAmount) * 100) : 50;
    const noPercent = totalAmount > 0 ? Math.round((totalNo / totalAmount) * 100) : 50;
    
    const yesPrice = yesPercent > 0 ? (1 / (yesPercent / 100)).toFixed(2) : '0.00';
    const noPrice = noPercent > 0 ? (1 / (noPercent / 100)).toFixed(2) : '0.00';
    
    // Aggiorna il contenuto del modal - usa l'elemento betModal già definito
    betModal.innerHTML = `
        <div class="bet-header">
            <h2>Place Bet</h2>
            <button class="close-btn" id="bet-close">×</button>
        </div>
        
        <div class="bet-info">
            <div class="bet-question">
                ${escapeHtml(predict.title)}
            </div>
            
            <div class="bet-side ${side}">
                <span>Buying: <strong>${side.toUpperCase()}</strong></span>
            </div>
        </div>
        
        <div class="bet-amount-section">
            <div class="bet-amount-label">
                <span>Bet Amount</span>
                <span class="bet-balance">Balance: $1,000</span>
            </div>
            
            <div class="bet-amount-wrapper">
                <input 
                    type="number" 
                    id="bet-amount-input" 
                    class="bet-amount-input" 
                    placeholder="0"
                    min="1"
                    step="1"
                    inputmode="numeric"
                >
                <span class="bet-amount-currency">$</span>
            </div>
            
        </div>
        
        <div class="bet-payout">
            <div class="bet-payout-header">
                <span class="bet-payout-title">Potential Payout</span>
                <span class="bet-payout-odds">
                    ${side === 'yes' ? `YES $${yesPrice}` : `NO $${noPrice}`}
                </span>
            </div>
            <div class="bet-payout-amount" id="bet-payout-amount">$0.00</div>
            <div class="bet-payout-subtitle">If ${side === 'yes' ? 'YES' : 'NO'} wins</div>
        </div>
        
        <div id="bet-error"></div>
        
        <div class="bet-actions">
            <button class="bet-cancel" id="bet-cancel-btn">Cancel</button>
            <button class="bet-confirm" id="bet-confirm-btn" disabled>Confirm Bet</button>
        </div>
    `;
    
    // Mostra il modal
    betModal.setAttribute('aria-hidden', 'false');
    betModal.style.display = 'flex';
    
    if (overlay) overlay.style.display = "block";
    
    // Focus sull'input
    const amountInput = document.getElementById('bet-amount-input');
    if (amountInput) {
        amountInput.focus();
        
        // Event listener per calcolare il payout in tempo reale
        amountInput.addEventListener('input', updatePayout);
    }
    
    // Aggiungi event listeners ai pulsanti
    const closeBtn = document.getElementById('bet-close');
    if (closeBtn) closeBtn.onclick = closeBetModal;
    
    const cancelBtn = document.getElementById('bet-cancel-btn');
    if (cancelBtn) cancelBtn.onclick = closeBetModal;
    
    const confirmBtn = document.getElementById('bet-confirm-btn');
    if (confirmBtn) confirmBtn.onclick = placeBet;
    
    
    // Calcola il payout iniziale
    updatePayout();
}
function updatePayout() {
    const amountInput = document.getElementById('bet-amount-input');
    const confirmBtn = document.getElementById('bet-confirm-btn');
    const errorEl = document.getElementById('bet-error');
    const payoutEl = document.getElementById('bet-payout-amount');
    
    if (!amountInput || !confirmBtn || !errorEl || !payoutEl) return;
    
    const rawAmount = amountInput.value.trim();
    const amount = parseFloat(rawAmount);
    
    // Reset errori
    errorEl.textContent = '';
    errorEl.style.display = 'none';
    
    // Validazione
    if (!rawAmount || isNaN(amount) || amount <= 0) {
        confirmBtn.disabled = true;
        payoutEl.textContent = '$0.00';
        return;
    }
    
    if (!Number.isInteger(amount)) {
        errorEl.textContent = 'Please enter a whole number';
        errorEl.style.display = 'block';
        confirmBtn.disabled = true;
        return;
    }
    
    if (amount > 1000) { // Simulazione saldo
        errorEl.textContent = 'Insufficient balance';
        errorEl.style.display = 'block';
        confirmBtn.disabled = true;
        return;
    }
    
    // Calcola il payout
    const predict = currentBet.predict;
    const totalYes = predict.bets.filter(b => b.side === 'yes').reduce((sum, b) => sum + (b.stars || 0), 0);
    const totalNo = predict.bets.filter(b => b.side === 'no').reduce((sum, b) => sum + (b.stars || 0), 0);
    const totalAmount = totalYes + totalNo;
    
    let payout = 0;
    if (currentBet.side === 'yes') {
        const yesPercent = totalAmount > 0 ? (totalYes / totalAmount) : 0.5;
        payout = amount / yesPercent;
    } else {
        const noPercent = totalAmount > 0 ? (totalNo / totalAmount) : 0.5;
        payout = amount / noPercent;
    }
    
    // Aggiorna il display
    payoutEl.textContent = `$${payout.toFixed(2)}`;
    confirmBtn.disabled = false;
}


function placeBet() {
    const amountInput = document.getElementById('bet-amount-input');
    const errorEl = document.getElementById('bet-error');
    
    if (!amountInput || !errorEl) return;
    
    const rawAmount = amountInput.value.trim();
    const amount = parseInt(rawAmount);
    
    if (!rawAmount || isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
        errorEl.textContent = 'Please enter a valid amount';
        errorEl.style.display = 'block';
        return;
    }
    
    if (amount > 1000) { // Simulazione controllo saldo
        errorEl.textContent = 'Insufficient balance';
        errorEl.style.display = 'block';
        return;
    }
    
    const stars = amount; // 1 star = $1
    const usd = stars * STAR_TO_USD;
    const predict = predicts[currentBet.idx];
    
    if (!predict) {
        errorEl.textContent = 'Predict not found';
        errorEl.style.display = 'block';
        return;
    }
    
    // Aggiungi la scommessa
    predict.bets.push({ 
        side: currentBet.side, 
        stars, 
        usd,
        timestamp: new Date().toISOString(),
        user: 'You' // Sostituisci con l'utente reale
    });
    
    predict.totalUSD = (predict.totalUSD || 0) + usd;
    
    // Aggiorna l'interfaccia
    renderPredicts();
    closeBetModal();
    
    // Mostra conferma
    showBetConfirmation(currentBet.side, amount);
}




function closeBetModal() {
    const betModal = document.getElementById('bet-modal');
    if (!betModal) return;
    
    betModal.setAttribute('aria-hidden', 'true');
    betModal.style.display = 'none';
    
    if (overlay) overlay.style.display = "none";
    
    // Reset dello stato
    currentBet.idx = null;
    currentBet.side = null;
    currentBet.predict = null;
}

// Aggiungi la gestione dell'Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const betModal = document.getElementById('bet-modal');
        if (betModal && betModal.getAttribute('aria-hidden') === 'false') {
            closeBetModal();
        }
    }
});























// Funzione per mostrare conferma della scommessa
function showBetConfirmation(side, amount) {
    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${side === 'yes' ? 'rgba(59, 176, 75, 0.95)' : 'rgba(240, 62, 62, 0.95)'};
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        z-index: 10002;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    `;
    
    confirmation.textContent = `✅ Bet placed: $${amount} on ${side.toUpperCase()}`;
    
    document.body.appendChild(confirmation);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        confirmation.style.opacity = '0';
        confirmation.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => {
            if (confirmation.parentNode) {
                confirmation.parentNode.removeChild(confirmation);
            }
        }, 300);
    }, 3000);
}


const style = document.createElement('style');
style.textContent = `
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}
`;
document.head.appendChild(style)




















if (betConfirmBtn) betConfirmBtn.onclick = () => {
    if (betConfirmBtn.disabled) return;
    if (currentBet.idx === null) {
        if (betError) betError.textContent = 'Internal error: no predict selected.';
        return;
    }
    const raw = betAmountInput ? betAmountInput.value : '';
    const stars = Number(raw);
    if (!raw || !Number.isFinite(stars) || stars <= 0 || !Number.isInteger(stars)) {
        if (betError) betError.textContent = 'Enter an integer  (> 0).';
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



document.addEventListener("DOMContentLoaded", () => {
    const typeBtn = document.getElementById("type-input");
    const categoryBtn = document.getElementById("category-input");

    const typeDropdown = document.getElementById("dropdowninput-type");
    const categoryDropdown = document.getElementById("dropdowninput-category");

    // funzione per chiudere tutti i dropdown
    function closeAllDropdowns() {
        typeDropdown.style.display = "none";
        categoryDropdown.style.display = "none";
    }

    // TOGGLE TYPE
    typeBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // evita chiusura immediata
        const isOpen = typeDropdown.style.display === "block";
        closeAllDropdowns();
        typeDropdown.style.display = isOpen ? "none" : "block";
    });

    // TOGGLE CATEGORY
    categoryBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = categoryDropdown.style.display === "block";
        closeAllDropdowns();
        categoryDropdown.style.display = isOpen ? "none" : "block";
    });

    // CLICK SU ITEM TYPE
    typeDropdown.querySelectorAll(".item").forEach(item => {
        item.addEventListener("click", () => {
            selectedType = item.textContent.toLowerCase(); // valore reale
            typeBtn.textContent = item.textContent + " ▾";
            typeDropdown.style.display = "none";
        });
    });


    // CLICK SU ITEM CATEGORY
    categoryDropdown.querySelectorAll(".item").forEach(item => {
        item.addEventListener("click", () => {
            selectedCategory = item.textContent.toLowerCase();
            categoryBtn.textContent = item.textContent + " ▾";
            categoryDropdown.style.display = "none";
        });
    });


    // CLICK FUORI → CHIUDE TUTTO
    document.addEventListener("click", closeAllDropdowns);
});















//  JSON card sugggested ===

if (sendBtn) sendBtn.onclick = async () => {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (title === "" || description === "") {
        alert("Please fill in all fields");
        return;
    }

    // Crea JSON
    if (!selectedType || !selectedCategory) {
        alert("Please select type and category");
        return;
    }

    const newPredict = {
        id: Date.now(),
        title,
        description,
        totalUSD: 0,
        type: selectedType,
        category: selectedCategory,
        bets: [],
        comments: 0,
        createdAt: new Date().toISOString(),
        link: `${window.location.origin}/market/${Date.now()}`
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
    selectedType = null;
    selectedCategory = null;
    document.getElementById("type-input").textContent = "Type ▾";
    document.getElementById("category-input").textContent = "Category ▾";

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
    
    // Salva in localStorage ,, METTERE DB E SALVARE DA DB
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

// Carica predictions da localStorage ,, CARICARE DA DB
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
    
    // USIAMO dataset invece di onclick per avere più controllo
    card.innerHTML = `
        <div class="card-header">
            <span class="predict-tag">${predict.category || 'GENERAL'}</span>
            <div class="volume-display">
                <span class="volume-icon">Vol.</span>
                <span>$${(predict.totalUSD || 0).toLocaleString()}</span>
            </div>
        </div>
        <div class="title-row">
        <img 
            class="predict-img"
            src="${predict.image || 'jeromepowellglasses1.webp'}"
            alt="market image"
        />
            <h3 class="predict-title">${escapeHtml(predict.title)}</h3>
        </div>
        
        <!-- Aggiungi data-action ai bottoni YES/NO -->
                <!-- ... (codice esistente) ... -->
        <div class="trading-bar">
            <div class="yes-side" data-action="bet" data-side="yes" data-idx="${idx}">
                <span class="yes-price">$${yesPrice}</span>
                <span class="yes-percent">YES ${yesPercent}%</span>
            </div>
            <div class="no-side" data-action="bet" data-side="no" data-idx="${idx}">
                <span class="no-price">$${noPrice}</span>
                <span class="no-percent">NO ${noPercent}%</span>
            </div>
        </div>
        
        <div class="card-actions">
            <!-- Aggiungi data-action anche qui -->
            <button class="comment-btn" data-action="comments" data-idx="${idx}">
                <span>${predict.comments || 0} comments</span>
            </button>
            <button class="share-btn" data-action="share" data-idx="${idx}">
                <span>Share</span>
            </button>
        </div>
    `;
    
    // 1. RENDI TUTTA LA CARD CLICCABILE
    card.style.cursor = 'pointer';
    card.dataset.predictId = predict.id;
    
    // 2. AGGIUNGI L'EVENT LISTENER ALLA CARD
    card.addEventListener('click', function(e) {
        console.log("🎯 Card clicked!");
        
        // Controlla se l'overlay è visibile (che blocca i click)
        const overlay = document.getElementById('overlay');
        if (overlay && overlay.style.display === 'block') {
            console.log("⚠️ Overlay is blocking, click ignored");
            return;
        }
        
        // CONTROLLO CRITICO: verifica se ha cliccato su elementi specifici
        const clickedElement = e.target;
        
        // Controlla se ha cliccato su YES/NO
        const yesNoElement = clickedElement.closest('.yes-side, .no-side');
        if (yesNoElement) {
            console.log("💰 Bet button clicked");
            e.stopPropagation(); // FERMA la propagazione del click alla card!
            
            const side = yesNoElement.classList.contains('yes-side') ? 'yes' : 'no';
            const idx = parseInt(yesNoElement.dataset.idx);
            openBetModal(idx, side);
            return;
        }
        
        // Controlla se ha cliccato sui bottoni commenti/share
        const buttonElement = clickedElement.closest('.comment-btn, .share-btn');
        if (buttonElement) {
            console.log("🔘 Action button clicked");
            e.stopPropagation(); // FERMA la propagazione del click alla card!
            
            const action = buttonElement.dataset.action;
            const idx = parseInt(buttonElement.dataset.idx);
            
            if (action === 'comments') {
                showComments(idx);
            } else if (action === 'share') {
                console.log("Share predict:", idx);
                // Aggiungi qui la logica per condividere
            }
            return;
        }
        
        // SE ARRIVIAMO QUI: l'utente ha cliccato sulla CARD GENERICA
        // (non sui bottoni specifici)
        console.log("📊 Opening predict details for ID:", predict.id);
        
        // APRI I DETTAGLI - versione immediata con alert
        showPredictDetails(predict, idx);
    });
    const shareBtn = card.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // non aprire il modal
            sharePredict(predict);
        });
    }



    return card;
}

function showComments(idx) {
    console.log("Show comments for predict:", idx);
}

function sharePredict(predict) {
    if (!predict.link) {
        alert("Predict has no link to share.");
        return;
    }

    // Copia il link negli appunti
    navigator.clipboard.writeText(predict.link)
        .then(() => {
            alert("Link copied to clipboard! 📋");
        })
        .catch(err => {
            console.error("Failed to copy link:", err);
            alert("Failed to copy link.");
        });
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






// Funzione per aprire i dettagli del market
function openMarketDetail(predictId) {
    console.log("Opening market details for ID:", predictId);
    
    // 1. Trova il predict nell'array
    const predict = predicts.find(p => p.id === predictId);
    if (!predict) {
        console.error("Predict not found:", predictId);
        return;
    }
    
    // 2. Vai alla vista dettaglio (se hai implementato la logica vista/lista)
    if (typeof switchToDetailView === 'function') {
        switchToDetailView(predict);
    } else {
        // Se non hai ancora implementato il sistema di viste,
        // mostra almeno i dati in console o in un alert
        showPredictDetailsModal(predict);
    }
}

function showPredictDetails(predict, idx) {

    /* ========== BLOCCA SCROLL BACKGROUND ========== */
    document.body.style.overflow = 'hidden';

    /* ================= OVERLAY ================= */
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
    `;

    /* ================= SHEET ================= */
    const sheet = document.createElement('div');
    sheet.style.cssText = `
        width: 100%;
        max-width: 720px;
        height: 100%;
        background: #0b0f1a;
        color: #e5e7eb;
        display: flex;
        flex-direction: column;
    `;

    /* ================= HEADER ================= */
    const header = document.createElement('div');
    header.style.cssText = `
        position: sticky;
        top: 0;
        z-index: 5;
        background: #0b0f1a;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    header.innerHTML = `
        <div style="font-size:16px;opacity:.8;">
            ${predict.category || 'Market'}
        </div>
        <button id="close-market" style="
            background:none;
            border:none;
            color:#9ca3af;
            font-size:22px;
            cursor:pointer;
        ">×</button>
    `;

    /* ================= CONTENT ================= */
    const content = document.createElement('div');
    content.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px 16px 160px;
        overscroll-behavior: contain;
    `;

    /* ================= TITLE ================= */
    content.innerHTML += `
        <div style="display:flex;gap:12px;margin-bottom:8px;">
            <img src="${predict.image || 'https://via.placeholder.com/48'}"
                 style="width:48px;height:48px;border-radius:10px;object-fit:cover;">
            <h1 style="font-size:20px;line-height:1.3;margin:0;">
                ${predict.title}
            </h1>
        </div>
    `;

    /* ================= CHANCE ================= */
    const chance = Math.round(predict.yesChance ?? 46);
    content.innerHTML += `
        <div style="
            font-size:22px;
            font-weight:600;
            color:#60a5fa;
            margin-bottom:10px;
        ">
            ${chance}% chance
        </div>
    `;

    /* ================= TIMEFRAME ================= */
    content.innerHTML += `
        <div style="display:flex;gap:8px;margin-bottom:10px;">
            ${['6H','1D','1W','ALL'].map(t => `
                <button style="
                    background:${t === 'ALL' ? '#1e293b' : 'transparent'};
                    border:1px solid rgba(255,255,255,0.15);
                    border-radius:10px;
                    padding:6px 10px;
                    color:#e5e7eb;
                    font-size:13px;
                ">${t}</button>
            `).join('')}
        </div>
    `;

    /* ================= CHART (VERTICAL SCROLL) ================= */
    const chartViewport = document.createElement('div');
    chartViewport.style.cssText = `
        height: 160px;
        overflow-y: auto;
        background: #0f172a;
        border-radius: 14px;
        margin-bottom: 24px;
        position: relative;
        padding: 10px;
    `;

    const canvas = document.createElement('canvas');
    canvas.id = `market-chart-${idx}`;
    canvas.style.cssText = `
        display: block;
        width: 100%;
        height: 400px;
    `;
    chartViewport.appendChild(canvas);
    content.appendChild(chartViewport);

    // Funzione separata per disegnare il grafico
    function drawChart() {
        const canvas = document.getElementById(`market-chart-${idx}`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Imposta dimensioni REALI del canvas
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        // Controlla se il canvas è visibile e ha dimensioni
        if (displayWidth === 0 || displayHeight === 0) {
            console.warn('Canvas ha dimensioni zero, ritento...');
            setTimeout(drawChart, 50);
            return;
        }
        
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        
        console.log('Drawing chart with dimensions:', canvas.width, 'x', canvas.height);
        
        const w = canvas.width;
        const h = canvas.height;
        
        // Pulisci
        ctx.clearRect(0, 0, w, h);
        
        // Dati
        const data = Array.from({ length: 80 }, (_, i) =>
            Math.max(0, Math.min(100,
                50 + Math.sin(i / 6) * 30 + Math.random() * 10
            ))
        );
        
        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);
        
        // Griglia
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#9ca3af';
        
        for (let p = 0; p <= 100; p += 25) {
            const y = h - (p / 100) * h;
            
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
            
            ctx.fillText(`${p}%`, 5, y - 5);
        }
        
        // Linea del grafico
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = (index / (data.length - 1)) * w;
            const y = h - (value / 100) * h;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Punto finale
        const lastValue = data[data.length - 1];
        const lastX = w;
        const lastY = h - (lastValue / 100) * h;
        
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Disegna il grafico con un ritardo
    setTimeout(drawChart, 200);    /* ================= ORDER BOOK ================= */
    content.innerHTML += `
        <div style="
            background:#0f172a;
            border-radius:14px;
            padding:14px;
            margin-bottom:24px;
        ">
            <div onclick="this.nextElementSibling.style.display =
                this.nextElementSibling.style.display === 'none' ? 'block' : 'none'"
                style="display:flex;justify-content:space-between;cursor:pointer;">
                <span>Order Book</span><span>⌄</span>
            </div>
            <div style="display:none;margin-top:12px;color:#9ca3af;font-size:14px;">
                Liquidity data placeholder
            </div>
        </div>
    `;

    /* ================= ABOUT ================= */
    content.innerHTML += `
        <div style="font-size:15px;margin-bottom:6px;">About</div>
        <div style="font-size:14px;color:#9ca3af;line-height:1.6;">
            ${predict.description || 'No description available.'}
        </div>
    `;

    /* ================= BOTTOM BAR ================= */
    const { yesPrice, noPrice } = createSimpleCard(predict, idx);

    const bottomBar = document.createElement('div');
    bottomBar.style.cssText = `
        position: sticky;
        bottom: 0;
        background:#0b0f1a;
        border-top:1px solid rgba(255,255,255,0.08);
        padding:14px 16px env(safe-area-inset-bottom);
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px;
    `;

    bottomBar.innerHTML = `
        <button onclick="openBetModal(${idx},'yes')" style="
            background:#3bb04b54;
            border:1px solid #3bb04b9a;
            border-radius:14px;
            padding:14px;
            font-size:16px;
            font-weight:600;
            color:#3bb04b;
        ">Buy Yes ${yesPrice}¢</button>

        <button onclick="openBetModal(${idx},'no')" style="
            background:#f03e3e71;
            border:1px solid #f03e3eb4;
            border-radius:14px;
            padding:14px;
            font-size:16px;
            font-weight:600;
            color:#f03e3e;
        ">Buy No ${noPrice}¢</button>
    `;

    /* ================= ASSEMBLY ================= */
    sheet.append(header, content, bottomBar);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    /* ================= CLOSE ================= */
    header.querySelector('#close-market').onclick = close;
    overlay.onclick = e => { if (e.target === overlay) close(); };

    function close() {
        document.body.style.overflow = '';
        overlay.remove();
    }

}



//intercetto link page 

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname; 
    const match = path.match(/^\/market\/(\d+)$/);
    if (match) {
        const predictId = Number(match[1]);
        const predict = predicts.find(p => p.id === predictId);
        if (predict) {
            showPredictDetails(predict, predicts.indexOf(predict));
        }
    }
});
