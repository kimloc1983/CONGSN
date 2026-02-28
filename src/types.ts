export interface Player {
  id: number;
  username: string;
  name: string;
  avatar: string;
  role: 'admin' | 'player';
}

export interface Question {
  id: number;
  level: number;
  question: string;
  answer: number;
}

export interface ScoreEntry {
  name: string;
  avatar: string;
  total_score: number;
}

export type View = 'home' | 'learning' | 'arena' | 'admin';
