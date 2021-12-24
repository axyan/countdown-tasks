import { useState } from 'react';

const TaskForm = ({ submitTask }) => {
  const [taskName, setTaskName] = useState('');
  const [due, setDue] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const handleChange = (event) => {
    setDue(prevState => ({
      ...prevState,
      [event.target.id]: event.target.value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const daysInSeconds = due.days * 24 * 60 * 60;
    const hoursInSeconds = due.hours * 60 * 60;
    const minutesInSeconds = due.minutes * 60;
    const epochTaskDue = Math.floor(Date.now() / 1000) + daysInSeconds + hoursInSeconds + minutesInSeconds + +due.seconds;

    submitTask(taskName, epochTaskDue);
    
    setTaskName('');
    setDue({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    });
  };

  return (
    <div className="container mt-5 px-5">
      <form className="row d-flex justify-content-center" onSubmit={handleSubmit}>
        <div className="col-xl-4 mb-2">
          <label htmlFor="taskName">Task name: </label>
          <input
            type="text"
            id="taskName"
            name="taskName"
            className="form-control"
            maxLength="100"
            value={taskName}
            onChange={(event) => setTaskName(event.target.value)}
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
                value={due.days}
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
                value={due.hours}
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
                value={due.minutes}
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
                value={due.seconds}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="col row align-items-end mx-0 mb-3">
          <button type="submit" className="btn btn-dark">Add Task</button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
