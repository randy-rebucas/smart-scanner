export interface DocumentTemplate {
  label: string;
  systemPrompt: string;
  jsonStructure: Record<string, unknown>;
}

// ── Templates ────────────────────────────────────────────────────────────────

const idTemplate: DocumentTemplate = {
  label: "ID Document",
  systemPrompt:
    "You are a document analysis AI specializing in identity documents (national IDs, passports, driver's licenses). Extract every visible field from the document accurately.",
  jsonStructure: {
    documentType: "",
    confidenceScore: 0,
    metadata: {
      detectedLanguage: "",
      imageQuality: "low | medium | high",
    },
    idInfo: {
      idType: "",
      idNumber: "",
      firstName: "",
      lastName: "",
      middleName: "",
      gender: "",
      birthdate: "",
      nationality: "",
      address: "",
      issuingAuthority: "",
      issuingCountry: "",
      issueDate: "",
      expirationDate: "",
    },
    rawText: "",
  },
};

const invoiceTemplate: DocumentTemplate = {
  label: "Invoice",
  systemPrompt:
    "You are a document analysis AI specializing in invoices. Extract every vendor, client, line-item, and financial field visible in the document.",
  jsonStructure: {
    documentType: "",
    confidenceScore: 0,
    metadata: {
      detectedLanguage: "",
      imageQuality: "low | medium | high",
    },
    vendor: {
      name: "",
      address: "",
      phone: "",
      email: "",
      taxId: "",
      website: "",
    },
    client: {
      name: "",
      address: "",
      phone: "",
      email: "",
    },
    invoiceDetails: {
      invoiceNumber: "",
      date: "",
      dueDate: "",
      purchaseOrderNumber: "",
      paymentTerms: "",
      notes: "",
      subtotal: null,
      discount: null,
      tax: null,
      shipping: null,
      total: null,
      currency: "",
    },
    items: [
      {
        description: "",
        quantity: null,
        unitPrice: null,
        total: null,
      },
    ],
    rawText: "",
  },
};

const receiptTemplate: DocumentTemplate = {
  label: "Receipt",
  systemPrompt:
    "You are a document analysis AI specializing in receipts. Extract every merchant detail, purchased item, and payment field visible in the document.",
  jsonStructure: {
    documentType: "",
    confidenceScore: 0,
    metadata: {
      detectedLanguage: "",
      imageQuality: "low | medium | high",
    },
    merchant: {
      name: "",
      address: "",
      phone: "",
      taxId: "",
    },
    receiptDetails: {
      receiptNumber: "",
      date: "",
      time: "",
      cashier: "",
      paymentMethod: "",
      subtotal: null,
      discount: null,
      tax: null,
      tip: null,
      total: null,
      currency: "",
    },
    items: [
      {
        description: "",
        quantity: null,
        unitPrice: null,
        total: null,
      },
    ],
    rawText: "",
  },
};

const businessCardTemplate: DocumentTemplate = {
  label: "Business Card",
  systemPrompt:
    "You are a document analysis AI specializing in business cards. Extract every contact detail, title, company, and social handle visible on the card.",
  jsonStructure: {
    documentType: "",
    confidenceScore: 0,
    metadata: {
      detectedLanguage: "",
      imageQuality: "low | medium | high",
    },
    contact: {
      firstName: "",
      lastName: "",
      title: "",
      company: "",
      department: "",
      phone: "",
      mobilePhone: "",
      email: "",
      website: "",
      address: "",
      linkedin: "",
      twitter: "",
    },
    rawText: "",
  },
};

const contractTemplate: DocumentTemplate = {
  label: "Contract / Agreement",
  systemPrompt:
    "You are a document analysis AI specializing in legal contracts and agreements. Extract party information, key dates, terms, and signatories visible in the document.",
  jsonStructure: {
    documentType: "",
    confidenceScore: 0,
    metadata: {
      detectedLanguage: "",
      imageQuality: "low | medium | high",
    },
    contractInfo: {
      title: "",
      contractNumber: "",
      effectiveDate: "",
      expirationDate: "",
      governingLaw: "",
    },
    parties: [
      {
        name: "",
        role: "",
        address: "",
      },
    ],
    keyTerms: [],
    signatories: [
      {
        name: "",
        role: "",
        signedDate: "",
      },
    ],
    rawText: "",
  },
};

const medicalTemplate: DocumentTemplate = {
  label: "Medical Document",
  systemPrompt:
    "You are a document analysis AI specializing in medical documents (prescriptions, lab results, medical records). Extract patient info, provider details, diagnoses, and medications visible in the document.",
  jsonStructure: {
    documentType: "",
    confidenceScore: 0,
    metadata: {
      detectedLanguage: "",
      imageQuality: "low | medium | high",
    },
    patient: {
      firstName: "",
      lastName: "",
      birthdate: "",
      gender: "",
      patientId: "",
    },
    provider: {
      name: "",
      specialty: "",
      licenseNumber: "",
      facility: "",
      address: "",
      phone: "",
    },
    documentDate: "",
    diagnosis: [],
    medications: [
      {
        name: "",
        dosage: "",
        frequency: "",
        quantity: "",
      },
    ],
    notes: "",
    rawText: "",
  },
};

const formTemplate: DocumentTemplate = {
  label: "Form",
  systemPrompt:
    "You are a document analysis AI specializing in forms and structured documents. Extract every labeled field, checkbox, and entry visible in the form.",
  jsonStructure: {
    documentType: "",
    confidenceScore: 0,
    metadata: {
      detectedLanguage: "",
      imageQuality: "low | medium | high",
    },
    formTitle: "",
    formNumber: "",
    date: "",
    fields: {},
    signatures: [],
    rawText: "",
  },
};

const otherTemplate: DocumentTemplate = {
  label: "Other Document",
  systemPrompt:
    "You are a document analysis AI. Extract all readable key-value information, tables, and text from this document.",
  jsonStructure: {
    documentType: "",
    confidenceScore: 0,
    metadata: {
      detectedLanguage: "",
      imageQuality: "low | medium | high",
    },
    keyValuePairs: {},
    tables: [],
    rawText: "",
  },
};

// ── Registry ─────────────────────────────────────────────────────────────────

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
  id: idTemplate,
  passport: idTemplate,
  drivers_license: idTemplate,
  invoice: invoiceTemplate,
  receipt: receiptTemplate,
  business_card: businessCardTemplate,
  contract: contractTemplate,
  medical: medicalTemplate,
  form: formTemplate,
  other: otherTemplate,
};

export const VALID_DOCUMENT_TYPES = Object.keys(DOCUMENT_TEMPLATES).join(" | ");

export function getTemplate(documentType: string): DocumentTemplate {
  return DOCUMENT_TEMPLATES[documentType] ?? DOCUMENT_TEMPLATES.other;
}
