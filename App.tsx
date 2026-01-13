
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuizState, Question, QuizResults } from './types';
import { generateQuizQuestions } from './services/geminiService';
import Timer from './components/Timer';
import { Trophy, Brain, ChevronRight, ChevronLeft, RefreshCcw, BookOpen, AlertCircle, Loader2, Cpu, Ruler, Atom, Calculator } from 'lucide-react';

const LOADING_MESSAGES = [
  { text: "Architecting the questions...", icon: <Ruler className="w-6 h-6" /> },
  { text: "Deriving partial differential equations...", icon: <Calculator className="w-6 h-6" /> },
  { text: "Synthesizing chemical properties...", icon: <Atom className="w-6 h-6" /> },
  { text: "Compiling logical reasoning matrices...", icon: <Brain className="w-6 h-6" /> },
  { text: "Optimizing thermal dynamics...", icon: <Cpu className="w-6 h-6" /> },
  { text: "Calculating structural loads...", icon: <Ruler className="w-6 h-6" /> },
  { text: "Simulating quantum states...", icon: <Atom className="w-6 h-6" /> },
  { text: "Balancing stoichiometry equations...", icon: <Calculator className="w-6 h-6" /> },
  { text: "Verifying circuit topologies...", icon: <Cpu className="w-6 h-6" /> },
  { text: "Fact-checking engineering history...", icon: <BookOpen className="w-6 h-6" /> }
];

const App: React.FC = () => {
  const [state, setState] = useState<QuizState>(QuizState.START);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
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
    setState(QuizState.LOADING);
    try {
      const q = await generateQuizQuestions();
      setQuestions(q);
      setState(QuizState.ACTIVE);
      setCurrentIdx(0);
      setUserAnswers({});
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the quiz engine. Check your internet.");
      setState(QuizState.START);
    }
  };

  const finishQuiz = useCallback(() => {
    let score = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    setResults({
      score,
      total: questions.length,
      answers: userAnswers,
      questions,
      timeSpent: 21 
    });
    setState(QuizState.FINISHED);
  }, [questions, userAnswers]);

  const handleSelectOption = (qId: string, optionIdx: number) => {
    setUserAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  if (state === QuizState.START) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-white text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Engineering Faculty Practice</h1>
            <p className="text-blue-100 opacity-90">Interdepartmental Quiz Preparation</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1 font-medium">Questions</p>
                <p className="text-2xl font-bold text-slate-800">50</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1 font-medium">Time Limit</p>
                <p className="text-2xl font-bold text-slate-800">21m</p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Topics Covered:</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2 text-blue-500" /> Advanced Calculus (PDE, ODE, Higher Order)</li>
                <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2 text-blue-500" /> Engineering Physics & Chemistry</li>
                <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2 text-blue-500" /> Mathematical Logic & Analytical Reasoning</li>
                <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2 text-blue-500" /> General Engineering Knowledge</li>
              </ul>
            </div>
            <button 
              onClick={startQuiz}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/20"
            >
              Start Practice Session
            </button>
            <p className="text-center text-xs text-slate-400">Personalized questions generated for every session.</p>
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
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[140px] flex flex-col justify-center transition-all duration-500 ease-in-out">
            <div className="flex justify-center mb-3 text-blue-500 animate-bounce">
              {LOADING_MESSAGES[loadingStep].icon}
            </div>
            <p className="text-xl font-bold text-slate-800 mb-2">
              {LOADING_MESSAGES[loadingStep].text}
            </p>
            <p className="text-slate-400 text-sm">
              Sourcing university-level problems from our knowledge base...
            </p>
          </div>
          
          <div className="mt-8 flex justify-center gap-1">
            {LOADING_MESSAGES.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${i === loadingStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`}
              />
            ))}
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
            <div className={`p-10 text-center ${percentage >= 70 ? 'bg-green-600' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-600'} text-white`}>
              <Trophy className="w-20 h-20 mx-auto mb-4" />
              <h2 className="text-4xl font-black mb-2">Quiz Complete!</h2>
              <p className="text-lg opacity-90">Great practice for the interdepartmental competition.</p>
            </div>
            
            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Your Score</p>
                  <p className="text-5xl font-black text-slate-800">{results.score}<span className="text-2xl text-slate-400 font-medium">/{results.total}</span></p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Percentage</p>
                  <p className="text-5xl font-black text-slate-800">{Math.round(percentage)}%</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Status</p>
                  <p className={`text-3xl font-black ${percentage >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                    {percentage >= 70 ? 'EXCELLENT' : percentage >= 40 ? 'QUALIFIED' : 'NEEDS WORK'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button 
                  onClick={startQuiz}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  <RefreshCcw className="w-5 h-5 mr-2" /> New Random Quiz
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
                >
                  Return Home
                </button>
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-blue-600" /> Review Questions
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
                                {i === q.correctAnswer && <span className="ml-2 font-bold">(Correct)</span>}
                                {i === userAns && !isCorrect && <span className="ml-2 font-bold">(Your Choice)</span>}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-start bg-white p-4 rounded-xl border border-slate-200">
                            <AlertCircle className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-600 leading-relaxed italic">
                              <span className="font-bold text-slate-800 not-italic mr-1">Explanation:</span> {q.explanation}
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
