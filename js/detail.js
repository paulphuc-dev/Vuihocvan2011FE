const BASE_URL = "https://vuihocvan2011be.onrender.com/api";
//const BASE_URL = "http://localhost:3000/api";
const SRC_URL = "https://vuihocvan2011be.onrender.com";

const joinUrl = (base, path) => {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const contentText = document.querySelector(".content p");
const progressBar = document.querySelector('.progress-bar');
const audioTime = document.querySelector('.audio-time');
const playBtn = document.querySelector('.play-btn');
let currentAudio = null;
let isPlaying = false;

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

  document.getElementById("input").addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
          sendMsg();
      }
  });

  document.getElementById("send").addEventListener("click", async () =>{
    sendMsg()
  });

  playBtn.addEventListener("click", playArticle);
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
    document.getElementById("audio").classList.add("d-none");
    contentWrapper.classList.add("story");
    contentWrapper.classList.remove("poem");
  }

}

async function sendMsg() {
    const input = document.getElementById("input");
    const messages = document.getElementById("messages");
    const question = input.value.trim();
    const author = document.querySelector('h4').innerText;
    const title = document.querySelector('h1').innerText
    const context = ` tác phẩm ${title} của ${author} `

    if (!question) return;

    const userMsg = document.createElement("div");
    userMsg.className = "msg msg-you";
    userMsg.textContent = question;
    messages.appendChild(userMsg);

    input.value = "";

    const loadingMsg = document.createElement("div");
    loadingMsg.className = "msg msg-ai";
    loadingMsg.innerHTML = `<span class="spinner-border spinner-border-sm text-warning"></span>`;
    messages.appendChild(loadingMsg);

    // Cuộn xuống cuối
    messages.scrollTop = messages.scrollHeight;

    try {
        const response = await fetch(`${BASE_URL}/assistant/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                context,
                question
            })
        });

        const data = await response.json();
        loadingMsg.remove();
        const aiMsg = document.createElement("div");
        aiMsg.className = "msg msg-ai";
        messages.appendChild(aiMsg);
        await typeText(aiMsg, data.answer);

    } catch (error) {
        loadingMsg.remove();

        const errorMsg = document.createElement("div");
        errorMsg.className = "msg msg-ai";
        errorMsg.textContent = "Lỗi kết nối tới AI server.";
        messages.appendChild(errorMsg);
    }

    messages.scrollTop = messages.scrollHeight;
}

async function typeText(element, text, speed = 25) {
    element.textContent = "";

    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);

        const messages = document.getElementById("messages");
        messages.scrollTop = messages.scrollHeight;

        await new Promise(resolve => setTimeout(resolve, speed));
    }
}

async function playArticle() {
    // nếu đang phát thì pause
    if (currentAudio && isPlaying) {
        currentAudio.pause();
        isPlaying = false;
        playBtn.textContent = "▶";
        return;
    }

    // nếu đã có audio thì resume
    if (currentAudio && !isPlaying) {
        currentAudio.play();
        isPlaying = true;
        playBtn.textContent = "⏸";
        return;
    }

    const text = document.querySelector('.content').innerText.trim();
    if (text.length < 3) return;

    const response = await fetch(`${BASE_URL}/assistant/voice`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: text
        })
    });

    const audioUrl = await response.text();

    await new Promise(resolve => setTimeout(resolve, 1500));

    currentAudio = new Audio(audioUrl);

    currentAudio.addEventListener('loadedmetadata', () => {
        audioTime.textContent = `0:00 / ${formatTime(currentAudio.duration)}`;
    });

    currentAudio.addEventListener('timeupdate', () => {
        const percent = (currentAudio.currentTime / currentAudio.duration) * 100;
        progressBar.style.width = percent + '%';

        audioTime.textContent =
            `${formatTime(currentAudio.currentTime)} / ${formatTime(currentAudio.duration)}`;
    });

    currentAudio.addEventListener('ended', () => {
        progressBar.style.width = '0%';
        playBtn.textContent = "▶";
        isPlaying = false;
    });

    currentAudio.play();
    isPlaying = true;
    playBtn.textContent = "⏸";
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
