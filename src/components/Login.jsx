const Login = ({ onLogin, onSignUp, setPassword, password, setEmail, email }) => {
    return (
        <div>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={onSignUp}>Sign Up</button>
          <button onClick={onLogin}>Log In</button>
        </div>
    )
}

export default Login