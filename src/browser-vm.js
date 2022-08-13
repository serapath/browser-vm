const method = {
  'open': (url, vm_name) => {
    const browsing_context = {
      origin: new URL(url).origin,
      close: () => {
        browsing_context.window.close()
        browsing_context.window = null
      },
      window: window.open(url, vm_name),
    }
    return browsing_context
  },
  'iframe': (url, vm_name) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('src', url)
    iframe.setAttribute('name', vm_name)
    iframe.setAttribute('style', 'width: 0px; height: 0px; border: 0;')
    const browsing_context = {
      origin: new URL(url).origin,
      close: () => {
        console.log('CLOSE')
        if (browsing_context.window) browsing_context.window.close()
        document.body.remove(iframe)
      },
      get window () { return iframe.contentWindow }
    }
    document.body.append(iframe)
    return browsing_context
  }
}

const default_url = 'https://serapath.github.io/container-frame/'

module.exports = virtual_machine

async function virtual_machine ({ type = 'iframe', controller = new AbortController(), url = default_url } = {}) {
  const { signal } = controller
  const name = window.name || (window.name = 'main-page')
  const vm_name = 'virtual-machine'
  var browsing_context = method[type](url, vm_name)
  return new Promise(initialize)
  function initialize (resolve, reject, init) {
    if (signal.aborted) return teardown()
    const interval = setInterval(keep_alive, 250)
    function keep_alive () {
      if (!browsing_context.window || browsing_context.window.closed) {
        clearInterval(interval)
        controller.abort('VM was closed')
      }
    }
    provision.id = vm_name
    provision.url = url
    var handler = data => {
      if (data) {
        controller.abort('received invalid message from VM')
        return reject(new Error('received invalid message from VM'))
      }
      handler = () => controller.abort('received unexpected message VM')
      resolve(provision)
    }
    signal.addEventListener('abort', teardown)
    window.addEventListener('message', onmessage)
    function teardown () {
      handler({ type: 'exit' })
      handler = void 0
      signal.removeEventListener('abort', teardown)
      window.removeEventListener('message', onmessage)
      if (browsing_context) browsing_context.close()
      browsing_context = null
    }
    function onmessage (event) {
      const { data, source, origin } = event
      if (source !== browsing_context.window) return
      if (origin !== browsing_context.origin) return
      handler(data)
    }
    function provision (executable, _handler) {
      if (init) throw new Error('machine is already provisioned')
      init = true
      /*
          <!doctype html>
          <html>
            <head><meta charset="utf-8"></head>
            <body><script>
              eval(localStorage.boot || `
                onmessage = ({data}) => eval(data)
                ;(opener||parent).postMessage(0, '*')
              `)
            </script></body>
          </html>
      */
      if (typeof executable !== 'function') throw new Error('executable must be a function')
      const script = `(${executable})("${location.href}", "${name}")`
      browsing_context.window.postMessage(script, browsing_context.origin)
      handler = _handler
      return function send (message) {
        if (!browsing_context) throw new Error('VM has shut down')
        browsing_context.window.postMessage(message, browsing_context.origin)
      }
    }
  }
}
