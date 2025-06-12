const Login = ({ onLogin, onSignUp, setPassword, password, setEmail, email }) => {
    return (
        <div className="login-form">
            <div className="field">
                <div className="control">
                    <input type="email" placeholder="Email" value={email} className="input" onChange={(e) => setEmail(e.target.value)} />
                </div>
            </div>

            <div className="field">
                <div className="control">
                    <input type="password" placeholder="Password" value={password} className="input" onChange={(e) => setPassword(e.target.value)} />
                </div>
            </div>
            
            <button className="button" onClick={onSignUp}>Sign Up</button>
            <button className="button" onClick={onLogin}>Log In</button>
        </div>
    )
}

export default Login