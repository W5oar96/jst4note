
function List() {
    
    const fruits = [{id: 1,name:"coconut", calories:105},
                    {id: 2,name:"orange", calories:159},
                    {id: 3,name:"pineapple", calories:37},
                    {id: 4,name:"banana", calories:45},
                    {id: 5,name:"apple", calories:95}];
    // fruits.sort((a, b) => a.name.localeCompare(b.name)); // ALPHABEFTICAL
    // fruits.sort((a, b) => b.name.localeCompare(a.name)); // REVERSE ALPHABEFTICAL
    // fruits.sort((a, b) => a.calories - b.calories); // NUMERIC
    // fruits.sort((a, b) => b.calories - a.calories); // REVERSE NUMERIC
    // const lowCalFruits = fruits.filter(fruit => fruit.calories < 100);         
    const highCalFruits = fruits.filter(fruit => fruit.calories >= 100);         

    const listItems = highCalFruits.map(highCalFruit => <li key={highCalFruit.id}>
                                            {highCalFruit.name}: &nbsp;
                                            <b>{highCalFruit.calories}</b>
                                            </li> )
    
    return(<ol>{listItems}</ol>);
}

export default List