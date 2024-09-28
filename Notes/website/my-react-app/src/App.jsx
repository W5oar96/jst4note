import Card from "./Card.jsx"
import List from "./List.jsx"

function App() {

  const fruits = [{id: 1,name:"coconut", calories:105},
                  {id: 2,name:"orange", calories:159},
                  {id: 3,name:"pineapple", calories:37},
                  {id: 4,name:"banana", calories:45},
                  {id: 5,name:"apple", calories:95}];
  const vegetables = [{id: 6,name:"potatoes", calories:110},
                      {id: 7,name:"celery", calories:12},
                      {id: 8,name:"carrots", calories:23},
                      {id: 9,name:"corn", calories:11},
                      {id: 10,name:"broccoli", calories:24}];
  return(
    <>
      <Card />
      <List items={fruits} category="Fruits"/>
      <List items={vegetables} category="Vegetables"/>

    </>
  )
}

export default App
