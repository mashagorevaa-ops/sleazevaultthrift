// ==================== BURGER MENU ====================
const burger = document.getElementById('burger-menu');
const nav = document.getElementById('nav');
const overlay = document.getElementById('overlay');
const catalogFilterButtons = document.querySelectorAll(".catalog-filter");
let currentProduct = null;

function closeMenu() {
    burger?.classList.remove('active');
    nav?.classList.remove('active');
    overlay?.classList.remove('active');
    document.body.style.overflow = "";
}

function updateCartButtons() {
    document.querySelectorAll(".favorites__card").forEach(card => {
        const id = card.dataset.id;
        const btn = card.querySelector(".to-cart-btn");

        if (!btn || !id) return;

        if (!btn.dataset.defaultText) {
            btn.dataset.defaultText = btn.textContent;
        }

        if (cartState.has(id)) {
            btn.classList.add("added");
            btn.textContent = "В корзине";
        } else {
            btn.classList.remove("added");
            btn.textContent = btn.dataset.defaultText;
        }
    });
}

burger?.addEventListener('click', () => {
    burger.classList.toggle('active');
    nav.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = nav.classList.contains('active') ? "hidden" : "";
});

overlay?.addEventListener('click', closeMenu);


// ==================== NAV SCROLL ====================
const navLinks = document.querySelectorAll(".nav__link");

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        const target = document.getElementById(targetId);
        if (!target) return;

        const titleElement = target.querySelector(".section-title");
        const scrollTarget = titleElement || target;
        const headerHeight = 90;
        const elementPosition = scrollTarget.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerHeight;

        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        closeMenu();
    });
});

document.querySelectorAll(".scroll-link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();

        const targetId = link.getAttribute("href").substring(1);
        const target = document.getElementById(targetId);
        if (!target) return;

        const titleElement = target.querySelector(".section-title");
        const scrollTarget = titleElement || target;

        const headerHeight = 90;

        const elementPosition = scrollTarget.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerHeight;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    });
});

catalogFilterButtons.forEach(button => {
    button.addEventListener("click", () => {
        const category = button.dataset.filter || "all";

        catalogFilterButtons.forEach(filterButton => {
            const isActive = filterButton === button;
            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
        });

        filterCatalog(category);
    });
});

// ==================== CART ====================
const cartList = document.querySelector(".cart__list");
const selectAll = document.getElementById("selectAll");
const favoritesGrid = document.querySelector("#favorites .favorites__grid");
const ordersList = document.getElementById("ordersList");
const checkoutButton = document.querySelector(".cart__checkout");
const cartEmpty = document.getElementById("cartEmpty");
const favoritesCount = document.getElementById("favoritesCount");
const cartCount = document.getElementById("cartCount");
const ordersCount = document.getElementById("ordersCount");
const toastStack = document.getElementById("toastStack");

const CART_KEY = "sleaze_cart";
const FAVORITES_KEY = "sleaze_favorites";
const ORDERS_KEY = "sleaze_orders";
const cartState = new Map();
const favorites = new Set();
let pendingCheckoutItems = [];

