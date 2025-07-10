import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import AdminGraph from '../components/AdminGraph'

interface Todo {
  id: string;
  title: string;
}

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [showMapEditor, setShowMapEditor] = useState(false)

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

  if (showMapEditor) {
    return <AdminGraph onBack={() => setShowMapEditor(false)} />
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Smart Store Map</h1>
      
      <div className="mb-8">
        <button 
          onClick={() => setShowMapEditor(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          🗺️ Open Map Editor
        </button>
      </div>

      <div className="border-t pt-8">
        <h2 className="text-xl font-bold mb-4">Todo List</h2>
        <ul className="list-disc pl-6">
          {todos.map((todo) => (
            <li key={todo.id}>{todo.title}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
