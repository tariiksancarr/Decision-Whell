// --- YEREL DOSYAYA İHTİYAÇ DUYMAYAN YAPAY SES MOTORU (YÖNTEM A) ---
let audioCtx = null;
let sesAcik = true; // Ses başlangıçta açık

const sesToggleBtn = document.getElementById("sesToggleBtn");

// 1. SES MOTORU FONKSİYONU
function calHizliCitSesi() {
    // KONTROL: Ses kapalıysa motoru hiç çalıştırma, fonksiyondan çık
    if (!sesAcik) return; 

    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'triangle'; 
        oscillator.frequency.setValueAtTime(550, audioCtx.currentTime); 
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03); 

        oscillator.start(0);
        oscillator.stop(audioCtx.currentTime + 0.03);
    } catch (e) {
        console.log("Ses motoru başlatılamadı:", e);
    }
}

sesToggleBtn.addEventListener("click", () => {
    sesAcik = !sesAcik; // Durumu tersine çevir
    
    if (sesAcik) {
        sesToggleBtn.classList.remove("muted"); // Kırmızı çizgiyi kaldır
        
        // --- SES AÇILDIĞINDA MÜZİĞİ GERİ GETİR ---
        if (music) {
            music.volume = 1.0; // Müziğin ses seviyesini maksimuma getir
        }
        
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } else {
        sesToggleBtn.classList.add("muted"); // Kırmızı çizgiyi ekle
        
        // --- SES KAPATILDIĞINDA MÜZİĞİ KESİN DURDUR ---
        if (music) {
            music.pause();       // Müziği durdur
            music.currentTime = 0; // Müziği en başa sar
            music.volume = 0.0;    // Ses seviyesini sıfırla (Emniyet payı)
        }
    }
});







const dilSozlugu = {
    TR: {
        title: "Karar Çarkı 🎡",
        addBtn: "➕ Seçenek Ekle",
        spinBtn: "▶︎",
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
        spinBtn: "▶︎",
        errorText: "You must write at least 2 options to spin!",
        modalTitle: "Result Chosen 🎯",
        modalAll: "Options:",
        modalRetry: "🔄 Spin Again",
        modalOk: "✅ OK",
        placeholder: "Option "
    }
};

let currentLang = "TR";

// HTML Elemanları
const kararBtn = document.getElementById("kararverbtn");
const addOptionBtn = document.getElementById("addOptionBtn");
const inputContainer = document.getElementById("inputContainer");
const sonucYazisi = document.getElementById("sonucYazisi");
const music = document.getElementById("audio");
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;
const originalWidth = canvas.width;
const originalHeight = canvas.height;
const scaledWidth = originalWidth * dpr;
canvas.width = originalWidth * dpr; 
canvas.height = originalHeight * dpr;
canvas.style.width = originalWidth + "px";
canvas.style.height = originalHeight + "px";
ctx.scale(dpr, dpr); // Ölçekleme düzeltmesi
ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Ölçekleme düzeltmesi

const mainTitle = document.getElementById("mainTitle");
const dilDegistirBtn = document.getElementById("dilDegistirBtn");

let secenekler = [];
let startAngle = 0;
let spinTimeout = null;
let spinAngleIncrement = 0;
let pointerKick = 0;
let pointerVelocity = 0;

const renkler = ["#264653", "#e9c46a", "#79c731", "#f4a261", "#e76f51", "#2a9d8f", "#06d6a0", "#6441a7", "#0f3ea3", "#264653", "#5c260d", "#24724b"];


