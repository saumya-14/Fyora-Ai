import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IThread extends Document {
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

const ThreadSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, 
  }
);

// Index for faster queries
ThreadSchema.index({ updatedAt: -1 }); // Sort by most recently updated

const Thread: Model<IThread> = mongoose.models.Thread || mongoose.model<IThread>('Thread', ThreadSchema);

export default Thread;