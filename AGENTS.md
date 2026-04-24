# Saha CRM Agent Guide

Bu dosya sadece bu proje icindir:

```text
/Users/zumra/Developer/mini-crm
```

Urun yonu artik **Saha CRM**'dir. Bu repo React Native CLI ile yazilmis, offline-first calisan genel bir saha CRM mobil uygulamasidir. Hedef, tek sektore kilitlenmeyen; satis, servis, emlak, sigorta, bayi, teknik destek ve kucuk isletme ekiplerinin kullanabilecegi sade ama ciddi bir mobil CRM yapmaktir.

## Urun Konumlandirmasi

Saha CRM, kullanicinin telefonunda musteri, gorusme, ziyaret, teklif, tahsilat, not ve takip islerini duzenli tutmasini saglar.

Temel kararlar:

- Kullaniciya gorunen ana urun adi **Saha CRM** olacaktir.
- Veriler cihaz icinde SQLite ile saklanir.
- Uygulama internet olmadan calisabilmelidir.
- Backend, zorunlu hesap, giris sistemi, cloud sync veya web panel varsayilan kapsama alinmaz.
- Yedekleme ve tasima isleri export/import ile yapilir.
- Sektor ozel akislari cekirdege gomulmez; etiket, durum ve aktivite turleri ile esneklik saglanir.
- Mevcut kullanici verisini bozabilecek degisiklikler migration ve geri uyumluluk dusunulmeden yapilmaz.

## Hedef Kullanici

- Saha satis ekipleri
- Sigorta ve emlak danismanlari
- Teknik servis ve destek ekipleri
- Bayi ve distribitor temsilcileri
- Kucuk isletmelerin musteri takip sorumlulari
- Tek basina calisan satis veya hizmet profesyonelleri

## Urun Ilkeleri

- Hız: Musteri bulma ve aktivite ekleme cok az adimla yapilir.
- Guven: Offline calisma, lokal veri ve net yedekleme hissi korunur.
- Sadelik: Kurumsal CRM karmasasi tasinmaz.
- Genellik: Tek bir sektorun dili veya is akisi uygulamaya egemen olmaz.
- Devamlilik: Musteri gecmisi her zaman okunabilir ve takip edilebilir olur.

## Ajanin Yapacaklari

- Yeni islerde once mevcut kod yapisini okuyacak.
- Projeyi Saha CRM olarak ele alacak; yeni kullanici metinlerinde bu adi kullanacak.
- React Native, TypeScript, Zustand, repository ve SQLite patternlerine uyacak.
- UI metinlerini Turkce ve kullanici icin net yazacak.
- Form validasyonlarini Zod ile tutacak.
- Yeni veri alani gerekiyorsa migration etkisini dusunecek.
- Liste, detay, modal ve store akislarini mevcut yapida gelistirecek.
- Kullanici verisini silebilecek her islemde onay ve anlasilir geri bildirim kullanacak.
- Degisiklikten sonra mumkunse `npm test` veya ilgili kontrol komutunu calistiracak.
- APK istenirse mevcut scriptleri kullanacak.

## Ajanin Yapmayacaklari

- Kullanici acikca istemeden backend, auth, Firebase, Supabase veya cloud sync eklemeyecek.
- Expo'ya tasimayacak.
- Gereksiz buyuk refactor yapmayacak.
- Mevcut UI dilini ve proje stilini bir anda dagitmayacak.
- Kullaniciya ait veriyi silebilecek komutlari onaysiz calistirmayacak.
- Eski ve ilgisiz dosyalari temizliyorum diye silmeyecek.
- Sektor ozel kelimeleri cekirdek modele kalici olarak dayatmayacak.

## Tech Stack

| Alan | Teknoloji |
| --- | --- |
| Framework | React Native CLI |
| Dil | TypeScript |
| Stil | NativeWind |
| Navigation | React Navigation |
| Veritabani | react-native-quick-sqlite |
| State | Zustand |
| Form | React Hook Form + Zod |
| Test | Jest |

## Sprint Plani

### Sprint 1 - Urun Kimligi ve Temel Temizlik