function uiGuncelle() {
    // Büyük harf yapınıza (TR / EN) uygun hale getirildi
    mainTitle.textContent = dilSozlugu[currentLang].title;
    kararBtn.textContent = "▶︎";
    addOptionBtn.textContent = dilSozlugu[currentLang].addBtn;
    
    // Tüm mevcut kutuların placeholder metinlerini güncelle
    const inputs = inputContainer.querySelectorAll(".option-input");
    inputs.forEach((input, index) => {
        input.placeholder = dilSozlugu[currentLang].placeholder + (index + 1);
    });
}
// Tek butonla diller arasında git-gel (Toggle) mantığı - GÜNCELLENDİ
dilDegistirBtn.addEventListener("click", () => {
    if (currentLang === "TR") {
        currentLang = "EN";
        dilDegistirBtn.textContent = "TR"; // İngilizcedeyken "Türkçeye geç" mesajı verir
    } else {
        currentLang = "TR";
        dilDegistirBtn.textContent = "EN"; // Türkçedeyken "İngilizceye geç" mesajı verir
    }
    
    // Sayfadaki tüm yazıları ve input placeholder alanlarını yeni dile göre yenile
    uiGuncelle();
    
    // --- GÜVENLİ ÇARK ÇİZİMİ ---
    // Mevcut input alanlarındaki yazıları alıyoruz
    let guncelGirdiler = getInputs();
    
    // Eğer kullanıcının yazdığı hiçbir seçenek yoksa (dizi boşsa) çarkı sıfırlama,
    // drawWheel fonksiyonuna boş göndermek yerine soru işaretlerini koruması için pas geç
    if (guncelGirdiler.length > 0) {
        drawWheel(guncelGirdiler);
    } else {
        drawWheel([]); // İçerisi boşsa drawWheel kendi içindeki ["?", "?"] korumasını tetikler
    }
});
function drawPegs(count) {
    const arc = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
        let angle = arc * i;

        // İki seçenekli çarkta mevcut açı kaydırmasını koru
        if (count === 2) {
            angle += Math.PI / 2;
        }

        const pegX = Math.cos(angle) * 125;
        const pegY = Math.sin(angle) * 125;

        ctx.save();
        ctx.translate(pegX, pegY);
        ctx.rotate(angle);

        // Çivinin gölgesi
        ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
        ctx.shadowBlur = 1;

        // Metal pim gövdesi
        ctx.fillStyle = "#e5e7eb";
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Parlaklık noktası
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";

        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
// Sayfa ilk açıldığında çarkın boş kalmaması için ilk çizimi yapıyoruz
drawWheel([]); 
uiGuncelle(); // Dil ayarlarına göre metinleri de ilk açılışta doldurur


// 1. Girdileri Güvenli Bir Şekilde Alır
function getInputs() {
    const inputs = Array.from(inputContainer.querySelectorAll(".option-input"));
    return inputs.map(input => input.value.trim()).filter(val => val !== "");
}

// 2. Çarkı Sabit Tutar, Sadece Siyah Oku Döndürür
// 2. Çarkı Sabit Tutar, Sadece Siyah Oku Döndürür
// 2. Çarkı Sabit Tutar, Sadece Siyah Oku Döndürür
function drawWheel(options) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    
    // Parametre boş gelirse çökmesin diye güvenlik
    let currentOptions = options ? options : [];
    let displayOptions = currentOptions.length > 0 ? currentOptions : ["?", "?"];
    let arc = (Math.PI * 2) / displayOptions.length;
    
    // --- 1. DÖNEN ÇARK ÇİZİMİ ---<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    ctx.save();
    ctx.translate(150, 150); // Çarkın merkezi
    ctx.rotate(startAngle);  // Sadece çarkı döndürür
    
    for (let i = 0; i < displayOptions.length; i++) {
        // --- 2 SEÇENEKTE/İLK AÇILIŞTA ÇARKI SOL-SAĞ DİKİNE BÖLMEK İÇİN AÇIYI KAYDIRIRIZ ---
        let startArc = arc * i;
        let endArc = arc * (i + 1);
        if (displayOptions.length === 2) {
            startArc += Math.PI / 2;
            endArc += Math.PI / 2;
        }
        
        // Dilim Çizimi
        ctx.beginPath();
        ctx.fillStyle = renkler[i % renkler.length];
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 180, startArc, endArc);
        ctx.lineTo(0, 0);
       ctx.arc(0, 0, 180, startArc, endArc, false);
       ctx.closePath();
       ctx.fill();
       
        
        
               // --- YAZI ÇİZİMİ BAŞLIYOR ---
    
        ctx.save();
        
        let textAngle = startArc + arc / 2; 
        ctx.textBaseline = "middle"; 
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "white";

        // 1. Dinamik Font Boyutu Hesaplama
        let fontSize = 20; // Başlangıç standart yazı boyutu
        ctx.font = `bold ${fontSize}px Arial`;
        
        let textWidth = ctx.measureText(displayOptions[i]).width;
        let maxAllowedWidth = 120; // Tam ortaya kadar gelmesine izin verilen maksimum alan

        // Yazı sığana kadar ve 11px sınırına düşene kadar tatlı tatlı küçült
        while (textWidth > maxAllowedWidth && fontSize > 15) {
            fontSize -= 0.5;
            ctx.font = `bold ${fontSize}px Arial`;
            textWidth = ctx.measureText(displayOptions[i]).width;
        }
        
        

        // Belli bir küçülmeden (11px) sonra hala sığmıyorsa üç nokta koy
        let finalInlineText = displayOptions[i];
        if (textWidth > maxAllowedWidth) {
            finalInlineText = finalInlineText.substring(0, 10) + "...";
            ctx.font = "bold 20px Arial";
            textWidth = ctx.measureText(finalInlineText).width;
            
        }

       // 1. Çarkın ANLIK toplam açısını hesaplayın (wheelAngle = çarkın o anki dönüş miktarı)
// Not: wheelAngle değişkeninizin adını kendi kodunuza göre güncelleyin (örn: currentAngle, rotationAngle)
let totalAngle = (startAngle + textAngle) % (2 * Math.PI);
// --- 1. SABİT DİLİM AÇISI KONTROLÜ (Çark dönse de bu açı asla değişmez) ---
// textAngle'ı 0 ile 2PI arasına sıkıştırıyoruz
let cleanTextAngle = textAngle % (2 * Math.PI);
if (cleanTextAngle < 0) cleanTextAngle += 2 * Math.PI;

// Kararı çarkın dönüşüne göre değil, dilimin çarktaki sabit yerine göre veriyoruz
const isLeft = cleanTextAngle > Math.PI / 2 && cleanTextAngle < (3 * Math.PI) / 2;

// --- 2. CANVAS DÖNDÜRME VE ÇİZİM ---
ctx.rotate(textAngle); // Dilimin açısına dön

if (isLeft) {
    ctx.rotate(Math.PI); // Sol taraftaki dilimler için metni ters çevir
}

// Hizalama ve metni yazdırma
ctx.textAlign = isLeft ? "right" : "left";
ctx.fillText(finalInlineText, isLeft ? -25 : 25, 0);



        
        ctx.restore();



    } 
    drawPegs(displayOptions.length);
    ctx.restore(); // Çark dönme efektini sıfırla (Ok etkilenmez)
    
    // --- 2. SABİT DURAN SAĞDAKİ OK ---
    ctx.save();
    ctx.translate(300, 150); 
    ctx.rotate(Math.PI + pointerKick);     
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ec4899";  
    ctx.strokeStyle = "#ec4899";
    
    ctx.beginPath();
    ctx.lineWidth = 8;   
    ctx.moveTo(0, 0);   
    ctx.lineTo(18, 0);    
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(14, -10);   
    ctx.lineTo(26, 0);    
    ctx.lineTo(14, 10);    
    ctx.closePath();
    ctx.fill();

    ctx.restore(); 
}



