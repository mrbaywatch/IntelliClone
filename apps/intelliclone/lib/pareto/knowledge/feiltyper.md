# Vanlige feiltyper i forsikringsdokumenter

## 1. 🔴 Promille vs prosent (KRITISK)

### Beskrivelse
Feil enhet brukt i rateberegning — gir 10× feil premie.

### Hvordan oppdage
```
1. Beregn premie med begge enheter
2. Sammenlign med fjorårets premie
3. Er endringen rimelig? (>50% endring = rødt flagg)
```

### Eksempel
```
Avtalt rate: 1,1933‰
Sum: 1 500 000 000

Korrekt (‰): 1 500 000 000 × 0,0011933 = 1 789 950
Feil (%):    1 500 000 000 × 0,011933  = 17 899 500

Differanse: 16 109 550 kr (!) 
```

---

## 2. 🔴 Endringer ikke utført

### Beskrivelse
Avtalte endringer er ikke implementert i fornyelsesdokumentet.

### Vanlige tilfeller
- Avtalt økning/reduksjon i forsikringssum ikke gjennomført
- Ny loss limit ikke oppdatert
- Geografisk utvidelse ikke tatt inn
- Ny rate ikke anvendt

### Hvordan oppdage
1. Lag liste over alle avtalte endringer fra e-post/referat
2. Sjekk punkt for punkt i dokumentet
3. Marker "Utført" eller "Mangler"

---

## 3. 🟡 Feil indeksregulering

### Beskrivelse
Feil indekssats brukt, eller indeksert poster som ikke skal indekseres.

### Vanlige tilfeller
| Feil | Konsekvens |
|------|------------|
| Avbrudd indeksregulert | Overpris |
| Varer indeksregulert | Overpris |
| Feil indekssats brukt | Over/underpris |
| Glemte å indeksregulere | Underforsikring |

### Gjeldende indekser 2026
- Bygninger: +2,3%
- Maskin/løsøre: +4,1%
- Varer: 0%
- Avbrudd: 0%

### Hvordan oppdage
```
1. Identifiser type (bygg, maskin, varer, avbrudd)
2. Sjekk om sum har økt med korrekt %
3. Flagg avvik fra forventet
```

---

## 4. 🟡 Naturskadepremie uklart

### Beskrivelse
Uklart om naturskadepremie (0,08‰) er inkludert i postpremie eller kommer separat.

### Symptom
Premien er ~0,08‰ høyere enn forventet basert på avtalt rate.

### Hvordan oppdage
```
1. Beregn forventet premie: Sum × Rate
2. Legg til naturskade: Sum × 0,00008
3. Sammenlign med dokument
4. Hvis dokument = forventet + naturskade: Inkludert
```

### Eksempel
```
Sum: 1 500 000 000
Avtalt rate: 1,1933‰

Forventet: 1 789 950
Naturskade: 120 000
Totalt: 1 909 950

I dokument: 1 909 950 → Naturskade er inkludert
```

---

## 5. 🟡 Fritekst/vilkår mangler

### Beskrivelse
Avtalte tilleggstekster eller spesielle vilkår er ikke tatt inn i polisen.

### Vanlige tilfeller
- Presiseringer om dekning mangler
- Geografiske utvidelser ikke notert
- Spesielle unntak ikke dokumentert
- Fravikelser fra standard mangler

### Hvordan oppdage
1. List alle avtalte tekster fra e-post/referat
2. Søk etter teksten i dokumentet
3. Marker som funnet/mangler

---

## 6. 🟢 Regnefeil

### Beskrivelse
Enkel regnefeil hos forsikringsselskapet.

### Hvordan oppdage
```
For hver post:
Beregn: Sum × Rate = Premie
Sammenlign med premie i dokument
```

### Akseptabel avvik
- Avrundingsdifferanse < 1 000 kr: OK
- Større avvik: Undersøk årsak

---

## 7. 🟢 Gammel rate brukt

### Beskrivelse
Forsikringsselskapet bruker fjorårets rate istedenfor ny avtalt rate.

### Hvordan oppdage
1. Noter avtalt ny rate fra e-post
2. Kontrollberegn rate fra dokumentet: (Premie ÷ Sum) × 1000
3. Sammenlign

---

## Sjekkliste ved kontroll

- [ ] ‰ vs % — Beregn med begge, sammenlign med fjorår
- [ ] Alle avtalte endringer gjennomført?
- [ ] Indeksregulering korrekt? (bygg +2,3%, maskin +4,1%)
- [ ] Avbrudd/varer IKKE indeksregulert?
- [ ] Naturskade inkludert eller separat?
- [ ] Alle fritekster/vilkår tatt inn?
- [ ] Skadegrenser/loss limits korrekt?
- [ ] Egenandeler korrekt?
- [ ] Totalpremie = sum av delpremier?

---

## Alvorlighetsgrad

| Farge | Betydning | Handling |
|-------|-----------|----------|
| 🔴 | Kritisk | Må rettes før signering |
| 🟡 | Viktig | Bør avklares |
| 🟢 | Mindre | Kan noteres for fremtiden |
