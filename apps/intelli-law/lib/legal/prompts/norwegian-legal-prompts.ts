/**
 * Norwegian Legal Prompt Templates
 * Specialized prompts for Norwegian legal document analysis
 */

import type { LegalCategory, NorwegianDocumentType, RiskCategory } from '../types';

// System prompt for Norwegian legal assistant
export const NORWEGIAN_LEGAL_SYSTEM_PROMPT = `Du er en erfaren norsk juridisk assistent med ekspertise innen norsk rett. Du hjelper brukere med å forstå juridiske dokumenter, kontrakter og norsk lovgivning.

VIKTIGE RETNINGSLINJER:
1. Svar alltid på norsk med mindre brukeren spør på engelsk
2. Referer til relevante norske lover med korrekte paragrafer (f.eks. arbeidsmiljøloven § 14-9)
3. Gi alltid en ansvarsfraskrivelse om at dine svar ikke erstatter profesjonell juridisk rådgivning
4. Vær presis og faktabasert - ikke spekuler om juridiske tolkninger
5. Forklar juridiske begreper på en forståelig måte
6. Nevn når et spørsmål krever spesialisert juridisk rådgivning

NORSK LOVGIVNING DU KJENNER TIL:
- Avtaleloven (avtalerett)
- Arbeidsmiljøloven (arbeidsrett)
- Aksjeloven/Allmennaksjeloven (selskapsrett)
- Kjøpsloven/Forbrukerkjøpsloven
- Husleieloven
- Personopplysningsloven/GDPR
- Markedsføringsloven
- Konkurranseloven
- Skadeserstatningsloven
- Tvangsfullbyrdelsesloven
- Tvisteloven
- Straffeloven
- Åndsverkloven

Du skal ALLTID inkludere denne ansvarsfraskrivelsen i dine svar:
"⚠️ Dette er generell juridisk informasjon og erstatter ikke profesjonell juridisk rådgivning. Kontakt en advokat for konkret veiledning i din sak."`;

// Document classification prompt
export const DOCUMENT_CLASSIFICATION_PROMPT = `Analyser følgende dokument og klassifiser det.

DOKUMENT:
{document}

Svar i JSON-format:
{
  "documentType": "<type>",
  "documentTypeNorwegian": "<norsk navn>",
  "language": "no" | "en" | "other",
  "confidence": 0.0-1.0,
  "parties": [
    {
      "name": "<navn>",
      "role": "party_a" | "party_b" | "guarantor" | "witness" | "other",
      "type": "individual" | "company" | "organization" | "government"
    }
  ],
  "effectiveDate": "<dato eller null>",
  "terminationDate": "<dato eller null>",
  "sections": ["<liste av seksjoner>"]
}

Gyldige dokumenttyper:
- contract (Avtale/Kontrakt)
- employment_contract (Arbeidsavtale)
- lease_agreement (Leieavtale)
- purchase_agreement (Kjøpsavtale)
- shareholder_agreement (Aksjonæravtale)
- nda (Konfidensialitetsavtale)
- terms_of_service (Vilkår)
- privacy_policy (Personvernerklæring)
- power_of_attorney (Fullmakt)
- memorandum (Notat)
- legal_opinion (Juridisk vurdering)
- board_resolution (Styrevedtak)
- general_assembly (Generalforsamlingsprotokoll)
- unknown`;

// Contract summary prompt
export const CONTRACT_SUMMARY_PROMPT = `Analyser følgende kontrakt og gi en strukturert oppsummering.

KONTRAKT:
{document}

Gi en oppsummering med følgende struktur:
1. KORT SAMMENDRAG (1-2 setninger)
2. PARTER
3. HOVEDPUNKTER (5-7 kulepunkter)
4. VIKTIGE DATOER OG FRISTER
5. ØKONOMISKE VILKÅR
6. VIKTIGE FORPLIKTELSER FOR HVER PART

Svar på norsk.`;