Hedef: Uygulamayi Mini CRM kalintilarindan kademeli olarak Saha CRM yonune almak.

Yapilacaklar:

- Kullaniciya gorunen app adi, basliklar ve ana metinlerde **Saha CRM** dilini kullan.
- Eski marka, kisi, ajans veya tek sektore ait metinleri temizle.
- `tr.json` ve `en.json` cevirilerini gozden gecir.
- Ana ekran, hakkinda, ayarlar ve bos durum metinlerini genel CRM diline cek.
- Riskli paket adi, Android applicationId veya iOS bundle degisikliklerini ayri is olarak planla.

Kabul kriteri:

- Kullanici uygulamada Mini CRM yerine Saha CRM algisini gorur.
- Offline ve lokal calisma vaadi metinlerde netlesir.
- Testler mevcut seviyede gecmeye devam eder.

### Sprint 2 - Musteri Karti ve Liste Deneyimi

Hedef: Musteri bulma ve musteri kartini genel sektorlere uygun hale getirmek.

Yapilacaklar:

- Musteri liste kartlarini okunakli ve hizli taranabilir hale getir.
- Arama alanini ad, firma, telefon ve not uzerinden guclendir.
- Musteri durumlari icin genel ifadeler kullan: yeni, aktif, takipte, pasif gibi.
- Etiket yapisi gerekiyorsa veri modeli etkisini planla.
- Musteri ekleme/duzenleme formunda zorunlu alanlari sade tut.

Kabul kriteri:

- Kullanici kalabalik listede musteriye hizli ulasir.
- Musteri karti herhangi bir sektore ozel hissettirmez.
- Mevcut musteriler veri kaybi olmadan gorunur.

### Sprint 3 - Musteri Gecmisi ve Aktivite Akisi

Hedef: CRM'in kalbini, yani musteriyle ne yasandigini net gosteren gecmisi guclendirmek.

Yapilacaklar:

- Aktivite turlerini genel saha kullanimina gore netlestir: görüşme, ziyaret, arama, WhatsApp, teklif, tahsilat, takip, not.
- Musteri detayinda aktivite gecmisini kronolojik ve okunabilir hale getir.
- Aktivite ekleme akisinda az adim, net tur secimi ve hizli not girisi sagla.
- Son islem bilgisini aktivite gecmisinden turet; gereksiz kopya kalici alan ekleme.
- Aktivite silme veya duzenleme varsa kullaniciya net geri bildirim ver.

Kabul kriteri:

- Kullanici bir musteriye girince son durumu saniyeler icinde anlar.
- Yeni aktivite eklemek sahada hizli yapilir.
- Aktivite turleri genel CRM kullanimi icin yeterlidir.

### Sprint 4 - Takipler, Gorevler ve Ana Ekran

Hedef: Kullanici uygulamayi actiginda bugun ne yapacagini hemen gorsun.

Yapilacaklar:

- Bugunku takipler, geciken takipler ve yaklasan takipleri ana ekranda one cikar.
- Takip tarihi olan aktiviteler veya mevcut `terms` yapisi arasinda net urun karari ver.
- Takip listesinde musteriye hizli gecis sagla.
- Tamamlandi, ertelendi veya iptal edildi durumlarini sade kurgula.
- Bildirim varsa offline/local notification olarak ele al; push notification varsayma.

Kabul kriteri:

- Ana ekran bir ozet panel gibi calisir.
- Kullanici bugunku islerini ayri arama yapmadan gorur.
- Takip akisi backend gerektirmez.

### Sprint 5 - Yedekleme, Export ve Import

Hedef: Lokal uygulamada veri guveni saglamak.

Yapilacaklar:

- JSON yedek alma ve geri yukleme akislarini netlestir.
- Excel export alanlarini kullanici icin anlasilir kolonlarla duzenle.
- Import oncesinde veri etkisi ve olasi cakisma durumunu acikla.
- Basarili/basarisiz yedekleme geri bildirimlerini iyilestir.
- Gerekirse ornek yedek dosya surum bilgisi ekle.

Kabul kriteri:

