-- Intelli-Law Legal Features Migration
-- Adds tables for cases/matters, legal templates, and knowledge base

-- Document type enum for Norwegian legal documents
create type norwegian_document_type as enum (
    'contract',
    'employment_contract',
    'lease_agreement',
    'purchase_agreement',
    'shareholder_agreement',
    'nda',
    'terms_of_service',
    'privacy_policy',
    'power_of_attorney',
    'memorandum',
    'legal_opinion',
    'board_resolution',
    'general_assembly',
    'unknown'
);

-- Legal category enum
create type legal_category as enum (
    'employment_law',
    'contract_law',
    'company_law',
    'real_estate',
    'family_law',
    'tax_law',
    'intellectual_property',
    'data_protection',
    'consumer_law',
    'public_law',
    'criminal_law',
    'immigration_law',
    'bankruptcy_law',
    'environmental_law',
    'other'
);

-- Risk level enum
create type risk_level as enum (
    'low',
    'medium',
    'high',
    'critical'
);

-- Case/Matter status enum
create type case_status as enum (
    'active',
    'pending',
    'closed',
    'archived'
);

-- Add columns to existing documents table for legal analysis
alter table documents
    add column if not exists document_type norwegian_document_type default 'unknown',
    add column if not exists language varchar(10) default 'no',
    add column if not exists risk_score integer,
    add column if not exists risk_level risk_level,
    add column if not exists analysis_completed boolean default false,
    add column if not exists analysis_data jsonb default '{}',
    add column if not exists parties jsonb default '[]',
    add column if not exists effective_date date,
    add column if not exists termination_date date;

-- Create index for document type queries
create index if not exists ix_documents_document_type on documents (document_type);
create index if not exists ix_documents_risk_level on documents (risk_level);

