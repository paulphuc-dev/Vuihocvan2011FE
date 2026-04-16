const BASE_URL = "https://vuihocvan2011be.onrender.com/api";
const SRC_URL = "https://vuihocvan2011be.onrender.com";

const joinUrl = (base, path) => {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    console.error('Không có ID trên URL');
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/works/${id}`);
    const data = await res.json();

    renderBook(data);

  } catch (err) {
    console.error('Lỗi load book detail:', err);
  }

  document.querySelector('.next-btn').addEventListener('click',()=>{
    window.location.href = `/test.html?id=${id}`;
  })
});

function renderBook(book) {
  document.querySelector('h4').innerText = book.author || 'Không rõ';
  document.querySelector('h1').innerText = book.title || '';

  const img = document.querySelector('img');

  img.src = joinUrl(SRC_URL, book.picture) 
  const contentWrapper = document.querySelector('.content');
  const content = document.querySelector('.content p');
  content.textContent = book.document || 'Chưa có nội dung';

  if (book.category === "Thơ") {
    contentWrapper.classList.add("poem");
    contentWrapper.classList.remove("story");
  } else {
    contentWrapper.classList.add("story");
    contentWrapper.classList.remove("poem");
  }

}