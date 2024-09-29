
function Button() {

    let count = 0;

    const handleClick = (name) => {
        if(count<3){
            count++;
            console.log(`${name} you cliked me ${count} time/s!!!`);
        }
        else{
            console.log(`${name} stop click me!!!!`);
        }
    }

    return(   
        <button onClick={() => handleClick("Bro")}>Click me 😈</button>
    )
}

export default Button