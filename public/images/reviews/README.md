# Review Fotoğrafları

Bu klasöre müşteri fotoğrafları gelir.

## ⚠️ ÖNEMLİ — AVG/GDPR

Hollanda'da bir kişinin fotoğrafını web sitende yayınlamadan önce **yazılı onayı** şarttır. WhatsApp'tan basit bir mesaj yeterli:

> "Merhaba [isim], alfareclame.nl sitesinde senin yorumunu ve fotoğrafını kullanabilir miyim? Tamam dersen hemen güzel görünsün diye ekleyeceğim 🙏"

Onayı mutlaka sakla (screenshot al, ileride sorulursa).

## Nasıl ekleyeyim?

1. Fotoğrafı buraya yükle (GitHub web arabiriminden)
2. Dosya adı: `isim.jpg` (örn: `mehmet-celik.jpg`, `paolo.jpg`)
3. `data/reviews.json` içinde ilgili review'un `photo` alanını güncelle:
   ```json
   "photo": "/public/images/reviews/mehmet-celik.jpg"
   ```
4. Commit — site 1-2 dakika içinde güncellenir

## Format önerileri

- **Format:** JPG veya WebP
- **Boyut:** 400x400 px (kare)
- **Dosya boyutu:** maks. 50KB (optimize et)
- **İçerik:** yüz + omuz, gündüz ışığı tercih

## Fotoğraf yoksa?

`photo` alanını boş bırak (`"photo": ""`). Site otomatik olarak isim baş harflerini kullanarak güzel bir avatar gösterir. Onay gelene kadar bu seçenek iyi bir geçici çözüm.
