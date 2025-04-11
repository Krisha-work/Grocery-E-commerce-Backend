import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

// Extend Express Request and Response interfaces
interface CustomRequest extends Request {
  file?: Express.Multer.File;
  setTimeout: (msecs: number, callback?: () => void) => this;
}

interface CustomResponse extends Response {
  status: (code: number) => this;
}

// Set storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req: CustomRequest, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Check file type
function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images only (jpeg, jpg, png, gif)'));
  }
}

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: function (req: CustomRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    checkFileType(file, cb);
  }
});

const uploadSingle = upload.single('productImage'); // 'productImage' is the field name

// Enhanced upload handler with timeout
const handleUpload = (fieldName: string) => {
  return (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    // Set timeout for upload (30 seconds)
    req.setTimeout(30000);

    const uploadPromise = new Promise((resolve, reject) => {
      console.log('Starting file upload for field:', fieldName);
      const uploadHandler = upload.single(fieldName);
      
      uploadHandler(req, res, (err: any) => {
        if (err) {
          // Clean up any partial uploads
          console.log('Error during file upload:', err);
          if (req.file) {
            fs.unlink(req.file.path, () => {});
          }

          if (err.code === 'LIMIT_FILE_SIZE') {
            reject({ status: 413, message: 'File too large (max 1MB)' });
            return;
          }
          if (err.message.includes('Unexpected end of form')) {
           
            reject({ 
              status: 400, 
              message: 'Upload interrupted. Please try again.',
              solution: 'Ensure stable network connection and try uploading again'
            });
            return;
          }
          
          console.error('Error during file upload:', err);
          reject({ 
            status: 500, 
            message: 'File upload failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
          return;
        }

        if (!req.file) {
          reject({ status: 400, message: 'No file was uploaded' });
          return;
        }

        console.log('File uploaded successfully:', req.file);
        resolve(req.file);
      });
    });

    uploadPromise
      .then(() => next())
      .catch((error: any) => {
        return res.status(error.status).json({
          error: error.message,
          solution: error.solution,
          details: error.details
        });
      });
  };
};

export { upload, handleUpload };