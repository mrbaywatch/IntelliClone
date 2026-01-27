'use client';

import { ExternalLink, Scale } from 'lucide-react';
import { Badge } from '@kit/ui/badge';

interface Law {
  name: string;
  shortName: string;
  description: string;
  url: string;
  category: string;
}

const norwegianLaws: Law[] = [
  {
    name: 'Arbeidsmiljøloven',
    shortName: 'aml.',
    description: 'Arbeidstid, stillingsvern, HMS',
    url: 'https://lovdata.no/dokument/NL/lov/2005-06-17-62',
    category: 'Arbeidsrett',
  },
  {
    name: 'Avtaleloven',
    shortName: 'avtl.',
    description: 'Inngåelse og gyldighet av avtaler',
    url: 'https://lovdata.no/dokument/NL/lov/1918-05-31-4',
    category: 'Kontraktsrett',
  },
  {
    name: 'Aksjeloven',
    shortName: 'asl.',
    description: 'Aksjeselskaper, styre, generalforsamling',
    url: 'https://lovdata.no/dokument/NL/lov/1997-06-13-44',
    category: 'Selskapsrett',
  },
  {
    name: 'Husleieloven',
    shortName: 'husll.',
    description: 'Leie av bolig, depositum, oppsigelse',
    url: 'https://lovdata.no/dokument/NL/lov/1999-03-26-17',
    category: 'Eiendomsrett',
  },
  {
    name: 'Kjøpsloven',
    shortName: 'kjl.',
    description: 'Kjøp mellom næringsdrivende',
    url: 'https://lovdata.no/dokument/NL/lov/1988-05-13-27',
    category: 'Kontraktsrett',
  },
  {
    name: 'Forbrukerkjøpsloven',
    shortName: 'fkjl.',
    description: 'Forbrukerkjøp, reklamasjon, garanti',
    url: 'https://lovdata.no/dokument/NL/lov/2002-06-21-34',
    category: 'Forbrukerrett',
  },
  {
    name: 'Personopplysningsloven',
    shortName: 'pop.',
    description: 'Personvern og GDPR i Norge',
    url: 'https://lovdata.no/dokument/NL/lov/2018-06-15-38',
    category: 'Personvern',
  },
  {
    name: 'Markedsføringsloven',
    shortName: 'mfl.',
    description: 'Markedsføring og avtalevilkår',
    url: 'https://lovdata.no/dokument/NL/lov/2009-01-09-2',
    category: 'Kontraktsrett',
  },
  {
    name: 'Angrerettloven',
    shortName: 'angrl.',
    description: 'Angrerett ved fjernsalg',
    url: 'https://lovdata.no/dokument/NL/lov/2014-06-20-27',
    category: 'Forbrukerrett',
  },
  {
    name: 'Arveloven',
    shortName: 'al.',
    description: 'Arv, testament, dødsboskifte',
    url: 'https://lovdata.no/dokument/NL/lov/2019-06-14-21',
    category: 'Familierett',
  },
  {
    name: 'Ekteskapsloven',
    shortName: 'el.',
    description: 'Ekteskap, skilsmisse, formuesforhold',
    url: 'https://lovdata.no/dokument/NL/lov/1991-07-04-47',
    category: 'Familierett',
  },
  {
    name: 'Barnelova',
    shortName: 'bl.',
    description: 'Foreldreansvar, samvær, bidrag',
    url: 'https://lovdata.no/dokument/NL/lov/1981-04-08-7',
    category: 'Familierett',
  },
  {
    name: 'Forvaltningsloven',
    shortName: 'fvl.',
    description: 'Behandling av forvaltningssaker',
    url: 'https://lovdata.no/dokument/NL/lov/1967-02-10',
    category: 'Offentlig rett',
  },
  {
    name: 'Skatteloven',
    shortName: 'sktl.',
    description: 'Skatt av formue og inntekt',
    url: 'https://lovdata.no/dokument/NL/lov/1999-03-26-14',
    category: 'Skatterett',
  },
  {
    name: 'Tvisteloven',
    shortName: 'tvl.',
    description: 'Sivile saker i domstolene',
    url: 'https://lovdata.no/dokument/NL/lov/2005-06-17-90',
    category: 'Prosessrett',
  },
  {
    name: 'Straffeloven',
    shortName: 'strl.',
    description: 'Straffbare handlinger',
    url: 'https://lovdata.no/dokument/NL/lov/2005-05-20-28',
    category: 'Strafferett',
  },
];

export function QuickLawLinks() {
  // Group by category
  const lawsByCategory = norwegianLaws.reduce<Record<string, Law[]>>((acc, law) => {
    if (!acc[law.category]) {
      acc[law.category] = [];
    }
    acc[law.category]!.push(law);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(lawsByCategory).map(([category, laws]) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {laws.map((law) => (
              <a
                key={law.shortName}
                href={law.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors group"
              >
                <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                  <Scale className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{law.name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {law.shortName}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {law.description}
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
