import "./index.css"; // добавьте импорт главного файла стилей
import { addCard } from "./components/card";
import { openModal } from "./components/modal";
import { closeModal } from "./components/modal";
import { escapeClose } from "./components/modal";
import { enableValidation } from "./components/validation";
import { clearValidation } from "./components/validation";
import { likeCardReq } from "./components/api";
import { dislikeCardReq } from "./components/api";
import { deleteCard } from "./components/api";
import { postCard } from "./components/api";
import { patchProfile } from "./components/api";
import { changeAvatar } from "./components/api";
import { userInfoRequest } from "./components/api";
import { cardsRequest } from "./components/api";

const content = document.querySelector(".content");
const cardList = content.querySelector(".places__list");
const profileAddButton = document.querySelector(".profile__add-button");
const addCardPopup = document.querySelector(".popup_type_new-card");
const profileEditButton = document.querySelector(".profile__edit-button");
const profileEditPopup = document.querySelector(".popup_type_edit");
const profileFormElement = document.forms["edit-profile"];
const nameInput = profileFormElement.elements.name;
const jobInput = profileFormElement.elements.description;
const newCardFormElement = document.forms["new-place"];
const cardNameInput = newCardFormElement.elements["place-name"];
const cardLink = newCardFormElement.elements.link;
const imageModal = document.querySelector('.popup_type_image');
const imageModalText = document.querySelector('.popup__caption');
const imageModalPicture = document.querySelector('.popup__image');
const profileNameText = document.querySelector(".profile__title");
const profileJobText = document.querySelector(".profile__description");
const profileImage = document.querySelector('.profile__image');
const profileAvatarPopup = document.querySelector('.popup_type_new-avatar');
const editAvatarButton = document.querySelector('.profile__image-button');
const avatarChangeForm = document.forms["new-avatar"];
const avatarUrlInput = avatarChangeForm.elements.link;
const avatarPopupButton = document.getElementById('avatar_button');
const profilePopupButton = document.getElementById('profile_button');
const cardPopupButton = document.getElementById('card_button');

editAvatarButton.addEventListener('click', () => {
  openModal(profileAvatarPopup);
})

  function submitAvatarForm(evt) {
    evt.preventDefault();
    const avatar = avatarUrlInput.value;
    handleAvatarChange(avatar);
    profileImage.style.backgroundImage = `url(${avatar})`;
    const openedPopup = document.querySelector('.popup_is-opened');
    closeModal(openedPopup);
    avatarChangeForm.reset();
    clearValidation(avatarChangeForm, {
    formSelector: '.popup__form',
    inputSelector: '.popup__input',
    submitButtonSelector: '.popup__button',
    inactiveButtonClass: 'popup__button_disabled',
    inputErrorClass: 'popup__input_type_error',
    errorClass: 'popup__error_visible'
  });
  }; 

  function handleAvatarChange(avatar){
    avatarPopupButton.textContent = 'Сохранение...';
    changeAvatar(avatar).then(() => {
    avatarPopupButton.textContent = 'Сохранить'; 
    })
    .catch((err) => {
      console.log(err);
    })
  };

avatarChangeForm.addEventListener('submit', submitAvatarForm);

const userIdPromise = [userInfoRequest]
const promises = [userInfoRequest, cardsRequest];

 Promise.all(promises)
  .then((promisesMassive) => {
    profileNameText.textContent = promisesMassive[0].name;
    // console.log(promisesMassive[1]);
    // console.log(promisesMassive[0]);
    profileJobText.textContent = promisesMassive[0].about;
    profileImage.style.backgroundImage = `url(${promisesMassive[0].avatar})`;
      function createDefaultCards() {
      promisesMassive[1].forEach(function (item) {
        cardList.append(addCard(item, handleDelete, handleLikes, openImageModal, promisesMassive[0]));
      })
      
    }
    createDefaultCards();
  })
  .catch((err) => {
    console.log(err);
  });

