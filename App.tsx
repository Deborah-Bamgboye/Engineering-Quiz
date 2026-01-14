
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuizState, Question, QuizResults, Attempt } from './types';
import { generateQuizQuestions } from './services/geminiService';
import { saveQuizAttempt, getRecentAttempts, getGlobalAttempts } from './services/firebaseService';
import Timer from './components/Timer';
import { Trophy, Brain, ChevronRight, ChevronLeft, RefreshCcw, BookOpen, AlertCircle, Loader2, Cpu, Ruler, Atom, Calculator, Cloud, Save, User, BarChart3, ArrowLeft } from 'lucide-react';

const LOADING_MESSAGES = [
  { text: "Architecting the questions...", icon: <Ruler className="w-6 h-6" /> },
  { text: "Deriving partial differential equations...", icon: <Calculator className="w-6 h-6" /> },
  { text: "Synthesizing chemical properties...", icon: <Atom className="w-6 h-6" /> },
  { text: "Compiling logical reasoning matrices...", icon: <Brain className="w-6 h-6" /> },
  { text: "Optimizing thermal dynamics...", icon: <Cpu className="w-6 h-6" /> },
  { text: "Calculating structural loads...", icon: <Ruler className="w-6 h-6" /> },
];

const App: React.FC = () => {
  const [state, setState] = useState<QuizState>(QuizState.START);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [globalAttempts, setGlobalAttempts] = useState<Attempt[]>([]);
  const [codeName, setCodeName] = useState(localStorage.getItem('eng_quiz_codename') || '');
  const [isSaving, setIsSaving] = useState(false);
  const loadingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (state === QuizState.START) {
      getRecentAttempts().then(setRecentAttempts);
    }
    if (state === QuizState.MONITOR) {
      getGlobalAttempts().then(setGlobalAttempts);
    }
    if (state === QuizState.LOADING) {
      loadingIntervalRef.current = window.setInterval(() => {
        setLoadingStep(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [state]);

  const startQuiz = async () => {
    if (!codeName.trim()) {
      alert("Please enter a Code Name to identify your progress.");
      return;
    }
    localStorage.setItem('eng_quiz_codename', codeName);
    setState(QuizState.LOADING);
    try {
      const q = await generateQuizQuestions();
      setQuestions(q);
      setState(QuizState.ACTIVE);
      setCurrentIdx(0);
      setUserAnswers({});
      setResults(null);
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the quiz engine.");
      setState(QuizState.START);
    }
  };

  const finishQuiz = useCallback(async () => {
    let score = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const newResults: QuizResults = {
      score,
      total: questions.length,
      answers: userAnswers,
      questions,
      timeSpent: 21,
      codeName
    };
    
    setResults(newResults);
    setState(QuizState.FINISHED);

    setIsSaving(true);
    await saveQuizAttempt(score, questions.length, codeName);
    setIsSaving(false);
  }, [questions, userAnswers, codeName]);

  const handleSelectOption = (qId: string, optionIdx: number) => {
    setUserAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  if (state === QuizState.MONITOR) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                  Live Progress Monitor
                </h2>
                <p className="text-slate-400 text-sm mt-1">Real-time faculty leaderboard and attempt log</p>
              </div>
              <button 
                onClick={() => setState(QuizState.START)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-100">
                      <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest">Code Name</th>
                      <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest text-center">Score</th>
                      <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest text-center">Efficiency</th>
                      <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {globalAttempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {attempt.codeName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-700">{attempt.codeName}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center font-bold text-slate-800">{attempt.score}/{attempt.total}</td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            attempt.percentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {Math.round(attempt.percentage)}%
                          </span>
                        </td>
                        <td className="py-4 text-right text-sm text-slate-400">
                          {new Date(attempt.timestamp).toLocaleDateString()} {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                    {globalAttempts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-slate-400 italic">No global data found yet. Be the first to complete!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === QuizState.START) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-white text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 uppercase tracking-tighter">Engineers Arena</h1>
            <p className="text-blue-100 opacity-90">Interdepartmental Practice Module</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 block">Enter Your Code Name</span>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={codeName}
                    onChange={(e) => setCodeName(e.target.value)}
                    placeholder="e.g. Cyber_Pulse_01"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-semibold text-slate-800"
                  />
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={startQuiz}
                className="py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                Start Quiz
              </button>
              <button 
                onClick={() => setState(QuizState.MONITOR)}
                className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-5 h-5" /> Monitor
              </button>
            </div>

            {recentAttempts.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                  <Cloud className="w-3 h-3 mr-1" /> Your Local Best
                </h4>
                <div className="space-y-2">
                  {recentAttempts.slice(0, 3).map((attempt, i) => (
                    <div key={i} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-slate-100">
                      <span className="text-slate-600 font-medium">Attempt {i+1}</span>
                      <span className="font-bold text-blue-600">{attempt.score}/{attempt.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === QuizState.LOADING) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-20">
              <div className="w-24 h-24 bg-blue-400 rounded-full"></div>
            </div>
            <div className="relative bg-white w-24 h-24 rounded-3xl shadow-xl flex items-center justify-center mx-auto border border-blue-100">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[140px] flex flex-col justify-center">
            <div className="flex justify-center mb-3 text-blue-500 animate-bounce">
              {LOADING_MESSAGES[loadingStep].icon}
            </div>
            <p className="text-xl font-bold text-slate-800 mb-2">
              {LOADING_MESSAGES[loadingStep].text}
            </p>
            <p className="text-slate-400 text-sm italic">
              Deploying logic for {codeName}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === QuizState.ACTIVE) {
    const q = questions[currentIdx];
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <Timer initialMinutes={21} onTimeUp={finishQuiz} />
        
        <div className="max-w-4xl mx-auto px-4 pt-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {q.category}
              </span>
              <h2 className="text-sm text-slate-500 mt-2 font-medium uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</h2>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-800">{Math.round(progress)}%</span>
            </div>
          </div>
          
          <div className="w-full bg-slate-200 h-2 rounded-full mb-8 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8 border border-slate-100">
            <h3 className="text-xl md:text-2xl font-semibold text-slate-800 leading-relaxed mb-8">
              {q.question}
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectOption(q.id, i)}
                  className={`flex items-center p-5 rounded-2xl border-2 transition-all text-left ${
                    userAnswers[q.id] === i 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold text-sm ${
                    userAnswers[q.id] === i ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-lg font-medium">{opt}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center gap-4">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="flex items-center px-6 py-3 rounded-xl font-bold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Previous
            </button>
            
            {currentIdx === questions.length - 1 ? (
              <button
                onClick={finishQuiz}
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition-all"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
              >
                Next <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === QuizState.FINISHED && results) {
    const percentage = (results.score / results.total) * 100;
    
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 border border-slate-100">
            <div className={`p-10 text-center ${percentage >= 70 ? 'bg-green-600' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-600'} text-white transition-colors duration-1000`}>
              <Trophy className="w-20 h-20 mx-auto mb-4" />
              <h2 className="text-4xl font-black mb-2">Assignment Terminated</h2>
              <p className="text-white/80 font-mono tracking-widest text-sm uppercase">Subject: {codeName}</p>
            </div>
            
            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Final Score</p>
                  <p className="text-5xl font-black text-slate-800">{results.score}<span className="text-2xl text-slate-400 font-medium">/{results.total}</span></p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Grade</p>
                  <p className="text-5xl font-black text-slate-800">{Math.round(percentage)}%</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Status</p>
                  <p className={`text-3xl font-black ${percentage >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                    {percentage >= 70 ? 'ELITE' : percentage >= 40 ? 'PASS' : 'RETAKE'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-12">
                <button 
                  onClick={startQuiz}
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:-translate-y-1 active:translate-y-0"
                >
                  <RefreshCcw className="w-6 h-6 mr-3" /> Start New Set
                </button>
                <button 
                  onClick={() => setState(QuizState.MONITOR)}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-xl flex items-center justify-center hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                  <BarChart3 className="w-6 h-6 mr-3" /> View Global Board
                </button>
                <button 
                  onClick={() => setState(QuizState.START)}
                  className="py-4 text-slate-500 font-bold flex items-center justify-center hover:text-slate-800 transition-all"
                >
                  Exit Practice
                </button>
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-blue-600" /> Technical Review
              </h3>
              
              <div className="space-y-6">
                {results.questions.map((q, idx) => {
                  const userAns = results.answers[q.id];
                  const isCorrect = userAns === q.correctAnswer;
                  return (
                    <div key={q.id} className={`p-6 rounded-2xl border-2 ${isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                      <div className="flex items-start gap-4">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-lg font-bold text-slate-800 mb-3">{q.question}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                            {q.options.map((opt, i) => (
                              <div key={i} className={`p-3 rounded-xl text-sm font-medium ${
                                i === q.correctAnswer ? 'bg-green-100 text-green-800' : 
                                i === userAns ? 'bg-red-100 text-red-800' : 'bg-white text-slate-500'
                              }`}>
                                {opt}
                                {i === q.correctAnswer && <span className="ml-2 font-bold">✓</span>}
                              </div>
                            ))}
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="text-sm text-slate-600 leading-relaxed italic">
                              <span className="font-bold text-slate-800 not-italic mr-1">Logic:</span> {q.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
