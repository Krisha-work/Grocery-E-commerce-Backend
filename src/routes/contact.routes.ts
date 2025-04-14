import express from 'express';
import {
  submitContactForm,
  getContactSubmissions,
  updateContactStatus,
  deleteContactSubmission
} from '../controllers/contact.controller';

const router = express.Router();

// Submit new contact form
router.post('/', submitContactForm);

// Get all contact submissions with optional filtering
router.get('/', getContactSubmissions);

// Update contact submission status
router.put('/:id/status', updateContactStatus);

// Delete contact submission
router.delete('/:id', deleteContactSubmission);

export default router; 