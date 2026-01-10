import mongoose, { Schema, Document as MongooseDocument,  Model } from 'mongoose';

export interface IDocument extends Document  {
  filename: string; // Stored filename (e.g., UUID-based)
  originalName: string; // Original filename from user
  fileType: string; // MIME type or extension (pdf, txt, docx, md)
  uploadedAt: Date;
  chunkCount: number; // Number of chunks created
  vectorStoreId: string; // Reference to ChromaDB collection/document ID
}

const DocumentSchema: Schema = new Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['pdf', 'txt', 'docx', 'md', 'application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    vectorStoreId: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster document queries
DocumentSchema.index({ uploadedAt: -1 });

const Document: Model<IDocument> = mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

export default Document;