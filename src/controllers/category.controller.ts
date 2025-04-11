import { Request, Response } from 'express';
import Category from '../models/category.model';
import Product from '../models/product.model';
import { Op } from 'sequelize';
import { handleResponse, HTTP_STATUS } from '../utils/responseHandler';
import { StatusCode } from '../config/statusCode';
import { validateName } from '../utils/validation';

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    // Validate input
    const nameValidation = validateName(name, 'Category name');
    if (!nameValidation.isValid) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        nameValidation.status || StatusCode.BAD_REQUEST,
        nameValidation.message || 'Invalid category name'
      );
    }

    const category = await Category.create({ name, description });
    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.CREATED,
      'Category created successfully',
      category
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error creating category'
    );
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate input if provided
    if (name) {
      const nameValidation = validateName(name, 'Category name');
      if (!nameValidation.isValid) {
        return handleResponse(
          res,
          HTTP_STATUS.ERROR_STATUS,
          nameValidation.status || StatusCode.BAD_REQUEST,
          nameValidation.message || 'Invalid category name'
        );
      }
    }
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Category not found'
      );
    }

    await category.update({ name, description });
    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Category updated successfully',
      category
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error updating category'
    );
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    
    if (!category) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Category not found'
      );
    }

    await category.destroy();
    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Category deleted successfully'
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error deleting category'
    );
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.findAll();
    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Categories retrieved successfully',
      categories
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error fetching categories'
    );
  }
};

export const getCategoryProducts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sortBy = 'created_at', order = 'DESC' } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const products = await Product.findAndCountAll({
      where: { category: id },
      limit: Number(limit),
      offset,
      order: [[sortBy as string, order as string]],
    });



    return handleResponse(
      res,  
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Category products retrieved successfully',
      products.rows
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error fetching category products'
    );
  }
}; 