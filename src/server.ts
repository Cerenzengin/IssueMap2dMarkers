import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { connectMongo, client } from './mongo'; // Ensure path is correct

// Define a schema for the issues
import { Schema, model } from 'mongoose';

const issueSchema = new Schema({
  issueType: String,
  description: String,
  photoPath: String,
  latitude: Number,
  longitude: Number,
});

const EnteredIssue = model('EnteredIssue', issueSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const app = express();

// Parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to handle issue submissions
app.post('/api/issues', upload.single('photo'), async (req, res) => {
  const issueData = {
    issueType: req.body.issueType,
    description: req.body.description,
    photoPath: req.file ? req.file.path : '',
    latitude: req.body.latitude,
    longitude: req.body.longitude,
  };

  try {
    const db = client.db('EnteredIssues'); // Replace with your database name
    const issuesCollection = db.collection('itwin'); // Replace with your collection name
    const result = await issuesCollection.insertOne(issueData);
    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// MongoDB connection
connectMongo().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(console.error);
