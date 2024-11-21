export const userInfoRequest = fetch('https://mesto.nomoreparties.co/v1/wff-cohort-26/users/me', {
  headers: {
    authorization: '1291abb4-4eb6-4ecd-a69b-ec3b707f9fe4'
  }
})
.then(res => {
  if(res.ok) {
    return res.json();
  } else {
    return Promise.reject(`Ошибка: ${res.status}`);
  }});

export const cardsRequest = fetch('https://mesto.nomoreparties.co/v1/wff-cohort-26/cards', {
  headers: {
    authorization: '1291abb4-4eb6-4ecd-a69b-ec3b707f9fe4'
  }
})
.then(res => {
  if(res.ok) {
    return res.json();
  } else {
    return Promise.reject(`Ошибка: ${res.status}`);
  }});  
    
export function postCard(nameElement, linkElement){
    return fetch('https://mesto.nomoreparties.co/v1/wff-cohort-26/cards', {
            method: 'POST',
            headers: {
              authorization: '1291abb4-4eb6-4ecd-a69b-ec3b707f9fe4',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: `${nameElement}`,
              link: `${linkElement}`
            })})
            .then(res => {
              if(res.ok) {
                return res.json();
              } else {
                return Promise.reject(`Ошибка: ${res.status}`);
              }})
          };

export function patchProfile(profileNameInputValue, profileJobInputValue){
    return fetch('https://mesto.nomoreparties.co/v1/wff-cohort-26/users/me', {
        method: 'PATCH',
        headers: {
          authorization: '1291abb4-4eb6-4ecd-a69b-ec3b707f9fe4',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${profileNameInputValue}`,
          about: `${profileJobInputValue}`
        })
      })
      .then(res => {
        if(res.ok) {
          return res.json();
        } else {
          return Promise.reject(`Ошибка: ${res.status}`);
        }})
    };

export function deleteCardReq(cardId){
    return fetch(`https://mesto.nomoreparties.co/v1/wff-cohort-26/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
            authorization: '1291abb4-4eb6-4ecd-a69b-ec3b707f9fe4',
        'Content-Type': "application/json"
        }})
        .then(res => {
          if(res.ok) {
            return res.json();
          } else {
            return Promise.reject(`Ошибка: ${res.status}`);
          }})
      };

export function likeCardReq(cardId){
   return fetch(`https://mesto.nomoreparties.co/v1/wff-cohort-26/cards/likes/${cardId}`, {
        method: 'PUT',
        headers: {
        authorization: '1291abb4-4eb6-4ecd-a69b-ec3b707f9fe4',
        'Content-Type': "application/json"
        }})
        .then(res => {
          if(res.ok) {
            return res.json();
          } else {
            return Promise.reject(`Ошибка: ${res.status}`);
          }})
      };

export function dislikeCardReq(cardId){
   return fetch(`https://mesto.nomoreparties.co/v1/wff-cohort-26/cards/likes/${cardId}`, {
        method: 'DELETE',
        headers: {
        authorization: '1291abb4-4eb6-4ecd-a69b-ec3b707f9fe4',
        'Content-Type': "application/json"
        }})
        .then(res => {
          if(res.ok) {
            return res.json();
          } else {
            return Promise.reject(`Ошибка: ${res.status}`);
          }})
      };

export function changeAvatar(avatarInputValue){
  return fetch(`https://mesto.nomoreparties.co/v1/wff-cohort-26/users/me/avatar`, {
    method: 'PATCH',
    headers: {
    authorization: '1291abb4-4eb6-4ecd-a69b-ec3b707f9fe4',
    'Content-Type': "application/json"
    },
    body: JSON.stringify({
      avatar: `${avatarInputValue}`
    })
  })
  .then(res => {
    if(res.ok) {
      return res.json();
    } else {
      return Promise.reject(`Ошибка: ${res.status}`);
    }})
};