const productDetails = {
    "Ботильоны": { material: "Кожа", condition: "Отличное", description: "Выразительная винтажная пара с уверенным силуэтом и мягким глянцем.", note: "Лучше всего смотрится с мини, денимом и длинным пальто." },
    "Сумка": { material: "Кожа", condition: "Очень хорошее", description: "Компактная сумка с характерной фактурой и спокойным винтажным настроением.", note: "Добавляет образу собранность и хорошо работает как акцент." },
    "Юбка": { material: "Шерсть с вискозой", condition: "Отличное", description: "Лаконичная юбка с чистой линией и правильной посадкой на каждый день.", note: "Хорошо сочетается и с прозрачным верхом, и с объемным трикотажем." },
    "Куртка": { material: "Эко-кожа", condition: "Очень хорошее", description: "Фактурная куртка с дерзким настроением и расслабленным силуэтом.", note: "Может стать главным акцентом всего образа." },
    "Очки": { material: "Ацетат", condition: "Отличное", description: "Узкая винтажная оправа, которая сразу делает образ собраннее.", note: "Подходит и к базовым вещам, и к более смелой стилизации." },
    "Платье": { material: "Вискоза", condition: "Отличное", description: "Легкое платье с мягкой линией и винтажным вечерним настроением.", note: "Особенно хорошо раскрывается в контрасте с грубой обувью." },
    "Ремень": { material: "Натуральная кожа", condition: "Очень хорошее", description: "Аккуратный аксессуар, который подчеркивает силуэт и завершает образ.", note: "Удачно работает поверх жакетов, платьев и трикотажа." },
    "Митенки": { material: "Трикотаж", condition: "Отличное", description: "Характерный акцент для layered-образов с легкой небрежностью.", note: "Добавляют образу фактуру и настроение без лишней тяжести." },
    "Джинсы": { material: "Деним", condition: "Очень хорошее", description: "Прямые винтажные джинсы с расслабленной посадкой и правильным выцветанием.", note: "Лучше всего сочетаются с лаконичным верхом и крупной сумкой." },
    "Кепи": { material: "Шерсть", condition: "Отличное", description: "Фактурный аксессуар, который делает силуэт интереснее и сложнее.", note: "Хорошо смотрится с минималистичной верхней одеждой." },
    "Сапоги": { material: "Кожа", condition: "Очень хорошее", description: "Высокие сапоги с уверенной формой и деликатным винтажным блеском.", note: "Подходят и к платьям, и к узкому дениму." },
    "Жакет": { material: "Шерсть", condition: "Отличное", description: "Структурный жакет с четкой линией плеч и спокойной посадкой.", note: "Подходит для многослойных образов с простым низом." },
    "Браслет": { material: "Металл", condition: "Отличное", description: "Украшение с мягким блеском и винтажным настроением.", note: "Носите отдельно или сочетайте с часами и кольцами." },
    "Топ": { material: "Хлопок с эластаном", condition: "Отличное", description: "Базовый топ с аккуратной посадкой и чистым силуэтом.", note: "Хорошо работает под жакеты, рубашки и кожаные куртки." }
};

const orderStatuses = ["Принят", "Собирается", "Передан в доставку"];

function filterCatalog(category) {
    document.querySelectorAll("#podbori .favorites__card").forEach(card => {
        const isVisible = category === "all" || card.dataset.category === category;
        card.classList.toggle("catalog-card--hidden", !isVisible);
    });
}

function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function loadOrders() {
    const data = localStorage.getItem(ORDERS_KEY);
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
}

