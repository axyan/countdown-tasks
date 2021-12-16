import { useState } from 'react';

import { useAuth } from '../hooks/useAuth';
import EditTask from './EditTask';
import TaskTimer from './TaskTimer';

const Task = ({ userId, taskId, taskName, taskDue, updateTasks }) => {
  const { user } = useAuth();
  const [name, setName] = useState(taskName);
  const [due, setDue] = useState(taskDue);
  const [isEditing, setIsEditing] = useState(false);

  const DOMAIN_NAME = process.env.REACT_APP_DOMAIN_NAME;

  const cancelTaskEdit = () => {
    setIsEditing(false);
  };

  const deleteTask = async () => {
    if (userId !== undefined && taskId !== undefined) {
      try {
        const response = await fetch(
          `${DOMAIN_NAME}/api/users/${userId}/tasks/${taskId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer ' + user.token,
            }
          }
        );
        
        if (response.status !== 204) {
          throw new Error(await response.json());
        }
      } catch (e) {
        console.log(e);
      }
    }

    updateTasks(prevTasks => prevTasks.filter((task) => task.props.taskId !== taskId ));
  };
  
  const saveTaskEdit = async (nameEdit, dueEdit) => {
    const task = {
      id: taskId,
      name: nameEdit,
      due: dueEdit
    }

    const response = await fetch(
      `${DOMAIN_NAME}/api/users/${userId}/tasks/${taskId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + user.token,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(task)
      }
    );

    setName(name);
    setDue(due);
    setIsEditing(false);
  };

  const startTaskEdit = () => {
    setIsEditing(true);
  };

  return (
    <div>
      {isEditing ? (
        <EditTask name={name} due={due} handleSave={saveTaskEdit} handleCancel={cancelTaskEdit} />
      ) : (
        <TaskTimer name={name} currentEpoch={Math.floor(Date.now() / 1000)} due={due} handleEdit={startTaskEdit} handleDelete={deleteTask} />
      )}
    </div>
  );
};

export default Task;
