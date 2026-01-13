
export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export enum QuizState {
  START = 'START',
  LOADING = 'LOADING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED'
}

export interface QuizResults {
  score: number;
  total: number;
  answers: Record<string, number>;
  questions: Question[];
  timeSpent: number;
}
