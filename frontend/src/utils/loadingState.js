let loadingCallback = null;
let activeRequests = 0;
let startTime = 0;
const MINIMUM_DURATION = 10000; // 10 seconds min display time

export const setLoadingCallback = (callback) => {
    loadingCallback = callback;
};

export const startRequest = () => {
    if (activeRequests === 0) {
        startTime = Date.now();
        if (loadingCallback) loadingCallback(true);
    }
    activeRequests++;
};

export const stopRequest = () => {
    activeRequests = Math.max(0, activeRequests - 1);

    if (activeRequests === 0) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MINIMUM_DURATION - elapsedTime);

        setTimeout(() => {
            // Re-check if another request started during the timeout
            if (activeRequests === 0 && loadingCallback) {
                loadingCallback(false);
            }
        }, remainingTime);
    }
};
