const config = {
  baseUrl: 'https://mesto.nomoreparties.co/v1/wff-cohort-26',
  headers: {
    authorization: '1291abb4-4eb6-4ecd-a69b-ec3b707f9fe4',
    'Content-Type': 'application/json'
  }
};

function checkResponse(res){
  if(res.ok) {
    return res.json();
  } else {
    return Promise.reject(`Ошибка: ${res.status}`);
  }
}

export const userInfoRequest = fetch(`${config.baseUrl}/users/me`, {
  headers: config.headers
  })
  .then(res => checkResponse(res)); 

export const cardsRequest = fetch(`${config.baseUrl}/cards`, {
  headers: config.headers
})
  .then(res => checkResponse(res));  

export function postCard(nameElement, linkElement){
  return fetch(`${config.baseUrl}/cards`, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify({
    name: `${nameElement}`,
    link: `${linkElement}`
    })})
    .then(res => checkResponse(res)); 
};

export function patchProfile(profileNameInputValue, profileJobInputValue){
  return fetch(`${config.baseUrl}/users/me`, {
    method: 'PATCH',
    headers: config.headers,
    body: JSON.stringify({
    name: `${profileNameInputValue}`,
    about: `${profileJobInputValue}`
    })})
    .then(res => checkResponse(res)); 
};

export function deleteCardReq(cardId){
  return fetch(`${config.baseUrl}/cards/${cardId}`, {
    method: 'DELETE',
    headers: config.headers
    })
    .then(res => checkResponse(res)); 
};

export function likeCardReq(cardId){
  return fetch(`${config.baseUrl}/cards/likes/${cardId}`, {
    method: 'PUT',
    headers: config.headers
    })
    .then(res => checkResponse(res)); 
};

export function dislikeCardReq(cardId){
  return fetch(`${config.baseUrl}/cards/likes/${cardId}`, {
    method: 'DELETE',
    headers: config.headers
    })
    .then(res => checkResponse(res)); 
};

export function changeAvatar(avatarInputValue){
  return fetch(`${config.baseUrl}/users/me/avatar`, {
    method: 'PATCH',
    headers: config.headers,
    body: JSON.stringify({
    avatar: `${avatarInputValue}`
    })})
    .then(res => checkResponse(res)); 
};

