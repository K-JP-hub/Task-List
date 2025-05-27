import Image from "next/image";
import TodoList from './components/Todo';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <TodoList />
    </main>
  );
}
