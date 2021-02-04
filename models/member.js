const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MemberSchema = new Schema({
  id: String,
  first_name: String,
  last_name: String,
  username: String,
  added_members_count: Number
}, { timestamps: true });


const Member = mongoose.model('Member', MemberSchema);

module.exports = Member;