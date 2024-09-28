import Card from "./Card.jsx"
import Student from "./Student.jsx"

function App() {

  return(
    <>
      <Card />
      <Student name='Spongebob' age='18' isStuent={false}/>
      <Student name='Patrick' age='18' isStuent={false}/>
      <Student name='Squaidwrad' age='18' isStuent={false}/>
      <Student name='Sandy' age='18' isStuent={false}/>
      <Student name='' />
      <Student />
    </>
  )
}

export default App
