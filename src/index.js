import "./index.css"; // добавьте импорт главного файла стилей
import { addCard } from "./components/card";
import { openModal } from "./components/modal";
import { closeModal } from "./components/modal";
import { escapeClose } from "./components/modal";
import { enableValidation } from "./components/validation";
import { clearValidation } from "./components/validation";
import { likeCardReq } from "./components/api";
import { dislikeCardReq } from "./components/api";
import { deleteCardReq } from "./components/api";
import { postCard } from "./components/api";
import { patchProfile } from "./components/api";
import { changeAvatar } from "./components/api";
import { userInfoRequest } from "./components/api";
import { cardsRequest } from "./components/api";
import { handleLikes } from "./components/card";
import { handleDelete } from "./components/card";

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
const modalWindows = document.querySelectorAll('.popup');
const validConfig = {
  formSelector: '.popup__form',
  inputSelector: '.popup__input',
  submitButtonSelector: '.popup__button',
  inactiveButtonClass: 'popup__button_disabled',
  inputErrorClass: 'popup__input_type_error',
  errorClass: 'popup__error_visible'
  };

function animatePopups(popupList){
  popupList.forEach( function (popup){
    popup.classList.add('popup_is-animated');
  })};

animatePopups(modalWindows);

editAvatarButton.addEventListener('click', () => {
  openModal(profileAvatarPopup);
})

function submitAvatarForm(evt) {
  evt.preventDefault();
  const avatar = avatarUrlInput.value;
  handleAvatarChange(avatar);
}; 

function handleAvatarChange(avatar){
  
changeAvatar(avatar).then(() => {
  avatarPopupButton.textContent = 'Сохранение...';
  profileImage.style.backgroundImage = `url(${avatar})`;
  closeModal();
  avatarChangeForm.reset();
  clearValidation(avatarChangeForm, validConfig);
  })
  .catch((err) => {
    console.log(err);
  })
  .finally(() => {
    avatarPopupButton.textContent = 'Сохранить'; 
  })
};

avatarChangeForm.addEventListener('submit', submitAvatarForm);

const promises = [userInfoRequest, cardsRequest];

let userId;

 Promise.all(promises)
  .then((promisesMassive) => {
    profileNameText.textContent = promisesMassive[0].name;
    profileJobText.textContent = promisesMassive[0].about;
    profileImage.style.backgroundImage = `url(${promisesMassive[0].avatar})`;
    userId = promisesMassive[0]._id;
    function createDefaultCards() {
      promisesMassive[1].forEach(function (item) {
        cardList.append(addCard(item, handleDelete, handleLikes, openImageModal, userId, likeCardReq, dislikeCardReq, deleteCardReq));
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
  clearValidation(profileFormElement, validConfig);
  openModal(profileEditPopup);
});

function submitProfileForm(evt) {
  evt.preventDefault();
  const job = jobInput.value;
  const name = nameInput.value;
  profileJobText.textContent = job;
  profileNameText.textContent = name;
  handlePatchProfile(name, job);
};

function handlePatchProfile(profileNameInputValue, profileJobInputValue){
  
  patchProfile(profileNameInputValue, profileJobInputValue).then(() => {
    profilePopupButton.textContent = 'Сохранение...';
    closeModal();
  })
  .catch((err) => {
    console.log(err);
  })
  .finally(() => {
    profilePopupButton.textContent = 'Сохранить';
  })
};

profileFormElement.addEventListener("submit", submitProfileForm);

function openImageModal(cardInformation){
  imageModalPicture.src = cardInformation.link;
  imageModalText.textContent = cardInformation.name;
  openModal(imageModal);
};

function submitCardForm(evt) {
  evt.preventDefault();
  const place = cardNameInput.value;
  const link = cardLink.value;
  const cardObject = {
    name: "",
    link: "",
  };
  cardObject.name = place;
  cardObject.link = link;
  addNewCard(place, link, userId);
}; 

function addNewCard(nameElement, linkElement, userIdElement){
  postCard(nameElement, linkElement).then((newCardInfo) => {
    cardPopupButton.textContent = 'Сохранение...';
    cardList.prepend(addCard(newCardInfo, handleDelete, handleLikes, openImageModal, userIdElement, likeCardReq, dislikeCardReq, deleteCardReq));
    
    closeModal();
    newCardFormElement.reset();
    clearValidation(newCardFormElement, validConfig);
  })
    .catch((err) => {
      console.log(err);
  })
  .finally(() => {
    cardPopupButton.textContent = 'Сохранить';
  })
};  

newCardFormElement.addEventListener("submit", submitCardForm);

enableValidation(validConfig); 
