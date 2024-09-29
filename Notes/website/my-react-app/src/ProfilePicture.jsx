
function ProfilePicture(){
    
    const imgUrl = './src/assets/profile.jpg';
    const handleClick = (e) => e.target.style.display = 'none';

    return(<img className="profileImg" src={imgUrl} onClick={(e)  => handleClick(e)}></img>);

}

export default ProfilePicture