function AddGame({
    gameTitle,
    setGameTitle,
    consoleName,
    setConsoleName,
    condition,
    setCondition,
    estimatedValue,
    setEstimatedValue,
    handleAddGame
  }) {
    return (
      <div className="add-form">
        <div className="field">
          <div className="control">
            <label className="label">Game Title</label>
            <input
              type="text"
              placeholder="Enter game title"
              value={gameTitle}
              className="input"
              onChange={(e) => setGameTitle(e.target.value)}
            />
          </div>
        </div>
  
        <div className="field">
          <div className="control">
            <label className="label">Console</label>
            <select
              value={consoleName}
              onChange={(e) => setConsoleName(e.target.value)}
              className="input"
            >
              <option value="">Select Console</option>
              <option value="Playstation">Playstation</option>
              <option value="Playstation 2">Playstation 2</option>
              <option value="GameCube">GameCube</option>
              <option value="Game Boy">Game Boy</option>
              <option value="Game Boy Color">Game Boy Color</option>
              <option value="Game Boy Advance">Game Boy Advance</option>
              <option value="Dreamcast">Dreamcast</option>
            </select>
          </div>
        </div>
  
        <div className="field">
          <div className="control">
            <label className="label">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="input"
            >
              <option value="CIB">CIB (Complete in Box)</option>
              <option value="Disc Only">Disc Only</option>
              <option value="New">New</option>
            </select>
          </div>
        </div>
  
        <div className="field">
          <div className="control">
            <label className="label">Estimated Value</label>
            <input
              type="number"
              placeholder="Estimated Value"
              value={estimatedValue}
              className="input"
              onChange={(e) => setEstimatedValue(e.target.value)}
            />
          </div>
        </div>
  
        <button onClick={handleAddGame} className="button is-primary">Add Game</button>
      </div>
    );
  }
  
  export default AddGame;
  