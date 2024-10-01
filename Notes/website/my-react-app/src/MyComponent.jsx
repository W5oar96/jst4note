import React,{useState} from "react";

function MyComponent() {

    const [name, setName] = useState();

    const updateName = () => {
        setName("Spongebob");
        console.log(name);
    }

    return(
        <div>
            <p>Name: {name}</p>
            <button onClick={updateName}>set name</button>
        </div>
    )
}
export default MyComponent