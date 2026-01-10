import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  threadId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  sources: mongoose.Types.ObjectId[]; // Array of document IDs
  webSearchUsed: boolean;
  timestamp: Date;
}

const MessageSchema: Schema = new Schema(
  {
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'Thread',
      required: true,
      index: true, // Index for faster queries by threadId
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    webSearchUsed: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Also adds createdAt and updatedAt
  }
);

// Compound index for efficient thread message retrieval
MessageSchema.index({ threadId: 1, timestamp: 1 });

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;