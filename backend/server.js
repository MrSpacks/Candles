const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");

const app = express();
const port = 3000;

// Используем CORS middleware
app.use(cors());

// Middleware для обработки JSON
app.use(express.json());

// Настройка multer для загрузки файлов
const upload = multer({ dest: "uploads/" }); // Папка для сохранения загружаемых файлов

// Подключение к базе данных SQLite
const db = new sqlite3.Database("./db/data.db", (err) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err.message);
  } else {
    console.log("Подключено к базе данных SQLite");
  }
});

// Создание таблицы продуктов (выполняется только один раз при запуске)
db.run(`
   CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      volume INTEGER,
      price REAL,
      stock INTEGER,
      active INTEGER,
      image TEXT
   )
`);

// Маршрут для добавления нового продукта
app.post("/api/products", upload.single("image"), (req, res) => {
  const { name, description, volume, price, stock, active } = req.body;
  const imagePath = req.file ? req.file.path : null;

  const query = `
    INSERT INTO products (name, description, volume, price, stock, active, image) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(
    query,
    [name, description, volume, price, stock, active ? 1 : 0, imagePath],
    function (err) {
      if (err) {
        console.error("Ошибка при добавлении в базу данных:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Маршрут для получения всех продуктов
app.get("/api/products", (req, res) => {
  db.all(`SELECT * FROM products`, [], (err, rows) => {
    if (err) {
      console.error("Ошибка при получении продуктов:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Маршрут для удаления продукта
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM products WHERE id = ?`;
  db.run(query, id, function (err) {
    if (err) {
      console.error("Ошибка при удалении продукта:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: "Продукт удален" });
  });
});

// Маршрут для изменения активности продукта
app.patch("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  const query = `UPDATE products SET active = ? WHERE id = ?`;
  db.run(query, [active ? 1 : 0, id], function (err) {
    if (err) {
      console.error("Ошибка при изменении активности продукта:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: "Активность продукта изменена" });
  });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
