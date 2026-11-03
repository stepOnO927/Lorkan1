'use strict';
const worker = new Worker('keepalive-worker.js');
worker.onmessage = () => chrome.runtime.sendMessage({type:'lorkan-active-ai-pulse'}).catch(() => {});
