/**
 * IntelliClone Billing Configuration
 * 
 * Norwegian pricing strategy inspired by competitor analysis:
 * - Price in NOK (psychological advantage)
 * - Transparent tiers (competitors hide pricing)
 * - "Billable conversation" model like Tidio
 * - Memory as the differentiator
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
      description: 'Perfekt for å teste IntelliClone',
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
        '100 meldinger/måned',
        '1 chatbot',
        '5 dokumenter',
        'Grunnleggende hukommelse',
        '7 dagers samtalehistorikk',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      badge: 'Populær',
      highlighted: true,
      description: 'For små bedrifter som vil vokse',
      currency: 'NOK',
      plans: [
        {
          name: 'Starter Månedlig',
          id: 'starter-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_starter',
              name: 'Starter',
              cost: 499,
              type: 'flat',
            },
          ],
        },
        {
          name: 'Starter Årlig',
          id: 'starter-yearly',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_starter_yearly',
              name: 'Starter (spar 20%)',
              cost: 4790, // 499 * 12 * 0.8
              type: 'flat',
            },
          ],
        },
      ],
      features: [
        '1 000 meldinger/måned',
        '3 chatboter',
        '50 dokumenter',
        'Full hukommelse',
        '90 dagers samtalehistorikk',
        'E-postvarsler',
        'Norsk support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: 'Best verdi',
      description: 'For voksende bedrifter',
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
              cost: 1499,
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
              cost: 14390, // 1499 * 12 * 0.8
              type: 'flat',
            },
          ],
        },
      ],
      features: [
        '10 000 meldinger/måned',
        '10 chatboter',
        'Ubegrenset dokumenter',
        'Avansert hukommelse med analyse',
        'Ubegrenset samtalehistorikk',
        'API-tilgang',
        'Webhook-integrasjoner',
        'Tripletex/Fiken-integrasjon',
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
        'Ubegrenset meldinger',
        'Ubegrenset chatboter',
        'Egne AI-modeller',
        'Dedikert hukommelsesserver',
        'SSO/SAML',
        'GDPR-revisjon',
        'SLA-garanti',
        'Dedikert kundesuksess-manager',
        'On-premise mulighet',
      ],
    },
  ],
});
