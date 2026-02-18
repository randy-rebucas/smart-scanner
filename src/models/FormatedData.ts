import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEntity {
	personNames: string[];
	companyNames: string[];
	emails: string[];
	phoneNumbers: string[];
	addresses: string[];
	lastName: string;
	firstName: string;
	middleName: string;
	gender: string;
	birthdate: string;
	address: string;
}

export interface IFinancialData {
	invoiceNumber: string;
	receiptNumber: string;
	date: string;
	dueDate: string;
	subtotal: number | null;
	tax: number | null;
	total: number | null;
	currency: string;
}

export interface IItem {
	description: string;
	quantity: number | null;
	unitPrice: number | null;
	total: number | null;
}

export interface IFormatedData extends Document {
	documentType: string;
	confidenceScore: number;
	metadata: {
		detectedLanguage: string;
		imageQuality: string;
	};
	entities: IEntity;
	financialData: IFinancialData;
	items: IItem[];
	rawText: string;
	user: string;
	createdAt: Date;
}

const FormatedDataSchema: Schema = new Schema(
	{
		documentType: { type: String, required: true },
		confidenceScore: { type: Number, required: true },
		metadata: {
			detectedLanguage: { type: String, required: true },
			imageQuality: { type: String, required: true },
		},
		entities: {
			personNames: [{ type: String }],
			companyNames: [{ type: String }],
			emails: [{ type: String }],
			phoneNumbers: [{ type: String }],
			addresses: [{ type: String }],
			lastName: { type: String },
			firstName: { type: String },
			middleName: { type: String },
			gender: { type: String },
			birthdate: { type: String },
			address: { type: String },
		},
		financialData: {
			invoiceNumber: { type: String },
			receiptNumber: { type: String },
			date: { type: String },
			dueDate: { type: String },
			subtotal: { type: Number },
			tax: { type: Number },
			total: { type: Number },
			currency: { type: String },
		},
		items: [
			{
				description: { type: String },
				quantity: { type: Number },
				unitPrice: { type: Number },
				total: { type: Number },
			},
		],
		rawText: { type: String },
		user: { type: String, required: true },
		createdAt: { type: Date, default: Date.now },
	},
	{ collection: "formated_data" }
);

const FormatedData: Model<IFormatedData> =
	mongoose.models.FormatedData || mongoose.model<IFormatedData>("FormatedData", FormatedDataSchema);

export default FormatedData;
