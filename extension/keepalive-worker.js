'use strict';
// The worker exists only while the user has enabled AI control.
setInterval(() => postMessage('pulse'), 1000);
