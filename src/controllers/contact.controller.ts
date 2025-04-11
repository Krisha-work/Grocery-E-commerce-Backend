import { Request, Response } from 'express';
import Contact from '../models/contact.model';
import { handleResponse, HTTP_STATUS } from '../utils/responseHandler';
import { StatusCode } from '../config/statusCode';

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    // Create contact form submission
    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
      status: 'pending'
    });

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.CREATED,
      'Contact form submitted successfully',
      contact
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error submitting contact form'
    );
  }
};

export const getContactSubmissions = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = status ? { status } : {};

    const { count, rows } = await Contact.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    const pagination = {
      page: Number(page),
      limit: Number(limit),
      totalItems: count,
      totalPages: Math.ceil(count / Number(limit))
    };

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Contact submissions retrieved successfully',
      rows,
      pagination
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error fetching contact submissions'
    );
  }
};

export const updateContactStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Contact submission not found'
      );
    }

    await contact.update({ status });
    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Contact status updated successfully',
      contact
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error updating contact status'
    );
  }
};

export const deleteContactSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Contact submission not found'
      );
    }

    await contact.destroy();
    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Contact submission deleted successfully'
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error deleting contact submission'
    );
  }
}; 