- Kullanici verisini disari alabilecegini ve geri yukleyebilecegini anlar.
- Export dosyasi islenebilir ve okunabilir olur.
- Import mevcut veriyi sessizce bozmaz.

### Sprint 6 - Ayarlar, Ozellestirme ve Genel Kullanima Hazirlik

Hedef: Farkli sektorlerin uygulamayi kendi is diline yaklastirmasini saglamak.

Yapilacaklar:

- Aktivite turleri, musteri durumlari veya etiketler icin ayarlanabilirlik ihtiyacini degerlendir.
- Tema, dil ve veri yedekleme ayarlarini sade tut.
- Hakkinda/gizlilik ekranlarini lokal veri prensibine gore guncelle.
- Bos durumlar ve hata ekranlarinda urun dilini tutarli hale getir.
- Android release akisini dokumante et.

Kabul kriteri:

- Uygulama tek bir sektorun uygulamasi gibi hissettirmez.
- Ayarlar ekrani sade ama guven verici olur.
- Release icin temel dokumantasyon hazirdir.

### Sprint 7 - Kalite, Performans ve Release

Hedef: Saha CRM'i genel kullanim icin daha stabil hale getirmek.

Yapilacaklar:

- Liste performansini ve buyuk veri davranisini kontrol et.
- Kritik ekranlarda loading, empty, error durumlarini tamamla.
- Jest testlerini urun akislarini kapsayacak kadar genislet.
- Android release build al.
- APK dosya adini urun yonune gore degerlendir: `saha-crm-release.apk`.

Kabul kriteri:

- Temel testler gecer.
- Release APK uretilir.
- Kritik kullanici akislari veri kaybi veya crash olmadan calisir.

## Onemli Komutlar

```bash
npm test
npm run lint
npm run android
npm run apk:release
```

Release APK ciktisi:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Repo kokundeki mevcut kolay paylasim dosyasi:

```text
mini-crm-release.apk
```

Saha CRM yonunde release isimlendirmesi yapilacaksa hedef:

```text
saha-crm-release.apk
```

## Kodlama Kurallari

- TypeScript tiplerini dar ve acik tut.
- Tarihleri veride ISO string olarak sakla, ekranda locale ile formatla.
- Repository katmanini atlayip ekran icinden dogrudan SQL yazma.
- Store mantigini ekranlara dagitma; mevcut Zustand store yapisini kullan.
- UI bilesenlerinde mevcut `src/components/ui` parcalarini tercih et.
- Yeni metin eklerken `src/i18n/translations/tr.json` ve gerekiyorsa `en.json` dosyalarini guncelle.
- Kullaniciya gorunen Turkce metinlerde dogru karakter kullan: musteri degil `müşteri`, gorusme degil `görüşme`.

## Dosya Yapisi Ipuclari

- Ekranlar: `src/screens`
- Modal formlar: `src/modals`
- UI parcaciklari: `src/components/ui`
- Musteri bilesenleri: `src/components/customer`
- Aktivite bilesenleri: `src/components/activity`
- Takip bilesenleri: `src/components/term`
- Store dosyalari: `src/store`
- Repository dosyalari: `src/repositories`
- SQLite init/migration: `src/db`
- Ceviriler: `src/i18n/translations`

## Is Yapma Sirasi

1. Kullanici istegini Saha CRM kapsaminda yorumla.
2. Ilgili dosyalari oku.
3. En kucuk dogru degisikligi yap.
4. Test veya tip/lint kontrolu calistir.
5. Sonucta hangi dosyalarin degistigini ve kontrol sonucunu kisa yaz.

## Git ve Push Notu

Bu klasor iki remote icerebilir:

- `origin`: eski `mini-crm` deposu
- `saha`: yeni `saha-crm` deposu

Saha CRM urun yonundeki calismalar icin hedef:

```bash
git push saha main
```

`origin` remote'u kullanicidan acik istek gelmeden degistirilmez veya silinmez.

## Kisa Urun Cumlesi

Saha CRM, sahada calisan ekiplerin ve kucuk isletmelerin musteri gecmisi, takipleri ve satis aktivitelerini internet olmadan telefonda duzenli tutmasini saglayan lokal bir mobil CRM uygulamasidir.
