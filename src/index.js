import "./index.css"; // добавьте импорт главного файла стилей
import { initialCards } from "./scripts/cards";
import { addCard } from "./components/card";
import { deleteCard } from "./components/card";
import { likeCard } from "./components/card";
import { openModal } from "./components/modal";
import { closeModal } from "./components/modal";
import { escapeClose } from "./components/modal";

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

function createDefaultCards() {
  initialCards.forEach(function (item) {
    cardList.append(addCard(item, deleteCard, likeCard, openImageModal));
  });
}

createDefaultCards();

profileAddButton.addEventListener("click", function () {
  openModal(addCardPopup);
});

profileEditButton.addEventListener("click", function () {
  jobInput.value = profileJobText.textContent;
  nameInput.value = profileNameText.textContent;
  openModal(profileEditPopup);
});

function openImageModal(cardInfo){
      imageModalPicture.src = cardInfo.link;
      imageModalText.textContent = cardInfo.name;
      openModal(imageModal);
};

function submitProfileForm(evt) {
  evt.preventDefault();
  const job = jobInput.value;
  const name = nameInput.value;
  profileJobText.textContent = job;
  profileNameText.textContent = name;
  const openedPopup = document.querySelector('.popup_is-opened');
  closeModal(openedPopup);
}

profileFormElement.addEventListener("submit", submitProfileForm);

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
  cardList.prepend(addCard(cardObject, deleteCard, likeCard, openImageModal));
  const openedPopup = document.querySelector('.popup_is-opened');
  closeModal(openedPopup);
  newCardFormElement.reset();
}

newCardFormElement.addEventListener("submit", submitCardForm);
