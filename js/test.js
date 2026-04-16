const BASE_URL = "https://vuihocvan2011be.onrender.com/api";
const form = document.getElementById("quizForm");
let chartInstance = null;

async function fetchQuestions() {
  try {
    const params = new URLSearchParams(window.location.search);
    const workId = params.get("id");

    if (!workId) {
      console.error("❌ Không có ID trên URL");
      return;
    }

    const url = `${BASE_URL}/questions/${workId}`;
    const res = await fetch(url);
    const data = await res.json();

    renderQuestions(data);

  } catch (err) {
    console.error("❌ Lỗi fetch câu hỏi:", err);
  }
}

function renderQuestions(questions) {
  const form = document.getElementById("quizForm");
  form.innerHTML = "";

  questions.forEach(q => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-box";

    let answersHTML = "";

    q.answers.forEach(ans => {
      answersHTML += `
        <label class="option">
          <input 
            type="radio" 
            name="q_${q.id}" 
            value="${ans.id}"
          >
          ${ans.content}
        </label>
      `;
    });

    questionDiv.innerHTML = `
      <h5>${q.order}. ${q.question}</h5>
      ${answersHTML}
    `;

    form.appendChild(questionDiv);
  });

  form.innerHTML += `
    <div class="text-center">
      <button type="submit" class="btn submit-btn">Nộp bài</button>
    </div>
  `;
}

function renderDonutChart(data) {
  const ctx = document.getElementById("scoreChart");

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Đúng", "Sai"],
      datasets: [{
        data: [data.correctAnswers, data.wrongAnswers],
        backgroundColor: ["#15f992", "#fe589a"],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });

  document.getElementById("scoreText").innerText = data.score + "%";
}

function validateAllAnswered() {
  const questionBlocks = document.querySelectorAll(".question-box");
  for (let block of questionBlocks) {
    const checked = block.querySelector("input[type='radio']:checked");

    if (!checked) {
      return false;
    }
  }
  return true;
}

function showResultPopup(data) {
  const overlay = document.getElementById("resultOverlay");

  document.getElementById("correct").innerText = data.correctAnswers;
  document.getElementById("wrong").innerText = data.wrongAnswers;
  document.getElementById("total").innerText = data.totalQuestions;

  renderDonutChart(data);

  // detail
  const detailDiv = document.getElementById("detail");
  detailDiv.innerHTML = "<h6>Chi tiết:</h6>";

  data.detail.forEach((d, index) => {
    detailDiv.innerHTML += `
      <div>
        <b>Câu ${index + 1}:</b> 
        ${d.isCorrect ? "✔ Đúng" : "❌ Sai"}
      </div>
    `;
  });

  overlay.classList.remove("hidden");
}

function closePopup() {
    document.getElementById("resultOverlay").classList.add("hidden");
    document.body.style.overflow = "auto";
  }

document.addEventListener("DOMContentLoaded", () => {
  fetchQuestions();
  const form = document.getElementById("quizForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateAllAnswered()) {
      alert("Bạn phải trả lời tất cả các câu hỏi!");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const workId = params.get("id");

    const formData = new FormData(form);

    const questionsMap = {};

    for (let [key, value] of formData.entries()) {
      const questionId = key.replace("q_", "");

      if (!questionsMap[questionId]) {
        questionsMap[questionId] = [];
      }

      questionsMap[questionId].push(value);
    }

    const questions = Object.keys(questionsMap).map(qId => ({
      questionId: qId,
      answerIds: questionsMap[qId]
    }));

    const payload = {
      workId,
      questions
    };

    try {
      const res = await fetch(`${BASE_URL}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      showResultPopup(data);

    } catch (err) {
      console.error("❌ Lỗi submit:", err);
    }
  });

  closePopup();
});