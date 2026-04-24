# Saha CRM - Agent Guide

Bu repo artik genel kullanima uygun, offline-first calisan bir **Saha CRM** mobil uygulamasidir. Uygulama belirli bir marka, kisi, ajans veya tek bir sektor icin degil; sahada musteri takip eden herkesin kendi telefonunda lokal kullanabilecegi sade bir CRM olarak gelistirilir.

## Urun Amaci

Saha CRM, internet veya sunucu zorunlulugu olmadan Android cihazda musteri, gorusme, ziyaret, teklif, tahsilat, gorev ve takip kayitlarini tutmak icin tasarlanir.

Hedef kullanicilar:

- Saha satis ekipleri
- Sigorta, emlak, servis, teknik destek ve bayi ekipleri
- Tek basina calisan temsilciler
- Kucuk isletmelerin musteri takip sorumlulari

Temel prensip:

- Her kullanici uygulamayi kendi cihazinda kullanir
- Veriler cihaz icinde SQLite ile saklanir
- Hesap, giris ekrani, backend ve cloud sync yoktur
- Internet olmadan calisir
- Yedekleme ve veri aktarimi export/import ile yapilir

## Bu Uygulama Ne Degil

- ERP degil
- Muhasebe programi degil
- Stok yonetimi degil
- Cok kullanicili ekip paneli degil
- Web dashboard degil
- Zorunlu abonelik veya hesap sistemi degil

## Tech Stack

| Katman | Teknoloji |
| --- | --- |
| Framework | React Native CLI |
| Dil | TypeScript |
| Stil | NativeWind |
| Navigation | React Navigation |
| Veritabani | SQLite (`react-native-quick-sqlite`) |
| State | Zustand |
| Form | React Hook Form + Zod |
| Ikon | react-native-vector-icons |
| Export | JSON ve Excel |

Expo, Firebase, Supabase, backend auth, zorunlu cloud sync ve web-only cozumler kullanilmaz.

## Urun Kapsami

Ilk genel surum su alanlara odaklanir:

- Musteri listesi
- Musteri detay sayfasi
- Gorusme, ziyaret ve not gecmisi
- Gorev ve takip tarihi
- Teklif / satis durumu
- Tahsilat veya odeme notu
- Arama ve filtreleme
- Excel / JSON disa aktarma
- JSON ice aktarma ile manuel yedek geri yukleme

Gelecekte eklenebilecek ama ilk kapsam disinda tutulacak konular:

- Push notification
- Google Drive / iCloud yedek
- Cok cihaz senkronizasyonu
- Ekip yonetimi
- Play Store urunlestirme
- Sektor bazli hazir sablonlar

## Dil ve Metin Kurallari

Kullanici arayuzu ana dil olarak Turkce yazilir. Ingilizce ceviri varsa korunabilir ama yeni ana metinler once Turkce dusunulur.

Turkce kullanici metinlerinde dogru Turkce karakter kullan:

- musteri degil, **müşteri**
- gorusme degil, **görüşme**
- tahsilat, teklif, ziyaret, takip gibi terimler net yazilir

Kod, dosya adi, teknik identifier ve migration alanlarinda ASCII tercih edilebilir.

## Marka ve Isimlendirme

Yeni genel urun adi:

- Kullaniciya gorunen ad: **Saha CRM**
- Paket/proje ismi kademeli olarak `saha-crm` yonune tasinabilir
- Eski `Mini CRM`, `lightmodedesign`, kisiye veya musteriye ozel referanslar yeni islerde kullanilmaz

Degisim yaparken once kullaniciya gorunen metinleri sade sekilde genellestir. Paket adi veya Android applicationId gibi daha riskli alanlar ayrica ele alinmali.

## Veri Modeli Beklentisi

Mevcut SQLite tabanli model korunur ve genellestirilir. Yeni alan eklenirken migration yazilir, mevcut kullanici verisi bozulmaz.

Ana varliklar:

- `customers`: musteri ve firma bilgileri
- `activities`: gorusme, ziyaret, teklif, not, tahsilat, takip gibi gecmis kayitlari
- `terms` veya gelecekte `tasks`: takip edilecek tarihli isler

Son islem bilgisi ayri bir kalici alan olarak tutulmaz. Musterinin son islemi aktivite gecmisinden turetilir.

## Aktivite Turleri

Genel saha kullanimina uygun aktivite turleri tercih edilir:

- Görüşme
- Ziyaret
- Arama
- WhatsApp
- Teklif gönderildi
- Teklif kabul edildi
- Teklif reddedildi
- Tahsilat
- Takip eklendi
- Not

Sektor ozel terimler dogrudan cekirdege eklenmez. Gerekirse ayarlanabilir liste veya sablon mantigi dusunulur.

## UI / UX Yonlendirmesi

Uygulama sahada hizli kullanilacak. Tasarim guzel ama gosteris odakli olmamali.

Oncelikler:

- Hızlı müşteri bulma
- Tek elle rahat kullanim
- Buyuk dokunma alanlari
- Az adimla aktivite ekleme
- Liste ve detay ekranlarinda okunabilirlik
- Offline kullanimda guven hissi
- Export/import aksiyonlarinda net geri bildirim

Kacin:

- Pazarlama landing sayfasi gibi buyuk hero alanlari
- Gereksiz animasyon ve dekor
- Sadece gorsellik icin bilgi yogunlugunu azaltmak
- Sahada yavaslatacak cok adimli akislardan

## Kodlama Kurallari

- Mevcut React Native, Zustand, repository ve SQLite patternlerine uy
- Yeni ozelliklerde migration dusun
- Kullanici verisini silebilecek islerde onay ve geri bildirim kullan
- Form validasyonlarini Zod ile tut
- Tarihleri ISO string olarak sakla, ekranda locale ile formatla
- TypeScript tiplerini acik ve dar tut
- Gereksiz buyuk refactor yapma

## Android Release Notu

APK uretimi icin mevcut komut:

```bash
npm run apk:release
```

Gradle release ciktisi:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Repo kokunde kullaniciya kolay verilecek dosya adi:

```text
mini-crm-release.apk
```

Bu dosya adi ileride `saha-crm-release.apk` olarak degistirilebilir. Dosya adi degisimi yapilacaksa build, dokuman ve kullaniciya verilen yol birlikte guncellenmelidir.

## Git / Remote Notu

Bu klasor iki GitHub reposuna bagli olabilir:

- `origin`: eski `mini-crm` reposu
- `saha`: yeni `saha-crm` reposu

Yeni genel Saha CRM calismalari icin push hedefi:

```bash
git push saha main
```

Eski repo korunacaksa `origin` remote'u silinmez veya uzerine yazilmaz.

## Ajan Davranisi

Bu repoda calisan ajan:

- Projeyi genel Saha CRM olarak ele alir
- Mini CRM veya musteriye ozel ifadeleri yeni islerde cogaltmaz
- Lokal/offline calisma prensibini bozmaz
- Backend, auth veya cloud sync eklemeden once kullanicidan net onay alir
- Kullanici komutlari kendisi calistirmak istediginde komutlari verir, calistirmaz
- APK istenirse build eder; ama kullanici "ben calistiracagim" derse sadece komutlari yazar

## Kisa Urun Cümlesi

Saha CRM, sahada çalışan kişilerin müşteri ve takip işlerini internet olmadan kendi telefonlarında düzenli tutmasını sağlayan sade, lokal ve pratik bir mobil CRM uygulamasıdır.
