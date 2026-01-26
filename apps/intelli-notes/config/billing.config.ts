/**
 * Intelli-Notes Billing Configuration
 * 
 * Norwegian meeting AI pricing inspired by Fireflies/Otter analysis:
 * - Price in NOK
 * - Minutes-based like Fireflies
 * - Norwegian transcription as differentiator
 */
import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

export default createBillingSchema({
  provider,
  products: [
    {
      id: 'gratis',
      name: 'Gratis',
      description: 'Test norsk møtetranskribering',
      currency: 'NOK',
      badge: 'Prøv gratis',
      plans: [
        {
          name: 'Gratis',
          id: 'free',
          custom: true,
          label: 'kr 0',
          buttonLabel: 'Start gratis',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [],
        },
      ],
      features: [
        '300 minutter/måned',
        '3 møter lagret',
        'Norsk transkribering',
        'Grunnleggende sammendrag',
        'Google Calendar-integrasjon',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: 'Mest populær',
      highlighted: true,
      description: 'For team som har mange møter',
      currency: 'NOK',
      plans: [
        {
          name: 'Pro Månedlig',
          id: 'pro-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_pro',
              name: 'Pro',
              cost: 299,
              type: 'flat',
            },
          ],
        },
        {
          name: 'Pro Årlig',
          id: 'pro-yearly',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_pro_yearly',
              name: 'Pro (spar 20%)',
              cost: 2870,
              type: 'flat',
            },
          ],
        },
      ],
      features: [
        '2 000 minutter/måned',
        'Ubegrenset møter lagret',
        'Norsk + engelsk transkribering',
        'AI-sammendrag med handlingspunkter',
        'Taleridentifikasjon',
        'Søk i alle møter',
        'Zoom, Teams & Meet integrasjon',
        'Eksporter til Notion/Docs',
      ],
    },
    {
      id: 'business',
      name: 'Business',
      badge: 'For team',
      description: 'For større team og bedrifter',
      currency: 'NOK',
      plans: [
        {
          name: 'Business Månedlig',
          id: 'business-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_business',
              name: 'Business',
              cost: 799,
              type: 'flat',
            },
          ],
        },
        {
          name: 'Business Årlig',
          id: 'business-yearly',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_business_yearly',
              name: 'Business (spar 20%)',
              cost: 7670,
              type: 'flat',
            },
          ],
        },
      ],
      features: [
        'Ubegrenset minutter',
        'Ubegrenset brukere',
        'Team-arbeidsområde',
        'Avansert sentimentanalyse',
        'Taletidsstatistikk',
        'CRM-integrasjoner',
        'API-tilgang',
        'Admin-dashboard',
        'GDPR-verktøy',
        'Prioritert support',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      badge: 'Skreddersydd',
      description: 'For større organisasjoner',
      currency: 'NOK',
      plans: [
        {
          name: 'Enterprise',
          id: 'enterprise',
          custom: true,
          label: 'Kontakt oss',
          buttonLabel: 'Kontakt salg',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [],
        },
      ],
      features: [
        'Alt i Business +',
        'SSO/SAML',
        'Dedikert infrastruktur',
        'Egne AI-modeller',
        'On-premise mulighet',
        'Revisjon og compliance',
        'Dedikert kundesuksess',
        'SLA-garanti 99.9%',
      ],
    },
  ],
});
