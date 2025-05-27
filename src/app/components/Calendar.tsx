'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot, DroppableStateSnapshot } from 'react-beautiful-dnd';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  date: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  originalDate?: string;
}

interface CalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  todos: Todo[];
  onTodoMove: (todoId: number, newDate: string) => void;
}

export default function Calendar({ selectedDate, onDateSelect, todos, onTodoMove }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getTodosForDate = (date: string) => {
    return todos.filter(todo => todo.date === date);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const todoId = parseInt(result.draggableId);
    const newDate = result.destination.droppableId;
    onTodoMove(todoId, newDate);
    setIsDraggingOver(null);
  };

  const handleDragStart = () => {
    // ドラッグ開始時の処理（必要に応じて）
  };

  const handleDragUpdate = (update: DropResult) => {
    if (!update.destination) {
      setIsDraggingOver(null);
      return;
    }
    setIsDraggingOver(update.destination.droppableId);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // 前月の日付を追加
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date: formatDate(date),
        isCurrentMonth: false,
      });
    }

    // 現在の月の日付を追加
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date: formatDate(date),
        isCurrentMonth: true,
      });
    }

    // 次月の日付を追加（6週間分になるまで）
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date: formatDate(date),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const calendarDays = generateCalendarDays();

  return (
    <DragDropContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
    >
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ←
          </button>
          <h2 className="text-lg font-bold">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
            <div key={day} className="text-center font-bold p-2">
              {day}
            </div>
          ))}
          {calendarDays.map(({ date, isCurrentMonth }) => {
            const todosForDate = getTodosForDate(date);
            const hasCompletedTodos = todosForDate.some(todo => todo.completed);
            const hasUncompletedTodos = todosForDate.some(todo => !todo.completed);

            return (
              <Droppable droppableId={date} key={date}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`relative min-h-[80px] ${
                      isDraggingOver === date ? 'bg-blue-50' : ''
                    }`}
                    onMouseEnter={() => setHoveredDate(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <button
                      onClick={() => onDateSelect(date)}
                      className={`
                        w-full p-2 rounded-lg text-center relative
                        ${date === selectedDate ? 'bg-blue-500 text-white' : ''}
                        ${
                          !isCurrentMonth
                            ? 'text-gray-400'
                            : date === selectedDate
                            ? ''
                            : 'hover:bg-gray-100'
                        }
                      `}
                    >
                      <span>{new Date(date).getDate()}</span>
                      {todosForDate.length > 0 && (
                        <div className="flex gap-1 justify-center mt-1">
                          {hasUncompletedTodos && (
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          )}
                          {hasCompletedTodos && (
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          )}
                        </div>
                      )}
                    </button>

                    {/* ドラッグ可能なタスク一覧 */}
                    <div className="mt-1">
                      {todosForDate.map((todo, index) => (
                        <Draggable
                          key={todo.id}
                          draggableId={todo.id.toString()}
                          index={index}
                        >
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                text-xs p-1 mb-1 rounded
                                ${todo.completed ? 'bg-green-100' : 'bg-red-100'}
                                ${todo.priority === 'high' ? 'border-l-4 border-red-500' : ''}
                              `}
                            >
                              {todo.text}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}

                    {/* ホバー時のタスク詳細 */}
                    {hoveredDate === date && todosForDate.length > 0 && (
                      <div className="absolute z-10 bg-white shadow-lg rounded-lg p-2 w-48 left-full top-0 ml-2">
                        <div className="text-sm font-bold mb-1">{date}</div>
                        <ul className="text-xs space-y-1">
                          {todosForDate.map(todo => (
                            <li
                              key={todo.id}
                              className={`flex items-center gap-1 ${
                                todo.completed ? 'text-gray-500 line-through' : ''
                              }`}
                            >
                              <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                              <span>{todo.time}</span>
                              <span>{todo.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
} 