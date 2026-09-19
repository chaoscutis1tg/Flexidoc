import mongoose from 'mongoose';

const contractVersionSchema = new mongoose.Schema({
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  version: {
    type: Number,
    required: true,
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {},
  },
  fieldsSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
  renderedContent: {
    type: String,
    default: '',
  },
  fileKeyDocx: {
    type: String,
    default: '',
  },
  fileKeyPdf: {
    type: String,
    default: '',
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

contractVersionSchema.index({ contractId: 1, version: -1 }, { unique: true });
contractVersionSchema.index({ organizationId: 1 });

export const ContractVersion = mongoose.model('ContractVersion', contractVersionSchema);
