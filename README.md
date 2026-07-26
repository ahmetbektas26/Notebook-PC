# Notebook-PC

Notebook-PC; günlük hayatı planlamak, kişisel hedefleri takip etmek, yazılı ve
sesli not almak, takvim alarmları kurmak ve okul işlerini ayrı bir alanda
düzenlemek için hazırlanmış çevrimdışı bir masaüstü uygulamasıdır.

## Özellikler

- Tamamen boş ve kişisel bilgi içermeyen başlangıç
- Günlük görevler, planlar ve hızlı notlar için **Bugün** ekranı
- Günlere tıklayarak görev, plan, hedef veya not eklenebilen aylık takvim
- İlerleme yüzdesi ve bitiş tarihi bulunan kişisel hedefler
- 25 dakikalık yerleşik odak sayacı
- Okuldan bağımsız Markdown destekli genel not defteri
- Genel ve okul notlarına çoklu PDF ekleme ve sürükle-bırak
- Uygulama içi PDF okuyucu, sayfa üzerinde altını çizme ve sayfaya açıklama bağlama
- Not, PDF adı/açıklaması, hedef, takvim ve dersleri kapsayan genel arama
- Hazır ve kullanıcı tarafından oluşturulabilen not şablonları
- Tamamlama oranı, odak süresi ve haftalık düşünce alanı bulunan haftalık değerlendirme
- Etiketleme ve favorilere alma
- Mikrofonla sesli not kaydetme ve oynatma
- Gün/saat seçilebilen tek seferlik, günlük veya haftalık masaüstü alarmları
- Ders notları ve ortalama araçları için günlük hayattan ayrılmış **Okul** modülü
- Okul modülünde Doğuş Üniversitesi harf notu ve 4.00 katsayı tablosu
- AKTS ağırlıklı dönem, tahmini genel ve hedef mezuniyet ortalaması
- Alarmların kaçmaması için Windows ile arka planda otomatik başlatma
- Açık/koyu tema
- JSON, Markdown, CSV ve PDF içe/dışa aktarma
- Şifreli yerel kasa, uygulama kilidi ve otomatik kilitleme
- Tamamen yerel veri saklama; hesap veya internet gerektirmez

## Windows'a kurma

GitHub'daki **Actions → Windows kurulum dosyası → Run workflow** yolunu izleyin.
İşlem tamamlandığında çalışmanın altındaki `Notebook-PC-Windows` dosyasını
indirin, ZIP'i açın ve `Notebook-PC-Setup-1.3.0.exe` dosyasını çalıştırın.

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
klasöründe; ses kayıtlarını `recordings/`, PDF eklerini `attachments/`
klasöründe saklar. Yerel kasa etkinleştirildiğinde veri dosyası, sesler ve
PDF'ler AES-256-GCM ile şifrelenir. Tam konumu uygulamanın **Ayarlar → Yerel
veri alanı** bölümünde görebilirsiniz.

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
