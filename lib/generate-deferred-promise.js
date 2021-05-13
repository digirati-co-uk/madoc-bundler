function generateDeferredPromise() {
  return (() => {
    let resolve;
    let reject;

    let p = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return {
      promise: p,
      reject,
      resolve,
    };
  })();
}

module.exports = { generateDeferredPromise };
