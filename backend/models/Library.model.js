const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  author:      { type: String, required: true },
  isbn:        { type: String, unique: true, sparse: true },
  publisher:   { type: String },
  edition:     { type: String },
  year:        { type: Number },
  category:    { type: String },
  subject:     { type: String },
  language:    { type: String, default: 'English' },
  totalCopies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  shelfNo:     { type: String },
  libraryId:   { type: String, default: 'LIB001' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

const bookIssueSchema = new mongoose.Schema({
  book:        { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  issueDate:   { type: Date, default: Date.now },
  dueDate:     { type: Date, required: true },
  returnDate:  { type: Date },
  fine:        { type: Number, default: 0 },
  finePaid:    { type: Boolean, default: false },
  status:      { type: String, enum: ['issued', 'returned', 'overdue'], default: 'issued' },
  issuedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  returnedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks:     { type: String },
}, { timestamps: true });

module.exports = {
  Book: mongoose.model('Book', bookSchema),
  BookIssue: mongoose.model('BookIssue', bookIssueSchema),
};
