
function Button() {

    let count = 0;

    const handleClick = (e) => e.target.textContent = "OUCH!!!😊";
    // {
    //     if(count<3){
    //         count++;
    //         console.log(`${name} you cliked me ${count} time/s!!!`);
    //     }
    //     else{
    //         console.log(`${name} stop click me!!!!`);
    //     }
    // }

    return(   
        <button onDoubleClick={(e) => handleClick(e)}>Click me 😈</button>
    )
}

export default Button