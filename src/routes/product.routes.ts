import express from 'express';
import { handleUpload } from '../middleware/upload';
import {
  createProduct,
  getAllProducts,
  updateProduct,
} from '../controllers/product.controller';

const router = express.Router();

router.get('/', getAllProducts);
router.post('/create', handleUpload('image_url'), createProduct);
router.put('/:id', handleUpload('image_url'), updateProduct);
export default router;