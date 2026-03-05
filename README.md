# 🏥 Informacioni sistem privatne klinike

Informacioni sistem privatne specijalističke klinike namenjen je digitalizaciji i automatizaciji ključnih procesa rada klinike: prijem pacijenata, zakazivanje i realizacija pregleda, vođenje medicinske dokumentacije, naplata usluga i upravljanje resursima (lekari, ordinacije, termini).

Sistem je namenjen **administratorima/recepciji**, **lekarima** i **menadžmentu klinike**, uz mogućnost proširenja za pacijentski portal.

---

## Sadržaj

1. [Korisnici i pristup sistemu](#1-korisnici-i-pristup-sistemu)
2. [Evidencija pacijenata](#2-evidencija-pacijenata)
3. [Upravljanje lekarima i uslugama](#3-upravljanje-lekarima-i-uslugama)
4. [Zakazivanje termina (kalendar)](#4-zakazivanje-termina-kalendar)
5. [Obaveštenja i podsetnici](#5-obaveštenja-i-podsetnici)
6. [Realizacija pregleda i medicinska dokumentacija](#6-realizacija-pregleda-i-medicinska-dokumentacija)
7. [Naplata, računi i fiskalizacija](#7-naplata-računi-i-fiskalizacija)
8. [Izveštaji i analitika za menadžment](#8-izveštaji-i-analitika-za-menadžment)
9. [Administracija i šifarnici](#9-administracija-i-šifarnici)
10. [Pacijentski portal (opciono proširenje)](#10-pacijentski-portal-opciono-proširenje)

---

## 1. Korisnici i pristup sistemu

- Registracija i upravljanje korisničkim nalozima (`admin`, `recepcija`, `lekar`, `menadžer`)
- Prijava/odjava korisnika, promena lozinke
- Uloge i prava pristupa *(npr. lekar vidi samo svoje termine i pacijente, recepcija ne menja medicinski izveštaj)*
- Evidencija aktivnosti (log) nad ključnim podacima *(npr. ko je izmenio termin ili nalaz)*

---

## 2. Evidencija pacijenata

- Unos i ažuriranje kartona pacijenta *(lični podaci, kontakt, osiguranje/plaćanje, napomene)*
- Pretraga pacijenata po imenu, JMBG/ID, telefonu, email-u
- Evidencija alergija i važnih upozorenja *(npr. hronične bolesti, terapije)*
- Pregled istorije poseta i prethodnih nalaza

---

## 3. Upravljanje lekarima i uslugama

- Evidencija lekara *(specijalizacija, radno vreme, kontakt, status aktivan/neaktivan)*
- Definisanje kataloga usluga *(naziv usluge, trajanje, cena, specijalizacija, opis)*
- Mapiranje usluga na specijaliste *(ko može da radi koju uslugu)*
- Evidencija ordinacija/kabineta *(naziv, lokacija, oprema, dostupnost)*

---

## 4. Zakazivanje termina (kalendar)

- Kreiranje termina za pregled/konzultaciju *(pacijent, lekar, usluga, datum/vreme, ordinacija)*
- Pregled kalendara po lekaru, po ordinaciji i po danu/nedelji/mesecu
- Automatska provera konflikta termina *(lekar i ordinacija ne mogu biti zauzeti u isto vreme)*
- Promena termina (re-scheduling) uz evidentiranje razloga promene
- Otkazivanje termina sa statusom:
  - `otkazao pacijent`
  - `otkazala klinika`
  - `nije se pojavio`
- Lista čekanja (waiting list) – *opcionalno, za popunjavanje slobodnih termina*

---

## 5. Obaveštenja i podsetnici

- Slanje podsetnika pacijentima za zakazani termin *(SMS/email – ili kao simulacija u projektu)*
- Notifikacije lekaru o dnevnom rasporedu
- Podsetnici za kontrole *(automatski predlog kontrolnog termina po preporuci lekara)*

---

## 6. Realizacija pregleda i medicinska dokumentacija

- Otvaranje pregleda iz zakazanog termina i vođenje zapisa pregleda
- Unos anamneze, simptoma, dijagnoze, preporuke i terapije
- Unos nalaza i zaključka *(slobodan tekst + strukturisana polja)*
- Evidencija propisane terapije *(lek, doza, učestalost, trajanje)*
- Evidencija upućivanja na dodatne analize ili specijalističke preglede
- Kreiranje i štampa medicinskog izveštaja *(PDF/print varijanta)*
- Prikaz istorije medicinskih izveštaja pacijenta

---

## 7. Naplata, računi i fiskalizacija

> *Na nivou projekta – fiskalizacija može biti samo kao napomena/placeholder.*

- Formiranje računa na osnovu obavljene usluge ili više usluga
- Podrška za više načina plaćanja: **gotovina**, **kartica**, **virman**
- Evidencija popusta i akcija *(npr. 10% za paket usluga)*
- Evidencija statusa naplate:
  - `plaćeno`
  - `neplaćeno`
  - `delimično`
- Štampa računa i izveštaj o dnevnom prometu

---

## 8. Izveštaji i analitika za menadžment

- Izveštaj o broju pregleda po lekaru, periodu i usluzi
- Izveštaj o prihodima po periodu *(dan / nedelja / mesec)* i po usluzi
- Izveštaj o otkazanim terminima i „no-show" pacijentima
- Pregled popunjenosti ordinacija i opterećenosti lekara
- Lista najtraženijih usluga i trendovi *(osnovna statistika)*

---

## 9. Administracija i šifarnici

- Upravljanje šifarnicima: specijalizacije, usluge, dijagnoze (osnovno), ordinacije
- Podešavanje radnog vremena klinike i neradnih dana *(praznici, kolektivni odmor)*
- Arhiviranje/neaktiviranje pacijenata ili zaposlenih *(bez brisanja podataka)*

---

## 10. Pacijentski portal *(opciono proširenje)*

- Pacijent vidi svoje zakazane termine i istoriju poseta
- Pacijent može podneti zahtev za termin *(odobrenje od recepcije)*
- Pacijent može preuzeti izveštaj ili potvrdu o pregledu *(ako klinika dozvoli)*
- Kanal za poruke *(pitanje recepciji / lekaru)* – kao osnovna funkcionalnost
