const Header = ({ user, onLogOut }) => {
    return (
        <div>
             <h1 className="is-size-2">Retro<span className="era">Era</span></h1>

             {user && (
                <div class="welcome-wrapper">
                    <p>Welcome, {user.email}</p>
                    <button className="button" onClick={onLogOut}>Log Out</button>
                </div>
            )}
        </div>
    )
}

export default Header