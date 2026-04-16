let books = [];
const BASE_URL = "https://vuihocvan2011be.onrender.com/api";
const SRC_URL = "https://vuihocvan2011be.onrender.com";

const joinUrl = (base, path) => {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

async function fetchBooks() {
  try {
    const res = await fetch(`${BASE_URL}/works/top-10`);  
    const data = await res.json(); 
    books = data; 
    renderBooks(); 
    updateCarousel();

  } catch (err) {
    console.error('Lỗi fetch API:', err);
  }
}


/* ===== KHỞI TẠO NỀN FOOTER ===== */
function initFooterBg() {
  const footerBg = document.getElementById('footerBg');
  footerColors.forEach(color => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.background = color;
    footerBg.appendChild(cell);
  });
}

/* ===== CAROUSEL SÁCH ===== */
let carouselOffset = 0;

function getVisible() {
  if (window.innerWidth <= 480) return 1;
  if (window.innerWidth <= 768) return 2;
  return 4;
}

function renderBooks() {
  const scroll = document.getElementById('carouselScroll');
  scroll.innerHTML = '';

  books.forEach(b => {
    const col = document.createElement('div');
    col.className = 'carousel-item-custom';
    col.innerHTML = `
      <div class="book-card">
        <div style="
          width: 100%;
          aspect-ratio: 3/4;
          background: #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${b.avatar 
            ? `<img src="${joinUrl(SRC_URL, b.avatar)}" style="width:100%;height:100%;object-fit:cover;" />`
            : `<span style="font-size:2rem">${b.title?.charAt(0)}</span>`
          }
        </div>
        <div class="book-card-body">
          <div class="book-title">${b.title}</div>
          <div class="book-author">${b.author || 'Không rõ'}</div>
          <button class="btn-doc">Đọc</button>
        </div>
      </div>
    `;

    const btn = col.querySelector('.btn-doc');
    btn.addEventListener('click', async () => {
      await loadBookDetail(b.id);
    });

    scroll.appendChild(col);
  });
}

function updateCarousel() {
  const scroll = document.getElementById('carouselScroll');
  const items = scroll.querySelectorAll('.carousel-item-custom');
  const vis = getVisible();
  const pct = 100 / vis;
  const gapPx = 16;
  items.forEach(el => {
    el.style.transform = `translateX(${-carouselOffset * (pct + (gapPx / scroll.offsetWidth * 100))}%)`;
  });
}

async function loadBookDetail(id) {
  try {
    const res = await fetch(`${BASE_URL}/works/${id}`);
    const data = await res.json();

    console.log('DETAIL:', data);

    fillPopup(data);
    openPopup();

  } catch (err) {
    console.error('Lỗi load chi tiết:', err);
  }
}

function fillPopup(book) {
  const popup = document.querySelector('.popup');

  popup.querySelector('h2').innerText = book.title || '';
  popup.querySelector('.author').innerText = book.author || 'Không rõ';

  const img = popup.querySelector('img');
  img.src = joinUrl(SRC_URL, book.avatar)

  popup.querySelector('.desc').innerText =
    book.brief || 'Chưa có mô tả';

  const tagEls = popup.querySelectorAll('.tags span');

  const tagValues = [
    book.release,
    book.program,
    book.expression,
    book.category
  ];

  tagEls.forEach((el, index) => {
    el.innerText = tagValues[index] || '';
  });

  const startBtn = popup.querySelector('.start-btn');
  startBtn.dataset.id = book.id;
}

document.querySelector('.start-btn').addEventListener('click', (e) => {
  const id = e.target.dataset.id;

  if (!id) {
    console.error('Không có ID');
    return;
  }

  window.location.href = `/page.html?id=${id}`;
});

function openPopup() {
  document.getElementById("overlay").style.display = "flex";
}

function searchBooks() {
  const search = document.querySelector('.search-wrap input').value;
  const category = document.querySelector('.search-wrap select').value;

  const params = new URLSearchParams();

  if (search) params.append("search", search);
  if (category && category !== "Thể loại") {
    params.append("category", category);
  }

  window.location.href = `works.html?${params.toString()}`;
}

function initCarousel() {
  renderBooks();

  document.getElementById('nextBtn').addEventListener('click', () => {
    const max = books.length - getVisible();
    if (carouselOffset < max) carouselOffset++;
    updateCarousel();
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (carouselOffset > 0) carouselOffset--;
    updateCarousel();
  });

  window.addEventListener('resize', () => {
    carouselOffset = 0;
    updateCarousel();
  });
}

async function fetchCategories() {
  try {
    const res = await fetch(`${BASE_URL}/works/category`);
    const data = await res.json();

    const select = document.getElementById("categorySelect");

    select.innerHTML = `<option value="">Thể loại</option>` + 
      data.map(cat => `<option value="${cat}">${cat}</option>`).join("");

  } catch (err) {
    console.error("Lỗi fetch category:", err);
  }
}

function initMobileNav() {
  document.getElementById('navToggle').addEventListener('click', () => {
    const menu = document.getElementById('mobileMenu');
    const isHidden = menu.style.display === 'none' || menu.style.display === '';
    menu.style.display = isHidden ? 'block' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  initMobileNav();
  fetchBooks();
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
        const res = await fetch(`${BASE_URL}/works/suggest?q=${keyword}`);
        const data = await res.json();

        datalist.innerHTML = data
          .map(item => `<option value="${item.title}">`)
          .join("");
      } catch (err) {
        console.error("Lỗi suggest:", err);
      }
    }, 300);
  });

  document.querySelector('.search-wrap button')
  .addEventListener('click', searchBooks);
});

