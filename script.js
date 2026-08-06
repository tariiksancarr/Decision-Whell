let kararBtn = document.getElementById("kararverbtn");
let sonucYazisi = document.getElementById("sonucYazisi");
let music = document.getElementById("audio");

kararBtn.addEventListener("click", function() {
    let s1 = document.getElementById("optionInput1").value;
    let s2 = document.getElementById("optionInput2").value;
    let s3 = document.getElementById("optionInput3").value;

    if (s1 === "" || s2 === "" || s3 === "") {
        sonucYazisi.textContent = "Lütfen 3 seçeneği de doldurun.";
        return;
    }

    let secenekler = [s1, s2, s3];
    let rastgeleSecenek = secenekler[Math.floor(Math.random() * secenekler.length)];

    sonucYazisi.textContent = "Seçilen seçenek: " + rastgeleSecenek;
    document.getElementById("result").textContent = "Seçilen seçenek: " + rastgeleSecenek;

    music.volume = 1.0;
    music.play();
});

