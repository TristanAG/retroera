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
            <input
              type="text"
              placeholder="Enter console"
              value={consoleName}
              className="input"
              onChange={(e) => setConsoleName(e.target.value)}
            />
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
  