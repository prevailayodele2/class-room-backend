const mongoose = require("mongoose");

const adminMessage = new mongoose.Schema({
  user_id: {
    type: String
  },
  nickname: {
    type: String,
    required: [true, 'nickname cannot be empty']
  },
  level: {
    type: String,
    required: [true, 'level admin cannot be empty']
  },
  faculty: {
    type: String,
    required: [true, 'faculty admin cannot be empty']
  },
  message: {
    type: String,
    required: [true, 'message to admin cannot be empty']
  }
});

const AdminMessage = new mongoose.model("AdminMessage", adminMessage);
module.exports = AdminMessage;
