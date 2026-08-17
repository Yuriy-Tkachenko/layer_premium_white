<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const EMAIL_TO = 'apolo16@inbox.ru';
const EMAIL_FROM = 'noreply@advokat-selivanov.ru';
const SITE_HOST = 'advokat-selivanov.ru';

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_value(mixed $value, int $maxLength): string
{
    $value = trim((string) $value);
    return mb_substr($value, 0, $maxLength);
}

function send_email(string $name, string $phone, string $comment): bool
{
    $subject = 'Новая заявка с сайта ' . SITE_HOST;
    $body = implode("\r\n", [
        'Новая заявка с сайта ' . SITE_HOST,
        '',
        'Имя: ' . $name,
        'Телефон: ' . $phone,
        'Комментарий: ' . $comment,
        '',
        'Дата: ' . date('d.m.Y H:i:s T'),
    ]);

    $encodedSubject = mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n");
    $encodedFromName = mb_encode_mimeheader('Заявки с сайта', 'UTF-8', 'B', "\r\n");
    $headers = implode("\r\n", [
        'From: ' . $encodedFromName . ' <' . EMAIL_FROM . '>',
        'Reply-To: ' . EMAIL_FROM,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'X-Mailer: PHP/' . PHP_VERSION,
    ]);

    return mail(EMAIL_TO, $encodedSubject, $body, $headers);
}

function send_telegram(string $text): bool
{
    $configPath = dirname(__DIR__) . '/.telegram-config.php';
    if (!is_file($configPath)) {
        error_log('Telegram configuration file is missing');
        return false;
    }

    $config = require $configPath;
    $token = (string) ($config['bot_token'] ?? '');
    $chatId = (string) ($config['chat_id'] ?? '');
    if ($token === '' || $chatId === '') {
        error_log('Telegram configuration is incomplete');
        return false;
    }

    if (!function_exists('curl_init')) {
        error_log('Telegram delivery failed: cURL extension is unavailable');
        return false;
    }

    $curl = curl_init('https://api.telegram.org/bot' . $token . '/sendMessage');
    if ($curl === false) {
        error_log('Telegram delivery failed: cannot initialize cURL');
        return false;
    }

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode(
            ['chat_id' => $chatId, 'text' => $text],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        ),
    ]);
    $responseBody = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($responseBody === false || $status < 200 || $status >= 300) {
        error_log('Telegram API error: HTTP ' . $status . ' ' . $error);
        return false;
    }

    return true;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'Метод не поддерживается']);
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || strlen($rawBody) > 16384) {
    respond(413, ['error' => 'Слишком большой запрос']);
}

$body = json_decode($rawBody, true);
if (!is_array($body)) {
    respond(400, ['error' => 'Некорректный формат запроса']);
}

// Honeypot: bots tend to fill this invisible field.
if (!empty($body['website'])) {
    respond(200, ['ok' => true]);
}

$name = clean_value($body['name'] ?? '', 100);
$phone = clean_value($body['phone'] ?? '', 50);
$comment = clean_value($body['comment'] ?? '', 1000);
$commentLength = mb_strlen((string) preg_replace('/\s+/u', '', $comment));
if ($name === '' || $phone === '' || $commentLength < 10) {
    respond(400, ['error' => 'Проверьте заполнение полей формы.']);
}

// Five attempts per IP per minute. The lock prevents parallel requests bypassing the limit.
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateFile = sys_get_temp_dir() . '/lawyer-contact-' . hash('sha256', $ip) . '.json';
$now = time();
$handle = fopen($rateFile, 'c+');
if ($handle !== false && flock($handle, LOCK_EX)) {
    $stored = stream_get_contents($handle);
    $decoded = $stored ? json_decode($stored, true) : [];
    $recent = is_array($decoded)
        ? array_values(array_filter($decoded, static fn ($time) => $now - (int) $time < 60))
        : [];

    if (count($recent) >= 5) {
        flock($handle, LOCK_UN);
        fclose($handle);
        respond(429, ['error' => 'Слишком много попыток. Попробуйте через минуту.']);
    }

    $recent[] = $now;
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, (string) json_encode($recent));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

$text = implode("\n", [
    '⚖️ Новое обращение с сайта',
    '',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
    'Комментарий: ' . $comment,
]);

// Delivery channels are independent: one outage must not discard the lead.
$emailSent = send_email($name, $phone, $comment);
$telegramSent = send_telegram($text);

if (!$emailSent) {
    error_log('Contact email was not accepted by the local mail transport');
}

if (!$emailSent && !$telegramSent) {
    respond(502, [
        'error' => 'Не удалось отправить сообщение. Позвоните нам по телефону.',
    ]);
}

respond(200, ['ok' => true]);
