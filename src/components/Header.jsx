const Header = ({ user, onLogOut }) => {
    console.log("Header props:", user, onLogOut);
    return (
        <div>
             <h1 className="is-size-2 has-text-primary">Retrobay</h1>

             {user && (
        <div class="welcome-wrapper">
          <p>Welcome, {user.email}</p>
          <button onClick={onLogOut}>Log Out</button>
        </div>
      )}
        </div>
    )
}

export default Header