function rotateAnimation() {
    let currentSpeed = Math.abs(spinAngleIncrement);

    // Çarkın yavaşlama sistemi
    if (currentSpeed > 4.0) {
        spinAngleIncrement *= 0.998;
    } else if (currentSpeed > 0.6) {
        spinAngleIncrement *= 0.993;
    } else {
        spinAngleIncrement *= 0.997;
    }

    // Çarkın açısını güncelle
    startAngle += spinAngleIncrement * Math.PI / 180;

    // Pim geçişi, ses ve ok hareketi
    if (secenekler && secenekler.length > 0) {
        let toplamDilimSayisi = secenekler.length;
        let dilimGenisligiDerece = 360 / toplamDilimSayisi;

        let guncelDerece = startAngle * 180 / Math.PI;

        // Sadece iki seçenekli çarkta 90 derece kaydırma var
        let kalibrasyonAcisi =
            toplamDilimSayisi === 2 ? 90 : 0;

        // Bağıl açıyı 0-360 arasına getir
        let relativeDegrees =
            (360 - (guncelDerece + kalibrasyonAcisi)) % 360;

        if (relativeDegrees < 0) {
            relativeDegrees += 360;
        }

        // Okun hizasındaki dilimi bul
        let suAnkiDilimIndex =
            Math.floor(relativeDegrees / dilimGenisligiDerece)
            % toplamDilimSayisi;

        // Yeni dilime geçildiğinde oku ve sesi çalıştır
        if (suAnkiDilimIndex !== sonGecilenDilimIndex) {
            let yonIsareti =
                spinAngleIncrement >= 0 ? -1 : 1;

            pointerVelocity = yonIsareti * 0.30;

            // Pim geçişinde çarkı biraz yavaşlat
            if (currentSpeed > 1.0) {
                spinAngleIncrement *= 0.985;
            }

            if (
                typeof navigator !== "undefined" &&
                navigator.vibrate
            ) {
                navigator.vibrate(10);
            }

            calHizliCitSesi();

            sonGecilenDilimIndex = suAnkiDilimIndex;
        }
    }

    // Bu bölüm pim kontrolünden sonra çalışmalı
    pointerVelocity += (0 - pointerKick) * 0.20;
    pointerVelocity *= 0.72;
    pointerKick += pointerVelocity;

    drawWheel(secenekler);

    // Durma kontrolü
    if (Math.abs(spinAngleIncrement) > 0.1) {
        spinTimeout = requestAnimationFrame(rotateAnimation);
    } else {
        stopWheel();
    }
}






