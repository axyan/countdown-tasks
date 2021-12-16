import { useState } from 'react';

const EditTask = ({ currName, currDue, handleCancel, handleSave }) => {
  const [nameEdit, setNameEdit] = useState(currName);
  const [dueEdit, setDueEdit] = useState(currDue);

  return (
    <div>
      <span>HELLO</span>

      <div className="float-end">
        <button className="btn btn-dark btn-sm me-2" type="button" onClick={handleSave}>Save</button>
        <button className="btn btn-dark btn-sm" type="button" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default EditTask;