function loadFavorites() {
    const data = localStorage.getItem(FAVORITES_KEY);
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function createFavoriteCard({ id, img, title, price = "0 ₽", size = "—" }) {
    const card = document.createElement("div");
    card.className = "favorites__card";
    card.dataset.id = id;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Открыть описание товара ${title}`);

    card.innerHTML = `
        <div class="favorites__image-wrapper">
            <img src="${img}" alt="${title}">
            <button class="to-cart-btn" data-price="${price}" data-size="${size}" aria-label="Добавить в корзину">🛒</button>
            <button class="to-fav-btn active" aria-label="Убрать из избранного">♡</button>
        </div>
        <div class="favorites__title">${title}</div>
        <div class="favorites__meta">${price} • ${formatSizeLabel(size)}</div>
    `;

    return card;
}

function getProductDetails(title) {
    return productDetails[title] || {
        material: "Винтажный микс",
        condition: "Отличное",
        description: "Винтажная находка с выразительным силуэтом и мягким настроением indie sleaze.",
        note: "Легко собирается с базовыми вещами и фактурными аксессуарами."
    };
}

function getSourceCardByTitle(title) {
    return Array.from(document.querySelectorAll("#podbori .favorites__card")).find(card => {
        return card.querySelector(".favorites__title")?.textContent?.trim() === title;
    }) || null;
}

function getSourceCardById(id) {
    if (!id) return null;
    return document.querySelector(`#podbori .favorites__card[data-id="${CSS.escape(id)}"]`);
}

function getSourceCardByImagePath(path) {
    const normalizedPath = normalizeImagePath(path);
    return Array.from(document.querySelectorAll("#podbori .favorites__card")).find(card => {
        const cardPath = normalizeImagePath(card.querySelector("img")?.getAttribute("src") || "");
        return cardPath === normalizedPath;
    }) || null;
}

function getFavoritePayloadFromCard(sourceCard) {
    if (!sourceCard) return null;

    const cartButton = sourceCard.querySelector(".to-cart-btn");
    const title = sourceCard.querySelector(".favorites__title")?.textContent?.trim() || "";
    return {
        id: sourceCard.dataset.id || "",
        img: sourceCard.querySelector("img")?.getAttribute("src") || "",
        title,
        price: cartButton?.dataset.price || "0 ₽",
        size: cartButton?.dataset.size || "—"
    };
}

function getFavoritePayloadById(id) {
    return getFavoritePayloadFromCard(getSourceCardById(id));
}

function getFavoritePayloadByTitle(title) {
    return getFavoritePayloadFromCard(getSourceCardByTitle(title));
}

function formatSizeLabel(size) {
    return size === "one size" ? "one size" : `размер ${size}`;
}

function ensureProductMeta(card) {
    const title = card.querySelector(".favorites__title");
    const cartButton = card.querySelector(".to-cart-btn");
    if (!title || !cartButton) return;

    let meta = card.querySelector(".favorites__meta");
    if (!meta) {
        meta = document.createElement("div");
        meta.className = "favorites__meta";
        title.after(meta);
    }

    meta.textContent = `${cartButton.dataset.price || "0 ₽"} • ${formatSizeLabel(cartButton.dataset.size || "—")}`;
}

function syncProductMeta() {
    document.querySelectorAll(".favorites__card").forEach(ensureProductMeta);
}

function normalizeImagePath(path) {
    if (!path) return "";
    if (path.startsWith("images/")) return path;

    const imagesIndex = path.indexOf("/images/");
    if (imagesIndex !== -1) {
        return path.slice(imagesIndex + 1);
    }

    return path;
}

function getStableImagePath(item = {}) {
    const sourceCard = (item.id ? getSourceCardById(item.id) : null)
        || getSourceCardByImagePath(item.img || "")
        || getSourceCardByTitle(item.title || "");
    const sourcePath = sourceCard?.querySelector("img")?.getAttribute("src");
    return sourcePath || normalizeImagePath(item.img || "");
}

function getOrderItemFromImage(img) {
    const imagePath = normalizeImagePath(img.getAttribute("src") || "");
    const sourceCard = getSourceCardByImagePath(imagePath);
    const payload = getFavoritePayloadFromCard(sourceCard);

    return {
        id: payload?.id || "",
        img: payload?.img || imagePath,
        title: payload?.title || img.alt || "Товар",
        price: payload?.price || "0 ₽",
        size: payload?.size || "—"
    };
}

function restoreFavorites() {
    if (!favoritesGrid) return;

    favoritesGrid.innerHTML = "";

    document.querySelectorAll("#podbori .favorites__card").forEach(sourceCard => {
        const favoriteItem = getFavoritePayloadFromCard(sourceCard);
        if (!favoriteItem?.id || !favorites.has(favoriteItem.id)) return;

        favoritesGrid.appendChild(createFavoriteCard(favoriteItem));
    });
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify([...cartState.values()]));
}

