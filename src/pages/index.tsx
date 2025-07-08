import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

interface Todo {
  id: string;
  title: string;
}

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    async function getTodos() {
      const { data: todos, error } = await supabase.from('todos').select()
      if (error) {
        console.error(error)
      } else {
        setTodos(todos || [])
      }
    }

    getTodos()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      <ul className="list-disc pl-6">
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  )
}
