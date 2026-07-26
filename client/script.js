let currentPassword = '';

document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadProducts();

  // Элементы UI
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const authModal = document.getElementById('authModal');
  const closeAuthBtn = document.getElementById('closeAuthBtn');
  const submitPasswordBtn = document.getElementById('submitPasswordBtn');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const authError = document.getElementById('authError');

  const adminPanelModal = document.getElementById('adminPanelModal');
  const closeAdminBtn = document.getElementById('closeAdminBtn');
  const addProductForm = document.getElementById('addProductForm');

  // 1. Клик по кнопке "Вход" -> открытие окна пароля
  adminLoginBtn.addEventListener('click', () => {
    adminPasswordInput.value = '';
    authError.classList.add('hidden');
    authModal.classList.remove('hidden');
  });

  // Отмена ввода пароля
  closeAuthBtn.addEventListener('click', () => {
    authModal.classList.add('hidden');
  });

  // 2. Проверка пароля и открытие админки
  submitPasswordBtn.addEventListener('click', () => {
    const password = adminPasswordInput.value.trim();
    if (!password) return;

    currentPassword = password;
    authModal.classList.add('hidden');
    
    // Открываем панель управления
    openAdminPanel();
  });

  // Закрытие админ-панели
  closeAdminBtn.addEventListener('click', () => {
    adminPanelModal.classList.add('hidden');
  });

  // 3. Отправка формы добавления товара
  addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('newTitle').value;
    const price = document.getElementById('newPrice').value;
    const category = document.getElementById('newCategory').value;
    const imageFile = document.getElementById('newImage').files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('image', imageFile);
    formData.append('password', currentPassword);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData
      });

      if (res.status === 403) {
        alert('Неверный пароль администратора!');
        return;
      }

      if (res.ok) {
        alert('Товар успешно добавлен!');
        addProductForm.reset();
        loadProducts();
        renderAdminProducts();
      } else {
        alert('Ошибка при добавлении товара');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка соединения с сервером');
    }
  });
});

// Загрузка категорий с относительным путем /api/categories
async function loadCategories() {
  const list = document.getElementById('categoriesList');
  try {
    const res = await fetch('/api/categories');
    const categories = await res.json();

    list.innerHTML = categories.map(cat => `
      <li data-id="${cat.id}">${cat.name}</li>
    `).join('');
  } catch (err) {
    list.innerHTML = '<li>Ошибка загрузки</li>';
  }
}

// Загрузка товаров с относительным путем /api/products
async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  const errorMsg = document.getElementById('errorMessage');

  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    errorMsg.classList.add('hidden');

    if (products.length === 0) {
      grid.innerHTML = '<p>Товаров пока нет</p>';
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="product-card">
        <img src="${p.img}" alt="${p.title}">
        <h4>${p.title}</h4>
        <p class="price">${p.price} ₽</p>
        <button class="btn-primary">Купить</button>
      </div>
    `).join('');
  } catch (err) {
    errorMsg.textContent = 'Ошибка загрузки каталога';
    errorMsg.classList.remove('hidden');
  }
}

// Отрисовка списка товаров внутри Админ-Панели (для удаления)
async function openAdminPanel() {
  const adminPanelModal = document.getElementById('adminPanelModal');
  adminPanelModal.classList.remove('hidden');
  renderAdminProducts();
}

async function renderAdminProducts() {
  const container = document.getElementById('adminProductsList');
  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    container.innerHTML = products.map(p => `
      <div class="admin-product-item">
        <span>${p.title} (${p.price} ₽)</span>
        <button onclick="deleteProduct(${p.id})" class="btn-danger">Удалить</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p>Ошибка загрузки списка</p>';
  }
}

// Функция удаления товара
async function deleteProduct(id) {
  if (!confirm('Вы уверены, что хотите удалить товар?')) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: currentPassword })
    });

    if (res.status === 403) {
      alert('Ошибка доступа: неверный пароль');
      return;
    }

    if (res.ok) {
      loadProducts();
      renderAdminProducts();
    }
  } catch (err) {
    alert('Не удалось удалить товар');
  }
}