// --- 4. Tetikleyici (Yöntem A Ses Motoru Aktifleştirildi) ---
// --- 4. Tetikleyici (Buton Kilitlemeyen ve Ses Uyandıran Sürüm) ---
function spinWheel(options) {
    try {
        if (
            typeof audioCtx !== "undefined" &&
            audioCtx &&
            audioCtx.state === "suspended"
        ) {
            audioCtx.resume();
        }

        calHizliCitSesi();
    } catch (e) {
        console.log("Ses uyandırılırken hata atlandı:", e);
    }

    // Yeni dönüşte eski değerleri temizle
    sonGecilenDilimIndex = -1;
    pointerKick = 0;
    pointerVelocity = 0;

    secenekler = options;
    spinAngleIncrement = Math.random() * 15 + 30;

    rotateAnimation();
}

function stopWheel() {
    cancelAnimationFrame(spinTimeout);
    
    // --- GÜVENLİK: Çark tam durduğu an yapay ses motorunun tıklarını tamamen kes ---
    if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend(); 
    }

    let toplamDilimSayisi = secenekler.length;
    let dilimGenisligiDerece = 360 / toplamDilimSayisi;

    let degrees = (startAngle * 180 / Math.PI) % 360;
    if (degrees < 0) degrees += 360;
    
    // Ok sağda olduğu için doğrudan 360 eksenine göre kazanan dilimi buluyoruz
    let kalibrasyonAcisi =
    toplamDilimSayisi === 2 ? 90 : 0;

let relativeDegrees =
    (360 - (degrees + kalibrasyonAcisi)) % 360;

if (relativeDegrees < 0) {
    relativeDegrees += 360;
}
 
    
    let index = Math.floor(relativeDegrees / dilimGenisligiDerece);
    index = (index + toplamDilimSayisi) % toplamDilimSayisi;
    
    // Kazanan modalını aç
    openResultModal(secenekler[index], secenekler);
}


