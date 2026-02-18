import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScannedData extends Document {
  data: any; // Adjust type as needed
  user: string;
  createdAt: Date;
}

const ScannedDataSchema: Schema = new Schema(
  {
    data: { type: Schema.Types.Mixed, required: true },
    user: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "scanned_data" }
);

const ScannedData: Model<IScannedData> =
  mongoose.models.ScannedData || mongoose.model<IScannedData>("ScannedData", ScannedDataSchema);

export default ScannedData;