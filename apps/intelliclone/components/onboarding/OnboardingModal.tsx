'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, User, Briefcase, Target, Check } from 'lucide-react';

interface OnboardingModalProps {
  userId: string;
  onComplete: () => void;
}

type Step = 'welcome' | 'name' | 'work' | 'goals' | 'complete';

export default function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [work, setWork] = useState('');
  const [goals, setGoals] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const steps: Step[] = ['welcome', 'name', 'work', 'goals', 'complete'];
  const currentIndex = steps.indexOf(step);

  const nextStep = () => {
    const next = steps[currentIndex + 1];
    if (next) setStep(next);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Save memories
      const memories = [];
      
      if (name) {
        memories.push({ key: 'name', value: name, category: 'personal' });
      }
      if (work) {
        memories.push({ key: 'occupation', value: work, category: 'work' });
      }
      if (goals) {
        memories.push({ key: 'goals', value: goals, category: 'goals' });
      }

      // Save each memory
      for (const memory of memories) {
        await fetch('/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            key: memory.key,
            value: memory.value,
            category: memory.category,
          }),
        });
      }

      // Mark onboarding complete in localStorage
      localStorage.setItem(`onboarding_complete_${userId}`, 'true');
      
      setStep('complete');
      setTimeout(onComplete, 2000);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-12">
          {steps.slice(0, -1).map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= currentIndex ? 'bg-gray-900 w-6' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Welcome */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-200">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-4">
                Hei! Jeg er Erik
              </h1>
              <p className="text-gray-500 text-lg mb-12 leading-relaxed">
                Din personlige AI-assistent som husker alt om deg
              </p>
              <button
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 transition-colors"
              >
                La oss bli kjent
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Name */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <User className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Hva heter du?
              </h2>
              <p className="text-gray-400 mb-8">
                Så jeg kan tiltale deg med navn
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ditt navn"
                autoFocus
                className="w-full px-6 py-4 text-lg text-center border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              />
              <div className="flex gap-3 mt-8">
                <button
                  onClick={nextStep}
                  className="flex-1 px-6 py-4 text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  Hopp over
                </button>
                <button
                  onClick={nextStep}
                  disabled={!name}
                  className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  Neste
                </button>
              </div>
            </motion.div>
          )}

          {/* Work */}
          {step === 'work' && (
            <motion.div
              key="work"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Briefcase className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Hva jobber du med{name ? `, ${name}` : ''}?
              </h2>
              <p className="text-gray-400 mb-8">
                Kort om hva du driver med
              </p>
              <textarea
                value={work}
                onChange={(e) => setWork(e.target.value)}
                placeholder="f.eks. 'Driver eget firma innen regnskap' eller 'Jobber som utvikler'"
                rows={3}
                className="w-full px-6 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none"
              />
              <div className="flex gap-3 mt-8">
                <button
                  onClick={nextStep}
                  className="flex-1 px-6 py-4 text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  Hopp over
                </button>
                <button
                  onClick={nextStep}
                  disabled={!work}
                  className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  Neste
                </button>
              </div>
            </motion.div>
          )}

          {/* Goals */}
          {step === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Target className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Hva kan jeg hjelpe deg med?
              </h2>
              <p className="text-gray-400 mb-8">
                Hva ønsker du å bruke meg til?
              </p>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="f.eks. 'Hjelp med skriving og research' eller 'Sparringspartner for forretningsideer'"
                rows={3}
                className="w-full px-6 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none"
              />
              <div className="flex gap-3 mt-8">
                <button
                  onClick={nextStep}
                  className="flex-1 px-6 py-4 text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  Hopp over
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Lagrer...' : 'Fullfør'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Perfekt{name ? `, ${name}` : ''}!
              </h2>
              <p className="text-gray-500 text-lg">
                Nå kjenner jeg deg litt bedre. La oss chatte!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