function launchFireworks(canvas) {
    const ctx = canvas.getContext("2d");
    let animationId;
    let intervalId;
    let active = true;
    let particles = [];

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createExplosion(x, y) {
        const colors = ["#ec4899", "#8b5cf6", "#38bdf8", "#facc15", "#34d399", "#ffffff"];
        const particleCount = 70;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;

            particles.push({
                x,
                y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                gravity: 0.045,
                friction: 0.985,
                life: 1,
                decay: Math.random() * 0.015 + 0.01,
                size: Math.random() * 2.5 + 1,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    function animate() {
        if (!active) return;

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        particles = particles.filter((particle) => particle.life > 0);

        particles.forEach((particle) => {
            particle.velocityX *= particle.friction;
            particle.velocityY = particle.velocityY * particle.friction + particle.gravity;

            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.life -= particle.decay;

            ctx.save();
            ctx.globalAlpha = Math.max(particle.life, 0);
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        animationId = requestAnimationFrame(animate);
    }

    function randomExplosion() {
        createExplosion(
            Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
            Math.random() * window.innerHeight * 0.45 + window.innerHeight * 0.1
        );
    }

       resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // İlk patlamalar
    randomExplosion();
    setTimeout(randomExplosion, 450);
    setTimeout(randomExplosion, 800);

    // Düzenli patlamalar
    intervalId = setInterval(randomExplosion, 1000);

        // ... (Yukarıdaki kodlar aynı kalıyor)
    animate();

    // DOĞRU SIRA: Önce durdurma fonksiyonunu tanımlıyoruz
    function stopFireworksInternal() {
        active = false; 
        clearInterval(intervalId); 
        clearTimeout(timeoutId); 
        cancelAnimationFrame(animationId); 
        window.removeEventListener("resize", resizeCanvas); 
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
    }

    // Şimdi zamanlayıcı stopFireworksInternal'ı güvenle çağırabilir
    const timeoutId = setTimeout(function() {
        stopFireworksInternal();
    }, 10000); // 9 saniye için 9000 yazılmalı (1000 sadece 1 saniyedir)

    // Modal butonlarının kullanabilmesi için fonksiyonu dışarı fırlatıyoruz
    return stopFireworksInternal;
} // launchFireworks bitti


// =================================================================
// 6. Sonuç Ekranı (Pop-up Modal)
// =================================================================
function openResultModal(chosen, options) {
    if (music) {
        music.currentTime = 0;
        music.play().catch(() => {
            console.log("Ses oynatma izni bekleniyor.");
        });
    }

    // Modal arka planı
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";

    // Havai fişek canvas'ı
    const fireworksCanvas = document.createElement("canvas");
    fireworksCanvas.className = "fireworks-canvas";
    modalOverlay.appendChild(fireworksCanvas);

    // Modal kartı
    const modalCard = document.createElement("div");
    modalCard.className = "modal-card";

    // Başlık
    const titleH3 = document.createElement("h3");
    titleH3.textContent = dilSozlugu[currentLang].modalTitle;
    modalCard.appendChild(titleH3);

    // Kazanan seçenek
    const chosenH1 = document.createElement("h1");
    chosenH1.style.color = "#00dfdb";
    chosenH1.style.margin = "20px 0";
    chosenH1.style.textShadow = "0 0 10px rgba(0, 223, 216, 0.5)";
    chosenH1.textContent = chosen;
    modalCard.appendChild(chosenH1);

    // Diğer seçenekler
    const optionsP = document.createElement("p");
    optionsP.style.color = "#94a3b8";
    optionsP.style.fontSize = "14px";

    const strongTag = document.createElement("strong");
    strongTag.textContent = dilSozlugu[currentLang].modalAll;

    optionsP.appendChild(strongTag);
    optionsP.appendChild(document.createElement("br"));

    options.forEach((opt, index) => {
        optionsP.appendChild(document.createTextNode(opt));

        if (index < options.length - 1) {
            optionsP.appendChild(document.createElement("br"));
        }
    });

    modalCard.appendChild(optionsP);

    // Tekrar dene butonu
    const retryBtn = document.createElement("button");
    retryBtn.id = "modalRetryBtn"; // CSS ID'si bağlandı
    retryBtn.type = "button";
    retryBtn.textContent = dilSozlugu[currentLang].modalRetry;
    modalCard.appendChild(retryBtn);

    // Tamam butonu
    const okBtn = document.createElement("button");
    okBtn.id = "modalOkBtn"; // CSS ID'si bağlandı
    okBtn.type = "button";
    okBtn.textContent = dilSozlugu[currentLang].modalOk;
    modalCard.appendChild(okBtn);

    // Modalı sayfaya ekle
    modalOverlay.appendChild(modalCard);
    document.body.appendChild(modalOverlay);

    // Havai fişekleri başlat
    const stopFireworks = launchFireworks(fireworksCanvas);

    // Tekrar dene olay dinleyicisi
    retryBtn.addEventListener("click", () => {
        if (music) {
            music.pause();
            music.currentTime = 0;
        }
        stopFireworks();
        modalOverlay.remove();
        kararBtn.disabled = false;
        kararBtn.click();
    });

    // Tamam olay dinleyicisi
    okBtn.addEventListener("click", () => {
        if (music) {
            music.pause();
            music.currentTime = 0;
        }
        stopFireworks();
        modalOverlay.remove();
        kararBtn.disabled = false;
    });
} // openResultModal sonu

// =================================================================
// ELLE ÇARK ÇEVİRME VE SÜRÜKLEME MEKANİZMASI (DÜZELTİLMİŞ HİBRİT SİSTEM)
// =================================================================
let isDragging = false;
let lastAngle = 0;
let currentRotationVelocity = 0;
let lastFrameTime = performance.now();

function getPointerCoords(e) {
    const rect = canvas.getBoundingClientRect();

    let clientX;
    let clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    return {
        x: clientX - rect.left - rect.width / 2,
        y: clientY - rect.top - rect.height / 2
    };
}

function onPointerDown(e) {
    if (kararBtn.disabled) return; 

    let activeOptions = getInputs();
    if (activeOptions.length < 2) {
        sonucYazisi.textContent = dilSozlugu[currentLang].errorText;
        return;
    }

    secenekler = activeOptions;
    sonucYazisi.textContent = ""; 
    isDragging = true;
    
    const coords = getPointerCoords(e);
    lastAngle = Math.atan2(coords.y, coords.x);
    lastFrameTime = performance.now();
    currentRotationVelocity = 0;
}

function onPointerMove(e) {
    if (!isDragging || !secenekler || secenekler.length < 2) return;

    // Mobil cihazda çarkı çevirirken tüm sayfanın kaymasını (scrolling) engeller
    if (e.cancelable) {
        e.preventDefault();
    }

    const coords = getPointerCoords(e);
    const currentAngle = Math.atan2(coords.y, coords.x);
    let angleDiff = currentAngle - lastAngle;
    
    // Açı atlamalarını (Giriş/Çıkış sınırlarını) yumuşatmak için (-PI ile +PI arası)
    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Yön her iki cihazda da standarttır; hareket yönü artı olarak eklenir
    startAngle += angleDiff; 
    
    drawWheel(secenekler);

    const now = performance.now();
    const dt = now - lastFrameTime;
    if (dt > 0) {
        // Radyan/milisaniye cinsinden hızı saniyeye çeviriyoruz
        currentRotationVelocity = angleDiff / dt; 
    }

    lastAngle = currentAngle;
    lastFrameTime = now;
}

function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;

    if (!secenekler || secenekler.length < 2) {
        sonucYazisi.textContent = dilSozlugu[currentLang].errorText;
        return;
    }

    // Kullanıcının çarkı ne kadar hızlı fırlattığını kontrol ediyoruz
    if (Math.abs(currentRotationVelocity) > 0.001) {
        sonucYazisi.textContent = ""; 
        kararBtn.disabled = true; 
        
        // Fırlatma hızını animasyon kare hızına (saf derece cinsinden) dönüştürün
        spinAngleIncrement = currentRotationVelocity * 150; 
        
        // Çarkın çok yavaş kalıp hemen durmaması için minimum fırlatma hızı eşiği
        const minHiz = 12 + Math.random() * 6;
        if (Math.abs(spinAngleIncrement) < minHiz) {
            spinAngleIncrement = spinAngleIncrement < 0 ? -minHiz : minHiz;
        }

        if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
          sonGecilenDilimIndex = -1;
          pointerKick = 0;
          pointerVelocity = 0;
        rotateAnimation(); 
    }
}

// Olay dinleyicileri (Mobil kayma sorunu için passive: false yapıldı)
canvas.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove, { passive: false });
window.addEventListener('mouseup', onPointerUp);

canvas.addEventListener('touchstart', onPointerDown);
window.addEventListener('touchmove', onPointerMove, { passive: false });
window.addEventListener('touchend', onPointerUp);

// =================================================================
// 7. Yeni Seçenek Ekleme ve Buton Kontrolleri (Stabilize Edildi)
// =================================================================
addOptionBtn.addEventListener("click", () => {
    const totalInputs = inputContainer.querySelectorAll(".input-wrapper").length;
    const wrapper = document.createElement("div");
    wrapper.className = "input-wrapper";
    
    wrapper.innerHTML = `
        <input type="text" class="option-input" placeholder="${dilSozlugu[currentLang].placeholder + (totalInputs + 1)}">
        <button class="remove-btn">❌</button>
    `;
    
    inputContainer.appendChild(wrapper);
    
    // Performans için sadece girdi değiştikçe çizim tetiklenir
    wrapper.querySelector(".option-input").addEventListener("input", () => {
        drawWheel(getInputs());
    });
    
    wrapper.querySelector(".remove-btn").addEventListener("click", () => {
        wrapper.remove();
        uiGuncelle();
        drawWheel(getInputs());
    });
    
    uiGuncelle();
});


// İlk yüklemedeki kutuların çarpı butonlarını çalıştırır
inputContainer.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.target.parentElement.remove();
        uiGuncelle();
        drawWheel(getInputs());
    });
});

// Kutulara veri girildikçe canlı güncelleme
inputContainer.addEventListener("input", (e) => {
    if (e.target.classList.contains("option-input")) {
        drawWheel(getInputs());
    }
});

// Çarkı Döndür Ana Butonu (Tıklama ile döndürme)
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

// =================================================================
// Başlangıç Kurulumları (En Son Çalışacak Kısım)
// =================================================================
uiGuncelle();
drawWheel(getInputs());


