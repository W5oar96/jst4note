import React,{useState} from "react";

function MyComponent() {

    const [name, setName] = useState("Guest");
    const [age, setAge] = useState(0);
    const [isEmpolyed, setIsEmpolyed] = useState(false);

    const updateName = () => {
        setName("Spongebob");
        console.log(name);
    }

    const incrementAge = () => {
        setAge(age + 1);
        console.log(age);
    }
    
    const toggleIsEmpolyedStatus = () => {
        setIsEmpolyed(!isEmpolyed);
        console.log(isEmpolyed);
    }   

    return(
        <div>
            <p>Name: {name}</p>
            <button onClick={updateName}>set name</button>

            <p>Age: {age}</p>
            <button onClick={incrementAge}>increment age</button>

            <p>IsEmpolyed: {isEmpolyed ? "Yes" : "No"}</p>
            <button onClick={toggleIsEmpolyedStatus}>toggle isEmpolyed status</button>
        </div>
    )
}
export default MyComponent