function loadCart() {
    const data = localStorage.getItem(CART_KEY);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function updateCart() {
    let total = 0;
    let count = 0;

    document.querySelectorAll(".cart__item").forEach(item => {
        const checkbox = item.querySelector(".cart-item");
        const priceEl = item.querySelector(".price");

        if (checkbox?.checked && priceEl) {
            const price = parseInt(priceEl.textContent.replace(/\D/g, "")) || 0;
            total += price;
            count++;
        }
    });

    document.getElementById("totalPrice").textContent = `${total.toLocaleString("ru-RU")} ₽`;
    document.getElementById("totalCount").textContent = count;
}

function checkSelectAll() {
    const checkboxes = document.querySelectorAll(".cart-item");
    const hasItems = checkboxes.length > 0;
    const allChecked = hasItems && Array.from(checkboxes).every(cb => cb.checked);
    if (selectAll) selectAll.checked = allChecked;
}

function createCartItem(item) {
    const newItem = document.createElement("div");
    newItem.classList.add("cart__item");
    newItem.dataset.id = item.id || item.title || "";
    const checked = item.checked !== false ? "checked" : "";
    const imagePath = getStableImagePath(item);

    newItem.innerHTML = `
        <input type="checkbox" class="cart-item" ${checked}>
        <img src="${imagePath}" alt="${item.title}" class="cart__item-img">
        <div class="cart__item-info">
            <div class="cart__item-title">${item.title}</div>
            <div class="cart__item-meta">Размер: ${item.size}</div>
            <div class="cart__item-meta price">${item.price}</div>
        </div>
        <div class="cart__actions">
            <button class="to-fav-btn" aria-label="В избранное">♡</button>
            <button class="delete-btn" aria-label="Удалить">🗑</button>
        </div>
    `;

    return newItem;
}

function getCartItemsFromDom() {
    return Array.from(document.querySelectorAll(".cart__item")).map(item => {
        const title = item.querySelector(".cart__item-title")?.textContent || "";
        const img = normalizeImagePath(item.querySelector(".cart__item-img")?.getAttribute("src") || "");
        const price = item.querySelector(".price")?.textContent || "0 ₽";
        const sizeText = item.querySelector(".cart__item-meta")?.textContent || "";
        const checked = Boolean(item.querySelector(".cart-item")?.checked);
        const id = item.dataset.id || getSourceCardByTitle(title)?.dataset.id || title;
        return {
            id,
            title,
            img,
            price,
            checked,
            size: sizeText.replace("Размер:", "").trim() || "—"
        };
    }).filter(item => item.title);
}

function persistCartFromDom() {
    const items = getCartItemsFromDom();
    cartState.clear();
    items.forEach(item => cartState.set(item.id || item.title, item));
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function updateCartEmpty() {
    if (!cartEmpty) return;
    const hasItems = document.querySelectorAll(".cart__item").length > 0;
    cartEmpty.style.display = hasItems ? "none" : "block";
}

function updateHeaderCounts() {
    if (favoritesCount) {
        favoritesCount.textContent = String(favorites.size);
        favoritesCount.classList.toggle("is-visible", favorites.size > 0);
    }
    if (cartCount) {
        cartCount.textContent = String(document.querySelectorAll(".cart__item").length);
        cartCount.classList.toggle("is-visible", document.querySelectorAll(".cart__item").length > 0);
    }
    if (ordersCount) {
        const totalOrders = document.querySelectorAll("#ordersList .orders__card").length;
        ordersCount.textContent = String(totalOrders);
        ordersCount.classList.toggle("is-visible", totalOrders > 0);
    }
}

function syncCartUI() {
    updateCart();
    checkSelectAll();
    updateCartButtons();
    updateModalButton();
    updateCartEmpty();
    updateHeaderCounts();
    updateCheckoutState();
}

function persistAndSyncCartUI() {
    persistCartFromDom();
    syncCartUI();
}

function updateCheckoutState() {
    if (!checkoutButton) return;
    const selected = document.querySelectorAll(".cart-item:checked").length;
    checkoutButton.disabled = selected === 0;
    checkoutButton.textContent = selected === 0 ? "Выберите товары" : "Перейти к оформлению";
}

function showToast(message) {
    if (!toastStack) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastStack.appendChild(toast);

    window.setTimeout(() => {
        toast.classList.add("toast--leaving");
        window.setTimeout(() => toast.remove(), 260);
    }, 2200);
}

function formatOrderDate(dateString) {
    return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(dateString));
}

function calculateOrderTotal(items) {
    return items.reduce((sum, item) => sum + (parseInt(String(item.price).replace(/\D/g, "")) || 0), 0);
}

function normalizeOrder(order) {
    return {
        ...order,
        items: (order.items || []).map(item => ({
            ...item,
            img: getStableImagePath(item)
        }))
    };
}

function createOrderCard(order) {
    order = normalizeOrder(order);
    const card = document.createElement("div");
    card.className = "orders__card orders__card--fresh";
    card.orderData = order;

    const images = order.items
        .map(item => `<img src="${getStableImagePath(item)}" alt="${item.title}" class="orders__item-img">`)
        .join("");

    const total = calculateOrderTotal(order.items);
    const itemLabel = order.items.length === 1 ? "товар" : order.items.length < 5 ? "товара" : "товаров";

    card.innerHTML = `
        <div class="orders__header">
            <span>${order.status || "Принят"}</span>
            <span class="arrow">→</span>
        </div>
        <div class="orders__meta">${formatOrderDate(order.createdAt)}</div>
        <div class="orders__items">${images}</div>
        <div class="orders__summary">${order.items.length} ${itemLabel} • ${total.toLocaleString("ru-RU")} ₽</div>
        <button class="orders__btn" type="button">Смотреть заказ</button>
    `;

    return card;
}

function flashCheckoutButton(text) {
    if (!checkoutButton) return;

    const originalText = checkoutButton.dataset.defaultText || checkoutButton.textContent;
    checkoutButton.dataset.defaultText = originalText;
    checkoutButton.textContent = text;
    checkoutButton.disabled = true;

    window.setTimeout(() => {
        updateCheckoutState();
    }, 1500);
}

function updateOrderStatuses() {
    const savedOrders = loadOrders().map((order, index) => {
        const status = order.status || orderStatuses[Math.min(index, orderStatuses.length - 1)];
        return normalizeOrder({ ...order, status });
    });
    saveOrders(savedOrders);

    document.querySelectorAll(".orders__card--fresh").forEach(card => card.remove());
    savedOrders.slice().reverse().forEach(order => ordersList?.prepend(createOrderCard(order)));
    updateHeaderCounts();
}

const checkoutModal = document.getElementById("checkoutModal");
const checkoutItems = document.getElementById("checkoutItems");
const checkoutTotal = document.getElementById("checkoutTotal");
const checkoutConfirm = document.getElementById("checkoutConfirm");
const checkoutClose = document.getElementById("checkoutClose");
const orderModal = document.getElementById("orderModal");
const orderModalClose = document.getElementById("orderModalClose");
const orderModalStatus = document.getElementById("orderModalStatus");
const orderModalItems = document.getElementById("orderModalItems");
const orderModalTotal = document.getElementById("orderModalTotal");

function getOrderFromCard(card) {
    if (card?.orderData) return normalizeOrder(card.orderData);

    const status = card?.querySelector(".orders__header span")?.textContent?.trim() || "Заказ";
    const items = Array.from(card?.querySelectorAll(".orders__item-img") || []).map(getOrderItemFromImage);

    return normalizeOrder({
        id: "static-order",
        status,
        createdAt: "",
        items
    });
}

function closeOrderModal() {
    orderModal?.classList.remove("active");
    orderModal?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = modal?.classList.contains("active") || checkoutModal?.classList.contains("active") ? "hidden" : "";
}

function openOrderModal(order) {
    if (!orderModal || !orderModalItems || !orderModalTotal) return;

    const normalizedOrder = normalizeOrder(order);
    const total = calculateOrderTotal(normalizedOrder.items);

    if (orderModalStatus) {
        orderModalStatus.textContent = normalizedOrder.status || "Заказ";
    }

    orderModalItems.innerHTML = normalizedOrder.items.map(item => `
        <article class="order-modal__item">
            <img src="${getStableImagePath(item)}" alt="${item.title}">
            <div class="order-modal__item-info">
                <h3>${item.title}</h3>
                <p>Размер: ${item.size || "—"}</p>
            </div>
            <strong>${item.price || "0 ₽"}</strong>
        </article>
    `).join("");

    orderModalTotal.textContent = `${total.toLocaleString("ru-RU")} ₽`;
    orderModal.classList.add("active");
    orderModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeCheckoutModal() {
    checkoutModal?.classList.remove("active");
    checkoutModal?.setAttribute("aria-hidden", "true");
    pendingCheckoutItems = [];
    document.body.style.overflow = modal?.classList.contains("active") || orderModal?.classList.contains("active") ? "hidden" : "";
}

function openCheckoutModal(items) {
    if (!checkoutModal || !checkoutItems || !checkoutTotal) return;

    pendingCheckoutItems = items;
    checkoutItems.innerHTML = items.map(item => `
        <div class="checkout-modal__item">
            <img src="${getStableImagePath(item)}" alt="${item.title}">
            <div>
                <div class="checkout-modal__item-title">${item.title}</div>
                <div class="checkout-modal__item-meta">Размер: ${item.size}</div>
            </div>
            <strong>${item.price}</strong>
        </div>
    `).join("");
    checkoutTotal.textContent = `${calculateOrderTotal(items).toLocaleString("ru-RU")} ₽`;
    checkoutModal.classList.add("active");
    checkoutModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

document.addEventListener("click", (e) => {
    const favBtn = e.target.closest(".to-fav-btn");
    if (favBtn) {
        e.preventDefault();
        e.stopPropagation();

        const productCard = favBtn.closest(".favorites__card");
        const cartItem = favBtn.closest(".cart__item");
        const id = productCard?.dataset.id || cartItem?.dataset.id || "";
        const favoriteItem = productCard ? getFavoritePayloadFromCard(productCard) : getFavoritePayloadById(id);

        if (!id || !favoriteItem) return;

        if (favorites.has(id)) {
            favorites.delete(id);
            saveFavorites();
            favoritesGrid?.querySelector(`[data-id="${id}"]`)?.remove();
            updateFavoritesEmpty();
            syncFavoriteButtons();
            updateHeaderCounts();
            showToast("Товар убран из избранного");
            return;
        }

        favorites.add(id);
        saveFavorites();

        if (favoritesGrid && !favoritesGrid.querySelector(`[data-id="${id}"]`)) {
            favoritesGrid.appendChild(createFavoriteCard(favoriteItem));
        }

        updateFavoritesEmpty();
        syncFavoriteButtons();
        updateHeaderCounts();
        showToast("Товар сохранён в избранное");
        return;
    }

    // ================= CART =================
    const cartBtn = e.target.closest(".to-cart-btn");
    if (cartBtn) {
        e.stopPropagation();

        const card = cartBtn.closest(".favorites__card");
        if (!card) return;

        const img = card.querySelector("img")?.getAttribute("src") || "";
        const title = card.querySelector(".favorites__title")?.textContent || "";
        const id = card.dataset.id || title;

        const price = cartBtn.dataset.price || "0 ₽";
        const size = cartBtn.dataset.size || "—";

        if (cartState.has(id)) {
            updateCartButtons();
            updateModalButton();
            return;
        }

        const item = { id, img, title, price, size };

        cartState.set(id, item);
        saveCart();

        const newItem = createCartItem(item);
        cartList.appendChild(newItem);

        persistAndSyncCartUI();
        showToast("Товар добавлен в корзину");
        return;
    }

    // ================= DELETE CART =================
    const delBtn = e.target.closest(".delete-btn");
    if (delBtn) {
        const item = delBtn.closest(".cart__item");
        if (!item) return;

        const title = item.querySelector(".cart__item-title")?.textContent;
        const id = item.dataset.id || title;

        item.classList.add("removing");

        setTimeout(() => {
            item.remove();

            cartState.delete(id);
            persistAndSyncCartUI();
            showToast("Товар убран из корзины");
        }, 400);
    }
});

// ==================== RESTORE FROM STORAGE ====================
const savedFav = loadFavorites();
savedFav.forEach(id => favorites.add(id));
restoreFavorites();
updateOrderStatuses();

const savedCart = loadCart();
const initialCartItems = Array.from(document.querySelectorAll(".cart__item"));

if (savedCart.length > 0) {
    initialCartItems.forEach(item => item.remove());
    savedCart.forEach(savedItem => {
        const item = { ...savedItem };
        item.id = item.id || getSourceCardByTitle(item.title)?.dataset.id || item.title;
        cartList.appendChild(createCartItem(item));
        cartState.set(item.id || item.title, item);
    });
} else {
    initialCartItems.forEach(item => {
        const id = item.dataset.id || "";
        const title = item.querySelector(".cart__item-title")?.textContent || "";
        const img = normalizeImagePath(item.querySelector(".cart__item-img")?.getAttribute("src") || "");
        const price = item.querySelector(".price")?.textContent || "0 ₽";
        const sizeText = item.querySelector(".cart__item-meta")?.textContent || "";
        const size = sizeText.replace("Размер:", "").trim() || "—";

        if (!title) return;
        cartState.set(id || title, { id, title, img, price, size });
    });
    saveCart();
}

// ==================== CHECKBOXES ====================
document.addEventListener('change', e => {
    if (e.target.classList.contains("cart-item")) {
        persistCartFromDom();
        updateCart();
        checkSelectAll();
        updateCheckoutState();
    }
});

if (selectAll) {
    selectAll.addEventListener("change", () => {
        document.querySelectorAll(".cart-item").forEach(cb => {
            cb.checked = selectAll.checked;
        });
        persistCartFromDom();
        updateCart();
        updateCheckoutState();
    });
}


// ==================== CHECKOUT ====================
checkoutButton?.addEventListener('click', () => {
    const selectedItems = Array.from(document.querySelectorAll(".cart__item"))
        .filter(item => item.querySelector(".cart-item")?.checked)
        .map(item => ({
            element: item,
            id: item.dataset.id || "",
            title: item.querySelector(".cart__item-title")?.textContent || "",
            img: normalizeImagePath(item.querySelector(".cart__item-img")?.getAttribute("src") || ""),
            price: item.querySelector(".price")?.textContent || "0 ₽",
            size: (item.querySelector(".cart__item-meta")?.textContent || "").replace("Размер:", "").trim() || "—"
        }))
        .filter(item => item.title);

    if (selectedItems.length === 0) {
        flashCheckoutButton("Выберите товары");
        return;
    }
    openCheckoutModal(selectedItems);
});


const sections = document.querySelectorAll("section");
const navLinksScroll = document.querySelectorAll(".nav__link");

window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach(section => {
        const top = section.offsetTop - 120;
        const height = section.offsetHeight;

        if (scrollY >= top && scrollY < top + height) {
            current = section.id;
        }
    });

    navLinksScroll.forEach(link => {
        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + current) {
            link.classList.add("active");
        }
    });
});

