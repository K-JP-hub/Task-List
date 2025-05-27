'use client';

import { useState, useEffect, useMemo } from 'react';
import Calendar from './Calendar';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  date: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  originalDate?: string; // タスクが移動された場合の元の日付
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [selectedCategory, setSelectedCategory] = useState('仕事');
  const [selectedRepeat, setSelectedRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(['仕事', 'プライベート', '買い物', '勉強']);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showPostponedTasks, setShowPostponedTasks] = useState(false);

  // 昨日の未完了タスクを検出
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const uncompletedYesterdayTasks = useMemo(() => {
    return todos.filter(
      (todo) => 
        todo.date === yesterdayStr && 
        !todo.completed && 
        todo.repeat === 'none' &&
        !todo.originalDate // 既に移動されたタスクは除外
    );
  }, [todos, yesterdayStr]);

  // タスクを別の日に移動する関数
  const handleTodoMove = (todoId: number, newDate: string) => {
    setTodos(todos.map(todo => {
      if (todo.id === todoId) {
        return {
          ...todo,
          date: newDate,
          originalDate: todo.originalDate || todo.date
        };
      }
      return todo;
    }));
  };

  // 未完了タスクを次の日に移動
  const moveUncompletedTasksToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    uncompletedYesterdayTasks.forEach(task => {
      handleTodoMove(task.id, today);
    });
    setShowPostponedTasks(false);
  };

  // コンポーネントマウント時に未完了タスクをチェック
  useEffect(() => {
    if (uncompletedYesterdayTasks.length > 0) {
      setShowPostponedTasks(true);
    }
  }, [uncompletedYesterdayTasks]);

  // ローカルストレージからデータを読み込む
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    const savedCategories = localStorage.getItem('categories');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  // データをローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [todos, categories]);

  const addTodo = () => {
    if (input.trim() === '') return;
    const newTodo: Todo = {
      id: Date.now(),
      text: input,
      completed: false,
      date: selectedDate,
      time: selectedTime,
      priority: selectedPriority,
      category: selectedCategory,
      repeat: selectedRepeat,
    };
    setTodos([...todos, newTodo]);
    setInput('');
  };

  const updateTodo = (todo: Todo) => {
    setTodos(todos.map((t) => (t.id === todo.id ? todo : t)));
    setEditingTodo(null);
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const addCategory = () => {
    const category = prompt('新しいカテゴリーを入力してください');
    if (category && !categories.includes(category)) {
      setCategories([...categories, category]);
    }
  };

  const getCompletionRate = (date: string) => {
    const dayTodos = todos.filter((todo) => todo.date === date);
    if (dayTodos.length === 0) return 0;
    const completedTodos = dayTodos.filter((todo) => todo.completed);
    return Math.round((completedTodos.length / dayTodos.length) * 100);
  };

  // 検索結果をメモ化
  const filteredTodos = useMemo(() => {
    if (!searchQuery) return todos;
    const query = searchQuery.toLowerCase();
    return todos.filter(
      (todo) =>
        todo.text.toLowerCase().includes(query) ||
        todo.category.toLowerCase().includes(query)
    );
  }, [todos, searchQuery]);

  // 選択された日付のタスクをメモ化
  const selectedDateTodos = useMemo(() => {
    return filteredTodos.filter((todo) => todo.date === selectedDate);
  }, [filteredTodos, selectedDate]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">タスク管理</h1>
      
      {/* 未完了タスクの通知 */}
      {showPostponedTasks && uncompletedYesterdayTasks.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-yellow-800">
              昨日の未完了タスク ({uncompletedYesterdayTasks.length}件)
            </h2>
            <button
              onClick={() => setShowPostponedTasks(false)}
              className="text-yellow-600 hover:text-yellow-700"
            >
              ×
            </button>
          </div>
          <ul className="space-y-2 mb-3">
            {uncompletedYesterdayTasks.map(task => (
              <li key={task.id} className="flex items-center justify-between">
                <span className="text-yellow-900">{task.text}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTodoMove(task.id, new Date().toISOString().split('T')[0])}
                    className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded"
                  >
                    今日に移動
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      handleTodoMove(task.id, tomorrow.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded"
                  >
                    明日に移動
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <button
              onClick={moveUncompletedTasksToToday}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              すべて今日に移動
            </button>
          </div>
        </div>
      )}

      {/* 検索バー */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="タスクを検索..."
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* カレンダー */}
        <div className="md:w-1/3">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            todos={todos}
            onTodoMove={handleTodoMove}
          />
        </div>

        {/* タスク入力・一覧 */}
        <div className="md:w-2/3">
          <div className="flex flex-wrap gap-2 mb-6">
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as 'high' | 'medium' | 'low')}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="high">優先度: 高</option>
              <option value="medium">優先度: 中</option>
              <option value="low">優先度: 低</option>
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button
              onClick={addCategory}
              className="px-3 py-2 text-blue-500 hover:text-blue-600"
            >
              ＋
            </button>
            <select
              value={selectedRepeat}
              onChange={(e) => setSelectedRepeat(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">繰り返しなし</option>
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
              <option value="monthly">毎月</option>
            </select>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="新しいタスクを入力..."
            />
            <button
              onClick={addTodo}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              追加
            </button>
          </div>

          {/* 完了率 */}
          <div className="mb-4 p-4 bg-white rounded-lg shadow">
            <div className="text-lg font-bold mb-2">
              {new Date(selectedDate).toLocaleDateString('ja-JP')} の達成率:
              {getCompletionRate(selectedDate)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${getCompletionRate(selectedDate)}%` }}
              ></div>
            </div>
          </div>

          {/* タスク一覧 */}
          <div className="bg-white rounded-lg shadow p-4">
            <ul className="space-y-2">
              {selectedDateTodos
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((todo) => (
                  <li
                    key={todo.id}
                    className="flex flex-col p-3 bg-gray-50 rounded-lg"
                  >
                    {editingTodo?.id === todo.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingTodo.text}
                          onChange={(e) =>
                            setEditingTodo({ ...editingTodo, text: e.target.value })
                          }
                          className="flex-1 px-2 py-1 border rounded"
                        />
                        <button
                          onClick={() => updateTodo(editingTodo)}
                          className="px-3 py-1 bg-blue-500 text-white rounded"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingTodo(null)}
                          className="px-3 py-1 bg-gray-500 text-white rounded"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => toggleTodo(todo.id)}
                              className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span
                              className={`${
                                todo.completed ? 'line-through text-gray-500' : ''
                              }`}
                            >
                              {todo.text}
                            </span>
                            {todo.originalDate && (
                              <span className="text-xs text-gray-500">
                                (移動済: {todo.originalDate}から)
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!todo.completed && (
                              <button
                                onClick={() => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  handleTodoMove(todo.id, tomorrow.toISOString().split('T')[0]);
                                }}
                                className="text-blue-500 hover:text-blue-600 text-sm"
                              >
                                明日に移動
                              </button>
                            )}
                            <button
                              onClick={() => setEditingTodo(todo)}
                              className="text-blue-500 hover:text-blue-600 text-sm"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="text-red-500 hover:text-red-600 text-sm"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-6 text-xs">
                          <span className="text-gray-500">{todo.time}</span>
                          <span
                            className={`px-2 rounded-full ${
                              todo.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : todo.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {todo.priority === 'high'
                              ? '高'
                              : todo.priority === 'medium'
                              ? '中'
                              : '低'}
                          </span>
                          <span className="px-2 rounded-full bg-gray-100">
                            {todo.category}
                          </span>
                          {todo.repeat !== 'none' && (
                            <span className="px-2 rounded-full bg-purple-100 text-purple-800">
                              {todo.repeat === 'daily'
                                ? '毎日'
                                : todo.repeat === 'weekly'
                                ? '毎週'
                                : '毎月'}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 