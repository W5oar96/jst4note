import { useState } from "react"

function ToDoList(){

    const [tasks, setTasks] = useState(["Eat breakfast", "Take a shower", "Walk the dog"]);
    const [newTask, setNewTask] = useState("");

    function handleInputChange(event){
        setNewTask(event.target.value);
    }
    function addTask(){

        if(newTask.trim() !== ""){
            setTasks(t => [...t, newTask]);
            setNewTask("");
        }
    }
    function removeTask(index){

        const updatedTasks = tasks.filter((_, i) => i !== index);
        setTasks(updatedTasks);
    }
    function moveTaskUp(index){

        if(index > 0){
            const updatedTasks = [...tasks];
            [updatedTasks[index], updatedTasks[index - 1]] = 
            [updatedTasks[index - 1], updatedTasks[index]];
            setTasks(updatedTasks);
        }
    }
    function moveTaskDown(index){

        if(index < tasks.length - 1){
            const updatedTasks = [...tasks];
            [updatedTasks[index], updatedTasks[index + 1]] = 
            [updatedTasks[index + 1], updatedTasks[index]];
            setTasks(updatedTasks);
        }
    }

    return(<div className="to-do-list">
            <h1>To-Do-List</h1>
            <div>
                <input 
                    type="text"
                    placeholder="Enter a task..."
                    value={newTask}
                    onChange={handleInputChange}/>
                <button
                    className="add-button"
                    onClick={addTask}>
                    Add
                    </button>
                <ol>
                    {tasks.map((task, index) =>
                        <li key={index}>
                            <span>{task}</span>
                            <button
                                className="add-button"
                                onClick={() => removeTask(index)}>
                                Remove
                            </button>
                            <button
                                className="add-button"
                                onClick={() => moveTaskUp(index)}>
                                Up
                            </button>
                            <button
                                className="add-button"
                                onClick={() => moveTaskDown(index)}>
                                Down
                            </button>
                        </li>
                    )}
                </ol>

            </div>
            </div>)
}
export default ToDoList