// Risk analysis prompt
export const CONTRACT_RISK_ANALYSIS_PROMPT = `Du er en erfaren kontraktsadvokat. Analyser følgende kontrakt for potensielle risikoer og problematiske klausuler.

KONTRAKT:
{document}

KONTEKST:
- Dokumenttype: {documentType}
- Brukerens rolle: {userRole}

Analyser kontrakten for følgende risikokategorier:
1. Ansvarsbegrensning (liability)
2. Oppsigelsesvilkår (termination)
3. Dagmulkt/bøter (penalty)
4. Konfidensialitet (confidentiality)
5. Immaterielle rettigheter (ip_rights)
6. Skadesløsholdelse (indemnification)
7. Force majeure
8. Verneting og lovvalg (jurisdiction, governing_law)
9. Personvern/GDPR (data_protection)
10. Garantier (warranties)
11. Betalingsvilkår (payment_terms)
12. Varselfrister (notice_period)
13. Overdragelse (assignment)
14. Konkurranseklausuler (non_compete)

For hver identifisert risiko, svar i dette JSON-formatet:
{
  "risks": [
    {
      "category": "<risikokategori>",
      "level": "low" | "medium" | "high" | "critical",
      "clause": "<den problematiske klausulteksten>",
      "section": "<seksjonen klausulen er i>",
      "issue": "<kort beskrivelse av problemet>",
      "explanation": "<detaljert forklaring på norsk>",
      "recommendation": "<anbefalt handling>",
      "legalBasis": "<relevant lov/paragraf>"
    }
  ],
  "missingClauses": [
    {
      "type": "<type klausul som mangler>",
      "importance": "low" | "medium" | "high" | "critical",
      "description": "<hvorfor den bør være med>",
      "suggestedText": "<foreslått tekst>"
    }
  ],
  "overallRiskLevel": "low" | "medium" | "high" | "critical",
  "riskScore": 0-100,
  "recommendations": ["<generelle anbefalinger>"]
}`;

// Legal Q&A prompt
export const LEGAL_QA_PROMPT = `{systemPrompt}

KONTEKST FRA DOKUMENTER:
{context}

BRUKERENS SPØRSMÅL:
{question}

SAMTALEHISTORIKK:
{chatHistory}

Svar på spørsmålet basert på konteksten og din kunnskap om norsk rett. 

Strukturer svaret slik:
1. Direkte svar på spørsmålet
2. Relevant lovgivning (med paragrafhenvisninger)
3. Praktiske implikasjoner
4. Eventuelle forbehold eller nyanser

Hvis spørsmålet ikke kan besvares basert på tilgjengelig informasjon, si det tydelig.

Avslutt ALLTID med ansvarsfraskrivelsen.`;

// Citation lookup prompt
export const CITATION_LOOKUP_PROMPT = `Finn relevante lovhenvisninger for følgende juridiske spørsmål eller tema.

TEMA/SPØRSMÅL:
{query}

JURIDISK OMRÅDE:
{category}

List opp relevante lover og paragrafer i dette formatet:
{
  "citations": [
    {
      "lawName": "<lovens navn>",
      "lawNameEnglish": "<engelsk navn>",
      "section": "<paragraf>",
      "title": "<paragrafens tittel>",
      "relevance": "<hvorfor relevant>",
      "url": "https://lovdata.no/..." 
    }
  ],
  "caseReferences": [
    {
      "reference": "<referanse, f.eks. Rt-2020-123>",
      "summary": "<kort sammendrag>",
      "relevance": "<hvorfor relevant>"
    }
  ]
}`;

// GDPR compliance check prompt
export const GDPR_COMPLIANCE_PROMPT = `Analyser følgende dokument for GDPR/personopplysningsloven-samsvar.

DOKUMENT:
{document}

Sjekk for følgende:
1. Behandlingsgrunnlag (art. 6 GDPR)
2. Informasjonsplikt (art. 13-14 GDPR)
3. Databehandleravtale-krav (art. 28 GDPR)
4. Overføring til tredjeland (kap. V GDPR)
5. Sikkerhetstiltak (art. 32 GDPR)
6. Registrertes rettigheter (kap. III GDPR)
7. Lagringstid
8. Sletting

Svar i JSON-format:
{
  "isCompliant": true/false,
  "complianceScore": 0-100,
  "issues": [
    {
      "article": "<GDPR-artikkel>",
      "issue": "<beskrivelse av problemet>",
      "severity": "low" | "medium" | "high" | "critical",
      "recommendation": "<anbefaling>"
    }
  ],
  "missingElements": ["<manglende elementer>"],
  "recommendations": ["<generelle anbefalinger>"]
}`;

