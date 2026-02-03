import fs from 'fs';
import path from 'path';

// Cache for loaded knowledge
let cachedKnowledge: string | null = null;

/**
 * Load all of Petter's knowledge base files
 * This is isolated to Pareto-Petter only
 */
export function loadPetterKnowledge(): string {
  if (cachedKnowledge) {
    return cachedKnowledge;
  }

  const knowledgeDir = path.join(process.cwd(), 'lib/pareto/knowledge');
  
  const files = [
    'SOUL.md',
    'regler.md', 
    'indekser.md',
    'formler.md',
    'feiltyper.md'
  ];

  const sections: string[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(knowledgeDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      sections.push(`\n\n## === ${file.toUpperCase()} ===\n${content}`);
    } catch (error) {
      console.error(`Could not load ${file}:`, error);
    }
  }

  cachedKnowledge = sections.join('\n');
  return cachedKnowledge;
}

/**
 * Build the complete system prompt for Petter
 */
export function buildPetterSystemPrompt(projectName?: string): string {
  const knowledge = loadPetterKnowledge();
  
  const projectContext = projectName 
    ? `\n\n## AKTIVT PROSJEKT: ${projectName}\nDu jobber nå med kunde/sak: "${projectName}". Hold fokus på denne kunden.`
    : '';

  return `${knowledge}${projectContext}

## VIKTIGE REGLER FOR DENNE SAMTALEN:
- Svar ALLTID på norsk
- IKKE hopp til konklusjoner - still spørsmål først
- Forklar resonnementet ditt steg for steg
- Vær metodisk og grundig`;
}
