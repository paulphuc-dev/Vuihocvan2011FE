const API_BASE = "https://vuihocvan2011be.onrender.com/api";
const SRC_URL = "https://vuihocvan2011be.onrender.com";
const PER_PAGE = 8;

const joinUrl = (base, path) => {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const state = {
  books: [],
  currentPage: 1,
  totalPages: 1,
  isSearchMode: false,
};

const bookList   = document.getElementById("bookList");
const pagination = document.getElementById("pagination");

async function fetchPaginatedBooks(page) {
  const url = `${API_BASE}/works?page=${page}&limit=${PER_PAGE}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const result = await res.json();

  state.books       = result.data  ?? [];
  state.totalPages  = result.totalPages  ?? 1;
  state.currentPage = result.page        ?? page;
}


async function fetchSearchBooks(search, category) {
  const query = new URLSearchParams({ search, category });
  const url   = `${API_BASE}/works/search?${query}`;
  const res   = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.data ?? []);

  state.books       = list;
  state.totalPages  = Math.ceil(list.length / PER_PAGE);
  state.currentPage = 1;
}

async function fetchBookDetail(id) {
  const res = await fetch(`${API_BASE}/works/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}


async function loadBooks(page = 1) {
  try {
    const params   = new URLSearchParams(window.location.search);
    const search   = params.get("search")   || "";
    const category = params.get("category") || "";

    state.isSearchMode = !!(search || category);

    if (state.isSearchMode) {
      await fetchSearchBooks(search, category);
    } else {
      await fetchPaginatedBooks(page);
    }

    renderBooks();
    renderPagination();
  } catch (err) {
    console.error("❌ Lỗi tải sách:", err);
    renderError();
  }
}

function renderBooks() {
  bookList.innerHTML = "";

  const items = state.isSearchMode
    ? getPageSlice(state.books, state.currentPage, PER_PAGE)
    : state.books; // API đã trả đúng trang, không cần slice

  if (items.length === 0) {
    bookList.innerHTML = `<p class="text-center text-muted w-100 py-5">Không tìm thấy tác phẩm nào.</p>`;
    return;
  }

  items.forEach(book => bookList.appendChild(createBookCard(book)));
}

function createBookCard(book) {
  const col = document.createElement("div");
  col.className = "col-6 col-md-3";
  col.innerHTML = `
    <div class="book-card">
      <img src="${joinUrl(SRC_URL, book.avatar)}" alt="${book.title || ''}">
      <div class="book-title">${book.title || ''}</div>
      <div class="book-author">${book.author || ''}</div>
      <button class="btn-doc">Đọc</button>
    </div>
  `;
  col.querySelector(".btn-doc").addEventListener("click", () => openBookDetail(book.id));
  return col;
}

function renderError() {
  bookList.innerHTML = `<p class="text-center text-danger w-100 py-5">Đã có lỗi xảy ra. Vui lòng thử lại.</p>`;
}

function renderPagination() {
  pagination.innerHTML = "";

  for (let i = 1; i <= state.totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className   = "page-btn" + (i === state.currentPage ? " active" : "");

    btn.addEventListener("click", () => onPageClick(i));
    pagination.appendChild(btn);
  }
}

function onPageClick(page) {
  if (page === state.currentPage) return;

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (state.isSearchMode) {
    // Phân trang FE: chỉ cần re-render, không gọi lại API
    state.currentPage = page;
    renderBooks();
    renderPagination();
  } else {
    // Phân trang BE: gọi API với page mới
    loadBooks(page);
  }
}

async function openBookDetail(id) {
  try {
    const book = await fetchBookDetail(id);
    fillPopup(book);
    openPopup();
  } catch (err) {
    console.error("Lỗi tải chi tiết:", err);
  }
}

function fillPopup(book) {
  const popup   = document.querySelector(".popup");
  const BASE_URL = API_BASE.replace("/api", "");

  popup.querySelector("h2").textContent      = book.title  || "";
  popup.querySelector(".author").textContent = book.author || "Không rõ";
  popup.querySelector(".desc").textContent   = book.brief  || "Chưa có mô tả";

  const img = popup.querySelector("img");
  img.src = joinUrl(SRC_URL, book.avatar)

  const tagValues = [book.release, book.program, book.expression, book.category];
  popup.querySelectorAll(".tags span").forEach((el, i) => {
    el.textContent = tagValues[i] || "";
  });

  const startBtn      = popup.querySelector(".start-btn");
  startBtn.dataset.id = book.id;
}

function openPopup() {
  document.getElementById("overlay").style.display = "flex";
}

function searchBooks() {
  const search   = document.querySelector(".search-wrap input").value.trim();
  const category = document.querySelector(".search-wrap select").value;

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category && category !== "Thể loại") params.set("category", category);

  window.location.href = `works.html?${params.toString()}`;
}

function getPageSlice(arr, page, perPage) {
  const start = (page - 1) * perPage;
  return arr.slice(start, start + perPage);
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/works/category`);
    const data = await res.json();

    const select = document.getElementById("categorySelect");

    select.innerHTML = `<option value="">Thể loại</option>` + 
      data.map(cat => `<option value="${cat}">${cat}</option>`).join("");

  } catch (err) {
    console.error("Lỗi fetch category:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadBooks();
  fetchCategories();

  const input = document.getElementById("searchInput");
  const datalist = document.getElementById("suggestList");

  let timeout;

  input.addEventListener("input", () => {
    clearTimeout(timeout);

    const keyword = input.value.trim();
    if (!keyword) {
      datalist.innerHTML = "";
      return;
    }

    timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/works/suggest?q=${keyword}`);
        const data = await res.json();

        datalist.innerHTML = data
          .map(item => `<option value="${item.title}">`)
          .join("");
      } catch (err) {
        console.error("Lỗi suggest:", err);
      }
    }, 300);
  });

  document.querySelector(".search-wrap button")
    .addEventListener("click", searchBooks);

  document.querySelector(".start-btn")
    .addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      if (!id) return console.error("Không có ID");
      window.location.href = `/page.html?id=${id}`;
    });
});