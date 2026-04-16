function sendMsg() {
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");

  if (input.value.trim() === "") return;

  // Tin nhắn user
  const userMsg = document.createElement("div");
  userMsg.className = "msg msg-you";
  userMsg.innerText = input.value;

  messages.appendChild(userMsg);

  // Fake AI trả lời
  const aiMsg = document.createElement("div");
  aiMsg.className = "msg msg-ai";
  aiMsg.innerText = "AI đang trả lời...";

  messages.appendChild(aiMsg);

  input.value = "";

  // 🔥 Auto scroll xuống dưới
  const chatBox = document.querySelector(".chat-box");
  chatBox.scrollTop = chatBox.scrollHeight;
}