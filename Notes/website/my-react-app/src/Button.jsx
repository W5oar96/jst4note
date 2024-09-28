
function Button() {

    const styles = {
        backgroundColor: 'brown',
        color: 'aliceblue',
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer'
    }

    const handleClick = () => console.log("OUCH!!!");
    const handleClick2 = (name) => console.log('${name} stop clicking')
    return(
        <>
            {/* <button style={styles}>Click me</button> */}
            <button onClick={handleClick2("Bro")}>Click me 😈</button>
        </>
    )
}

export default Button