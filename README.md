# Notebook-PC

Notebook-PC; dersleri ve konuları düzenlemek, yazılı ve sesli not almak, çalışma
alarmları kurmak ve Doğuş Üniversitesi'nin AKTS ağırlıklı sistemine göre not
ortalaması hesaplamak için hazırlanmış çevrimdışı bir masaüstü uygulamasıdır.

## Özellikler

- Ders → konu → not düzeni
- Markdown destekli yazılı not editörü ve önizleme
- Etiketleme, arama ve favorilere alma
- Mikrofonla sesli not kaydetme ve oynatma
- Gün/saat seçilebilen tek seferlik, günlük veya haftalık masaüstü alarmları
- Alarmların kaçmaması için Windows ile arka planda otomatik başlatma seçeneği
- Doğuş Üniversitesi harf notu ve 4.00 katsayı tablosu
- AKTS ağırlıklı dönem ortalaması ve tahmini genel ortalama
- Mezuniyet AKTS'sine göre hedef GANO için gereken ortalamayı hesaplama
- Açık/koyu tema
- JSON yedeği dışa aktarma ve geri yükleme
- Tamamen yerel veri saklama; hesap veya internet gerektirmez

## Windows'a kurma

GitHub'daki **Actions → Windows kurulum dosyası → Run workflow** yolunu izleyin.
İşlem tamamlandığında çalışmanın altındaki `Notebook-PC-Windows` dosyasını
indirin, ZIP'i açın ve `Notebook-PC-Setup-1.0.0.exe` dosyasını çalıştırın.

Yerelde kurulum dosyası üretmek için:

```bash
npm install
npm run dist:win
```

Kurulum dosyası `release/` klasöründe oluşur.

## Geliştirme

Node.js 22 veya daha güncel bir sürüm gereklidir.

```bash
npm install
npm run dev
```

Kontroller:

```bash
npm run typecheck
npm test
npm run build
```

## Veriler nerede tutulur?

Electron uygulaması verileri işletim sisteminin standart uygulama verisi
klasöründeki `notebook-data.json` dosyasında, ses kayıtlarını ise aynı klasörün
altındaki `recordings/` klasöründe saklar. Tam konumu uygulamanın
**Ayarlar → Yerel veri alanı** bölümünde görebilirsiniz.

## Not sistemi

| Puan | Harf | Katsayı |
|---:|:---:|---:|
| 95–100 | A+ | 4.00 |
| 90–94 | A | 3.75 |
| 85–89 | B+ | 3.50 |
| 75–84 | B | 3.00 |
| 65–74 | C+ | 2.50 |
| 55–64 | C | 2.00 |
| 45–54 | D+ | 1.50 |
| 40–44 | D | 1.00 |
| 0–39 | F | 0.00 |

## Lisans

MIT
