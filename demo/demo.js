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
