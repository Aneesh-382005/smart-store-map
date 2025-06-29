import { useState, useEffect } from 'react'
import { supabase } from '../app/utils/supabaseClient'

function Page()
{
    const [todos, setTodos] = useState<any[]>([])

    useEffect(() => {
         async function getTodos()
        {
            const {data: todos } = await supabase.from('todos').select()

            if (todos && todos.length > 1)
            {
                setTodos(todos)
            }
        }

        getTodos()
    }, [])
    return (
    <div>
      {todos.map((todo) => (
        <li key={todo}>{todo}</li>
      ))}
    </div>
  )
}
export default Page