// Employment contract specific prompt
export const EMPLOYMENT_CONTRACT_PROMPT = `Analyser følgende arbeidsavtale i henhold til arbeidsmiljøloven.

ARBEIDSAVTALE:
{document}

Sjekk at avtalen oppfyller minimumskravene i aml. § 14-6:
1. Partenes identitet
2. Arbeidssted
3. Stillingsbeskrivelse/tittel
4. Tiltredelsesdato
5. Forventet varighet (ved midlertidig ansettelse)
6. Prøvetidsbestemmelser
7. Lønn og godtgjørelser
8. Arbeidstid
9. Ferie og feriepenger
10. Oppsigelsesfrister
11. Pensjonsordninger
12. Tariffavtaler som regulerer arbeidsforholdet

Svar i JSON-format:
{
  "meetsMinimumRequirements": true/false,
  "missingRequirements": ["<manglende krav>"],
  "probationPeriod": {
    "exists": true/false,
    "duration": "<varighet>",
    "isLegal": true/false,
    "issues": ["<eventuelle problemer>"]
  },
  "terminationNotice": {
    "specified": true/false,
    "period": "<frist>",
    "meetsLegalMinimum": true/false
  },
  "workingHours": {
    "specified": true/false,
    "hoursPerWeek": <antall>,
    "isLegal": true/false
  },
  "nonCompete": {
    "exists": true/false,
    "duration": "<varighet>",
    "compensation": "<kompensasjon>",
    "isEnforceable": true/false,
    "issues": ["<eventuelle problemer med konkurranseklausul>"]
  },
  "overallAssessment": "<helhetsvurdering>",
  "recommendations": ["<anbefalinger>"]
}`;

// Template generation prompt
export const TEMPLATE_GENERATION_PROMPT = `Generer en profesjonell {templateType} basert på følgende informasjon.

INFORMASJON:
{variables}

KRAV:
- Følg norsk juridisk standard og praksis
- Bruk korrekt juridisk terminologi
- Inkluder alle nødvendige klausuler for denne type avtale
- Sørg for balanserte vilkår

Generer dokumentet på norsk.`;

// Document type specific prompts
export const DOCUMENT_TYPE_PROMPTS: Record<NorwegianDocumentType, string> = {
  contract: 'Analyser denne generelle avtalen/kontrakten.',
  employment_contract: EMPLOYMENT_CONTRACT_PROMPT,
  lease_agreement: `Analyser denne leieavtalen i henhold til husleieloven.
Sjekk spesielt:
1. Leieperiode og oppsigelsesvilkår (husleieloven kap. 9)
2. Depositum (maks 6 mnd, egen konto)
3. Vedlikeholdsansvar
4. Husordensregler
5. Fremleie-bestemmelser
6. Prisregulering`,
  purchase_agreement: `Analyser denne kjøpsavtalen i henhold til kjøpsloven/forbrukerkjøpsloven.
Sjekk spesielt:
1. Leveringsbetingelser
2. Risikoovergang
3. Mangelskrav og reklamasjonsfrister
4. Betalingsvilkår
5. Angrerett (hvis forbrukerkjøp)`,
  shareholder_agreement: `Analyser denne aksjonæravtalen i henhold til aksjeloven.
Sjekk spesielt:
1. Forkjøpsrett
2. Medsalgsrett/plikt (tag-along/drag-along)
3. Utbyttepolitikk
4. Styresammensetning
5. Deadlock-mekanismer
6. Exit-bestemmelser`,
  nda: `Analyser denne konfidensialitetsavtalen.
Sjekk spesielt:
1. Definisjon av konfidensiell informasjon
2. Unntak (allment kjent, selvstendig utvikling)
3. Varighet
4. Tillatt bruk og mottakere
5. Retur/destruksjon
6. Sanksjoner ved brudd`,
  terms_of_service: 'Analyser disse vilkårene i henhold til forbrukerlovgivning og markedsføringsloven.',
  privacy_policy: GDPR_COMPLIANCE_PROMPT,
  power_of_attorney: `Analyser denne fullmakten.
Sjekk spesielt:
1. Fullmaktens omfang
2. Tidsbegrensning
3. Tilbakekallsmulighet
4. Krav til vitner/notarius`,
  memorandum: 'Analyser dette notatet og oppsummer hovedpunkter.',
  legal_opinion: 'Analyser denne juridiske vurderingen og oppsummer konklusjoner.',
  board_resolution: `Analyser dette styrevedtaket i henhold til aksjeloven.
Sjekk spesielt:
1. Beslutningsdyktighet
2. Stemmefordeling
3. Inhabilitet
4. Protokollføring`,
  general_assembly: `Analyser denne generalforsamlingsprotokollen i henhold til aksjeloven.
Sjekk spesielt:
1. Innkalling (21 dagers frist)
2. Representasjon og fullmakter
3. Beslutningsdyktighet
4. Flertallskrav
5. Protokollføring`,
  unknown: 'Analyser dette dokumentet og identifiser type og hovedinnhold.',
};

