const mongoose = require('mongoose');

const User = require('./user');

const Schema = mongoose.Schema;

const taskSchema = new Schema (
  {
    name: { type: String, required: true, maxLength: 100 },
    due: { type: Number, required: true }
  }
);

// Hacky solution to delete references of deleted tasks in user's tasks array
// TODO: Learn relational db (PostgreSQL)
taskSchema.pre('findOneAndDelete', function () {
  const taskId = this.getQuery()._id;
  User.updateOne(
    { 'tasks': mongoose.Types.ObjectId(taskId) },
    { '$pull': { 'tasks': mongoose.Types.ObjectId(taskId) } },
    (err) => {
      if (err) { throw err; }
    }
  );
});

module.exports = mongoose.model('Task', taskSchema);
