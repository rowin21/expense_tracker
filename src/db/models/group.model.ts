import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  groupName: string;
  members: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    groupName: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const GroupModel = mongoose.model<IGroup>('Group', GroupSchema);
