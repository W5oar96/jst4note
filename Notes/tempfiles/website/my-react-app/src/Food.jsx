
function Food() {
    const food1='apple';
    const food2='banana';
    const food3='orange';

    return(
        <ul>
            <li>food</li>
            <li>{food1}</li>
            <li>{food2}</li>
            <li>{food3.toUpperCase()}</li>
        </ul>
    )
}

export default Food