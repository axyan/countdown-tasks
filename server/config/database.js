const mongoose = require('mongoose');

mongoose.connect(
  process.env.MONGODB_CONNECTION_STRING, 
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error: '));

mongoose.set('toJSON', {
  transform: (doc, ret, options) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});
