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


// MODIFICA la funzione placeBet():

async function placeBet() {
    const amountInput = document.getElementById('bet-amount-input');
    const errorEl = document.getElementById('bet-error');
    
    if (!amountInput || !errorEl) return;
    
    const rawAmount = amountInput.value.trim();
    const amount = parseInt(rawAmount);
    
    // Validazioni...
    
    const stars = amount;
    const usd = stars * STAR_TO_USD;
    const predict = predicts[currentBet.idx];
    
    // Crea l'oggetto bet
    const newBet = { 
        side: currentBet.side, 
        stars, 
        usd,
        timestamp: new Date().toISOString(),
        user: 'You'
    };
    
    try {
        // 1. Invia la bet al backend
        const response = await fetch(`http://localhost:3000/api/predicts/${predict.id}/bets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newBet)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 2. Aggiorna localmente
        predict.bets.push(newBet);
        predict.totalUSD = (predict.totalUSD || 0) + usd;
        
        // 3. Aggiorna l'interfaccia
        renderPredicts();
        closeBetModal();
        
        // 4. Mostra conferma
        showBetConfirmation(currentBet.side, amount);
        
    } catch (error) {
        console.error("Error placing bet:", error);
        errorEl.textContent = 'Error placing bet. Please try again.';
        errorEl.style.display = 'block';
    }
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


async function savePredictToJSON(predict) {
    try {
        // 1. Salva sul backend
        const response = await fetch('http://localhost:3000/api/predicts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(predict)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const savedPredict = await response.json();
        
        // 2. Aggiorna l'array locale con il dato tornato dal server
        predicts.push(savedPredict);
        
        // 3. Aggiorna l'interfaccia
        renderPredicts();
        
        console.log("✅ Saved to backend:", savedPredict);
        
        // 4. Mantieni anche localStorage come cache
        try {
            const savedPredicts = JSON.parse(localStorage.getItem('userPredicts') || '[]');
            savedPredicts.push(savedPredict);
            localStorage.setItem('userPredicts', JSON.stringify(savedPredicts));
            console.log("✅ Also cached to localStorage");
        } catch (e) {
            console.error("Error caching to localStorage:", e);
        }
        
        return savedPredict;
        
    } catch (error) {
        console.error("Error saving to backend:", error);
        
        // Fallback: salva solo in localStorage
        predicts.push(predict);
        
        try {
            const savedPredicts = JSON.parse(localStorage.getItem('userPredicts') || '[]');
            savedPredicts.push(predict);
            localStorage.setItem('userPredicts', JSON.stringify(savedPredicts));
            console.log("✅ Saved to localStorage (fallback)");
        } catch (e) {
            console.error("Error saving to localStorage:", e);
        }
        
        renderPredicts();
        return predict;
    }
}

// Carica predictions da localStorage ,, CARICARE DA DB
// RIMPIAZZA la funzione loadSavedPredicts():

async function loadSavedPredicts() {
    try {
        // Carica dal backend invece che localStorage
        const response = await fetch('http://localhost:3000/api/predicts');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Sostituisci array esistente
        predicts.length = 0;
        predicts.push(...data);
        
        console.log(`📂 Loaded ${predicts.length} predicts from backend`);
        
        // Renderizza le card
        if (predicts.length > 0) {
            renderPredicts();
        }
    } catch (error) {
        console.error("Error loading from backend:", error);
        
        // Fallback a localStorage se il backend non risponde
        try {
            const savedPredicts = localStorage.getItem('userPredicts');
            if (savedPredicts) {
                const parsed = JSON.parse(savedPredicts);
                if (Array.isArray(parsed)) {
                    predicts.length = 0;
                    parsed.forEach(p => predicts.push(p));
                    console.log(`📂 Loaded ${predicts.length} predicts from localStorage (fallback)`);
                    renderPredicts();
                }
            }
        } catch (e) {
            console.error("Error loading from localStorage:", e);
        }
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
                showPredictDetails(predict, idx, true); // Passa true per scrollare ai commenti
            } else if (action === 'share') {
                console.log("Share predict:", idx);
                // Aggiungi qui la logica per condividere
                sharePredict(predict);
            }
            return;
        }
        
        // (non sui bottoni specifici)
        console.log("📊 Opening predict details for ID:", predict.id);
        
        // APRI I DETTAGLI - senza scrollare ai commenti
        showPredictDetails(predict, idx, false);
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

function showPredictDetails(predict, idx, scrollToComments = false) {

    document.body.style.overflow = 'hidden';

    /* ================= OVERLAY ================= */
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.75);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    /* ================= SHEET ================= */
    const sheet = document.createElement('div');
    sheet.style.cssText = `
        width: 100%;
        max-width: 720px;
        height: 95vh;
        background: #111827;
        color: #e5e7eb;
        display: flex;
        flex-direction: column;
        border-radius: 16px;
        overflow: hidden;
    `;

    /* ================= HEADER ================= */
    const header = document.createElement('div');
    header.style.cssText = `
        position: sticky;
        top: 0;
        z-index: 5;
        background: #111827;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <div style="font-size:14px;color:#9ca3af;">
            ${predict.category || 'Market'}
        </div>
        <button id="close-market" style="
            background:none;
            border:none;
            color:#9ca3af;
            font-size:28px;
            cursor:pointer;
            line-height:1;
        ">×</button>
    `;

    /* ================= CONTENT ================= */
    const content = document.createElement('div');
    content.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px 16px 160px;
    `;

    /* ================= TITLE ================= */
    const titleSection = document.createElement('div');
    titleSection.innerHTML = `
        <div style="display:flex;gap:12px;margin-bottom:6px;">
            <img src="${predict.image || 'https://via.placeholder.com/48'}"
                 style="width:48px;height:48px;border-radius:10px;">
            <h1 style="font-size:18px;line-height:1.3;margin:0;">
                ${predict.title}
            </h1>
        </div>
        <div style="font-size:13px;color:#9ca3af;margin-bottom:14px;">
            $${(predict.totalUSD || 0).toLocaleString()} Vol.
        </div>
    `;
    content.appendChild(titleSection);

    /* ================= CHANCE ================= */
    const chance = Math.round(predict.yesChance ?? 50);
    const chanceSection = document.createElement('div');
    chanceSection.style.cssText = `
        font-size:32px;
        font-weight:700;
        margin-bottom:4px;
        color:#22c55e;
    `;
    chanceSection.textContent = `${chance}%`;
    content.appendChild(chanceSection);

    const chanceLabel = document.createElement('div');
    chanceLabel.style.cssText = 'font-size:14px;color:#9ca3af;margin-bottom:16px;';
    chanceLabel.textContent = 'chance';
    content.appendChild(chanceLabel);

    /* ================= TIMEFRAME ================= */
    const timeframeSection = document.createElement('div');
    timeframeSection.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';
    let activeTimeframe = 'ALL';
    
    ['6H','1D','1W','ALL'].forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = t;
        btn.className = 'timeframe-btn-' + t;
        btn.dataset.timeframe = t;
        btn.style.cssText = `
            padding:6px 10px;
            border-radius:999px;
            border:1px solid rgba(255,255,255,.15);
            background:${t === 'ALL' ? 'rgba(255,255,255,.12)' : 'transparent'};
            color:#e5e7eb;
            font-size:12px;
            cursor:pointer;
        `;
        timeframeSection.appendChild(btn);
    });
    content.appendChild(timeframeSection);

    /* ================= CHART CONTAINER ================= */
    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = `
        height: 200px;
        margin-bottom: 24px;
        position: relative;
        background: rgba(0,0,0,0.2);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.06);
    `;
    content.appendChild(chartContainer);

    /* ================= ORDER BOOK ================= */
    const orderBook = document.createElement('div');
    orderBook.style.cssText = `
        background:#0f172a;
        border-radius:14px;
        padding:14px;
        margin-bottom:24px;
    `;
    orderBook.innerHTML = `
        <div onclick="this.nextElementSibling.style.display =
            this.nextElementSibling.style.display === 'none' ? 'block' : 'none'"
            style="display:flex;justify-content:space-between;cursor:pointer;">
            <span>Order Book</span><span>⌄</span>
        </div>
        <div style="display:none;margin-top:12px;color:#9ca3af;font-size:14px;">
            Liquidity data placeholder
        </div>
    `;
    content.appendChild(orderBook);

    /* ================= ABOUT ================= */
    const aboutSection = document.createElement('div');
    aboutSection.innerHTML = `
        <div style="font-size:16px;margin-bottom:6px;">About</div>
        <div style="font-size:14px;color:#9ca3af;line-height:1.6;margin-bottom:20px;">
            ${predict.description || 'No description available.'}
        </div>
    `;
    content.appendChild(aboutSection);

    /* ================= COMMENTS ================= */
    const commentsWrapper = document.createElement('div');
    commentsWrapper.id = 'comments-section';
    commentsWrapper.style.marginTop = '24px';

    const commentsTitle = document.createElement('div');
    commentsTitle.textContent = 'Comments';
    commentsTitle.style.cssText = `
        font-size:15px;
        font-weight:600;
        margin-bottom:10px;
        color:#e5e7eb;
    `;
    commentsWrapper.appendChild(commentsTitle);

    const commentsList = document.createElement('div');
    commentsList.id = 'comments-list';
    commentsList.style.cssText = `
        display:flex;
        flex-direction:column;
        gap:14px;
        max-height:320px;
        overflow-y:auto;
        padding-bottom:60px;
    `;
    commentsWrapper.appendChild(commentsList);

    const newCommentDiv = document.createElement('div');
    newCommentDiv.style.cssText = 'display:flex;gap:8px;margin-top:10px;';
    newCommentDiv.innerHTML = `
        <input id="new-comment-input" type="text" placeholder="Write a comment..."
            style="
                flex:1;
                padding:8px 10px;
                border-radius:8px;
                border:1px solid rgba(255,255,255,0.15);
                background:#1e2936f3;
                color:#e5e7eb;
                outline:none;
            ">
        <button style="
            background:linear-gradient(135deg,#1a1d23 35%,#1e2936f3 65%);
            border:none;
            color:white;
            padding:8px 12px;
            border-radius:8px;
            cursor:pointer;
        ">Send</button>
    `;
    commentsWrapper.appendChild(newCommentDiv);
    content.appendChild(commentsWrapper);

    /* ================= RENDER COMMENTS ================= */
    function renderComments() {
        const comments = predict.comments || [];
        commentsList.innerHTML = '';

        comments.forEach((c) => {
            const commentDiv = document.createElement('div');
            commentDiv.style.cssText = `
                display:flex;
                gap:12px;
                border-bottom:1px solid rgba(255,255,255,0.08);
                padding-bottom:10px;
            `;

            commentDiv.innerHTML = `
                <img src="${c.avatar || 'https://via.placeholder.com/32'}"
                    style="width:32px;height:32px;border-radius:50%;object-fit:cover;">

                <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
                    <div style="font-weight:600;color:#e5e7eb;">${c.user}</div>
                    <div style="color:#9ca3af;line-height:1.4;">${c.text}</div>

                    <div style="display:flex;gap:14px;font-size:13px;color:#9ca3af;margin-top:2px;">
                        <button style="background:none;border:none;color:#9ca3af;cursor:pointer;">
                            ${c.likes || 0} <i class='bxr bx-like'></i>
                        </button>
                        <button class="show-replies"
                            style="background:none;border:none;color:#9ca3af;cursor:pointer;">
                            Show replies (${(c.replies || []).length})
                        </button>
                    </div>

                    <div class="replies"
                        style="display:none;flex-direction:column;gap:6px;margin-top:6px;padding-left:36px;">
                        ${(c.replies || []).map(r => `
                            <div style="display:flex;gap:8px;">
                                <img src="${r.avatar || 'https://via.placeholder.com/28'}"
                                    style="width:28px;height:28px;border-radius:50%;">
                                <div>
                                    <div style="font-weight:500;color:#e5e7eb;">${r.user}</div>
                                    <div style="color:#9ca3af;font-size:13px;">${r.text}</div>
                                </div>
                            </div>
                        `).join('')}

                        <div style="display:flex;gap:6px;margin-top:4px;">
                            <input type="text" placeholder="Reply..."
                                style="
                                    flex:1;
                                    padding:6px 8px;
                                    border-radius:6px;
                                    border:1px solid rgba(255,255,255,0.15);
                                    background:none;
                                    color:#e5e7eb;
                                ">
                            <button style="
                                background:linear-gradient(135deg,#1a1d23 35%,#1e2936f3 65%);
                                border:none;
                                color:white;
                                padding:6px 10px;
                                border-radius:6px;
                                cursor:pointer;
                            ">Add</button>
                        </div>
                    </div>
                </div>
            `;

            commentsList.appendChild(commentDiv);

            const repliesBtn = commentDiv.querySelector('.show-replies');
            const repliesBox = commentDiv.querySelector('.replies');
            const replyInput = repliesBox.querySelector('input');
            const addBtn = repliesBox.querySelector('button');

            repliesBtn.onclick = () => {
                repliesBox.style.display =
                    repliesBox.style.display === 'flex' ? 'none' : 'flex';
            };

            addBtn.onclick = () => {
                const txt = replyInput.value.trim();
                if (!txt) return;
                c.replies = c.replies || [];
                c.replies.push({ user: 'CurrentUser', text: txt });
                renderComments();
            };
        });
    }

    newCommentDiv.querySelector('button').onclick = () => {
        const input = document.getElementById('new-comment-input');
        const txt = input.value.trim();
        if (!txt) return;

        predict.comments = predict.comments || [];
        predict.comments.push({
            user: 'CurrentUser',
            text: txt,
            likes: 0,
            replies: []
        });

        input.value = '';
        renderComments();
    };

    /* ================= BOTTOM BAR ================= */
    const { yesPrice, noPrice } = createSimpleCard(predict, idx);
    const bottomBar = document.createElement('div');
    bottomBar.style.cssText = `
        position: sticky;
        bottom: 0;
        background:#111827;
        border-top:1px solid rgba(255,255,255,.08);
        padding:14px;
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px;
    `;
    bottomBar.innerHTML = `
        <button onclick="openBetModal(${idx},'yes')" style="
            background:#22c55e;border:none;border-radius:14px;padding:14px;color:white;font-size:16px;font-weight:600;cursor:pointer;">
            Buy Yes ${yesPrice}¢
        </button>
        <button onclick="openBetModal(${idx},'no')" style="
            background:#ef4444;border:none;border-radius:14px;padding:14px;color:white;font-size:16px;font-weight:600;cursor:pointer;">
            Buy No ${noPrice}¢
        </button>
    `;

    /* ================= ASSEMBLE DOM ================= */
    sheet.appendChild(header);
    sheet.appendChild(content);
    sheet.appendChild(bottomBar);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    /* ================= CREATE CHART AFTER DOM ================= */
    let chart, lineSeries, fullChartData;
    
    setTimeout(() => {
        if (typeof LightweightCharts !== 'undefined') {
            chart = LightweightCharts.createChart(chartContainer, {
                layout: {
                    background: { color: 'transparent' },
                    textColor: '#9ca3af',
                    fontSize: 11,
                },
                grid: {
                    vertLines: { color: 'rgba(255,255,255,0.05)' },
                    horzLines: { color: 'rgba(255,255,255,0.05)' },
                },
                rightPriceScale: {
                    visible: true,
                    borderVisible: false,
                    scaleMargins: { top: 0.1, bottom: 0.1 },
                },
                timeScale: { 
                    visible: true,
                    borderVisible: false,
                    timeVisible: true,
                    secondsVisible: false,
                },
                crosshair: { 
                    mode: LightweightCharts.CrosshairMode.Normal,
                    vertLine: {
                        color: 'rgba(255,255,255,0.2)',
                        width: 1,
                        style: LightweightCharts.LineStyle.Dashed,
                    },
                    horzLine: {
                        color: 'rgba(255,255,255,0.2)',
                        width: 1,
                        style: LightweightCharts.LineStyle.Dashed,
                    },
                },
                handleScroll: {
                    vertTouchDrag: false,
                },
                handleScale: {
                    axisPressedMouseMove: false,
                },
            });

            lineSeries = chart.addLineSeries({
                color: '#22c55e',
                lineWidth: 2.5,
                priceLineVisible: false,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 4,
                crosshairMarkerBorderColor: '#22c55e',
                crosshairMarkerBackgroundColor: '#22c55e',
            });

            // Genera dati storici se non presenti
            const now = Math.floor(Date.now() / 1000);
            if (predict.historicalData) {
                fullChartData = predict.historicalData;
            } else {
                // Genera 30 giorni di dati
                fullChartData = Array.from({ length: 720 }, (_, i) => ({
                    time: now - (720 - i) * 3600, // ogni ora
                    value: Math.max(1, Math.min(99, chance + Math.sin(i / 20) * 10 + Math.random() * 4 - 2))
                }));
            }

            lineSeries.setData(fullChartData);
            chart.timeScale().fitContent();
            chart.resize(chartContainer.clientWidth, 200);

            // Funzione per filtrare i dati in base al timeframe
            function updateChartTimeframe(timeframe) {
                activeTimeframe = timeframe;
                const now = Math.floor(Date.now() / 1000);
                let filteredData = [...fullChartData];
                
                if (timeframe === '6H') {
                    filteredData = filteredData.filter(d => d.time > now - 6 * 3600);
                } else if (timeframe === '1D') {
                    filteredData = filteredData.filter(d => d.time > now - 24 * 3600);
                } else if (timeframe === '1W') {
                    filteredData = filteredData.filter(d => d.time > now - 7 * 24 * 3600);
                }
                
                lineSeries.setData(filteredData);
                chart.timeScale().fitContent();

                // Aggiorna gli stili dei bottoni
                document.querySelectorAll('[data-timeframe]').forEach(btn => {
                    btn.style.background = btn.dataset.timeframe === timeframe 
                        ? 'rgba(255,255,255,.12)' 
                        : 'transparent';
                });
            }

            // Aggiungi event listeners ai bottoni timeframe
            document.querySelectorAll('[data-timeframe]').forEach(btn => {
                btn.onclick = () => updateChartTimeframe(btn.dataset.timeframe);
            });

        } else {
            chartContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;font-size:14px;">Chart library not loaded. Add Lightweight Charts script.</div>';
        }
    }, 100);

    renderComments();

    if (scrollToComments) {
        requestAnimationFrame(() => {
            const commentsSection = content.querySelector('#comments-section');
            if (commentsSection) {
                commentsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    

    

    /* ================= CLOSE MODAL ================= */
    header.querySelector('#close-market').onclick = () => {
        document.body.style.overflow = '';
        if (chart) chart.remove();
        overlay.remove();
    };
}


card.onclick = () => {
    showPredictDetails(predict, idx);
};
commentsBtn.onclick = (e) => {
    e.stopPropagation(); // evita il click della card
    showPredictDetails(predict, idx, true);
};







// Funzione helper per generare dati storici (opzionale)
function generateHistoricalData(currentChance, days, trend = 'steady') {
    const data = [];
    const now = Math.floor(Date.now() / 1000);
    const hoursPerDay = 24;
    const totalHours = days * hoursPerDay;
    
    for (let i = totalHours; i >= 0; i--) {
        const timestamp = now - (i * 3600);
        let value;
        
        if (trend === 'bullish') {
            value = currentChance - (i * 0.03) + Math.random() * 3 - 1.5;
        } else if (trend === 'bearish') {
            value = currentChance + (i * 0.03) + Math.random() * 3 - 1.5;
        } else if (trend === 'volatile') {
            value = currentChance + Math.sin(i / 10) * 8 + Math.random() * 6 - 3;
        } else {
            value = currentChance + Math.sin(i / 20) * 3 + Math.random() * 2 - 1;
        }
        
        value = Math.max(1, Math.min(99, value));
        
        data.push({
            time: timestamp,
            value: value
        });
    }
    
    return data;
}




async function addComment(predictId, commentText) {
    try {
        const comment = {
            text: commentText,
            user: 'CurrentUser', // Sostituisci con utente reale
            timestamp: new Date().toISOString(),
            likes: 0,
            replies: []
        };
        
        const response = await fetch(`http://localhost:3000/api/predicts/${predictId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(comment)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const savedComment = await response.json();
        
        // Aggiorna la predict locale
        const predict = predicts.find(p => p.id === predictId);
        if (predict) {
            predict.comments = predict.comments || [];
            predict.comments.push(savedComment);
        }
        
        return savedComment;
        
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
}

async function loadComments(predictId) {
    try {
        const response = await fetch(`http://localhost:3000/api/predicts/${predictId}/comments`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error("Error loading comments:", error);
        return [];
    }
}
function showLoading(show = true) {
    const loadingEl = document.getElementById('loading-indicator') || createLoadingIndicator();
    
    if (show) {
        loadingEl.style.display = 'flex';
    } else {
        loadingEl.style.display = 'none';
    }
}

function createLoadingIndicator() {
    const loadingEl = document.createElement('div');
    loadingEl.id = 'loading-indicator';
    loadingEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        display: none;
    `;
    loadingEl.innerHTML = 'Loading...';
    document.body.appendChild(loadingEl);
    return loadingEl;
}

const questsList = document.getElementById('quests-list');
const questModal = document.getElementById('quest-modal');
const modalImg = document.getElementById('modal-img');
const modalReward = document.getElementById('modal-reward');
const modalSteps = document.getElementById('modal-steps');
const closeModalBtn = document.getElementById('close-modal');

// Esempio JSON dal back-end
const questsFromBackend = [
    { 
        title: "Share a Secret Santa link", 
        img: "icons8-crypto-48 (1).png", 
        reward: "2$", 
        progress: 0.3,
        steps: ["Share link with 3 friends", "Get 1 friend to join", "Claim reward"]
    },
    { 
        title: "Boost Giftomania RUS channel", 
        img: "gift.png", 
        reward: "2$", 
        progress: 0.6,
        steps: ["Join channel", "Like 2 posts", "Share channel"]
    },
    { 
        title: "Open InkLand and Activate Bonus", 
        img: "inkland.png", 
        reward: "2$", 
        progress: 0.1,
        steps: ["Open InkLand app", "Activate bonus", "Finish tutorial"]
    }
];

// Render delle quests
function renderQuests(quests) {
    questsList.innerHTML = '';

    quests.forEach((q, idx) => {
        const div = document.createElement('div');
        div.className = 'quest-item';
        div.innerHTML = `
            <div class="quest-top">
                <div class="quest-left">
                    <img src="${q.img}" alt="${q.title}">
                    <div class="quest-title">${q.title}</div>
                </div>
                <div class="quest-reward">${q.reward}</div>
            </div>
            <div class="quest-progress">
                <div class="quest-progress-fill" style="width:${(q.progress*100).toFixed(0)}%"></div>
            </div>
        `;

        // click per aprire modal
        div.addEventListener('click', () => {
            modalSteps.innerHTML = '';

            // aggiorna img e reward
            modalImg.src = q.img;

            q.steps.forEach((step, i) => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'modal-step';

                const numberDiv = document.createElement('div');
                numberDiv.className = 'modal-step-number';
                numberDiv.textContent = i + 1;

                const textDiv = document.createElement('div');
                textDiv.textContent = step;

                stepDiv.appendChild(numberDiv);
                stepDiv.appendChild(textDiv);
                modalSteps.appendChild(stepDiv);
            });

            questModal.style.display = 'flex';
        });

        questsList.appendChild(div);
    });
}

// chiudi modal
closeModalBtn.addEventListener('click', () => {
    questModal.style.display = 'none';
});

// render iniziale
renderQuests(questsFromBackend);

function renderProfile(user) {
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.85);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 20px;
        overflow-y: auto;
    `;

    const sheet = document.createElement('div');
    sheet.style.cssText = `
        width: 100%;
        max-width: 800px;
        background: #111827;
        color: #e5e7eb;
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        margin-bottom: 40px;
    `;

    // HEADER AVATAR + NOME + ID
    const header = document.createElement('div');
    header.style.cssText = `
        display:flex;
        align-items:center;
        gap:16px;
        padding:16px;
        position: sticky;
        top:0;
        background:#111827;
        z-index:10;
    `;
    header.innerHTML = `
        <img src="${user.avatar||'https://via.placeholder.com/64'}" style="width:64px;height:64px;border-radius:12px;">
        <div style="display:flex;flex-direction:column;">
            <div style="font-size:20px;font-weight:700;">${user.name}</div>
            <div style="font-size:12px;color:#9ca3af;">ID #${user.id||'12345'}</div>
        </div>
        <button id="close-profile" style="
            margin-left:auto;
            background:none;
            border:none;
            color:#9ca3af;
            font-size:22px;
            cursor:pointer;
        ">×</button>
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        padding:16px;
        display:flex;
        flex-direction:column;
        gap:20px;
    `;

    // STATISTICHE TRASPARENTI
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = `
        display:flex;
        gap:12px;
        flex-wrap:wrap;
    `;

    const stats = [
        {label:'Positions Value', value:`$${user.positionsValue?.toLocaleString()||'4,462.37'}`},
        {label:'Biggest Win', value:`$${user.biggestWin?.toLocaleString()||'1,099.61'}`},
        {label:'Predictions', value:user.predictions||42},
        {label:'Profit/Loss', value:`$${user.profitLoss?.toLocaleString()||'1,356.05'}`}
    ];

    stats.forEach(s=>{
        const statBox = document.createElement('div');
        statBox.style.cssText = `
            flex:1;
            min-width:100px;
            background: rgba(255,255,255,0.05);
            padding:12px;
            border-radius:10px;
            text-align:center;
        `;
        statBox.innerHTML = `
            <div style="font-size:12px;color:#9ca3af;">${s.label}</div>
            <div style="font-size:16px;font-weight:600;">${s.value}</div>
        `;
        statsDiv.appendChild(statBox);
    });

    content.appendChild(statsDiv);

    // PROFIT/Loss GRANDE SOPRA GRAFICO
    const profitDiv = document.createElement('div');
    profitDiv.style.cssText = `
        font-size:24px;
        font-weight:700;
        color:#22c55e;
    `;
    profitDiv.textContent = `$${user.profitLoss?.toLocaleString()||'1,356.05'}`;
    content.appendChild(profitDiv);

    // TIMEFRAME
    const timeframeDiv = document.createElement('div');
    timeframeDiv.style.cssText = `display:flex;gap:8px;margin-bottom:8px;`;
    ['1D','1W','1M','ALL'].forEach(t=>{
        const btn = document.createElement('button');
        btn.textContent = t;
        btn.style.cssText = `
            padding:6px 10px;
            border-radius:999px;
            border:1px solid rgba(255,255,255,.15);
            background:${t==='ALL'?'rgba(255,255,255,.1)':'transparent'};
            color:#e5e7eb;
            font-size:12px;
            cursor:pointer;
        `;
        timeframeDiv.appendChild(btn);
    });
    content.appendChild(timeframeDiv);

    // GRAFICO
    const chartWrap = document.createElement('div');
    chartWrap.id = 'profile-chart';
    chartWrap.style.cssText = `height:160px;position:relative;margin-bottom:16px;`;
    content.appendChild(chartWrap);

    setTimeout(()=>{
        const chart = LightweightCharts.createChart(chartWrap,{
            layout:{background:{color:'transparent'},textColor:'rgba(229,231,235,0.7)',fontSize:11},
            grid:{vertLines:{color:'rgba(255,255,255,0.04)'},horzLines:{color:'rgba(255,255,255,0.04)'}},
            rightPriceScale:{visible:true,borderVisible:false,scaleMargins:{top:0.15,bottom:0.15}},
            timeScale:{visible:false},
            crosshair:{mode:LightweightCharts.CrosshairMode.Normal},
            handleScroll:false,
            handleScale:false,
        });
        const series = chart.addLineSeries({color:'#60a5fa',lineWidth:2,priceLineVisible:false,crosshairMarkerVisible:true});
        const now = Math.floor(Date.now()/1000);
        const data = Array.from({length:80},(_,i)=>({time:now-(80-i)*60,value:Math.max(5, Math.min(95, Math.random()*100))}));
        series.setData(data);
        chart.resize(chartWrap.clientWidth,160);
    },50);

    // POSITIONS
    const positionsList = document.createElement('div');
    positionsList.id = 'positions-list';
    content.appendChild(positionsList);

    const positionsData = user.positions || [];
    renderPositions(positionsData);

    sheet.appendChild(content);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    // CHIUSURA
    document.getElementById('close-profile').onclick = ()=>{
        overlay.remove();
        document.body.style.overflow = '';
    };
}

/* ================= CLICK SULLA LEADERBOARD ================= */
document.getElementById('leaderboard-users').addEventListener('click',(e)=>{
    const row = e.target.closest('.leader-row');
    if(!row) return;
    const idx = Array.from(document.getElementById('leaderboard-users').children).indexOf(row);
    const user = users[idx];
    renderProfile(user);
});


renderPositions([
    {
        img: 'https://via.placeholder.com/64',
        title: 'Mavericks vs Jazz: O/U 241.5',
        shares: '182,065.9',
        price: 49,
        tag: 'Under',
        value: 86481.30,
        pnl: -2736.81,
        pnlPerc: -3.07
    },
    {
        img: 'https://via.placeholder.com/64',
        title: 'Al Kholoood vs Al Ittihad',
        shares: '100,000.0',
        price: 59,
        tag: 'Under',
        value: 60500.00,
        pnl: 1500.00,
        pnlPerc: 2.54
    },
        {
        img: 'https://via.placeholder.com/64',
        title: 'Al Kholoood vs Al Ittihad',
        shares: '100,000.0',
        price: 59,
        tag: 'Under',
        value: 60500.00,
        pnl: 1500.00,
        pnlPerc: 2.54
    },
        {
        img: 'https://via.placeholder.com/64',
        title: 'Al Kholoood vs Al Ittihad',
        shares: '100,000.0',
        price: 59,
        tag: 'Under',
        value: 60500.00,
        pnl: 1500.00,
        pnlPerc: 2.54
    }
]);





function renderPositions(positions) {
    const list = document.getElementById('positions-list');
    list.innerHTML = '';

    positions.forEach(p => {
        const div = document.createElement('div');
        div.className = 'position-item';

        // ✅ CLICK APRE I DETTAGLI
        div.onclick = () => openMarketDetail(p.id);

        const pnlClass = p.pnl >= 0 ? 'pnl-green' : 'pnl-red';
        const tagClass =
            p.tag === 'Yes' ? 'tag-yes' :
            p.tag === 'Under' ? 'tag-under' : 'tag-team';

        div.innerHTML = `
            <div class="position-left">
                <img src="${p.img}" class="position-avatar">
                <div class="position-info">
                    <div class="position-title">${p.title}</div>
                    <div class="position-sub">${p.shares} shares at ${p.price}¢</div>
                    <div class="position-tag ${tagClass}">${p.tag}</div>
                </div>
            </div>

            <div class="position-right">
                <div class="position-value">$${p.value.toLocaleString()}</div>
                <div class="position-pnl ${pnlClass}">
                    ${p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)} (${p.pnlPerc}%)
                </div>
            </div>
        `;

        list.appendChild(div);
    });
}



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


