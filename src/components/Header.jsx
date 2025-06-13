const Header = ({ user, onLogOut, setPage }) => {
    return (
        <div>
             <h1 className="is-size-2" onClick={() => setPage('home')}>Retro<span className="era">Era</span></h1>

             {user && (
                <div class="welcome-wrapper">
                    <p onClick={() => setPage('user')}>Welcome, {user.email}</p>
                    <button className="button" onClick={onLogOut}>Log Out</button>
                </div>
            )}
        </div>
    )
}

export default Header