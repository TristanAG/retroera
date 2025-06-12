const GamesList = ({ games }) => {
    return (
        <div>
            <h3>Your Games:</h3>

            <ul>
            {games.map((game) => (
                <li key={game.id}>
                {game.title} - {game.console} ({game.condition}) - ${game.estimated_value}
                </li>
            ))}
            </ul> 
        </div>
    ) 
}

export default GamesList