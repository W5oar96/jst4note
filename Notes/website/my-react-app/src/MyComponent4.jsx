import { useState } from "react";

function MyComponent4(){

    const [cars, setCars] = useState([]);
    const [carYear, setCarYear] = useState(new Date().getFullYear());
    const [carMake, setCarMake] = useState("");
    const [carModel, setCarModel] = useState("");

    function handleAddCar(){
        const newCar = {year: carYear,
                        make: carMake,
                        model: carModel};
        
        setCars(c => [...cars, newCar]);
        setCarYear(new Date().getFullYear());
        setCarMake("");
        setCarModel("");
    }

    function handleRemoveCar(index){
        setCars(car => car.filter((_, i) => i !== index));
    }
    
    function handleCarYearChange(event){
        setCarYear(event.target.value);
    }

    function handleCarMakeChange(event){
        setCarMake(event.target.value);
    }

    function handleCarModelChange(event){
        setCarModel(event.target.value);
    }

    return(<div>
            <h2>List Of Car Objects</h2>
            <ul>
                {cars.map((car, index) =>
                <li key={index} onClick={() => handleRemoveCar(index)}>
                    {car.year} {car.make} {car.model}
                </li>)}
            </ul>

            <input type="number" 
                    value={carYear}
                    onChange={handleCarYearChange}>
            </input><br/>
            <input type="text" 
                    value={carMake}
                    onChange={handleCarMakeChange}
                    placeholder="Enter car make">
            </input><br/>
            <input type="text" 
                    value={carModel}
                    onChange={handleCarModelChange}
                    placeholder="Enter car model">
            </input><br/>
            <button onClick={handleAddCar}>Add Car</button>
            </div>);
}

export default MyComponent4