const modal = document.getElementById("productModal");
const closeModal = document.getElementById("closeModal");

const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const modalSize = document.getElementById("modalSize");
const modalCartBtn = document.querySelector(".modal-cart-btn");
const modalMaterial = document.getElementById("modalMaterial");
const modalCondition = document.getElementById("modalCondition");
const modalNote = document.getElementById("modalNote");
const modalDescription = document.getElementById("modalDescription");

function closeProductModal() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

function openProductModal(card) {
    if (!card) return;

    const img = card.querySelector("img")?.getAttribute("src");
    const title = card.querySelector(".favorites__title")?.innerText;
    const cartBtn = card.querySelector(".to-cart-btn");
    const details = getProductDetails(title);

    if (!img || !title || !cartBtn) return;

    currentProduct = {
        id: card.dataset.id || title,
        title: title,
        price: cartBtn.dataset.price,
        size: cartBtn.dataset.size,
        image: img
    };

    modalImage.src = img;
    modalImage.alt = title;
    modalTitle.innerText = title;
    modalPrice.innerText = cartBtn.dataset.price;
    modalSize.innerText = "Размер: " + cartBtn.dataset.size;
    if (modalMaterial) modalMaterial.innerText = details.material;
    if (modalCondition) modalCondition.innerText = details.condition;
    if (modalDescription) modalDescription.innerText = details.description;
    if (modalNote) modalNote.innerText = details.note;

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    updateModalButton();
}

