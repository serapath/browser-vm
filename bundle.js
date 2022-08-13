(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const browservm = require('..')
const get_http_service = require('get-http-service')

async function start () {
  const get = await get_http_service({ vm: browservm })

  const message1 = await get('https://serapath.github.io/browser-vm')
  if (message1.type === 'fail') console.error(message1)
  else {
    const response = message1.data
    console.log({message1})
    const txt = await response.blob.text()
    console.log({txt})
  }

  const message2 = await get('https://google.com')
  if (message2.type === 'fail') console.error(message2)
  else {
    const response = message2.data
    const txt = await response.blob.text()
    console.log({txt})
  }

  const message3 = await get('https://google.com')
  if (message3.type === 'fail') console.error(message3)
  else {
    const response = message3.data
    const txt = await response.blob.text()
    console.log({txt})
  }

  const message4 = await get('https://serapath.github.io/browser-vm')
  if (message4.type === 'fail') console.error(message4)
  else {
    const response = message4.data
    console.log({message4})
    const txt = await response.blob.text()
    console.log({txt})
  }
  const parser = document.createElement('div')
  parser.innerHTML = `
    <h1> browser-vm </h1>
    <label>request</label>
    <style>
      input:valid {
        color: green;
      }
      input:invalid {
        color: red;
      }
    </style>
    <input type="url" name="url" id="url"
       placeholder="https://api.github.com/users/hadley/orgs"
       value="https://api.github.com/users/hadley/orgs"
       pattern="https://.*" size="30"
       required>
    <button>submit</button>
    <div class="results"></div>
  `
  const [,,,input_url,btn,list] = parser.children
  document.body.append(...parser.children)
  console.log(input_url, btn, list)
  btn.onclick = async  event => {

    console.log(input_url.value)
    const url = new URL(input_url.value).href
    const message4 = await get(url)
    if (message4.type === 'fail') {
      console.error(message4)
      append(message4)
    }
    else {
      const response = message4.data
      console.log({message4})
      const txt = await response.blob.text()
      console.log({txt})
      append(message4)
    }
  }
  function append (message) {
    const json = JSON.stringify(message, 0, 2)
    const pre = document.createElement('pre')
    pre.textContent = json
    list.append(pre)
  }
}


start()

},{"..":3,"get-http-service":2}],2:[function(require,module,exports){

module.exports = get_service

// @TODO: try to send some requests in parallel and see if they all resolve correctly

async function get_service ({controller = new AbortController(), vm }) {
  const provision = await vm({controller})
  const to = provision.url
  const by = location.href
  var id = 0
  const send = provision(script, onmessage)
  const pending = {}
  var _resolve
  var _reject
  var exited

  // const button = document.createElement('button')
  // button.innerHTML = 'focus: ' + provision.id
  // button.onclick = () => window.open('', provision.id)
  // document.body.append(button)
  const action = {
    'exit'  : message => {
      exited = true
      console.error('ABORT', message)
      controller.abort('exiting VM');
    },
    'fail'  : message => {
      Object.keys(pending).map(key => {
        const { message:sent_msg, resolve, timeout } = pending[key]
        clearTimeout(timeout)
        resolve({ type: 'fail', refs: { cause: sent_msg.head }, data: { request: sent_msg, response: message } })
      })
    },
    'data'  : message => {
      const { resolve, timeout } = pending[message.refs.cause]
      clearTimeout(timeout)
      resolve({ type: 'data', data: message.data })
    },
    'init'  : message => {
      get.help = message.data
      Object.freeze(get)
      action.init = resolve = _reject = void _resolve(get)
    }
  }

  return new Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })
  function get (url) {
    if (exited) return
    const head = [by, to, id++]
    const type = 'get'
    const data = url
    const message = { head, refs: {}, type, data, meta: { time: Date.now(), stack: new Error().stack } }
    send(message)
    return new Promise((resolve, reject) => {
      pending[head] = { message, resolve, reject, timeout: setTimeout(() => {
        pending[head] = null
        // @TODO: check if postMessage supports "abort"
        const error = { type: 'fail', refs: { cause: message.head }, data: { info: 'request timeout', message } }
        resolve(error)
      }, 5000)}
    })
  }
  function onmessage (message) {
    const handler = action[message.type]
    if (!handler) {
      controller.abort('get-service received invalid message')
      action.exit({ type: 'exit', data: { type: 'invalid', message } })
    }
    handler(message)
  }
  function script (url, name) {
    const forigin = new URL(url).origin
    const context = (opener || parent)
    const send = (d, o = '*', t) => context.postMessage(d, o, t)
    const by = location.href
    var mid = 0
    localStorage.command = ''
    async function grab (callback) {
      callback()
      const { command } = localStorage
      if (!command) return
      const { msg, req } = JSON.parse(command)
      const request =  (typeof req === 'string') ? { url: req } : req
      try {
        const response = await fetch(request.url, request)
        const blob = await response.blob()
        const data = {}
        data.url = response.url
        data.type = response.type
        data.status = response.status
        data.statusText = response.statusText
        data.redirected = response.redirected
        data.ok = response.ok
        data.headers = [...response.headers].reduce(to_object, {})
        data.blob = blob
        msg.data = data
      } catch (error) {
        msg.type = 'fail'
        msg.data = { text: error.toString(), stack: `${error.stack}` }
      }
      localStorage.command = ''
      send(msg)
    }
    function to_object (obj, x) { obj[x[0]] = x[1]; return obj }
    const action = {
      'exit': () => window.close(),
      'fail': message => send({ type: 'fail', data: message }),
      'get': async nessage => {
        grab(async () => {
          const { head, data: request } = nessage
          const [to, by] = head
          localStorage.command = JSON.stringify({
            msg: {
              head: [by, to, mid++],
              refs: { cause: head },
              type: 'data',
            },
            req: request
          })
        }, 0)
      }
    }
    onmessage = event => {
      const { data: message, origin } = event
      if (origin !== forigin) return
      const handler = action[message.type] || action['fail']
      handler(message)
    }

    // const button = document.createElement('button')
    // button.innerHTML = 'focus: ' + name
    // button.onclick = () =>  window.open('', name)
    // document.body.append(button)
    // console.log('FOCUS BACK')
    // // const btn = [...document.body.querySelectorAll('button')].at(-1)
    // // setTimeout(() => btn.click(), 1000)

    const time = `${Date.now()}`
    const stack = `${new Error().stack}`
    ;(opener || parent).postMessage(({
      head: [by, url, mid++],
      refs: { },
      type: 'init',
      data: Object.keys(action),
      meta: { time, stack },
    }), '*')
    // send({
    //   head: [by, url, mid++],
    //   refs: { },
    //   type: 'init',
    //   data: Object.keys(action),
    //   meta: { time: Date.now(), stack: new Error().stack },
    // })
  }
}
},{}],3:[function(require,module,exports){
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

},{}]},{},[1]);
