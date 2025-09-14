import { useState, useEffect } from "react";
import { signUp, logIn, logOut } from "./authService";
import { addGame, getGames } from "./firestoreService";
import { auth } from "./firebase";
import 'bulma/css/bulma.min.css';

import Header from './components/Header'
import Navigation from './components/Navigation'
import Login from './components/Login'
import AddGame from './components/AddGame'
import GamesList from './components/GamesList'


function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [gameTitle, setGameTitle] = useState("");
  const [consoleName, setConsoleName] = useState("");
  const [condition, setCondition] = useState("CIB");
  const [estimatedValue, setEstimatedValue] = useState("");

  const [page, setPage] = useState('home')

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchGames();
    });
    return () => unsubscribe();
  }, []);

  const handleSignUp = async () => {
    try {
      const newUser = await signUp(email, password);
      setUser(newUser);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogIn = async () => {
    try {
      const loggedInUser = await logIn(email, password);
      setUser(loggedInUser);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogOut = async () => {
    console.log('test')
    await logOut();
    setUser(null);
    setGames([]);
  };

  const handleAddGame = async () => {
    if (!gameTitle || !consoleName || !estimatedValue) return alert("Fill in all fields!");
    try {
      await addGame({
        title: gameTitle,
        console: consoleName,
        condition,
        estimated_value: parseFloat(estimatedValue),
        userId: user.uid,
      });
      setGameTitle("");
      setConsoleName("");
      setCondition("CIB");
      setEstimatedValue("");
      fetchGames();
    } catch (error) {
      alert(error.message);
    }
  };

  const fetchGames = async () => {
    try {
      const userGames = await getGames();
      setGames(userGames);
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  return (
    <section className="section">
      <Header user={user} onLogOut={handleLogOut} setPage={setPage}/>

      <Navigation />

      {user ? (
        <div className="section">
          {page === 'home' && (
            <div className="user-screen">
              <AddGame
                gameTitle={gameTitle}
                setGameTitle={setGameTitle}
                consoleName={consoleName}
                setConsoleName={setConsoleName}
                condition={condition}
                setCondition={setCondition}
                estimatedValue={estimatedValue}
                setEstimatedValue={setEstimatedValue}
                handleAddGame={handleAddGame}
              />
          
              <GamesList games={games} />
            </div>
          )}

          {page === 'user' && (
            <>
              <p>user page</p>
            </>
          )}
                    

        </div>
      ) : (
        <Login 
          onLogin={handleLogIn} 
          onSignUp={handleSignUp} 
          setPassword={setPassword} 
          password={password} 
          setEmail={setEmail} 
          email={email} 
        />
      )}
    </section>
  );
}

export default App;
