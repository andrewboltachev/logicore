onmessage = function (evt) {
  importScripts(
    '/static/hljs/highlight.min.js',
    '/static/hljs/typescript.min.js'
  );
  //self.hljs.registerLanguage('typescript', ts);
  const result = self.hljs.highlight('typescript', evt.data);
  postMessage(result.value);
  //postMessage(self.hljs.listLanguages());
}
