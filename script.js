// --- YEREL DOSYAYA İHTİYAÇ DUYMAYAN YAPAY SES MOTORU (YÖNTEM A) ---
let audioCtx = null;
let sonGecilenDilimIndex = -1; 
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

const renkler = ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51", "#2a9d8f", "#06d6a0", "#f4a261", "#e76f51", "#264653", "#2a9d8f", "#e9c46a"];


function uiGuncelle() {
    // Büyük harf yapınıza (TR / EN) uygun hale getirildi
    mainTitle.textContent = dilSozlugu[currentLang].title;
    kararBtn.textContent = dilSozlugu[currentLang].spinBtn;
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
    
    // --- 1. DÖNEN ÇARK ÇİZİMİ ---
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
        ctx.arc(0, 0, 150, startArc, endArc);
        ctx.lineTo(0, 0);
        ctx.fill();
        
        ctx.strokeStyle = "rgba(15, 23, 42, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // --- AKILLI YAZI ÇİZİMİ ---
               // --- YAZI ÇİZİMİ BAŞLIYOR ---
                // --- YAZI ÇİZİMİ BAŞLIYOR ---
        ctx.save();
        
        let textAngle = startArc + arc / 2; 
        ctx.textBaseline = "middle"; 
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "white";

        // 1. Dinamik Font Boyutu Hesaplama
        let fontSize = 16; // Başlangıç standart yazı boyutu
        ctx.font = `bold ${fontSize}px Arial`;
        
        let textWidth = ctx.measureText(displayOptions[i]).width;
        let maxAllowedWidth = 125; // Tam ortaya kadar gelmesine izin verilen maksimum alan

        // Yazı sığana kadar ve 11px sınırına düşene kadar tatlı tatlı küçült
        while (textWidth > maxAllowedWidth && fontSize > 60) {
            fontSize -= 0.5;
            ctx.font = `bold ${fontSize}px Arial`;
            textWidth = ctx.measureText(displayOptions[i]).width;
        }

        // Belli bir küçülmeden (11px) sonra hala sığmıyorsa üç nokta koy
        let finalInlineText = displayOptions[i];
        if (textWidth > maxAllowedWidth) {
            finalInlineText = finalInlineText.substring(0, 15) + "...";
            ctx.font = "bold 11px Arial";
            textWidth = ctx.measureText(finalInlineText).width;
        }

        // Çarkın mutlak dönüş açısını hesapla (0 ile 2PI arasında)
        let totalAngle = (startAngle + textAngle) % (2 * Math.PI);
        if (totalAngle < 0) totalAngle += 2 * Math.PI;

        // --- 2. YÖN VE HİZALAMA DÜZELTMESİ (BOŞ ALANI TAM KULLANMA) ---
        ctx.rotate(textAngle); // Dilimin açısına dön

        // AÇI KONTROLÜ DÜZELTİLDİ: Gerçekten sol taraftaysa (90 ile 270 derece arası)
        if (totalAngle > Math.PI / 2 && totalAngle < (3 * Math.PI) / 2) {
            ctx.rotate(Math.PI); // Baş aşağı dönmesini engelle
            ctx.textAlign = "right"; // Yazıyı sağa yasla (Merkezden dışarıya doğru aksın)
            // Sol taraftaki yazının ucu tam ortadaki 0 noktasına bakar, kelime uzadıkça sola (dışa) doğru büyür
            ctx.fillText(finalInlineText, -10, 0); 
        } 
        // Gerçekten sağ taraftaysa (0-90 ve 270-360 derece arası)
        else {
            ctx.textAlign = "left"; // Yazıyı sola yasla (Merkezden dışarıya doğru aksın)
            // Sağ taraftaki yazının başlangıcı çarkın tam merkezinden (10px yanından) başlar, 
            // kelime yazdıkça sağa (dış boşluğa) doğru genişler. Boş alanı tam kullanır!
            ctx.fillText(finalInlineText, 10, 0); 
        }
        
        ctx.restore();


    } 
    
    ctx.restore(); // Çark dönme efektini sıfırla (Ok etkilenmez)
    
    // --- 2. SABİT DURAN SAĞDAKİ OK ---
    ctx.save();
    ctx.translate(300, 150); 
    ctx.rotate(Math.PI);     
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#a11c6e";  
    ctx.strokeStyle = "#a11c6e";
    
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
    // 1. HİBRİT YAVAŞLAMA SİSTEMİ (Uzun dönüş ve titremesiz pürüzsüz duruş)
    if (spinAngleIncrement > 1.5) {
        spinAngleIncrement *= 0.995; // Çark hızlıyken uzun süre döner
    } else {
        spinAngleIncrement *= 0.96;  // Durmaya yakın yumuşak bir fren yapar (Titremez)
    }

    // Çarkın genel dönüş açısını radyan cinsinden artır
    startAngle += (spinAngleIncrement * Math.PI / 180);
    
    // 2. KESİNTİSİZ SES VE TİTREŞİM TETİKLEME MATEMATİĞİ
    if (secenekler && secenekler.length > 0) {
        let toplamDilimSayisi = secenekler.length;
        
        // startAngle radyan açısını, 0 ile 360 derece arasına kusursuzca sıkıştırıyoruz
        let guncelDerece = (startAngle * 180 / Math.PI) % 360;
        if (guncelDerece < 0) guncelDerece += 360;
        
        // Sabit sağdaki oka (0 derece ekseni) göre anlık dilim genişliğini ve endeksini hesapla
        let dilimGenisligiDerece = 360 / toplamDilimSayisi;
        let relativeDegrees = (360 - guncelDerece) % 360;
        
        // Çarkın o an tam okun üstünden geçen dilim numarasını bulur (0, 1, 2 vb.)
        let suAnkiDilimIndex = Math.floor(relativeDegrees / dilimGenisligiDerece);
        
        // EĞER ÇARK DÖNERKEN DİLİM ÇİZGİSİ GEÇİLDİYSE VE ENDEKS DEĞİŞTİYSE:
        if (suAnkiDilimIndex !== sonGecilenDilimIndex) {
            
            // Mobil cihazlar için hafif titreşim tetiği
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(10); 
            }
            
            // YAPAY SESİ HER ÇİZGİ GEÇİŞİNDE DURMAKSIZIN TETİKLE
            // Bu fonksiyon artık çark döndükçe saniyede onlarca kez peş peşe çağrılacak!
            calHizliCitSesi();
            
            // Son durumu kaydet ki aynı dilimin içindeyken ses mükerrer çalmasın, sadece çizgi geçişinde çalsın
            sonGecilenDilimIndex = suAnkiDilimIndex;
        }
    }

    // 3. ÇARKIN YENİDEN ÇİZİLMESİ VE DÖNGÜ KONTROLÜ
    drawWheel(secenekler); 
    
    // Hız 0.1'in üzerindeyse döngüyü requestAnimationFrame ile kesintisiz sürdür
    if (spinAngleIncrement > 0.1) {
        spinTimeout = requestAnimationFrame(rotateAnimation);
    } else {
        stopWheel();
    }
}


