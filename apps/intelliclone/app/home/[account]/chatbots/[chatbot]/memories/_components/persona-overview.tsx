'use client';

/**
 * Persona Overview Component
 * 
 * Displays a summary of what the chatbot knows about users.
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Progress } from '@kit/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@kit/ui/collapsible';
import {
  Brain,
  User,
  Building2,
  MessageSquare,
  Target,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
} from 'lucide-react';

import type { UserPersona, CommunicationStyle } from '~/lib/persona';

interface PersonaOverviewProps {
  persona: UserPersona;
  onEdit?: (personaId: string) => void;
  onDelete?: (personaId: string) => void;
}

export function PersonaOverview({
  persona,
  onEdit,
  onDelete,
}: PersonaOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const prof = persona.professionalProfile;
  const style = persona.communicationStyle;
  const prefs = persona.personalPreferences;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{persona.name || 'Anonymous User'}</CardTitle>
              <CardDescription>
                {prof.title && prof.company
                  ? `${prof.title} at ${prof.company}`
                  : prof.title || prof.company || 'No professional info yet'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={persona.overallConfidence > 0.6 ? 'default' : 'secondary'}>
              {Math.round(persona.overallConfidence * 100)}% confidence
            </Badge>
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(persona.id)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={() => onDelete(persona.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <QuickStat
            label="Conversations"
            value={persona.conversationsAnalyzed}
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <QuickStat
            label="Facts Learned"
            value={Object.values(persona.facts).flat().length}
            icon={<Brain className="h-4 w-4" />}
          />
          <QuickStat
            label="Goals"
            value={prof.goals.length}
            icon={<Target className="h-4 w-4" />}
          />
          <QuickStat
            label="Challenges"
            value={prof.challenges.length}
            icon={<AlertCircle className="h-4 w-4" />}
          />
        </div>
        
        {/* Communication Style */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communication Style
          </h4>
          <div className="space-y-3">
            <StyleBar label="Formality" value={style.formality} leftLabel="Casual" rightLabel="Formal" />
            <StyleBar label="Verbosity" value={style.verbosity} leftLabel="Brief" rightLabel="Detailed" />
            <StyleBar label="Directness" value={style.directness} leftLabel="Indirect" rightLabel="Direct" />
            <StyleBar label="Technicality" value={style.technicality} leftLabel="Simple" rightLabel="Technical" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline">
              Language: {style.preferredLanguage === 'no' ? 'Norwegian' : 'English'}
            </Badge>
          </div>
        </div>
        
        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>View Details</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            {/* Goals */}
            {prof.goals.length > 0 && (
              <DetailSection title="Goals" icon={<Target className="h-4 w-4" />}>
                <ul className="list-disc list-inside space-y-1">
                  {prof.goals.map((goal, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{goal}</li>
                  ))}
                </ul>
              </DetailSection>
            )}
            
            {/* Challenges */}
            {prof.challenges.length > 0 && (
              <DetailSection title="Challenges" icon={<AlertCircle className="h-4 w-4" />}>
                <ul className="list-disc list-inside space-y-1">
                  {prof.challenges.map((challenge, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{challenge}</li>
                  ))}
                </ul>
              </DetailSection>
            )}
            
            {/* Known Facts */}
            {Object.keys(persona.facts).length > 0 && (
              <DetailSection title="Known Facts" icon={<Brain className="h-4 w-4" />}>
                {Object.entries(persona.facts).map(([category, facts]) => (
                  <div key={category} className="mb-2">
                    <Badge variant="secondary" className="mb-1">{category}</Badge>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {facts.map((fact, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{fact}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </DetailSection>
            )}
            
            {/* Interests */}
            {prefs.interests.length > 0 && (
              <DetailSection title="Interests">
                <div className="flex flex-wrap gap-2">
                  {prefs.interests.map((interest, i) => (
                    <Badge key={i} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </DetailSection>
            )}
            
            {/* Relationships */}
            {persona.relationships.keyPeople.length > 0 && (
              <DetailSection title="Key People" icon={<Building2 className="h-4 w-4" />}>
                <div className="space-y-2">
                  {persona.relationships.keyPeople.map((person, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{person.name}</span>
                      <span className="text-muted-foreground">({person.relationship})</span>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}
            
            {/* Metadata */}
            <DetailSection title="Metadata">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Created: {new Date(persona.createdAt).toLocaleDateString()}</p>
                <p>Last Updated: {new Date(persona.lastUpdated).toLocaleDateString()}</p>
                <p>Version: {persona.version}</p>
              </div>
            </DetailSection>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function QuickStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function StyleBar({
  label,
  value,
  leftLabel,
  rightLabel,
}: {
  label: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{leftLabel}</span>
        <span>{label}</span>
        <span>{rightLabel}</span>
      </div>
      <Progress value={value * 100} className="h-2" />
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4">
      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
        {icon}
        {title}
      </h5>
      {children}
    </div>
  );
}
