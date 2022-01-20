import { useState } from 'react';

import {
  nowEpoch,
  secondsToTimeUnits,
  timeUnitsToSeconds 
} from '../utils/utils';

const EditTask = ({ name, due, handleSave, handleCancel }) => {
  const [nameEdit, setNameEdit] = useState(name);
  const timeLeft = secondsToTimeUnits(due - nowEpoch());
  const [dueEditUnits, setDueEditUnits] = useState(timeLeft);

  const handleChange = (event) => {
    setDueEditUnits(prevState => ({
      ...prevState,
      [event.target.id]: event.target.value
    }));
  };

  const triggerSave = () => {
    const dueEpoch = nowEpoch() + timeUnitsToSeconds(dueEditUnits);
    handleSave(nameEdit, dueEpoch);
  };

  return (
    <div className="container">
      <form className="row d-flex">
        <div className="col-xl-4 mb-2">
          <label htmlFor="taskName">Task name: </label>
          <input
            type="text"
            id="taskName"
            name="taskName"
            className="form-control"
            maxLength="100"
            value={nameEdit}
            onChange={(event) => setNameEdit(event.target.value)}
            required
          />
        </div>

        <div className="col-xl-4 mb-3">
          <div className="row">
              <div className="col-3">
              <label htmlFor="days">Days: </label>
              <input
                type="number"
                id="days"
                name="days"
                className="form-control"
                min="0"
                value={dueEditUnits.days}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-3">
              <label htmlFor="hours">Hours: </label>
              <input
                type="number"
                id="hours"
                name="hours"
                className="form-control"
                min="0"
                max="23"
                value={dueEditUnits.hours}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-3">
              <label htmlFor="minutes">Minutes: </label>
              <input
                type="number"
                id="minutes"
                name="minutes"
                className="form-control"
                min="0"
                max="59"
                value={dueEditUnits.minutes}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-3">
              <label htmlFor="seconds">Seconds: </label>
              <input
                type="number"
                id="seconds"
                name="seconds"
                className="form-control"
                min="0"
                max="59"
                value={dueEditUnits.seconds}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="col d-flex justify-content-end align-items-center px-0">
          <button className="btn btn-dark btn-md me-2" type="button" onClick={triggerSave}>Save</button>
          <button className="btn btn-dark btn-md" type="button" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditTask;
