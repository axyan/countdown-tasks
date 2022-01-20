import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import TaskForm from './TaskForm';
import Task from './Task';

const Tasks = () => {
  const DOMAIN_NAME = process.env.REACT_APP_DOMAIN_NAME;
  const { navigate } = useNavigate();

  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);


  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch(
        `${DOMAIN_NAME}/api/users/${user.id}/tasks/`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + user.token
          }
        }
      );

      return await response.json();
    };

    if (user !== null) {
      fetchTasks()
        .then((data) => {
          const taskList = data.tasks.map((task) => {
            return (
              <Task
                userId={user.id}
                taskId={task.id}
                taskName={task.name}
                taskDue={task.due}
                updateTasks={setTasks}
                key={task.id}
              />
            );
          });

          setTasks(taskList);
        })
      .catch(err => console.log(err));
    }
  }, [user, DOMAIN_NAME]);

  const addTask = async (name, due) => {
    if (user !== null) {
      const res = await fetch(
        `${DOMAIN_NAME}/api/users/${user.id}/tasks/`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + user.token,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ name, due })
        }
      );

      const response = await res.json();
      if (!res.ok) {
        if (res.status === 400) {
          console.log(response.error);
          return;
        } else {
          navigate('/login');
        }
      }

      setTasks([
        ...tasks,
        <Task
          userId={user.id}
          taskId={response.task.id}
          taskName={name}
          taskDue={due}
          updateTasks={setTasks}
          key={response.task.id}
        />
      ]);
    } else {
      setTasks([
        ...tasks,
        <Task
          taskId={Date.now()}
          taskName={name}
          taskDue={due}
          updateTasks={setTasks}
          key={Date.now()}
        />
      ]);
    }
  };

  return (
    <>
      <TaskForm submitTask={addTask} />
      <div className="container mt-4 mb-5 px-5">
        <h2>Tasks:</h2>
        <ul className="list-group">
          {tasks.map((task) => <li key={task.key} className="list-group-item">{task}</li>)}
        </ul>
      </div>
    </>
  );
};

export default Tasks;
