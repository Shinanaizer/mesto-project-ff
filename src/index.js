import "./index.css"; // добавьте импорт главного файла стилей
import { initialCards } from "./scripts/cards";
import { addCard } from "./components/card";
import { deleteCard } from "./components/card";
import { likeCard } from "./components/card";
import { openModal } from "./components/modal";
import { closeModal } from "./components/modal";
import { escapeClose } from "./components/modal";

const openedPopup = document.querySelector(".popup_is-opened");
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

function sixCards() {
  initialCards.forEach(function (item) {
    cardList.append(addCard(item, deleteCard));
  });
}

sixCards();

profileAddButton.addEventListener("click", function () {
  openModal(addCardPopup);
});

profileEditButton.addEventListener("click", function () {
  openModal(profileEditPopup);
});

function profileFormSubmit(evt) {
  evt.preventDefault();
  const job = jobInput.value;
  const name = nameInput.value;

  const profileNameText = document.querySelector(".profile__title");
  const profileJobText = document.querySelector(".profile__description");

  profileJobText.textContent = job;
  profileNameText.textContent = name;
  const openedPopup = document.querySelector(".popup_is-opened");
  closeModal(openedPopup);
}

profileFormElement.addEventListener("submit", profileFormSubmit);

function cardFormSubmit(evt) {
  evt.preventDefault();
  const place = cardNameInput.value;
  const link = cardLink.value;
  const cardObject = {
    name: "",
    link: "",
  };
  cardObject.name = place;
  cardObject.link = link;
  cardList.prepend(addCard(cardObject, deleteCard));
  const openedPopup = document.querySelector(".popup_is-opened");
  closeModal(openedPopup);
  newCardFormElement.reset();
}

newCardFormElement.addEventListener("submit", cardFormSubmit);
