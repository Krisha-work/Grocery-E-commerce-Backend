import { Request, Response } from 'express';
import Review from '../models/review.model';
import Order from '../models/order.model';
import OrderItem from '../models/orderItem.model';
import { Op } from 'sequelize';
import Product from '../models/product.model';
import User from '../models/user.model';

export const createReview = async (req: Request, res: Response) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user!.id;

    // Check if user has purchased the product
    const hasPurchased = await Order.findOne({
      include: [{
        model: OrderItem,
        as: 'OrderItems',
        where: { productId },
      }],
      where: {
        user_id: userId,
        status: 'delivered',
      },
    });

    if (!hasPurchased) {
      return res.status(403).json({ error: 'You must purchase the product before reviewing it' });
    }

    // Check if user has already reviewed the product
    const existingReview = await Review.findOne({
      where: { user_id: userId, product_id: productId },
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      user_id: userId,
      product_id: productId,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Error creating review' });
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user!.id;

    const review = await Review.findOne({
      where: { id, user_id: userId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.update({ rating, comment });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Error updating review' });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const review = await Review.findOne({
      where: { id, user_id: userId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.destroy();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting review' });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const reviews = await Review.findAndCountAll({
      where: { product_id: productId },
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username'],
      }],
    });

    res.json({
      reviews: reviews.rows,
      total: reviews.count,
      totalPages: Math.ceil(reviews.count / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error fetching product reviews' });
  }
};

export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const reviews = await Review.findAndCountAll({
      where: { user_id: userId },
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'image_url'],
      }],
    });

    res.json({
      reviews: reviews.rows,
      total: reviews.count,
      totalPages: Math.ceil(reviews.count / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error fetching user reviews' });
  }
}; 