profileAddButton.addEventListener("click", function () {
  openModal(addCardPopup);
});

profileEditButton.addEventListener("click", function () {
  jobInput.value = profileJobText.textContent;
  nameInput.value = profileNameText.textContent;
  clearValidation(profileFormElement, {
    formSelector: '.popup__form',
    inputSelector: '.popup__input',
    submitButtonSelector: '.popup__button',
    inactiveButtonClass: 'popup__button_disabled',
    inputErrorClass: 'popup__input_type_error',
    errorClass: 'popup__error_visible'
  });
  openModal(profileEditPopup);
});

function submitProfileForm(evt) {
  evt.preventDefault();
  const job = jobInput.value;
  const name = nameInput.value;
  profileJobText.textContent = job;
  profileNameText.textContent = name;
  handlePatchProfile(name, job);
  const openedPopup = document.querySelector('.popup_is-opened');
  closeModal(openedPopup);
};

function handlePatchProfile(profileNameInputValue, profileJobInputValue){
  profilePopupButton.textContent = 'Сохранение...';
  patchProfile(profileNameInputValue, profileJobInputValue).then(() => {
    profilePopupButton.textContent = 'Сохранить';
  })
  .catch((err) => {
    console.log(err);
  })};

profileFormElement.addEventListener("submit", submitProfileForm);

function openImageModal(cardInformation){
      imageModalPicture.src = cardInformation.link;
      imageModalText.textContent = cardInformation.name;
      openModal(imageModal);
};

function submitCardForm(evt) {
  evt.preventDefault();
  cardPopupButton.textContent = 'Сохранение...';
  const place = cardNameInput.value;
  const link = cardLink.value;
  const cardObject = {
    name: "",
    link: "",
  };
  cardObject.name = place;
  cardObject.link = link;
  addNewCard(place, link);
  const openedPopup = document.querySelector('.popup_is-opened');
  closeModal(openedPopup);
  newCardFormElement.reset();
  clearValidation(newCardFormElement, {
    formSelector: '.popup__form',
    inputSelector: '.popup__input',
    submitButtonSelector: '.popup__button',
    inactiveButtonClass: 'popup__button_disabled',
    inputErrorClass: 'popup__input_type_error',
    errorClass: 'popup__error_visible'
  });
  }; 

function addNewCard(nameElement, linkElement){
  postCard(nameElement, linkElement).then((newCardInfo) => {
    Promise.all(userIdPromise)
    .then((userIdPromiseMassive) => {
      cardList.prepend(addCard(newCardInfo, handleDelete, handleLikes, openImageModal, userIdPromiseMassive[0]));
      cardPopupButton.textContent = 'Сохраненить';
    })})
    .catch((err) => {
      console.log(err);
    })
};

newCardFormElement.addEventListener("submit", submitCardForm);

enableValidation({
    formSelector: '.popup__form',
    inputSelector: '.popup__input',
    submitButtonSelector: '.popup__button',
    inactiveButtonClass: 'popup__button_disabled',
    inputErrorClass: 'popup__input_type_error',
    errorClass: 'popup__error_visible'
  }); 

function handleDelete(id, cardElement){ 
 return deleteCard(id).then(() => {
    cardElement.remove()
  })
  .catch((err) => {
    console.log(err);
  })
};

function handleLikes(id, likeButton, likeCounter){
  if (likeButton.classList.contains('card__like-button_is-active')) {
    return dislikeCardReq(id).then((res) => {
      likeButton.classList.remove('card__like-button_is-active');
      likeCounter.textContent = `${res.likes.length}`
    })
    .catch((err) => {
      console.log(err);
    });
  } else {
    return likeCardReq(id).then((res) => {
      likeButton.classList.add('card__like-button_is-active');
      likeCounter.textContent = `${res.likes.length}`
    }) 
    .catch((err) => {
      console.log(err);
    })
  }
};


