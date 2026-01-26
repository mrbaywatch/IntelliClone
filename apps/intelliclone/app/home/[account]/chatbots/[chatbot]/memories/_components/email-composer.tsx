'use client';

/**
 * Email Composer Component
 * 
 * Composes emails in the user's personal style based on their persona.
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Alert, AlertDescription } from '@kit/ui/alert';
import {
  Mail,
  Copy,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';

import type { UserPersona, ComposedEmail, EmailCompositionRequest } from '~/lib/persona';

interface EmailComposerProps {
  persona: UserPersona;
  onCompose: (request: EmailCompositionRequest) => Promise<ComposedEmail>;
}

export function EmailComposer({ persona, onCompose }: EmailComposerProps) {
  const [recipient, setRecipient] = useState('');
  const [purpose, setPurpose] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [tone, setTone] = useState<'default' | 'formal' | 'casual' | 'friendly' | 'urgent'>('default');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [composedEmail, setComposedEmail] = useState<ComposedEmail | null>(null);
  const [copied, setCopied] = useState(false);
  
  const handleCompose = async () => {
    if (!recipient || !purpose) return;
    
    setIsLoading(true);
    try {
      const request: EmailCompositionRequest = {
        purpose,
        recipient,
        keyPoints: keyPoints.split('\n').filter(Boolean),
        toneOverride: tone === 'default' ? undefined : tone,
        length,
      };
      
      const result = await onCompose(request);
      setComposedEmail(result);
    } catch (error) {
      console.error('Failed to compose email:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = async () => {
    if (!composedEmail) return;
    
    const fullEmail = `Subject: ${composedEmail.subject}\n\n${composedEmail.body}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleReset = () => {
    setComposedEmail(null);
    setRecipient('');
    setPurpose('');
    setKeyPoints('');
    setTone('default');
    setLength('medium');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Composer
        </CardTitle>
        <CardDescription>
          Write emails in your personal style based on what we've learned about you
        </CardDescription>
      </CardHeader>
      <CardContent>
        {persona.overallConfidence < 0.3 && (
          <Alert variant="default" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              We haven't learned much about your writing style yet. Keep chatting to improve personalization!
            </AlertDescription>
          </Alert>
        )}
        
        {!composedEmail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Name</Label>
                <Input
                  id="recipient"
                  placeholder="e.g., Ole Hansen"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                  <SelectTrigger id="tone">
                    <SelectValue placeholder="Use my default style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">My Default Style</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Email</Label>
              <Input
                id="purpose"
                placeholder="e.g., Follow up on our meeting about the Q2 budget"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keyPoints">Key Points (one per line)</Label>
              <Textarea
                id="keyPoints"
                placeholder="Thank them for their time&#10;Confirm the budget increase&#10;Schedule a follow-up meeting"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short & concise</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={composedEmail.styleMatchScore > 0.7 ? 'default' : 'secondary'}>
                  {Math.round(composedEmail.styleMatchScore * 100)}% style match
                </Badge>
                <Badge variant="outline">
                  {Math.round(composedEmail.confidenceScore * 100)}% confidence
                </Badge>
              </div>
            </div>
            
            {composedEmail.notes && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{composedEmail.notes}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label>Subject</Label>
              <div className="p-3 bg-muted rounded-md font-medium">
                {composedEmail.subject}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Email Body</Label>
              <div className="p-4 bg-muted rounded-md whitespace-pre-wrap text-sm">
                {composedEmail.body}
              </div>
            </div>
            
            {composedEmail.suggestedFollowUp && (
              <div className="space-y-2">
                <Label>Suggested Follow-up</Label>
                <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                  {composedEmail.suggestedFollowUp}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!composedEmail ? (
          <Button
            onClick={handleCompose}
            disabled={!recipient || !purpose || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Composing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Compose Email
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
            <Button onClick={handleCopy} className="flex-1">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Email
                </>
              )}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
