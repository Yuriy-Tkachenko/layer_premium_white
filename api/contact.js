const requests = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 16_384) reject(new Error("Payload too large"));
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

module.exports = async function contactHandler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Метод не поддерживается" });
    return;
  }

  const forwarded = request.headers["x-forwarded-for"];
  const ip = String(forwarded || request.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (requests.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    sendJson(response, 429, { error: "Слишком много попыток. Попробуйте через минуту." });
    return;
  }
  recent.push(now);
  requests.set(ip, recent);

  try {
    const body = await readJson(request);
    if (body.website) {
      sendJson(response, 200, { ok: true });
      return;
    }

    const name = clean(body.name, 100);
    const phone = clean(body.phone, 50);
    const comment = clean(body.comment, 1000);
    if (!name || !phone || comment.replace(/\s/g, "").length < 10) {
      sendJson(response, 400, { error: "Проверьте заполнение полей формы." });
      return;
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      console.error("Telegram environment variables are not configured");
      sendJson(response, 503, { error: "Отправка временно недоступна. Позвоните нам по телефону." });
      return;
    }

    const text = [
      "⚖️ Новое обращение с сайта",
      "",
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Комментарий: ${comment}`,
    ].join("\n");
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!telegramResponse.ok) {
      const details = await telegramResponse.text();
      console.error("Telegram API error", telegramResponse.status, details);
      throw new Error("Telegram delivery failed");
    }

    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error("Contact form error", error);
    if (!response.writableEnded) {
      sendJson(response, 500, { error: "Не удалось отправить сообщение. Позвоните нам по телефону." });
    }
  }
};