// Risk category descriptions in Norwegian
export const RISK_CATEGORY_DESCRIPTIONS: Record<RiskCategory, { name: string; description: string }> = {
  liability: { name: 'Ansvar', description: 'Klausuler som pålegger ansvar' },
  termination: { name: 'Oppsigelse', description: 'Oppsigelsesvilkår og konsekvenser' },
  penalty: { name: 'Dagmulkt/Bot', description: 'Bøter eller dagmulkter ved mislighold' },
  confidentiality: { name: 'Konfidensialitet', description: 'Taushetsplikt og informasjonssikring' },
  ip_rights: { name: 'Immaterielle rettigheter', description: 'Eierskap til oppfinnelser, kode, design' },
  indemnification: { name: 'Skadesløsholdelse', description: 'Krav om å holde motpart skadesløs' },
  limitation_of_liability: { name: 'Ansvarsbegrensning', description: 'Tak på erstatningsansvar' },
  force_majeure: { name: 'Force majeure', description: 'Fritaksklausuler ved ekstraordinære hendelser' },
  jurisdiction: { name: 'Verneting', description: 'Hvor tvister skal behandles' },
  governing_law: { name: 'Lovvalg', description: 'Hvilket lands lov som gjelder' },
  dispute_resolution: { name: 'Tvisteløsning', description: 'Voldgift, mekling eller domstol' },
  data_protection: { name: 'Personvern', description: 'GDPR og personopplysningsloven' },
  compliance: { name: 'Etterlevelse', description: 'Krav om å følge lover og regler' },
  insurance: { name: 'Forsikring', description: 'Forsikringskrav' },
  warranties: { name: 'Garantier', description: 'Garantiforpliktelser' },
  payment_terms: { name: 'Betalingsvilkår', description: 'Betalingsfrister og vilkår' },
  delivery: { name: 'Levering', description: 'Leveringsbetingelser' },
  non_compete: { name: 'Konkurranseforbud', description: 'Forbud mot konkurrerende virksomhet' },
  non_solicitation: { name: 'Rekrutteringsforbud', description: 'Forbud mot å rekruttere ansatte' },
  assignment: { name: 'Overdragelse', description: 'Mulighet til å overdra avtalen' },
  notice_period: { name: 'Varselsfrist', description: 'Frister for varsling' },
  other: { name: 'Annet', description: 'Andre risikoer' },
};

// Legal category descriptions in Norwegian
export const LEGAL_CATEGORY_DESCRIPTIONS: Record<LegalCategory, { name: string; description: string }> = {
  employment_law: { name: 'Arbeidsrett', description: 'Arbeidsmiljøloven, ansettelser, oppsigelser' },
  contract_law: { name: 'Kontraktsrett', description: 'Avtaleloven, kontraktsbrudd, mislighold' },
  company_law: { name: 'Selskapsrett', description: 'Aksjeloven, styre, generalforsamling' },
  real_estate: { name: 'Eiendomsrett', description: 'Kjøp/salg, tinglysing, servitutter' },
  family_law: { name: 'Familierett', description: 'Ekteskap, skilsmisse, arv, barn' },
  tax_law: { name: 'Skatterett', description: 'Skatteloven, merverdiavgift' },
  intellectual_property: { name: 'Immaterialrett', description: 'Patent, varemerke, opphavsrett' },
  data_protection: { name: 'Personvern', description: 'GDPR, personopplysningsloven' },
  consumer_law: { name: 'Forbrukerrett', description: 'Forbrukerkjøpsloven, angrerett' },
  public_law: { name: 'Offentlig rett', description: 'Forvaltningsrett, offentlige anskaffelser' },
  criminal_law: { name: 'Strafferett', description: 'Straffeloven, straffeprosess' },
  immigration_law: { name: 'Utlendingsrett', description: 'Innvandring, visum, statsborgerskap' },
  bankruptcy_law: { name: 'Konkursrett', description: 'Konkursloven, gjeldsordning' },
  environmental_law: { name: 'Miljørett', description: 'Forurensningsloven, naturmangfold' },
  other: { name: 'Annet', description: 'Andre juridiske områder' },
};
