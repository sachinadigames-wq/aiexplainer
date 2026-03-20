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
  const [currentTopic, setCurrentTopic] = useState('');

  const generateExplanation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      setError("API Key is missing. Please add GEMINI_API_KEY to your environment variables and redeploy.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setQuizAnswers({});
    setShowQuizResults(false);
    setCurrentTopic(topic);

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
    } catch (err: any) {
      console.error("Error generating content:", err);
      if (err.message?.includes("Failed to fetch")) {
        setError("Network error: Failed to reach Gemini API. Check your internet connection or if your region is supported.");
      } else {
        setError(err.message || "Failed to fetch explanation. Please try again.");
      }
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-violet-200 selection:text-violet-900">
      {/* Vibrant Background Accents */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-violet-200/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-pink-200/30 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-emerald-200/30 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
            <div className="w-11 h-11 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-violet-200 shadow-xl group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Topic Explainer
            </h1>
          </div>
          {data && (
            <button 
              onClick={reset}
              className="px-4 py-2 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2 border border-slate-200"
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center space-y-10 py-16"
            >
              <div className="space-y-6">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[1.1]">
                  Learn <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500">Anything</span> <br />
                  in Seconds.
                </h2>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                  Enter any topic and we'll break it down with simple language, visuals, and interactive quizzes.
                </p>
              </div>

              <form onSubmit={generateExplanation} className="relative max-w-2xl mx-auto group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 rounded-[2.5rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Photosynthesis, Blockchain, Black Holes..."
                    className="w-full px-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] text-xl shadow-2xl focus:outline-none focus:border-violet-500 transition-all placeholder:text-slate-400 font-medium"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !topic.trim()}
                    className="absolute right-3 top-3 bottom-3 px-8 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-[1.5rem] font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-violet-200 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        Explain <ArrowRight size={24} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 font-bold flex items-center justify-center gap-2 bg-red-50 py-3 px-6 rounded-full w-fit mx-auto border border-red-100"
                >
                  <XCircle size={20} /> {error}
                </motion.p>
              )}

              <div className="flex flex-wrap justify-center gap-3 pt-6">
                {['Quantum Mechanics', 'Ancient Rome', 'How AI works', 'The Water Cycle', 'Bitcoin'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setTopic(suggestion); }}
                    className="px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-600 hover:border-violet-400 hover:text-violet-600 hover:shadow-md transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-16 pb-32"
            >
              {/* Topic Header & Image */}
              <div className="space-y-8">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative overflow-hidden rounded-[2.5rem] border-8 border-white shadow-2xl">
                    <img 
                      src={`https://picsum.photos/seed/${encodeURIComponent(currentTopic)}/1200/600`} 
                      alt={currentTopic}
                      className="w-full h-[300px] md:h-[400px] object-cover hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-10">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-600 text-white rounded-full text-xs font-black uppercase tracking-[0.2em]">
                          Deep Dive
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                          {currentTopic}
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                        <BookOpen size={24} />
                      </div>
                      The Big Picture
                    </h3>
                    <div className="prose prose-slate max-w-none text-xl leading-relaxed text-slate-700 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                      <ReactMarkdown>{data.explanation}</ReactMarkdown>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                        <FileText size={24} />
                      </div>
                      Quick Recap
                    </h3>
                    <div className="p-8 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-[2.5rem] shadow-xl shadow-violet-200 h-full">
                      <p className="text-lg font-bold leading-relaxed italic opacity-90">
                        "{data.summary}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Points */}
              <section className="space-y-8">
                <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                    <ListChecks size={24} />
                  </div>
                  5 Essential Takeaways
                </h3>
                <div className="grid gap-4">
                  {data.keyPoints.map((point, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="flex gap-6 p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:border-violet-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-violet-600 group-hover:text-white rounded-2xl flex items-center justify-center font-black text-xl transition-colors">
                        {i + 1}
                      </div>
                      <p className="text-slate-700 font-bold text-lg self-center">{point}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Pros and Cons */}
              <section className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <ThumbsUp size={24} />
                    </div>
                    The Good Stuff
                  </h3>
                  <div className="space-y-4">
                    {data.pros.map((pro, i) => (
                      <div key={i} className="flex gap-4 p-6 bg-emerald-50/40 border-2 border-emerald-100 rounded-[2rem] text-emerald-900">
                        <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={24} />
                        <p className="font-bold text-lg">{pro}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                      <ThumbsDown size={24} />
                    </div>
                    The Challenges
                  </h3>
                  <div className="space-y-4">
                    {data.cons.map((con, i) => (
                      <div key={i} className="flex gap-4 p-6 bg-rose-50/40 border-2 border-rose-100 rounded-[2rem] text-rose-900">
                        <XCircle className="text-rose-500 flex-shrink-0" size={24} />
                        <p className="font-bold text-lg">{con}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Quiz Section */}
              <section className="space-y-8">
                <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <HelpCircle size={24} />
                  </div>
                  Quick Quiz
                </h3>
                <div className="space-y-10 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
                  {data.quiz.map((q, qIndex) => (
                    <div key={qIndex} className="space-y-6">
                      <p className="font-black text-2xl text-slate-800 leading-tight">
                        <span className="text-indigo-600 mr-2">Q{qIndex + 1}.</span> {q.question}
                      </p>
                      <div className="grid gap-4">
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
                                w-full text-left p-6 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group
                                ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}
                                ${showCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : ''}
                                ${showWrong ? 'border-rose-500 bg-rose-50 text-rose-900' : ''}
                              `}
                            >
                              <span className="font-bold text-lg">{option}</span>
                              {showCorrect && <CheckCircle2 className="text-emerald-500" size={24} />}
                              {showWrong && <XCircle className="text-rose-500" size={24} />}
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
                      className="w-full py-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-[2rem] font-black text-xl hover:shadow-2xl hover:shadow-violet-200 disabled:from-slate-300 disabled:to-slate-400 transition-all active:scale-[0.98]"
                    >
                      Check My Answers
                    </button>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-10 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2.5rem] text-center space-y-6 shadow-2xl"
                    >
                      <div className="space-y-2 text-white">
                        <p className="text-4xl font-black">
                          {data.quiz.filter((q, i) => quizAnswers[i] === q.correctAnswer).length} / {data.quiz.length}
                        </p>
                        <p className="text-xl font-bold opacity-80">Correct Answers!</p>
                      </div>
                      <button
                        onClick={() => { setQuizAnswers({}); setShowQuizResults(false); }}
                        className="px-8 py-3 bg-white text-violet-600 font-black rounded-full hover:bg-violet-50 transition-all shadow-lg"
                      >
                        Try Again
                      </button>
                    </motion.div>
                  )}
                </div>
              </section>

              {/* Footer Action */}
              <div className="flex justify-center pt-12">
                <button 
                  onClick={reset}
                  className="group relative px-10 py-5 font-black text-xl text-white transition-all duration-200 bg-slate-900 rounded-[2rem] hover:bg-slate-800 active:scale-95"
                >
                  <span className="flex items-center gap-3">
                    <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-500" /> 
                    Explore Another Topic
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-16 border-t border-slate-200 text-center space-y-4">
        <div className="flex justify-center gap-6 text-slate-400">
          <BookOpen size={20} />
          <HelpCircle size={20} />
          <FileText size={20} />
        </div>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
          Powered by Gemini AI • Built for curious minds
        </p>
      </footer>
    </div>
  );
}
