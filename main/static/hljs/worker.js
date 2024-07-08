onmessage = function (evt) {
  importScripts(
    '/static/hljs/highlight.min.js',
    '/static/hljs/typescript.min.js'
  );
  const result = self.hljs.highlight('typescript', evt.data);
  postMessage(result.value);
}
