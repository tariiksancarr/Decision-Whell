const dilSozlugu = {
    TR: {
        title: "Karar Çarkı 🎡",
        addBtn: "➕ Seçenek Ekle",
        spinBtn: "Çarkı Döndür 🚀",
        errorText: "Çarkı döndürmek için en az 2 seçenek yazmalısınız!",
        modalTitle: "Sonuç Seçildi 🎯",
        modalAll: "Seçenekler:",
        modalRetry: "🔄 Tekrar Çevir",
        modalOk: "✅ Tamam",
        placeholder: "Seçenek "
    },
    EN: {
        title: "Decision Wheel 🎡",
        addBtn: "➕ Add Option",
        spinBtn: "Spin the Wheel 🚀",
        errorText: "You must write at least 2 options to spin!",
        modalTitle: "Result Chosen 🎯",
        modalAll: "Options:",
        modalRetry: "🔄 Spin Again",
        modalOk: "✅ OK",
        placeholder: "Option "
    }
};

let currentLang = "TR";
const kararBtn = document.getElementById("kararverbtn");
const addOptionBtn = document.getElementById("addOptionBtn");
const inputContainer = document.getElementById("inputContainer");
const sonucYazisi = document.getElementById("sonucYazisi");
const music = document.getElementById("audio");
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const mainTitle = document.getElementById("mainTitle");

let secenekler = [];
let startAngle = 0;
let spinTimeout = null;
let spinAngleIncrement = 0;

const renkler = ["#ff0055", "#00ffcc", "#ffcc00", "#9900ff", "#ff5500", "#00ff00", "#0066ff"];


function uiGuncelle() {
    mainTitle.textContent = dilSozlugu[currentLang].title;
    kararBtn.textContent = dilSozlugu[currentLang].spinBtn;
    addOptionBtn.textContent = dilSozlugu[currentLang].addBtn;
    
    const inputs = inputContainer.querySelectorAll(".option-input");
    inputs.forEach((input, index) => {
        input.placeholder = dilSozlugu[currentLang].placeholder + (index + 1);
    });
}
function getInputs() {
    const inputs = Array.from(inputContainer.querySelectorAll(".option-input"));
    return inputs.map(input => input.value.trim()).filter(val => val !== "");
}

function drawWheel(options) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let displayOptions = options.length > 0 ? options : ["?", "?"];
    let arc = (Math.PI * 2) / displayOptions.length;
        for (let i = 0; i < displayOptions.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = renkler[i % renkler.length];
        ctx.moveTo(150, 150);
        ctx.arc(150, 150, 148, arc * i, arc * (i + 1));
        ctx.lineTo(150, 150);
        ctx.fill();
        ctx.strokeStyle = "rgba(15, 23, 42, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.save();
        ctx.translate(150, 150);
        ctx.rotate(arc * i + arc / 2);
        ctx.fillStyle = "white";
        ctx.font = "bold 13px Arial";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText(displayOptions[i], 45, 5);
        ctx.restore();
    }
    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(startAngle);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.moveTo(0, 0);
    ctx.lineTo(25, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, -13);
    ctx.lineTo(40, 0);
    ctx.lineTo(20, 13);
    ctx.closePath();
    ctx.fill();


    ctx.restore();
    
}

function rotateAnimation() {
    spinAngleIncrement *= 0.98;
    startAngle += (spinAngleIncrement * Math.PI / 180);
    
    drawWheel(secenekler);
    
    if (spinAngleIncrement > 0.1) {
        spinTimeout = requestAnimationFrame(rotateAnimation);
    } else {
        stopWheel();
    }
}

function spinWheel(options) {
    secenekler = options;
    spinAngleIncrement = Math.random() * 15 + 30;
    rotateAnimation();
}

function stopWheel() {
    cancelAnimationFrame(spinTimeout);
    if (music) music.pause();

    let arc = (Math.PI * 2) / secenekler.length;
    let degrees = (startAngle * 180 / Math.PI) % 360;
    if (degrees < 0) degrees += 360;
    
    let index = Math.floor(degrees / (arc * 180 / Math.PI));
    index = (index + secenekler.length) % secenekler.length;
    
    openResultModal(secenekler[index], secenekler);
}

function openResultModal(chosen, options) {
    if (music) {
        music.currentTime = 0;
        music.play().catch(() => console.log("Ses oynatma izni bekleniyor."));
    }

    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    
    modalOverlay.innerHTML = `
      <div class="modal-card">
        <h3>${dilSozlugu[currentLang].modalTitle}</h3>
        <h1 style="color:#00dfd8; margin:20px 0; text-shadow: 0 0 10px rgba(0,223,216,0.5);">${chosen}</h1>
        <p style="color:#94a3b8; font-size:14px;">
        <strong>${dilSozlugu[currentLang].modalAll}</strong><br>
         ${options.join("<br>")}
         </p>
        <button id="modalRetryBtn">${dilSozlugu[currentLang].modalRetry}</button>
        <button id="modalOkBtn">${dilSozlugu[currentLang].modalOk}</button>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    document.getElementById("modalRetryBtn").addEventListener("click", () => {
        if (music) {
            music.pause();
            music.currentTime = 0;
        }
        modalOverlay.remove();
        kararBtn.disabled = false;
        kararBtn.click();
    });

    document.getElementById("modalOkBtn").addEventListener("click", () => {
        if (music) {
            music.pause();
            music.currentTime = 0;
        }
        modalOverlay.remove();
        kararBtn.disabled = false;
    });
}

addOptionBtn.addEventListener("click", () => {
    const totalInputs = inputContainer.querySelectorAll(".input-wrapper").length;
    const wrapper = document.createElement("div");
    wrapper.className = "input-wrapper";
    
    wrapper.innerHTML = `
        <input type="text" class="option-input" placeholder="${dilSozlugu[currentLang].placeholder + (totalInputs + 1)}">
        <button class="remove-btn">❌</button>
    `;
    
    inputContainer.appendChild(wrapper);
    
    wrapper.querySelector(".option-input").addEventListener("input", () => drawWheel(getInputs()));
    wrapper.querySelector(".remove-btn").addEventListener("click", () => {
        wrapper.remove();
        uiGuncelle();
        drawWheel(getInputs());
    });
    
    uiGuncelle();
});

inputContainer.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.target.parentElement.remove();
        uiGuncelle();
        drawWheel(getInputs());
    });
});


inputContainer.addEventListener("input", (e) => {
    if (e.target.classList.contains("option-input")) {
        drawWheel(getInputs());
    }
});
kararBtn.addEventListener("click", function() {
    let activeOptions = getInputs();
    
    if (activeOptions.length < 2) {
        sonucYazisi.textContent = dilSozlugu[currentLang].errorText;
        return;
    }
    
    sonucYazisi.textContent = ""; 
    kararBtn.disabled = true; 
    spinWheel(activeOptions);
});

document.getElementById("langTR").addEventListener("click", (e) => {
    currentLang = "TR";
    document.getElementById("langEN").classList.remove("active");
    e.target.classList.add("active");
    uiGuncelle();
});

document.getElementById("langEN").addEventListener("click", (e) => {
    currentLang = "EN";
    document.getElementById("langTR").classList.remove("active");
    e.target.classList.add("active");
    uiGuncelle();
});

uiGuncelle();
drawWheel(getInputs());
