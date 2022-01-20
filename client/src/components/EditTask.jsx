import { useState } from 'react';

import { secondsToTimeUnits } from '../utils/utils';

const EditTask = ({ name, due, handleSave, handleCancel }) => {
  const [nameEdit, setNameEdit] = useState(name);
  const timeLeft = secondsToTimeUnits(due - Math.round(Date.now() / 1000));
  const [dueEdit, setDueEdit] = useState(timeLeft);

  const handleChange = (event) => {
    setDueEdit(prevState => ({
      ...prevState,
      [event.target.id]: event.target.value
    }));
  };

  const triggerSave = () => {
    const daysToSeconds = dueEdit.days * 24 * 60 * 60;
    const hoursToSeconds = dueEdit.hours * 60 * 60;
    const minutesToSeconds = dueEdit.minutes * 60;
    const newDue = Math.round(Date.now() / 1000) + daysToSeconds + hoursToSeconds + minutesToSeconds + dueEdit.seconds;

    handleSave(nameEdit, newDue);
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
                value={dueEdit.days}
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
                value={dueEdit.hours}
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
                value={dueEdit.minutes}
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
                value={dueEdit.seconds}
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
