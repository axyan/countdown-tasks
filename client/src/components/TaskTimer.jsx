import { useEffect } from 'react';
import useTimer from 'easytimer-react-hook';

import { secondsToTimeUnits } from '../utils/utils';

const TaskTimer = ({ name, currentEpoch, due, handleEdit, handleDelete }) => {
  const timeLeft = secondsToTimeUnits(due - currentEpoch);
  const [timer, isTargetAchieved] = useTimer({
    startValues: {
      days: timeLeft.days,
      hours: timeLeft.hours,
      minutes: timeLeft.minutes,
      seconds: timeLeft.seconds,
      secondTenths: 0
    },
    countdown: true,
    updateWhenTargetAchieved: true
  });
  
  useEffect(() => {
    timer.start()
  }, [timer]);

  return (
    <div className="timer-instance d-flex align-items-center justify-content-between">
      <div>{name} -&nbsp;
				{isTargetAchieved || due < Math.round(Date.now() / 1000) ? (
					<div style={{display: "inline"}}>
						<span style={{fontWeight: "bold"}}>
							Completed at {new Date(due * 1000).toLocaleString()}
						</span>
					</div>
				) : (
					timer.getTimeValues().toString(['days', 'hours', 'minutes', 'seconds'])
				)}
			</div>

      <div>
        <button className="btn btn-dark btn-sm me-2" type="button" onClick={handleEdit}>Edit</button>
        <button className="btn btn-dark btn-sm" type="button" onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
};

export default TaskTimer;
