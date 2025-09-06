const CACHE_NAME = 'netflix-top10-cache-v1';
// 'App Shell' - 核心檔案，讓應用程式能夠運行
const CORE_ASSETS = [
    '/',
    'index.html',
    'style.css',
    'script.js',
    'asserts/Netflix_Logo.png',
    'asserts/top10.svg',
    'file_manifest.json'
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

// 3. 攔截網路請求 (Fetch Event)
self.addEventListener('fetch', event => {
    const { request } = event;

    // 對於 JSON 數據，採用 'Network First, falling back to Cache' 策略
    // 這確保用戶總是先嘗試獲取最新數據，如果離線則使用舊數據
    if (request.url.includes('/HTML_Json/')) {
        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    // 如果成功從網路獲取，就更新快取
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    // 如果網路請求失敗 (離線)，則從快取中尋找
                    console.log('Service Worker: Fetch failed, trying cache for:', request.url);
                    return caches.match(request);
                })
        );
        return;
    }

    // 對於 App Shell 和其他靜態資源，採用 'Cache First' 策略
    // 這讓應用程式可以秒開
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                // 如果快取中有，直接回傳快取版本
                if (cachedResponse) {
                    return cachedResponse;
                }
                // 如果快取中沒有，則透過網路請求，並存入快取供下次使用
                return fetch(request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
    );
});