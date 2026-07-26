const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors());
app.use(express.json());

// Настройка Cloudinary через переменные окружения
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Настройка хранилища Multer для загрузки напрямую в Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'velix_drop_products', // Название папки в Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});
const upload = multer({ storage });

// Категории
const categories = [
  { id: 'all', name: 'Все товары' },
  { id: 't-shirts', name: 'Футболки' },
  { id: 'longsleeves', name: 'Лонгсливы' },
  { id: 'jeans', name: 'Джинсы' },
  { id: 'pants', name: 'Штаны' },
  { id: 'shorts', name: 'Шорты' },
  { id: 'sneakers', name: 'Кроссовки' }
];

let products = [
  { 
    id: 1, 
    title: 'Тестовая Футболка', 
    price: 1500, 
    category: 't-shirts',
    img: 'https://via.placeholder.com/300' 
  }
];

// Пароль администратора берется из переменных окружения
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'default_admin_pass';

app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/products', upload.single('image'), (req, res) => {
  const { title, price, category, password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Неверный пароль!' });
  }

  if (!title || !price || !category) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  // Ссылка на фото из Cloudinary возвращается в req.file.path
  const imgUrl = req.file ? req.file.path : 'https://via.placeholder.com/300';

  const newProduct = {
    id: Date.now(),
    title,
    price: Number(price),
    category,
    img: imgUrl
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.delete('/api/products/:id', (req, res) => {
  const { password } = req.body;
  const productId = Number(req.params.id);

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Неверный пароль!' });
  }

  products = products.filter(p => p.id !== productId);
  res.json({ success: true, message: 'Товар удален' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));