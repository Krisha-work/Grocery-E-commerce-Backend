import { Request, Response } from 'express';
import Product from '../models/product.model';
import Category from '../models/category.model';
import Review from '../models/review.model';
import User from '../models/user.model';
import { Op } from 'sequelize';
import { handleResponse, HTTP_STATUS } from '../utils/responseHandler';
import { StatusCode } from '../config/statusCode';
import path from 'path';
import fs from 'fs';

// Helper function to validate image file
const validateImageFile = (file: Express.Multer.File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Only JPEG, PNG, and GIF images are allowed');
  }

  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }

  return true;
};
  
// Helper function to delete old image file
const deleteOldImage = async (imagePath: string) => {
  if (imagePath) {
    const fullPath = path.join(__dirname, '..', '..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    console.log("-----------------33---------------");
    const products = await Product.findAll({
      include: [
        { model: Category, as: 'categoryDetail' },
      ]
    });

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,  
      'Products retrieved successfully',
      { products }
    );
  } catch (error) {
    console.log(error);
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error fetching products'
    );
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      sort = 'created_at',
      page = 1,
      limit = 10,
      search
    } = req.query;
    console.log("-----------------11---------------");
    const where: any = {};
    if (category) where.category = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    console.log("---------------22-----------------");
    const { count, rows } = await Product.findAndCountAll({
      where,
      order: [[sort as string, 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      include: [
        { model: Category, as: 'categoryDetails' },
        { model: Review, attributes: ['rating', 'comment'] }
      ]
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
      'Products retrieved successfully',
      { products: rows, pagination }
    );
  } catch (error) {
    console.log(error);
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error fetching products'
    );
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'categoryDetails' },
        { 
          model: Review, 
          as: 'reviewDetails',
          include: [{ model: User, as: 'userDetails', attributes: ['id', 'name', 'email'] }]
        }
      ]
    });

    if (!product) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Product not found'
      );
    }

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Product retrieved successfully',
      product
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error fetching product'
    );
  }
};

export const createProduct = async (req: Request, res: Response) => {
  console.log('Starting product creation process');
  try {
    const { name, description, price, stock, categoryId } = req.body;
    
    if (!req.file) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'No image file was uploaded'
      );
    }

    try {
      validateImageFile(req.file);
    } catch (validationError) {
      // Clean up the uploaded file
      await deleteOldImage(req.file.path);
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        validationError instanceof Error ? validationError.message : 'File validation failed'
      );
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category: categoryId,
      image_url: req.file.path.replace(/\\/g, '/')
    });

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.CREATED,
      'Product created successfully',
      product
    );
  } catch (error) {
    if (req.file) {
      await deleteOldImage(req.file.path);
    }
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error creating product'
    );
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, categoryId } = req.body;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Product not found'
      );
    }

    const updateData: any = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      categoryId
    };

    if (req.file) {
      validateImageFile(req.file);
      const oldImagePath = product.image_url;
      updateData.image_url = req.file.path.replace(/\\/g, '/');
      await deleteOldImage(oldImagePath || '');
    }

    await product.update(updateData);

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Product updated successfully',
      product
    );
  } catch (error) {
    if (req.file) {
      await deleteOldImage(req.file.path);
    }
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error updating product'
    );
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Product not found'
      );
    }

    const imagePath = product.image_url;
    await product.destroy();
    await deleteOldImage(imagePath || '');

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Product deleted successfully'
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error deleting product'
    );
  }
};