// *** 新增：定義您的儲存庫名稱變數 ***
const REPO_NAME = '/NetflixTop10Global_PWA'; 
const CACHE_NAME = 'netflix-top10-cache-v1';

// *** 修改：在所有核心資源路徑前加上 REPO_NAME ***
const CORE_ASSETS = [
    `${REPO_NAME}/`,
    `${REPO_NAME}/index.html`,
    `${REPO_NAME}/style.css`,
    `${REPO_NAME}/script.js`,
    `${REPO_NAME}/asserts/Netflix_Logo.png`,
    `${REPO_NAME}/asserts/top10.svg`,
    `${REPO_NAME}/file_manifest.json`
];

// 1. 安裝 Service Worker 並快取 App Shell
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching core assets...');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => self.skipWaiting()) // 強制新的 Service Worker 立即啟用
    );
});

// 2. 啟用 Service Worker 並清理舊快取
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // 讓 Service Worker 控制所有已開啟的頁面
});

// 3. 攔截網路請求 (Fetch Event) - 此部分無需修改
self.addEventListener('fetch', event => {
    const { request } = event;

    // 對於 JSON 數據，採用 'Network First, falling back to Cache' 策略
    if (request.url.includes('/HTML_Json/')) {
        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    console.log('Service Worker: Fetch failed, trying cache for:', request.url);
                    return caches.match(request);
                })
        );
        return;
    }

    // 對於 App Shell 和其他靜態資源，採用 'Cache First' 策略
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
    );
});