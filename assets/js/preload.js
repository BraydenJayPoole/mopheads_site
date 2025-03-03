function preloadContent(url) {
  console.log("preloadContent called for:", url);

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    console.log("Service worker is active, sending message to check cache:", url);
    navigator.serviceWorker.controller.postMessage({ type: 'check-cache', url: url });
  } else {
    console.log("Service worker is NOT active or not supported, prefetching directly:", url);
    prefetchWithoutSWCheck(url);
  }
}

function prefetchWithoutSWCheck(url){
    console.log("Prefetching without service worker check:", url);
    const links = document.querySelectorAll('link[rel="prefetch"]');
      for (const link of links) {
        if (link.href === url) {
          console.log("Already in Browser cache:", url);
          return; // Do not prefetch if already prefetched
        }
      }
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
}

navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.type === 'cache-check-result') {
        if (!event.data.inCache){
            console.log("Not in cache, prefetching and caching:", event.data.url);
            caches.open('mopheads-site-v3').then(cache => {
                fetch(event.data.url).then(response => {
                    if (response.ok) {
                        cache.put(event.data.url, response.clone());
                        console.log("Cached in Service Worker Cache:", event.data.url);
                    } else {
                        console.error("Error fetching", event.data.url, response.status);
                    }
                }).catch(error => {
                    console.error("Error fetching and caching:", event.data.url, error);
                });
            });
        } else {
            console.log("Already in Service Worker cache:", event.data.url);
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('a');

  links.forEach(link => {
    link.addEventListener('mouseover', function(event) {
      if (event.target.href && event.target.origin === window.location.origin) {
        preloadContent(event.target.href);
      }
    });
        link.addEventListener('touchstart', function(event) {
      if (event.target.href && event.target.origin === window.location.origin) {
        preloadContent(event.target.href);
      }
    });
  });
});