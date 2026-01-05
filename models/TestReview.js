const testReviewSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTest',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5 // Ocena ogólna 1-5
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 3 // Ocena trudności 1-3
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, { timestamps: true });

// Zapobiegamy wielokrotnemu ocenianiu tego samego testu przez tę samą osobę
testReviewSchema.index({ test: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('TestReview', testReviewSchema);