import Card from "./Card.jsx"
import UserGretting from "./UserGretting.jsx"

function App() {

  return(
    <>
      <Card />
      <UserGretting isLoggedIn={true} userName="BroCode"/>
      <UserGretting />
    </>
  )
}

export default App
