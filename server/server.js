const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Мидлвары для обработки JSON и CORS
app.use(cors());
app.use(express.json());

// Настройка раздачи статических файлов фронтенда из папки client
app.use(express.static(path.join(__dirname, '../client')));

// Настройка Cloudinary через переменные окружения
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Хранилище Multer для прямой загрузки файлов в Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'velix_drop_products', // Папка в Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});
const upload = multer({ storage });

// Базовые категории
const categories = [
  { id: 'all', name: 'Все товары' },
  { id: 't-shirts', name: 'Футболки' },
  { id: 'longsleeves', name: 'Лонгсливы' },
  { id: 'jeans', name: 'Джинсы' },
  { id: 'pants', name: 'Штаны' },
  { id: 'shorts', name: 'Шорты' },
  { id: 'sneakers', name: 'Кроссовки' }
];

// Массив товаров в памяти
let products = [
  { 
    id: 1, 
    title: 'Тестовая Футболка', 
    price: 1500, 
    category: 't-shirts',
    img: 'https://via.placeholder.com/300' 
  }
];

// Пароль админа из переменных окружения
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'default_admin_pass';

// --- МАРШРУТЫ ФРОНТЕНДА ---

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// --- API МАРШРУТЫ ---

// Получить категории
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// Получить товары
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Добавить новый товар
app.post('/api/products', upload.single('image'), (req, res) => {
  const { title, price, category, password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Неверный пароль администратора!' });
  }

  if (!title || !price || !category) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  // URL загруженного изображения из Cloudinary
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

// Удалить товар по ID
app.delete('/api/products/:id', (req, res) => {
  const { password } = req.body;
  const productId = Number(req.params.id);

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Неверный пароль администратора!' });
  }

  products = products.filter(p => p.id !== productId);
  res.json({ success: true, message: 'Товар успешно удален' });
});

// Запуск сервера
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер успешно запущен на порту ${PORT}`);
});