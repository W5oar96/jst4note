import React,{useState} from "react";

function MyComponent1() {

    const [name, setName] = useState("Guest");
    const [quality, setQuality] = useState(0);
    const [comment, setComment] = useState();
    const [payment, setPayment] = useState();
    const [shipping, setShipping] = useState();

    function handleNameChange(event) {
        setName(event.target.value)
    }

    function handleQualityChange(event) {
        setQuality(event.target.value)
    }
  
    function handleCommentChange(event) {
        setComment(event.target.value)
    }

    function handlePaymentChange(event) {
        setPayment(event.target.value)
    }

    function handleShippingChange(event) {
        setShipping(event.target.value)
    }

    return(
        <div>
            <input value={name} onChange={handleNameChange} />
            <p>Name: {name}</p>

            <input value={quality} onChange={handleQualityChange} type="number"/>
            <p>Quality: {quality}</p>

            <textarea value={comment} onChange={handleCommentChange}
            placeholder="This is a textarea"/>
            <p>Comment: {comment}</p>

            <select value={payment} onChange={handlePaymentChange}>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>
            <p>Payment: {payment}</p>

            <label>
            <input type="radio" value="Pick up"
                        checked={shipping === "Pick up"}
                        onChange={handleShippingChange} />
                Pick up
            </label>
            <br/>
            <label>
                <input type="radio" value="Delivery"
                        checked={shipping === "Delivery"}
                        onChange={handleShippingChange} />
                Delivery
            </label>
            <p>Shipping : {shipping}</p>
        </div>
    )

}
export default MyComponent1