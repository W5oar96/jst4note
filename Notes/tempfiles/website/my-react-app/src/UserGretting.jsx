import PropType from 'prop-types';

function UserGretting(props) {

    const welcomeMessage = <h2 className="welcome-message">
                            Welcome {props.userName}
                            </h2>
    
    const loginPrompt = <h2 className="login-prompt">
                            Please login in to continue
                            </h2>

    return(props.isLoggedIn ? welcomeMessage : loginPrompt)
}

UserGretting.proptypes = {
    isLoggedIn: PropType.bool,
    userName: PropType.string,
}

UserGretting.defaultProps = {
    isLoggedIn: false,
    userName: "Guest",
}

export default UserGretting