# Notebook-PC test rehberi

## Otomatik kalite kapısı

```bash
npm ci
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

`npm test` iki katmanı birlikte çalıştırır:

- React/DOM testleri: ana modüller, kullanıcı formları, şifre alanı, PDF,
  sesli not, ders/not silme ilişkileri, içe/dışa aktarma hata yolları, bozuk
  yedek normalleştirme ve akademik hesap sınırları
- Node testleri: AES-256-GCM kasa motoru, otomatik kilit sınırları ve
  tekrarlanan alarm tarihleri

## Windows kurulum kontrolü

GitHub Actions'ın ürettiği kurulum dosyasında her sürüm için şu kısa kontrol
uygulanmalıdır:

1. Temiz kurulumda uygulamanın boş veriyle açıldığını doğrula.
2. Kişisel not oluştur; PDF ekle ve ses kaydı izni akışını kontrol et.
3. Takvimde saatli, günlük veya haftalık bir alarm oluştur.
4. Okul alanında ders ve AKTS/harf notu ekleyip ortalamayı kontrol et; dersi
   silince bağlı notun kişisel deftere taşındığını doğrula.
5. JSON yedeği al; Markdown, CSV ve PDF dışa aktarımını dene.
6. Yerel kasayı etkinleştir, **Şimdi kilitle** seçeneğine bas ve şifreyi
   klavye, yapıştırma ve Enter ile dene.
7. Yanlış şifrenin alanı temizlediğini; doğru şifrenin verileri açtığını
   doğrula.
8. Uygulamayı kapatıp sistem tepsisinden yeniden aç; otomatik kilidi ve
   verilerin kalıcılığını kontrol et.

## Güvenlik denetimi

Üretim bağımlılıkları `npm audit --omit=dev` ile denetlenir. Kurulum üretim
araçlarındaki geliştirme bağımlılığı uyarıları ayrıca değerlendirilir; kırıcı
`npm audit fix --force` değişiklikleri incelemeden uygulanmaz.
