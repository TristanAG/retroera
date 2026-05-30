import { CONDITION_PRICE_HINTS } from "../priceChartingService";
import PriceChartingLink from "./PriceChartingLink";

function EditGame({
  game,
  condition,
  setCondition,
  estimatedValue,
  setEstimatedValue,
  onSave,
  onCancel,
}) {
  return (
    <div className="add-form">
      <h2 className="title is-4 mb-4">Edit Game</h2>

      <div className="field">
        <label className="label">Game Title</label>
        <p className="control">
          <input type="text" value={game.title} className="input" disabled />
        </p>
      </div>

      <div className="field">
        <label className="label">Console</label>
        <p className="control">
          <input type="text" value={game.console} className="input" disabled />
        </p>
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
        <PriceChartingLink title={game.title} className="mt-2" />
        {CONDITION_PRICE_HINTS[condition] && (
          <p className="help">
            For {condition}: look for the {CONDITION_PRICE_HINTS[condition]} column.
          </p>
        )}
      </div>

      <div className="field is-grouped">
        <div className="control">
          <button type="button" onClick={onSave} className="button is-primary">
            Save
          </button>
        </div>
        <div className="control">
          <button type="button" onClick={onCancel} className="button is-light">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditGame;
