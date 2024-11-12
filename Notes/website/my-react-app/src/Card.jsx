import ProfilePic from './assets/profile.jpg';
import ProfilePic2 from './assets/profile2.jpg';
import ProfileCat from './assets/profile_cat.jpg';

function Card() {
    return(
        <div className='card'>
            <img className='card-img' src={ProfilePic} alt="profile picture"></img>
            <img className='card-img' src={ProfilePic2} alt="profile picture"></img>
            <img className='card-img' src={ProfileCat} alt="profile picture"></img>
            <h2 className='card-h2'>FK U</h2>
            <p className='card-p'>Fuck you liulei</p>
        </div>
    )
}

export default Card