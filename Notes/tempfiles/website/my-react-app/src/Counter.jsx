import React,{useState} from "react"

function Counter() {

    const [count, setCount] = useState(0);

    const increment = () => {
        setCount(count => count + 1);
        setCount(count => count + 1);
        setCount(count => count + 1);
    }

    const decrement = () => {
        setCount(count => count - 1);
        setCount(count => count - 1);
        setCount(count => count - 1);
    }

    const reset = () => {
        setCount(c => c = 0);
    }

    return(
        <div className="counter-container">
            <p className="counter-display">Count: {count}</p>
            <button className="counter-button" onClick={decrement}>decrement</button>
            <button className="counter-button" onClick={reset}>reset</button>
            <button className="counter-button" onClick={increment}>increment</button>
        </div>
    )
}
export default Counter