/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Trophy, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  LogOut,
  Plus,
  Trash2,
  Medal,
  Star,
  Gamepad2
} from 'lucide-react';
import { Player, Question, ScoreEntry, View } from './types';

// --- Components ---

const LearningSection = () => {
  const [position, setPosition] = useState(0);
  const [inputExpression, setInputExpression] = useState("");
  const [allMoves, setAllMoves] = useState<{ from: number; to: number; val: number; id: number }[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<number[]>([]);

  const parseExpression = (expr: string): number[] => {
    const matches = expr.match(/-?\d+/g);
    return matches ? matches.map(Number) : [];
  };

  const executeExpression = async () => {
    const steps = parseExpression(inputExpression);
    if (steps.length === 0) return;

    setIsAnimating(true);
    setShowResult(false);
    setPosition(0);
    setAllMoves([]);
    setCurrentSteps([]);

    let currentPos = 0;
    let moveId = 0;
    for (let i = 0; i < steps.length; i++) {
      const val = steps[i];
      const nextPos = currentPos + val;
      const clampedNextPos = Math.max(-10, Math.min(10, nextPos));
      const actualMove = clampedNextPos - currentPos;

      // Update direction and steps before moving
      setCurrentSteps(prev => [...prev, actualMove]);
      
      // Small delay to allow state update for direction
      await new Promise(resolve => setTimeout(resolve, 100));

      const newMove = { from: currentPos, to: clampedNextPos, val: actualMove, id: moveId++ };
      setAllMoves(prev => [...prev, newMove]);
      setPosition(clampedNextPos);
      currentPos = clampedNextPos;

      // Wait for animation to finish (1.2s for tween + some buffer)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // If not the last step, pause for 4 seconds
      if (i < steps.length - 1) {
        setIsAnimating(false); // Stop jumping animation during pause
        await new Promise(resolve => setTimeout(resolve, 4000));
        setIsAnimating(true); // Resume jumping for next move
      }
    }
    setIsAnimating(false);
  };

  const reset = () => {
    setPosition(0);
    setInputExpression("");
    setAllMoves([]);
    setShowResult(false);
    setCurrentSteps([]);
  };

  const stepWidth = 35; // px per unit

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[3rem] shadow-2xl border border-orange-100 max-w-5xl mx-auto w-full">
      <h2 className="text-4xl font-black text-orange-600 mb-10 flex items-center gap-3 tracking-tight">
        <div className="p-2 bg-orange-100 rounded-xl">
          <BookOpen className="w-8 h-8" />
        </div>
        HỌC TẬP CỘNG SỐ NGUYÊN
      </h2>

      <div className="relative w-full h-80 flex items-end justify-center mb-12 bg-gradient-to-b from-slate-50 to-white rounded-[2rem] border-b-8 border-slate-200 overflow-visible px-10">
        {/* Number Line */}
        <div className="absolute bottom-16 w-[700px] h-1.5 bg-slate-300 flex justify-between">
          {Array.from({ length: 21 }).map((_, i) => {
            const num = i - 10;
            return (
              <div key={num} className="relative flex flex-col items-center">
                <div className={`w-0.5 ${num === 0 ? 'bg-red-500 h-6 w-1' : 'bg-slate-400 h-4'}`} />
                <span className={`absolute top-6 text-sm font-bold font-mono ${num === 0 ? 'text-red-600' : 'text-slate-500'}`}>
                  {num}
                </span>
                {position === num && (
                  <motion.div 
                    layoutId="projection"
                    className="absolute -top-56 w-px h-56 border-l border-dashed border-orange-400 opacity-50"
                  />
                )}
              </div>
            );
          })}
          <div className="absolute -left-4 -top-1.5 text-slate-300"><ChevronLeft className="w-5 h-5" /></div>
          <div className="absolute -right-4 -top-1.5 text-slate-300"><ChevronRight className="w-5 h-5" /></div>
        </div>

        {/* Movement Arrows */}
        <AnimatePresence>
          {allMoves.map((move, index) => {
            // Separate tracks for positive and negative moves
            // Positive moves are higher up, negative moves are lower down
            const baseBottom = move.val >= 0 ? 120 : 80;
            const yOffset = baseBottom + (index * 12);
            
            return (
              <motion.div
                key={move.id}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  bottom: `${yOffset}px`,
                  left: `calc(50% + ${Math.min(move.from, move.to) * stepWidth}px)`,
                  width: `${Math.abs(move.val) * stepWidth}px`,
                  height: '4px',
                  transformOrigin: move.val > 0 ? 'left' : 'right',
                  backgroundColor: move.val > 0 ? '#10b981' : '#ef4444',
                  borderRadius: '999px',
                  zIndex: 10 + index
                }}
              >
                <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${move.val > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {move.val > 0 ? `+${move.val}` : move.val}
                </div>
                <div className={`absolute top-1/2 -translate-y-1/2 ${move.val > 0 ? '-right-1' : '-left-1'}`}>
                  {move.val > 0 ? <ChevronRight className="w-4 h-4 text-emerald-500" /> : <ChevronLeft className="w-4 h-4 text-red-500" />}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Runner */}
        <motion.div 
          animate={{ x: position * stepWidth }}
          transition={{ type: "tween", ease: "easeInOut", duration: 1.2 }}
          className="absolute bottom-16 z-30"
        >
          <div className="relative flex flex-col items-center -translate-y-1">
            <motion.div 
              animate={{
                y: isAnimating ? [0, -10, 0] : 0,
                rotate: isAnimating ? (currentSteps[currentSteps.length-1] > 0 ? [0, 10, 0] : [0, -10, 0]) : 0,
                scaleX: currentSteps.length > 0 ? (currentSteps[currentSteps.length-1] < 0 ? -1 : 1) : 1
              }}
              transition={{ 
                y: { duration: 0.4, repeat: isAnimating ? Infinity : 0 },
                rotate: { duration: 0.4, repeat: isAnimating ? Infinity : 0 },
                scaleX: { duration: 0.2 }
              }}
              className="text-3xl drop-shadow-md"
            >
              🤖
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="w-full bg-slate-900 border-4 border-slate-800 p-8 rounded-[2.5rem] font-mono shadow-2xl mb-8 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">Nhập phép tính của bạn</div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-4xl justify-center">
          <div className="flex items-center justify-center gap-3 bg-slate-800 p-2 sm:p-4 rounded-2xl border-2 border-slate-700 focus-within:border-emerald-500 transition-all min-w-[300px] sm:min-w-[400px]">
            <input
              type="text"
              value={inputExpression}
              onChange={(e) => setInputExpression(e.target.value)}
              placeholder="Ví dụ: (-2) + 3"
              className="bg-transparent text-2xl sm:text-3xl font-bold text-emerald-400 focus:outline-none text-center placeholder:text-slate-700 w-full max-w-[250px]"
            />
            {!isAnimating && currentSteps.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 shrink-0"
              >
                <span className="text-slate-500">=</span>
                <span className="text-emerald-400">{position}</span>
              </motion.div>
            )}
          </div>
          <button
            onClick={executeExpression}
            disabled={isAnimating || !inputExpression}
            className="w-full sm:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95"
          >
            Thực hiện
          </button>
        </div>


      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button 
          onClick={reset}
          className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black transition-all flex items-center gap-2"
        >
          <LogOut className="w-5 h-5 rotate-180" /> XÓA HẾT
        </button>
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium italic">
          * Nhập các số cách nhau bởi dấu cộng, ví dụ: -2 + 5 + (-3)
        </div>
      </div>
    </div>
  );
};

const ArenaSection = ({ player, onLogout }: { player: Player; onLogout: () => void }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard').then(res => res.json()).then(setLeaderboard);
  }, [gameState]);

  const startLevel = async (lvl: number) => {
    const res = await fetch(`/api/questions/${lvl}`);
    const data = await res.json();
    setQuestions(data);
    setLevel(lvl);
    setCurrentQIndex(0);
    setScore(0);
    setGameState('playing');
    setUserAnswer('');
  };

  const submitAnswer = async () => {
    const currentQ = questions[currentQIndex];
    if (parseInt(userAnswer) === currentQ.answer) {
      setScore(s => s + 1);
    }

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(prev => prev + 1);
      setUserAnswer('');
    } else {
      // End of level
      const finalScore = score + (parseInt(userAnswer) === currentQ.answer ? 1 : 0);
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: player.id, level, score: finalScore })
      });
      setGameState('result');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{player.avatar}</div>
          <div>
            <div className="font-bold text-slate-900">{player.name}</div>
            <div className="text-xs text-slate-500">@{player.username}</div>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {gameState === 'menu' && (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Levels Selection */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-indigo-500" /> CHỌN CẤP ĐỘ
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => startLevel(lvl)}
                  className="group relative p-6 bg-white rounded-3xl border-2 border-slate-100 hover:border-indigo-500 transition-all shadow-sm hover:shadow-md overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="text-4xl mb-2">
                      {lvl === 1 ? '🌱' : lvl === 2 ? '🔥' : '⚡'}
                    </div>
                    <div className="font-bold text-slate-900">Cấp độ {lvl}</div>
                    <div className="text-xs text-slate-500">5 câu hỏi • 4đ để qua</div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Star className="w-24 h-24 fill-current" />
                  </div>
                </button>
              ))}
            </div>

            {/* Hall of Fame / Badges */}
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-lg shadow-indigo-200">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Medal className="w-6 h-6" /> BẢNG VINH DANH
              </h4>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm flex flex-col items-center w-24">
                  <div className="text-3xl mb-1">🥉</div>
                  <div className="text-[10px] uppercase font-bold opacity-80">Tập sự</div>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm flex flex-col items-center w-24">
                  <div className="text-3xl mb-1">🥈</div>
                  <div className="text-[10px] uppercase font-bold opacity-80">Chiến binh</div>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm flex flex-col items-center w-24">
                  <div className="text-3xl mb-1">🥇</div>
                  <div className="text-[10px] uppercase font-bold opacity-80">Huyền thoại</div>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" /> TOP CAO THỦ
            </h3>
            <div className="space-y-4">
              {leaderboard.map((entry, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${i < 3 ? 'bg-yellow-50 border border-yellow-100' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 font-bold ${i === 0 ? 'text-yellow-600' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-slate-300'}`}>
                      {i + 1}
                    </span>
                    <span className="text-xl">{entry.avatar}</span>
                    <span className="font-medium text-slate-700">{entry.name}</span>
                  </div>
                  <div className="font-bold text-slate-900">{entry.total_score}đ</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && questions.length > 0 && (
        <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
          <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">
            Câu hỏi {currentQIndex + 1} / {questions.length}
          </div>
          <div className="text-6xl font-black text-slate-900 mb-12">
            {questions[currentQIndex].question} = ?
          </div>
          <input
            autoFocus
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
            className="w-full text-center text-4xl p-6 bg-slate-50 rounded-3xl border-4 border-slate-100 focus:border-indigo-500 focus:outline-none transition-all mb-8"
            placeholder="Nhập kết quả..."
          />
          <button
            onClick={submitAnswer}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-bold text-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            Trả lời
          </button>
        </div>
      )}

      {gameState === 'result' && (
        <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
          <div className="text-8xl mb-6">
            {score >= 4 ? '🎉' : '😢'}
          </div>
          <h3 className="text-4xl font-black text-slate-900 mb-2">
            {score >= 4 ? 'TUYỆT VỜI!' : 'CỐ GẮNG LÊN!'}
          </h3>
          <p className="text-xl text-slate-500 mb-12">
            Bạn đạt được <span className="font-bold text-indigo-600">{score} / 5</span> điểm.
            {score >= 4 ? ' Bạn đã vượt qua cấp độ này!' : ' Bạn cần ít nhất 4 điểm để vượt qua.'}
          </p>
          <button
            onClick={() => setGameState('menu')}
            className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-3xl font-bold text-xl transition-all"
          >
            Quay lại Menu
          </button>
        </div>
      )}
    </div>
  );
};

const AdminSection = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tab, setTab] = useState<'players' | 'questions'>('players');

  useEffect(() => {
    fetch('/api/admin/players').then(res => res.json()).then(setPlayers);
    fetch('/api/admin/questions').then(res => res.json()).then(setQuestions);
  }, []);

  const deletePlayer = async (id: number) => {
    if (confirm('Xoá người chơi này?')) {
      await fetch(`/api/admin/players/${id}`, { method: 'DELETE' });
      setPlayers(prev => prev.filter(p => p.id !== id));
    }
  };

  const deleteQuestion = async (id: number) => {
    if (confirm('Xoá câu hỏi này?')) {
      await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="flex border-b border-slate-100">
        <button 
          onClick={() => setTab('players')}
          className={`flex-1 py-6 font-bold flex items-center justify-center gap-2 transition-colors ${tab === 'players' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <User className="w-5 h-5" /> QUẢN LÝ NGƯỜI CHƠI
        </button>
        <button 
          onClick={() => setTab('questions')}
          className={`flex-1 py-6 font-bold flex items-center justify-center gap-2 transition-colors ${tab === 'questions' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <BookOpen className="w-5 h-5" /> QUẢN LÝ CÂU HỎI
        </button>
      </div>

      <div className="p-8">
        {tab === 'players' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-sm uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4 font-medium">Avatar</th>
                  <th className="pb-4 font-medium">Tên</th>
                  <th className="pb-4 font-medium">Username</th>
                  <th className="pb-4 font-medium">Vai trò</th>
                  <th className="pb-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {players.map(p => (
                  <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 text-2xl">{p.avatar}</td>
                    <td className="py-4 font-bold text-slate-700">{p.name}</td>
                    <td className="py-4 text-slate-500">{p.username}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${p.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {p.role !== 'admin' && (
                        <button onClick={() => deletePlayer(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                <Plus className="w-5 h-5" /> Thêm câu hỏi
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {questions.map(q => (
                <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-bold">Cấp độ {q.level}</div>
                    <div className="text-xl font-bold text-slate-800">{q.question} = {q.answer}</div>
                  </div>
                  <button onClick={() => deleteQuestion(q.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }: { onLogin: (p: Player) => void }) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👦');

  const avatars = ['👦', '👧', '🦁', '🦊', '🐼', '🐨', '🐯', '🐸'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !name) return;
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, name, avatar })
    });
    const player = await res.json();
    onLogin(player);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">ĐẤU TRƯỜNG</h2>
        <p className="text-slate-500">Đăng nhập để bắt đầu thi đấu</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tên đăng nhập</label>
          <input
            required
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
            placeholder="Ví dụ: hocsinh123"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Họ và tên</label>
          <input
            required
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
            placeholder="Ví dụ: Nguyễn Văn A"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Chọn Avatar</label>
          <div className="grid grid-cols-4 gap-2">
            {avatars.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`text-3xl p-2 rounded-xl border-2 transition-all ${avatar === a ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          Vào Đấu Trường
        </button>
      </form>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<View>('home');
  const [player, setPlayer] = useState<Player | null>(null);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200 group-hover:rotate-12 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">CỘNG SỐ NGUYÊN</span>
          </button>

          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => setView('learning')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${view === 'learning' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Học tập
            </button>
            <button 
              onClick={() => setView('arena')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${view === 'arena' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Đấu trường
            </button>
            {player?.role === 'admin' && (
              <button 
                onClick={() => setView('admin')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${view === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Quản trị
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {player ? (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                <span className="text-xl">{player.avatar}</span>
                <span className="font-bold text-sm text-slate-700">{player.name}</span>
              </div>
            ) : (
              <button 
                onClick={() => setView('arena')}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center max-w-4xl mx-auto"
            >
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 tracking-tight">
                Làm chủ <span className="text-orange-500">Số Nguyên</span> thật dễ dàng!
              </h1>
              <p className="text-xl text-slate-500 mb-12 max-w-2xl leading-relaxed">
                Khám phá thế giới số nguyên qua mô hình trục số sinh động và thử thách bản thân tại đấu trường trí tuệ.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 w-full">
                <button 
                  onClick={() => setView('learning')}
                  className="group relative p-8 bg-white rounded-[3rem] border-2 border-orange-100 hover:border-orange-500 transition-all shadow-xl shadow-orange-50/50 text-left overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-2">HỌC TẬP</h3>
                    <p className="text-slate-500">Luyện tập với trục số và con chạy sinh động.</p>
                  </div>
                  <div className="absolute -right-8 -bottom-8 text-orange-50 opacity-20 group-hover:opacity-40 transition-opacity">
                    <BookOpen className="w-48 h-48" />
                  </div>
                </button>

                <button 
                  onClick={() => setView('arena')}
                  className="group relative p-8 bg-white rounded-[3rem] border-2 border-indigo-100 hover:border-indigo-500 transition-all shadow-xl shadow-indigo-50/50 text-left overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-2">ĐẤU TRƯỜNG</h3>
                    <p className="text-slate-500">Thi đấu, leo hạng và nhận huy hiệu vinh danh.</p>
                  </div>
                  <div className="absolute -right-8 -bottom-8 text-indigo-50 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Trophy className="w-48 h-48" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {view === 'learning' && (
            <motion.div 
              key="learning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <LearningSection />
            </motion.div>
          )}

          {view === 'arena' && (
            <motion.div 
              key="arena"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {player ? (
                <ArenaSection player={player} onLogout={() => setPlayer(null)} />
              ) : (
                <LoginScreen onLogin={setPlayer} />
              )}
            </motion.div>
          )}

          {view === 'admin' && player?.role === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AdminSection />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
        <p>© 2024 CỘNG SỐ NGUYÊN • Ứng dụng học tập thông minh</p>
      </footer>
    </div>
  );
}