closeModal.addEventListener("click", closeProductModal);

modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        closeProductModal();
    }
});

checkoutModal?.addEventListener("click", (e) => {
    if (e.target === checkoutModal) {
        closeCheckoutModal();
    }
});
checkoutClose?.addEventListener("click", closeCheckoutModal);

orderModal?.addEventListener("click", (e) => {
    if (e.target === orderModal) {
        closeOrderModal();
    }
});
orderModalClose?.addEventListener("click", closeOrderModal);

ordersList?.addEventListener("click", (e) => {
    const button = e.target.closest(".orders__btn");
    if (!button) return;

    const card = button.closest(".orders__card");
    if (!card) return;

    openOrderModal(getOrderFromCard(card));
});

document.addEventListener("click", (e) => {
    const card = e.target.closest(".favorites__card");
    if (!card) return;

    if (e.target.closest(".to-fav-btn") || e.target.closest(".to-cart-btn")) {
        return;
    }

    openProductModal(card);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
        closeProductModal();
    }
    if (e.key === "Escape" && checkoutModal?.classList.contains("active")) {
        closeCheckoutModal();
    }
    if (e.key === "Escape" && orderModal?.classList.contains("active")) {
        closeOrderModal();
    }

    const card = e.target.closest?.(".favorites__card");
    if (!card) return;

    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProductModal(card);
    }
});