// --- 4. Tetikleyici (Yöntem A Ses Motoru Aktifleştirildi) ---
// --- 4. Tetikleyici (Buton Kilitlemeyen ve Ses Uyandıran Sürüm) ---
function spinWheel(options) {
    try {
        // Tarayıcının ses motorunu güvenli bir şekilde uyandır (Çakışma yaratmaz)
        if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        // Ses motoru henüz oluşmadıysa veya sustuysa ilk çıt sesini tetikle (Korumayı aşar)
        calHizliCitSesi(); 
    } catch (e) {
        console.log("Ses uyandırılırken hata atlandı:", e);
    }

    // Butonun asıl yapması gereken çark döndürme işlevleri kesintisiz devam eder
    secenekler = options;
    spinAngleIncrement = Math.random() * 15 + 30; // Başlangıç fırlatılma hızı
    rotateAnimation();
}


function stopWheel() {
    cancelAnimationFrame(spinTimeout);
    
    // --- GÜVENLİK: Çark tam durduğu an yapay ses motorunun tıklarını tamamen kes ---
    if (audioCtx && audioCtx.state === 'running') {
        // Ses motorunu geçici olarak askıya alıyoruz ki çıt çıt sesleri tamamen dursun
        audioCtx.suspend(); 
    }

    let arc = (Math.PI * 2) / secenekler.length;
    let degrees = (startAngle * 180 / Math.PI) % 360;
    if (degrees < 0) degrees += 360;
    
    let relativeDegrees = (360 - degrees) % 360;
    
    let index = Math.floor(relativeDegrees / (arc * 180 / Math.PI));
    index = (index + secenekler.length) % secenekler.length;
    
    // Kazanan modalını aç
    openResultModal(secenekler[index], secenekler);
}




// 6. Sonuç Ekranı (Pop-up Modal)
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

// 7. Yeni Seçenek Ekleme Butonu
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

// İlk yüklemedeki 3. kutunun çarpı butonunu çalıştırır
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

// Çarkı Döndür Ana Butonu
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

// Dil Ayarı Buton Olayları
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

// Başlangıç Kurulumları
uiGuncelle();
drawWheel(getInputs());
