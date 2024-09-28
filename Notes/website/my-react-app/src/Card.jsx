import ProfilePic from './assets/profile.jpg'

function Card() {
    return(
        <div className='card'>
            <img className='card-img' src={ProfilePic} alt="profile picture"></img>
            <h2 className='card-h2'>Bro Code</h2>
            <p className='card-p'>I make youtube video and play video games</p>
        </div>
    )
}

export default Card