modalCartBtn?.addEventListener("click", () => {
    if (!currentProduct) return;

    if (cartState.has(currentProduct.id)) return;

    const itemData = {
        id: currentProduct.id,
        img: currentProduct.image,
        title: currentProduct.title,
        price: currentProduct.price,
        size: currentProduct.size
    };

    cartState.set(currentProduct.id, itemData);
    saveCart();

    const item = createCartItem(itemData);
    cartList.appendChild(item);

    closeProductModal();

    persistAndSyncCartUI();
    showToast("Товар добавлен в корзину");
});

function updateModalButton() {
    const btn = modalCartBtn;
    if (!btn || !currentProduct) return;

    if (cartState.has(currentProduct.id)) {
        btn.classList.add("added");
        btn.textContent = "Уже в корзине";
    } else {
        btn.classList.remove("added");
        btn.textContent = "Добавить в корзину";
    }
}

function updateFavoritesEmpty() {
    const empty = document.getElementById("favoritesEmpty");
    if (!empty || !favoritesGrid) return;
    empty.style.display = favoritesGrid.children.length === 0 ? "block" : "none";
}

function syncFavoriteButtons() {
    document.querySelectorAll(".favorites__card").forEach(card => {
        const id = card.dataset.id || "";
        const btn = card.querySelector(".to-fav-btn");
        if (!btn || !id) return;
        btn.classList.toggle("active", favorites.has(id));
        btn.setAttribute("aria-label", favorites.has(id) ? "Убрать из избранного" : "Добавить в избранное");
    });

    document.querySelectorAll(".cart__item").forEach(item => {
        const id = item.dataset.id || "";
        const btn = item.querySelector(".to-fav-btn");
        if (!btn || !id) return;
        btn.classList.toggle("active", favorites.has(id));
        btn.setAttribute("aria-label", favorites.has(id) ? "Убрать из избранного" : "Добавить в избранное");
    });
}

checkoutConfirm?.addEventListener("click", () => {
    if (pendingCheckoutItems.length === 0) return;

    const order = {
        id: `order-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: orderStatuses[0],
        items: pendingCheckoutItems.map(({ element, ...item }) => item)
    };

    const savedOrders = loadOrders();
    savedOrders.push(order);
    saveOrders(savedOrders);

    ordersList?.prepend(createOrderCard(order));

    pendingCheckoutItems.forEach(({ element, id, title }) => {
        element.remove();
        cartState.delete(id || title);
    });

    persistAndSyncCartUI();
    closeCheckoutModal();
    showToast("Заказ оформлен");

    document.getElementById('orders')?.scrollIntoView({ behavior: "smooth" });
});

// ==================== INIT ====================
syncProductMeta();
updateFavoritesEmpty();
syncFavoriteButtons();
syncCartUI();
