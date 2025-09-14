const Header = ({ user, onLogOut, setPage }) => {
    return (
        <div>
            {/* <h1 className="is-size-2 has-text-primary-35" onClick={() => setPage('home')}>RetroEra</h1> */}

            {/* {user && (
                <div class="welcome-wrapper">
                    <p onClick={() => setPage('user')}>Welcome, {user.email}</p>
                    <button className="button" onClick={onLogOut}>Log Out</button>
                </div>
            )} */}
        </div>
    )
}

export default Header