/*
* LEGAL CASES / MATTERS
* For organizing documents and conversations by legal matter
*/
create table if not exists legal_cases (
    id uuid primary key default gen_random_uuid(),
    account_id uuid not null references public.accounts (id) on delete cascade,
    name varchar(500) not null,
    description text,
    case_number varchar(100),
    category legal_category default 'other',
    status case_status default 'active',
    client_name varchar(500),
    opposing_party varchar(500),
    notes text,
    metadata jsonb default '{}',
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

grant select, delete on table legal_cases to authenticated;
grant select, insert, update, delete on table legal_cases to service_role;

alter table legal_cases enable row level security;

create index ix_legal_cases_account_id on legal_cases (account_id);
create index ix_legal_cases_status on legal_cases (status);
create index ix_legal_cases_category on legal_cases (category);

create policy legal_cases_select on legal_cases
    for select to authenticated
    using (account_id = (select auth.uid()));

create policy legal_cases_insert on legal_cases
    for insert to authenticated
    with check (account_id = (select auth.uid()));

create policy legal_cases_update on legal_cases
    for update to authenticated
    using (account_id = (select auth.uid()));

create policy legal_cases_delete on legal_cases
    for delete to authenticated
    using (account_id = (select auth.uid()));

-- Link documents to cases
create table if not exists case_documents (
    id uuid primary key default gen_random_uuid(),
    case_id uuid not null references public.legal_cases (id) on delete cascade,
    document_id uuid not null references public.documents (id) on delete cascade,
    added_at timestamptz default now() not null,
    notes text,
    unique(case_id, document_id)
);

grant select, delete on table case_documents to authenticated;
grant select, insert, update, delete on table case_documents to service_role;

alter table case_documents enable row level security;

create index ix_case_documents_case_id on case_documents (case_id);
create index ix_case_documents_document_id on case_documents (document_id);

create policy case_documents_select on case_documents
    for select to authenticated
    using (
        exists (
            select 1 from legal_cases 
            where legal_cases.id = case_documents.case_id 
            and legal_cases.account_id = (select auth.uid())
        )
    );

create policy case_documents_insert on case_documents
    for insert to authenticated
    with check (
        exists (
            select 1 from legal_cases 
            where legal_cases.id = case_documents.case_id 
            and legal_cases.account_id = (select auth.uid())
        )
    );

create policy case_documents_delete on case_documents
    for delete to authenticated
    using (
        exists (
            select 1 from legal_cases 
            where legal_cases.id = case_documents.case_id 
            and legal_cases.account_id = (select auth.uid())
        )
    );

/*
* DOCUMENT ANALYSIS RESULTS
* Stores detailed analysis results for documents
*/
create table if not exists document_analyses (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references public.documents (id) on delete cascade unique,
    account_id uuid not null references public.accounts (id) on delete cascade,
    document_type norwegian_document_type not null,
    language varchar(10) default 'no',
    
    -- Summary
    brief_summary text,
    detailed_summary text,
    key_points jsonb default '[]',
    parties jsonb default '[]',
    effective_date date,
    termination_date date,
    contract_value jsonb,
    
    -- Risk analysis
    overall_risk_level risk_level,
    risk_score integer check (risk_score >= 0 and risk_score <= 100),
    risks jsonb default '[]',
    missing_clauses jsonb default '[]',
    recommendations jsonb default '[]',
    
    -- Compliance
    gdpr_compliant boolean,
    gdpr_issues jsonb default '[]',
    norwegian_law_compliant boolean,
    norwegian_law_issues jsonb default '[]',
    relevant_laws jsonb default '[]',
    
    -- Metadata
    word_count integer,
    page_count integer,
    sections jsonb default '[]',
    has_signature_block boolean,
    has_date_block boolean,
    
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

grant select, delete on table document_analyses to authenticated;
grant select, insert, update, delete on table document_analyses to service_role;

alter table document_analyses enable row level security;

create index ix_document_analyses_document_id on document_analyses (document_id);
create index ix_document_analyses_account_id on document_analyses (account_id);
create index ix_document_analyses_risk_level on document_analyses (overall_risk_level);

create policy document_analyses_select on document_analyses
    for select to authenticated
    using (account_id = (select auth.uid()));

create policy document_analyses_insert on document_analyses
    for insert to authenticated
    with check (account_id = (select auth.uid()));

create policy document_analyses_update on document_analyses
    for update to authenticated
    using (account_id = (select auth.uid()));

create policy document_analyses_delete on document_analyses
    for delete to authenticated
    using (account_id = (select auth.uid()));

/*
* LEGAL TEMPLATES
* Norwegian legal document templates
*/
create table if not exists legal_templates (
    id uuid primary key default gen_random_uuid(),
    name varchar(500) not null,
    name_norwegian varchar(500) not null,
    description text,
    category legal_category not null,
    document_type norwegian_document_type not null,
    template_content text not null,
    placeholders jsonb default '[]',
    instructions text,
    legal_basis text,
    version varchar(50) default '1.0',
    is_public boolean default false,
    account_id uuid references public.accounts (id) on delete cascade,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

grant select on table legal_templates to authenticated;
grant select, insert, update, delete on table legal_templates to service_role;

alter table legal_templates enable row level security;

create index ix_legal_templates_category on legal_templates (category);
create index ix_legal_templates_document_type on legal_templates (document_type);
create index ix_legal_templates_account_id on legal_templates (account_id);

-- Public templates are visible to all, private only to owner
create policy legal_templates_select on legal_templates
    for select to authenticated
    using (
        is_public = true 
        or account_id = (select auth.uid())
        or account_id is null
    );

create policy legal_templates_insert on legal_templates
    for insert to authenticated
    with check (account_id = (select auth.uid()));

create policy legal_templates_update on legal_templates
    for update to authenticated
    using (account_id = (select auth.uid()));

create policy legal_templates_delete on legal_templates
    for delete to authenticated
    using (account_id = (select auth.uid()));

/*
* LEGAL KNOWLEDGE BASE
* For storing legal research, law references, and case precedents
*/
create table if not exists legal_knowledge (
    id uuid primary key default gen_random_uuid(),
    title varchar(1000) not null,
    content text not null,
    category legal_category not null,
    knowledge_type varchar(50) not null, -- 'law', 'case', 'regulation', 'guideline', 'article'
    
    -- Norwegian law specific
    law_name varchar(500),
    law_name_english varchar(500),
    section varchar(100),
    lovdata_url text,
    
    -- Case reference
    case_reference varchar(200),
    court varchar(200),
    decision_date date,
    
    -- Search & retrieval
    keywords jsonb default '[]',
    embedding vector(1536),
    
    -- Metadata
    source text,
    source_url text,
    is_active boolean default true,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

grant select on table legal_knowledge to authenticated;
grant select, insert, update, delete on table legal_knowledge to service_role;

alter table legal_knowledge enable row level security;

create index ix_legal_knowledge_category on legal_knowledge (category);
create index ix_legal_knowledge_type on legal_knowledge (knowledge_type);
create index ix_legal_knowledge_law_name on legal_knowledge (law_name);
create index on legal_knowledge using hnsw (embedding vector_cosine_ops);

create policy legal_knowledge_select on legal_knowledge
    for select to authenticated
    using (is_active = true);

/*
* LEGAL CHAT SESSIONS
* Extended conversations table for legal-specific features
*/
create table if not exists legal_chat_sessions (
    id uuid primary key default gen_random_uuid(),
    account_id uuid not null references public.accounts (id) on delete cascade,
    case_id uuid references public.legal_cases (id) on delete set null,
    document_id uuid references public.documents (id) on delete set null,
    title varchar(500) not null,
    category legal_category,
    context_type varchar(50) default 'general', -- 'general', 'document', 'case', 'research'
    context_data jsonb default '{}',
    is_archived boolean default false,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

grant select, delete on table legal_chat_sessions to authenticated;
grant select, insert, update, delete on table legal_chat_sessions to service_role;

alter table legal_chat_sessions enable row level security;

create index ix_legal_chat_sessions_account_id on legal_chat_sessions (account_id);
create index ix_legal_chat_sessions_case_id on legal_chat_sessions (case_id);
create index ix_legal_chat_sessions_document_id on legal_chat_sessions (document_id);

create policy legal_chat_sessions_select on legal_chat_sessions
    for select to authenticated
    using (account_id = (select auth.uid()));

create policy legal_chat_sessions_insert on legal_chat_sessions
    for insert to authenticated
    with check (account_id = (select auth.uid()));

create policy legal_chat_sessions_update on legal_chat_sessions
    for update to authenticated
    using (account_id = (select auth.uid()));

create policy legal_chat_sessions_delete on legal_chat_sessions
    for delete to authenticated
    using (account_id = (select auth.uid()));

/*
* LEGAL CHAT MESSAGES
* Messages with legal-specific metadata
*/
create table if not exists legal_chat_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.legal_chat_sessions (id) on delete cascade,
    account_id uuid not null references public.accounts (id) on delete cascade,
    role varchar(20) not null, -- 'user', 'assistant', 'system'
    content text not null,
    
    -- Legal specific
    citations jsonb default '[]',
    confidence numeric(3,2),
    caveats jsonb default '[]',
    related_questions jsonb default '[]',
    
    -- Context used
    context_documents jsonb default '[]',
    context_knowledge jsonb default '[]',
    
    created_at timestamptz default now() not null
);

grant select, delete on table legal_chat_messages to authenticated;
grant select, insert, update, delete on table legal_chat_messages to service_role;

alter table legal_chat_messages enable row level security;

create index ix_legal_chat_messages_session_id on legal_chat_messages (session_id);
create index ix_legal_chat_messages_account_id on legal_chat_messages (account_id);

create policy legal_chat_messages_select on legal_chat_messages
    for select to authenticated
    using (account_id = (select auth.uid()));

create policy legal_chat_messages_insert on legal_chat_messages
    for insert to authenticated
    with check (account_id = (select auth.uid()));

create policy legal_chat_messages_delete on legal_chat_messages
    for delete to authenticated
    using (account_id = (select auth.uid()));

/*
* HELPER FUNCTIONS
*/

-- Function to search legal knowledge base
create or replace function public.search_legal_knowledge(
    query_embedding vector(1536),
    match_count int default 5,
    category_filter legal_category default null
)
returns table (
    id uuid,
    title varchar(1000),
    content text,
    category legal_category,
    knowledge_type varchar(50),
    law_name varchar(500),
    section varchar(100),
    lovdata_url text,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select 
        lk.id,
        lk.title,
        lk.content,
        lk.category,
        lk.knowledge_type,
        lk.law_name,
        lk.section,
        lk.lovdata_url,
        1 - (lk.embedding <=> query_embedding) as similarity
    from public.legal_knowledge lk
    where lk.is_active = true
      and (category_filter is null or lk.category = category_filter)
    order by lk.embedding <=> query_embedding
    limit match_count;
end;
$$;

grant execute on function public.search_legal_knowledge to authenticated, service_role;

-- Function to get case summary stats
create or replace function public.get_legal_case_stats(p_account_id uuid)
returns table (
    total_cases bigint,
    active_cases bigint,
    pending_cases bigint,
    closed_cases bigint,
    total_documents bigint,
    high_risk_documents bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select 
        count(*)::bigint as total_cases,
        count(*) filter (where status = 'active')::bigint as active_cases,
        count(*) filter (where status = 'pending')::bigint as pending_cases,
        count(*) filter (where status = 'closed')::bigint as closed_cases,
        (select count(*)::bigint from documents where account_id = p_account_id) as total_documents,
        (select count(*)::bigint from documents where account_id = p_account_id and risk_level in ('high', 'critical')) as high_risk_documents
    from legal_cases
    where account_id = p_account_id;
end;
$$;

grant execute on function public.get_legal_case_stats to authenticated, service_role;

-- Update trigger for updated_at columns
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger update_legal_cases_updated_at
    before update on legal_cases
    for each row execute function public.update_updated_at_column();

create trigger update_document_analyses_updated_at
    before update on document_analyses
    for each row execute function public.update_updated_at_column();

create trigger update_legal_templates_updated_at
    before update on legal_templates
    for each row execute function public.update_updated_at_column();

create trigger update_legal_knowledge_updated_at
    before update on legal_knowledge
    for each row execute function public.update_updated_at_column();

create trigger update_legal_chat_sessions_updated_at
    before update on legal_chat_sessions
    for each row execute function public.update_updated_at_column();

/*
* SEED DEFAULT TEMPLATES
*/
insert into legal_templates (name, name_norwegian, description, category, document_type, template_content, placeholders, instructions, legal_basis, is_public) values
(
    'Employment Contract',
    'Arbeidsavtale',
    'Standard Norwegian employment contract compliant with arbeidsmiljøloven § 14-6',
    'employment_law',
    'employment_contract',
    E'ARBEIDSAVTALE\n\n1. PARTER\n\nArbeidsgiver: {{employer_name}}\nOrg.nr: {{employer_org_nr}}\nAdresse: {{employer_address}}\n\nArbeidstaker: {{employee_name}}\nFødselsnummer: {{employee_id}}\nAdresse: {{employee_address}}\n\n2. STILLING OG ARBEIDSSTED\n\nStillingstittel: {{job_title}}\nArbeidssted: {{work_location}}\nStillingsbeskrivelse: {{job_description}}\n\n3. TILTREDELSE OG VARIGHET\n\nTiltredelsesdato: {{start_date}}\nArbeidsforholdet er: {{employment_type}}\n{{#if probation_period}}\nPrøvetid: {{probation_period}} måneder\n{{/if}}\n\n4. ARBEIDSTID\n\nNormal arbeidstid: {{weekly_hours}} timer per uke\nArbeidstid: {{work_schedule}}\n\n5. LØNN OG GODTGJØRELSER\n\nFastlønn: {{salary}} kr per {{salary_period}}\nUtbetalingsdato: {{payment_date}}\nPensjonsordning: {{pension_scheme}}\n\n6. FERIE OG FERIEPENGER\n\nFerie etter ferieloven med {{vacation_days}} feriedager\nFeriepenger: {{vacation_pay_percent}}% av feriepengegrunnlaget\n\n7. OPPSIGELSE\n\nOppsigelsestid: {{notice_period}} {{notice_period_unit}}\nOppsigelsestid i prøvetiden: 14 dager\n\n8. TARIFFAVTALE\n\n{{#if collective_agreement}}\nArbeidsforholdet reguleres av: {{collective_agreement}}\n{{else}}\nIngen tariffavtale gjelder for dette arbeidsforholdet.\n{{/if}}\n\n9. ØVRIGE VILKÅR\n\n{{additional_terms}}\n\n\nSted: {{location}}\nDato: {{date}}\n\n\n_____________________________          _____________________________\n{{employer_name}}                      {{employee_name}}\nArbeidsgiver                           Arbeidstaker',
    '[{"key":"employer_name","label":"Employer Name","labelNorwegian":"Arbeidsgivers navn","type":"text","required":true},{"key":"employer_org_nr","label":"Organization Number","labelNorwegian":"Org.nr","type":"text","required":true},{"key":"employer_address","label":"Employer Address","labelNorwegian":"Arbeidsgivers adresse","type":"text","required":true},{"key":"employee_name","label":"Employee Name","labelNorwegian":"Arbeidstakers navn","type":"text","required":true},{"key":"employee_id","label":"National ID","labelNorwegian":"Fødselsnummer","type":"text","required":true},{"key":"employee_address","label":"Employee Address","labelNorwegian":"Arbeidstakers adresse","type":"text","required":true},{"key":"job_title","label":"Job Title","labelNorwegian":"Stillingstittel","type":"text","required":true},{"key":"work_location","label":"Work Location","labelNorwegian":"Arbeidssted","type":"text","required":true},{"key":"job_description","label":"Job Description","labelNorwegian":"Stillingsbeskrivelse","type":"multiline","required":true},{"key":"start_date","label":"Start Date","labelNorwegian":"Tiltredelsesdato","type":"date","required":true},{"key":"employment_type","label":"Employment Type","labelNorwegian":"Ansettelsestype","type":"select","required":true,"options":["Fast ansettelse","Midlertidig ansettelse"]},{"key":"probation_period","label":"Probation Period (months)","labelNorwegian":"Prøvetid (måneder)","type":"number","required":false,"defaultValue":"6"},{"key":"weekly_hours","label":"Weekly Hours","labelNorwegian":"Ukentlig arbeidstid","type":"number","required":true,"defaultValue":"37.5"},{"key":"work_schedule","label":"Work Schedule","labelNorwegian":"Arbeidstid","type":"text","required":true,"defaultValue":"Man-fre 08:00-16:00"},{"key":"salary","label":"Salary","labelNorwegian":"Lønn","type":"number","required":true},{"key":"salary_period","label":"Salary Period","labelNorwegian":"Lønnsperiode","type":"select","required":true,"options":["måned","år","time"]},{"key":"payment_date","label":"Payment Date","labelNorwegian":"Utbetalingsdato","type":"text","required":true,"defaultValue":"den 25. hver måned"},{"key":"pension_scheme","label":"Pension Scheme","labelNorwegian":"Pensjonsordning","type":"text","required":true,"defaultValue":"Innskuddsbasert pensjon etter OTP-loven"},{"key":"vacation_days","label":"Vacation Days","labelNorwegian":"Feriedager","type":"number","required":true,"defaultValue":"25"},{"key":"vacation_pay_percent","label":"Vacation Pay %","labelNorwegian":"Feriepengeprosent","type":"number","required":true,"defaultValue":"12"},{"key":"notice_period","label":"Notice Period","labelNorwegian":"Oppsigelsestid","type":"number","required":true,"defaultValue":"3"},{"key":"notice_period_unit","label":"Notice Period Unit","labelNorwegian":"Enhet oppsigelsestid","type":"select","required":true,"options":["måneder","uker"]},{"key":"collective_agreement","label":"Collective Agreement","labelNorwegian":"Tariffavtale","type":"text","required":false},{"key":"additional_terms","label":"Additional Terms","labelNorwegian":"Øvrige vilkår","type":"multiline","required":false},{"key":"location","label":"Location","labelNorwegian":"Sted","type":"text","required":true},{"key":"date","label":"Date","labelNorwegian":"Dato","type":"date","required":true}]',
    'Fyll ut alle obligatoriske felt. Arbeidsavtalen oppfyller minimumskravene i arbeidsmiljøloven § 14-6.',
    'Arbeidsmiljøloven § 14-6',
    true
),
(
    'Non-Disclosure Agreement',
    'Konfidensialitetsavtale',
    'Standard NDA for protecting confidential information',
    'contract_law',
    'nda',
    E'KONFIDENSIALITETSAVTALE (NDA)\n\nDenne konfidensialitetsavtalen ("Avtalen") er inngått mellom:\n\n1. PARTER\n\nUtleverende part: {{disclosing_party}}\nOrg.nr: {{disclosing_org_nr}}\n\nMottakende part: {{receiving_party}}\nOrg.nr: {{receiving_org_nr}}\n\n2. BAKGRUNN\n\n{{background}}\n\n3. DEFINISJON AV KONFIDENSIELL INFORMASJON\n\nMed "Konfidensiell Informasjon" menes all informasjon som Utleverende part deler med Mottakende part, herunder men ikke begrenset til:\n- Forretningshemmeligheter og know-how\n- Teknisk informasjon og spesifikasjoner\n- Finansiell informasjon\n- Kundelister og leverandørinformasjon\n- Planer, strategier og analyser\n- Annen informasjon merket som konfidensiell\n\n4. UNNTAK\n\nKonfidensiell Informasjon omfatter ikke informasjon som:\na) Er eller blir offentlig kjent uten Mottakende parts medvirkning\nb) Var kjent for Mottakende part før mottak fra Utleverende part\nc) Er mottatt fra tredjepart uten taushetsplikt\nd) Er selvstendig utviklet av Mottakende part\n\n5. MOTTAKENDE PARTS FORPLIKTELSER\n\nMottakende part forplikter seg til å:\n- Behandle Konfidensiell Informasjon strengt konfidensielt\n- Kun bruke informasjonen for {{permitted_purpose}}\n- Kun dele informasjonen med ansatte som har behov for den\n- Sikre at mottakere er bundet av tilsvarende taushetsplikt\n- Treffe rimelige sikkerhetstiltak for å beskytte informasjonen\n\n6. VARIGHET\n\nDenne Avtalen gjelder i {{duration_years}} år fra undertegnelse.\nTaushetsplikten består i {{confidentiality_years}} år etter Avtalens utløp.\n\n7. RETUR AV INFORMASJON\n\nVed Avtalens opphør skal Mottakende part returnere eller destruere all Konfidensiell Informasjon og bekrefte dette skriftlig.\n\n8. MISLIGHOLD\n\nVed brudd på denne Avtalen kan Utleverende part kreve erstatning for dokumentert tap. Mottakende part erkjenner at brudd kan medføre uopprettelig skade som berettiger midlertidig forføyning.\n\n9. LOVVALG OG VERNETING\n\nAvsaten reguleres av norsk rett. Tvister avgjøres ved {{venue}}.\n\n\nSted: {{location}}\nDato: {{date}}\n\n\n_____________________________          _____________________________\n{{disclosing_party}}                   {{receiving_party}}',
    '[{"key":"disclosing_party","label":"Disclosing Party","labelNorwegian":"Utleverende part","type":"text","required":true},{"key":"disclosing_org_nr","label":"Disclosing Party Org Nr","labelNorwegian":"Org.nr utleverende part","type":"text","required":true},{"key":"receiving_party","label":"Receiving Party","labelNorwegian":"Mottakende part","type":"text","required":true},{"key":"receiving_org_nr","label":"Receiving Party Org Nr","labelNorwegian":"Org.nr mottakende part","type":"text","required":true},{"key":"background","label":"Background/Purpose","labelNorwegian":"Bakgrunn","type":"multiline","required":true},{"key":"permitted_purpose","label":"Permitted Purpose","labelNorwegian":"Tillatt formål","type":"text","required":true},{"key":"duration_years","label":"Agreement Duration (years)","labelNorwegian":"Avtalens varighet (år)","type":"number","required":true,"defaultValue":"2"},{"key":"confidentiality_years","label":"Confidentiality Duration (years)","labelNorwegian":"Taushetspliktens varighet (år)","type":"number","required":true,"defaultValue":"5"},{"key":"venue","label":"Venue","labelNorwegian":"Verneting","type":"text","required":true,"defaultValue":"Oslo tingrett"},{"key":"location","label":"Location","labelNorwegian":"Sted","type":"text","required":true},{"key":"date","label":"Date","labelNorwegian":"Dato","type":"date","required":true}]',
    'Tilpass formål og varighet etter behov. Vurder om spesifikke sikkerhetstiltak bør spesifiseres.',
    'Markedsføringsloven §§ 28-29',
    true
),
(
    'Lease Agreement',
    'Leieavtale for bolig',
    'Standard residential lease agreement compliant with husleieloven',
    'real_estate',
    'lease_agreement',
    E'LEIEAVTALE FOR BOLIG\n\n1. PARTER\n\nUtleier: {{landlord_name}}\nAdresse: {{landlord_address}}\nTelefon: {{landlord_phone}}\nE-post: {{landlord_email}}\n\nLeietaker: {{tenant_name}}\nFødselsnummer: {{tenant_id}}\nTelefon: {{tenant_phone}}\nE-post: {{tenant_email}}\n\n2. LEIEOBJEKT\n\nAdresse: {{property_address}}\nType: {{property_type}}\nAreal: {{property_size}} kvm\nAntall rom: {{number_of_rooms}}\n\n3. LEIEPERIODE\n\nLeieforholdet løper fra: {{start_date}}\n{{#if end_date}}\nLeieforholdet løper til: {{end_date}}\n{{else}}\nLeieforholdet er tidsubestemt.\n{{/if}}\n\n4. OPPSIGELSE\n\nOppsigelsestiden er {{notice_period}} måneder, regnet fra utløpet av kalendermåneden oppsigelsen ble mottatt.\n\nOppsigelse skal være skriftlig.\n\n5. LEIE\n\nMånedlig leie: kr {{monthly_rent}}\nBetales forskuddsvis innen den {{payment_day}}. hver måned til konto {{payment_account}}.\n\nLeien kan reguleres årlig i henhold til konsumprisindeksen.\n\n6. DEPOSITUM\n\nDepositum: kr {{deposit_amount}} (tilsvarende {{deposit_months}} måneders leie)\nDeponeres på depositumskonto i leietakers navn.\n\n7. STRØM OG ANDRE UTGIFTER\n\n{{utilities_arrangement}}\n\n8. VEDLIKEHOLD\n\nUtleier har ansvar for utvendig vedlikehold og vedlikehold av felles arealer.\nLeietaker har ansvar for innvendig vedlikehold og normale forbruksartikler.\n\n9. HUSORDENSREGLER\n\nLeietaker plikter å følge husordensreglene som er vedlagt denne avtalen.\n\n10. FREMLEIE\n\nFremleie krever skriftlig samtykke fra utleier.\n\n11. OVERTAKELSE\n\nVed overtakelse skal det gjennomføres felles befaring og utarbeides protokoll.\n\n12. SÆRSKILTE VILKÅR\n\n{{special_conditions}}\n\n\nSted: {{location}}\nDato: {{date}}\n\n\n_____________________________          _____________________________\nUtleier                                Leietaker',
    '[{"key":"landlord_name","label":"Landlord Name","labelNorwegian":"Utleiers navn","type":"text","required":true},{"key":"landlord_address","label":"Landlord Address","labelNorwegian":"Utleiers adresse","type":"text","required":true},{"key":"landlord_phone","label":"Landlord Phone","labelNorwegian":"Utleiers telefon","type":"text","required":true},{"key":"landlord_email","label":"Landlord Email","labelNorwegian":"Utleiers e-post","type":"text","required":true},{"key":"tenant_name","label":"Tenant Name","labelNorwegian":"Leietakers navn","type":"text","required":true},{"key":"tenant_id","label":"Tenant National ID","labelNorwegian":"Leietakers fødselsnummer","type":"text","required":true},{"key":"tenant_phone","label":"Tenant Phone","labelNorwegian":"Leietakers telefon","type":"text","required":true},{"key":"tenant_email","label":"Tenant Email","labelNorwegian":"Leietakers e-post","type":"text","required":true},{"key":"property_address","label":"Property Address","labelNorwegian":"Boligens adresse","type":"text","required":true},{"key":"property_type","label":"Property Type","labelNorwegian":"Boligtype","type":"select","required":true,"options":["Leilighet","Enebolig","Rekkehus","Hybel"]},{"key":"property_size","label":"Size (sqm)","labelNorwegian":"Areal (kvm)","type":"number","required":true},{"key":"number_of_rooms","label":"Number of Rooms","labelNorwegian":"Antall rom","type":"number","required":true},{"key":"start_date","label":"Start Date","labelNorwegian":"Startdato","type":"date","required":true},{"key":"end_date","label":"End Date","labelNorwegian":"Sluttdato","type":"date","required":false},{"key":"notice_period","label":"Notice Period (months)","labelNorwegian":"Oppsigelsestid (måneder)","type":"number","required":true,"defaultValue":"3"},{"key":"monthly_rent","label":"Monthly Rent","labelNorwegian":"Månedlig leie","type":"number","required":true},{"key":"payment_day","label":"Payment Day","labelNorwegian":"Betalingsdag","type":"number","required":true,"defaultValue":"1"},{"key":"payment_account","label":"Payment Account","labelNorwegian":"Betalingskonto","type":"text","required":true},{"key":"deposit_amount","label":"Deposit Amount","labelNorwegian":"Depositumsbeløp","type":"number","required":true},{"key":"deposit_months","label":"Deposit (months of rent)","labelNorwegian":"Depositum (antall mnd leie)","type":"number","required":true,"defaultValue":"3"},{"key":"utilities_arrangement","label":"Utilities Arrangement","labelNorwegian":"Strøm og utgifter","type":"multiline","required":true,"defaultValue":"Strøm og internett betales av leietaker i tillegg til husleien."},{"key":"special_conditions","label":"Special Conditions","labelNorwegian":"Særskilte vilkår","type":"multiline","required":false},{"key":"location","label":"Location","labelNorwegian":"Sted","type":"text","required":true},{"key":"date","label":"Date","labelNorwegian":"Dato","type":"date","required":true}]',
    'Depositum kan maksimalt være 6 måneders leie (husleieloven § 3-5). Oppsigelsestid må være minst 3 måneder for tidsubestemte leieforhold.',
    'Husleieloven',
    true
);
