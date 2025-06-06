import axios from 'axios'
import update, { extend } from 'immutability-helper'

function getCookie (name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}
const csrfToken = getCookie('csrftoken')
axios.defaults.headers.common['X-CSRFTOKEN'] = csrfToken

extend('$auto', function (value, object) {
  return object ? update(object, value) : update({}, value)
})
extend('$autoArray', function (value, object) {
  return object ? update(object, value) : update([], value)
})

export { axios, extend, update }
