// slider
let slideIndex = 0;

function showSlides() {
  let slides = document.getElementsByClassName("slide");
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slideIndex++;
  if (slideIndex > slides.length) {
    slideIndex = 1;
  }
  slides[slideIndex - 1].style.display = "block";
  setTimeout(showSlides, 3000);
}

showSlides();
//---------

async function loadProductCards() {
  try {
    // Получаем список продуктов с сервера
    const response = await fetch("http://localhost:3000/api/products");
    const products = await response.json();

    const productCardsContainer = document.getElementById("product_cards");
    productCardsContainer.innerHTML = ""; // Очищаем контейнер перед добавлением карточек

    // Фильтруем только активные продукты
    const activeProducts = products.filter((product) => product.active === 1);

    // Создаем карточки только для активных продуктов
    activeProducts.forEach((product) => {
      // Создаем карточку продукта
      const card = document.createElement("div");
      card.className = "card";

      // Вставляем изображение продукта или заглушку
      const imageSrc = product.image
        ? `http://localhost:3000/${product.image}`
        : "./img/slider_img/1.jpeg";
      const image = `<img src="${imageSrc}" alt="${product.name}" class="card_img" />`;

      // Условие для отображения объема (если он указан)
      const volume = product.volume
        ? `<div class="sklad">Objem: ${product.volume} ml</div>`
        : "";

      // Добавляем HTML содержимое карточки
      card.innerHTML = `
        ${image}
        <div class="card_content">
          <div class="card_top">
            <h3 class="card_title">${product.name}</h3>
            <div class="card_line"></div>
            <p class="card_text">${product.description}</p>
          </div>
          <div class="card_bottom">
            ${volume}
            <div class="sklad">Na sklade: ${product.stock} ks</div>
            <div class="card_footer">
              <span class="price">${product.price} Kč</span>
              <div class="card_plus" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${imageSrc}">
                + <img class="card_cart" src="./img/cart.svg" alt="cart" />
              </div>
            </div>
          </div>
        </div>
      `;

      // Добавляем обработчик событий для кнопки добавления в корзину
      const addToCartButton = card.querySelector(".card_plus");
      addToCartButton.addEventListener("click", () => {
        const productData = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: imageSrc,
        };
        addToCart(productData);
      });

      // Добавляем карточку в контейнер
      productCardsContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Neco se pokazilo: ", error);
  }
}

// Функция добавления товара в корзину
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existingProduct = cart.find((item) => item.id === product.id);
  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Přidano do košiku");
}

// Загружаем карточки при загрузке страницы
document.addEventListener("DOMContentLoaded", loadProductCards);

// Загружаем карточки при загрузке страницы
document.addEventListener("DOMContentLoaded", loadProductCards);

function addToCart(product) {
  // Получаем текущую корзину из localStorage
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Ищем, есть ли продукт уже в корзине
  const existingProduct = cart.find((item) => item.id === product.id);

  if (existingProduct) {
    // Если продукт уже есть, увеличиваем его количество
    existingProduct.quantity += 1;
  } else {
    // Если продукта нет в корзине, добавляем его с количеством 1
    cart.push({ ...product, quantity: 1 });
  }

  // Сохраняем обновленную корзину в localStorage
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Přidano do košiku");
}

// Пример привязки функции к кнопке в карточке продукта
document.addEventListener("DOMContentLoaded", function () {
  const cartButtons = document.querySelectorAll(".card_plus");
  cartButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-id"); // Получаем ID продукта
      const product = {
        id: productId,
        name: button.getAttribute("data-name"),
        price: Number(button.getAttribute("data-price")),
        image: button.getAttribute("data-image"),
      };
      addToCart(product);
    });
  });
});
