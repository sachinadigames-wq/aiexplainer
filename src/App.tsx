/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Search, BookOpen, ListChecks, HelpCircle, FileText, Loader2, CheckCircle2, XCircle, ArrowRight, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface TopicData {
  explanation: string;
  keyPoints: string[];
  pros: string[];
  cons: string[];
  quiz: QuizQuestion[];
  summary: string;
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TopicData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const generateExplanation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);
    setQuizAnswers({});
    setShowQuizResults(false);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain the topic "${topic}" in simple, beginner-friendly language. Provide 5 key points, 3 pros, 3 cons, 3 multiple-choice quiz questions, and a short summary.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING, description: "A simple, clear explanation of the topic." },
              keyPoints: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "5 key points summarizing the most important aspects."
              },
              pros: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 pros or advantages of the topic."
              },
              cons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 cons or disadvantages of the topic."
              },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING, description: "The exact string from the options that is correct." }
                  },
                  required: ["question", "options", "correctAnswer"]
                },
                description: "3 multiple-choice quiz questions."
              },
              summary: { type: Type.STRING, description: "A short, concise summary of the topic." }
            },
            required: ["explanation", "keyPoints", "pros", "cons", "quiz", "summary"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setData(result);
    } catch (err) {
      console.error("Error generating content:", err);
      setError("Failed to fetch explanation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = (questionIndex: number, answer: string) => {
    if (showQuizResults) return;
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const checkQuiz = () => {
    setShowQuizResults(true);
  };

  const reset = () => {
    setTopic('');
    setData(null);
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <BookOpen size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Topic Explainer</h1>
          </div>
          {data && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-neutral-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={14} />
              New Topic
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!data ? (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 py-12"
            >
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
                  What would you like to <span className="text-indigo-600">learn</span> today?
                </h2>
                <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                  Enter any topic—from Quantum Physics to how a toaster works—and we'll break it down for you.
                </p>
              </div>

              <form onSubmit={generateExplanation} className="relative max-w-xl mx-auto group">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, Blockchain, Black Holes..."
                  className="w-full px-6 py-5 bg-white border-2 border-neutral-200 rounded-2xl text-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-neutral-400"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !topic.trim()}
                  className="absolute right-3 top-3 bottom-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Explain <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              {error && (
                <p className="text-red-500 font-medium flex items-center justify-center gap-2">
                  <XCircle size={18} /> {error}
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {['Quantum Mechanics', 'Ancient Rome', 'How AI works', 'The Water Cycle'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setTopic(suggestion); }}
                    className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12 pb-24"
            >
              {/* Hero Section */}
              <section className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold uppercase tracking-wider">
                  Topic: {topic}
                </div>
                <h2 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                  <BookOpen className="text-indigo-600" /> Simple Explanation
                </h2>
                <div className="prose prose-neutral max-w-none text-lg leading-relaxed text-neutral-700 bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
                  <ReactMarkdown>{data.explanation}</ReactMarkdown>
                </div>
              </section>

              {/* Key Points */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                  <ListChecks className="text-indigo-600" /> 5 Key Points
                </h2>
                <div className="grid gap-4">
                  {data.keyPoints.map((point, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="flex gap-4 p-5 bg-white border border-neutral-200 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <p className="text-neutral-700 font-medium">{point}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Pros and Cons */}
              <section className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                    <ThumbsUp className="text-emerald-600" /> Pros
                  </h2>
                  <div className="space-y-3">
                    {data.pros.map((pro, i) => (
                      <div key={i} className="flex gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-emerald-900">
                        <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={20} />
                        <p className="font-medium text-sm">{pro}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                    <ThumbsDown className="text-red-600" /> Cons
                  </h2>
                  <div className="space-y-3">
                    {data.cons.map((con, i) => (
                      <div key={i} className="flex gap-3 p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-900">
                        <XCircle className="text-red-500 flex-shrink-0" size={20} />
                        <p className="font-medium text-sm">{con}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Quiz Section */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                  <HelpCircle className="text-indigo-600" /> Test Your Knowledge
                </h2>
                <div className="space-y-8 bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
                  {data.quiz.map((q, qIndex) => (
                    <div key={qIndex} className="space-y-4">
                      <p className="font-bold text-lg text-neutral-800">
                        {qIndex + 1}. {q.question}
                      </p>
                      <div className="grid gap-3">
                        {q.options.map((option, oIndex) => {
                          const isSelected = quizAnswers[qIndex] === option;
                          const isCorrect = option === q.correctAnswer;
                          const showCorrect = showQuizResults && isCorrect;
                          const showWrong = showQuizResults && isSelected && !isCorrect;

                          return (
                            <button
                              key={oIndex}
                              onClick={() => handleQuizAnswer(qIndex, option)}
                              disabled={showQuizResults}
                              className={`
                                w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between
                                ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-100 bg-neutral-50 hover:border-neutral-200'}
                                ${showCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : ''}
                                ${showWrong ? 'border-red-500 bg-red-50 text-red-900' : ''}
                              `}
                            >
                              <span className="font-medium">{option}</span>
                              {showCorrect && <CheckCircle2 className="text-emerald-500" size={20} />}
                              {showWrong && <XCircle className="text-red-500" size={20} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {!showQuizResults ? (
                    <button
                      onClick={checkQuiz}
                      disabled={Object.keys(quizAnswers).length < data.quiz.length}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-neutral-300 transition-all shadow-lg active:scale-95"
                    >
                      Check Answers
                    </button>
                  ) : (
                    <div className="p-6 bg-indigo-50 rounded-2xl text-center space-y-4">
                      <p className="text-indigo-900 font-bold text-xl">
                        You got {data.quiz.filter((q, i) => quizAnswers[i] === q.correctAnswer).length} out of {data.quiz.length} correct!
                      </p>
                      <button
                        onClick={() => { setQuizAnswers({}); setShowQuizResults(false); }}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        Try Quiz Again
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Summary */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                  <FileText className="text-indigo-600" /> Summary
                </h2>
                <div className="p-8 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-200">
                  <p className="text-xl font-medium leading-relaxed italic">
                    "{data.summary}"
                  </p>
                </div>
              </section>

              {/* Footer Action */}
              <div className="flex justify-center pt-8">
                <button 
                  onClick={reset}
                  className="px-8 py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <RefreshCw size={20} /> Explain Another Topic
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-neutral-200 text-center text-neutral-400 text-sm">
        <p>Powered by Gemini AI • Built for curious minds</p>
      </footer>
    </div>
  );
}
