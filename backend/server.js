const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();
const port = 3000;
const sqlite3 = require("sqlite3").verbose();

// Используем CORS middleware
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
  // Сохраняем полный путь к файлу, включая папку
  const imagePath = req.file ? `uploads/${req.file.filename}` : null;

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

const nodemailer = require("nodemailer");

app.post("/api/send-order", async (req, res) => {
  const { name, address, city, postalCode, phone, email, cart } = req.body;

  const cartItems = cart
    .map(
      (item) =>
        `- ${item.name}, množství: ${item.quantity}, cena za kus: ${item.price} Kč`
    )
    .join("\n");

  const message = `
    Objednávka od zákazníka:
    Jméno: ${name}
    Adresa: ${address}
    Město, stát: ${city}
    PSČ: ${postalCode}
    Telefon: ${phone}
    Email: ${email}

    Obsah košíku:
    ${cartItems}

    Celková cena: ${cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )} Kč
  `;

  try {
    // Настройка почтового клиента
    const transporter = nodemailer.createTransport({
      service: "gmail", // Или другой почтовый сервис
      auth: {
        user: "web.mr.spacks@gmail.com", // Замените на ваш email
        pass: "89527532341Praha", // Замените на ваш пароль (или приложение пароль)
      },
    });

    // Отправка email
    await transporter.sendMail({
      from: "web.mr.spacks@gmail.com", // Замените на ваш email
      to: "web.mr.spacks@gmail.com", // Замените на ваш email
      subject: "Nová objednávka",
      text: message,
    });

    res.status(200).send("Objednávka byla úspěšně odeslána.");
  } catch (error) {
    console.error("Chyba při odesílání emailu:", error);
    res.status(500).send("Chyba při odesílání emailu.");
  }
});
